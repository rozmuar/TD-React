import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { clearCart } from '../../store/slices/cartSlice'
import {
  getLocationCode, getCheckoutContext, calculateCheckout, submitCheckout,
  syncCartToServer,
  sendSmsCode, verifySmsCode,
  getBitrixStoreList,
  getUserProfile,
} from '../../services/apiClient'
import { setToken } from '../../store/slices/authSlice'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import { decodeHtml } from '../../utils/decodeHtml'

// ── DaData подсказки городов ──────────────────────────────
const DADATA_TOKEN = 'b797ba9abf3c4df0a778b1a215514b3a8d9b1382'
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'

async function geocodeAddress(address) {
  if (!address) return null
  try {
    const res = await fetch(DADATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Token ' + DADATA_TOKEN,
      },
      body: JSON.stringify({ query: address, count: 1 }),
    })
    const json = await res.json()
    const d = json.suggestions?.[0]?.data
    if (d?.geo_lat && d?.geo_lon) return { lat: Number(d.geo_lat), lng: Number(d.geo_lon) }
  } catch {}
  return null
}

async function suggestCity(query) {
  if (!query || query.length < 2) return []
  const res = await fetch(DADATA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Token ' + DADATA_TOKEN,
    },
    body: JSON.stringify({
      query,
      from_bound: { value: 'city' },
      to_bound: { value: 'settlement' },
      count: 7,
    }),
  })
  const json = await res.json()
  return (json.suggestions || []).map((s) => ({
    value: s.value,
    city: s.data.city || s.data.settlement || s.value,
    region: s.data.region_with_type || '',
    kladr: s.data.kladr_id || '',
    fias: s.data.fias_id || '',
  }))
}

// ── Утилита: очистка HTML-тегов из описаний ────────────────
const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Yandex Maps JS API ────────────────────────────────────
const YMAPS_KEY = 'd8072d8e-bcbe-4b04-9208-ee08d3bd8c4e'

let ymapsReady = null
function loadYmaps() {
  if (ymapsReady) return ymapsReady
  ymapsReady = new Promise((resolve) => {
    if (window.ymaps) { window.ymaps.ready(() => resolve(window.ymaps)); return }
    const s = document.createElement('script')
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${YMAPS_KEY}&lang=ru_RU`
    s.onload = () => window.ymaps.ready(() => resolve(window.ymaps))
    document.head.appendChild(s)
  })
  return ymapsReady
}

function YandexMap({ lat, lng, zoom = 15, points, height = 250, onSelect }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    let disposed = false
    loadYmaps().then((ymaps) => {
      if (disposed || !containerRef.current) return
      if (mapRef.current) { mapRef.current.destroy(); mapRef.current = null }

      const center = [lat || 53.1867, lng || 45.0052]
      const map = new ymaps.Map(containerRef.current, { center, zoom, controls: ['zoomControl'] })
      mapRef.current = map

      if (points && points.length) {
        points.forEach((p) => {
          if (!p.lat || !p.lng) return
          const selectBtn = onSelect
            ? `<div style="margin-top:8px"><button onclick="window.__ymapsSelect__('${p.id}')" style="padding:6px 18px;background:#04B31B;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">Выбрать</button></div>`
            : ''
          const pm = new ymaps.Placemark([p.lat, p.lng], {
            balloonContentHeader: `<strong>${p.name || ''}</strong>`,
            balloonContentBody: `<div>${p.address || ''}${p.hours ? '<br><span style="color:#999;font-size:12px">' + p.hours + '</span>' : ''}${selectBtn}</div>`,
          }, { preset: 'islands#greenDotIcon' })
          map.geoObjects.add(pm)
        })
        if (points.length > 1) map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
      } else if (lat && lng) {
        const pm = new ymaps.Placemark([lat, lng], {}, { preset: 'islands#greenDotIcon' })
        map.geoObjects.add(pm)
      }
    })
    return () => { disposed = true; if (mapRef.current) { mapRef.current.destroy(); mapRef.current = null } }
  }, [lat, lng, zoom, points])

  useEffect(() => {
    if (!onSelect || !points) return
    window.__ymapsSelect__ = (id) => {
      const store = points.find((p) => String(p.id) === String(id))
      if (store) onSelect(store)
    }
    return () => { delete window.__ymapsSelect__ }
  }, [onSelect, points])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}

const DEFAULT_STORES = []

// ── Маска телефона ────────────────────────────────────────
function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  let nums = digits
  if (['7', '8', '9'].includes(nums[0])) {
    if (nums[0] === '9') nums = '7' + nums
    if (nums[0] === '8') nums = '7' + nums.slice(1)
    let f = '+7'
    if (nums.length > 1) f += ' ' + nums.substring(1, 4)
    if (nums.length >= 5) f += ' ' + nums.substring(4, 7)
    if (nums.length >= 8) f += '-' + nums.substring(7, 9)
    if (nums.length >= 10) f += '-' + nums.substring(9, 11)
    return f
  }
  return '+' + nums
}

// ══════════════════════════════════════════════════════════
function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector((s) => s.cart.items).filter((i) => i.selected !== false)
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)

  // ── Шаг 1: город + персональные данные ──────────────────
  const [cityInput, setCityInput] = useState('')
  const [cityConfirmed, setCityConfirmed] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestTimer = useRef(null)
  const wrapperRef = useRef(null)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [comment, setComment] = useState('')

  // ── Автозаполнение из профиля авторизованного пользователя ──
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    getUserProfile()
      .then((res) => {
        if (cancelled) return
        const p = res.data?.message || res.data
        if (!p) return
        const ph = p.phone || p.PERSONAL_PHONE || ''
        if (ph && !phone) setPhone(formatPhoneInput(ph))
        if (!email) setEmail(p.email || p.EMAIL || '')
        if (!firstName) setFirstName(p.name || p.NAME || '')
        if (!lastName) setLastName(p.last_name || p.LAST_NAME || '')
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isAuthenticated])

  // ── Шаг 2: доставка ──────────────────────────────────────
  const [deliveryMethods, setDeliveryMethods] = useState([])
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState(null)
  const [stores, setStores] = useState(DEFAULT_STORES)
  const [selectedStore, setSelectedStore] = useState(null)
  const [storePickerOpen, setStorePickerOpen] = useState(false)
  const [storeSearch, setStoreSearch] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')

  // ── Шаг 3: оплата ──────────────────────────────────────
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(null)

  // ── Checkout API state ─────────────────────────────────
  const [locationCode, setLocationCode] = useState('')
  const [personTypeId, setPersonTypeId] = useState(null)
  const [checkoutProperties, setCheckoutProperties] = useState([])
  const [totals, setTotals] = useState(null)
  const [canSubmit, setCanSubmit] = useState(false)
  const [checkoutErrors, setCheckoutErrors] = useState([])

  // ── SMS / Submit ────────────────────────────────────────
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', ''])
  const [smsSending, setSmsSending] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Computed ────────────────────────────────────────────
  const totalAmount = totals ? totals.basket_price : items.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  const totalOldAmount = items.reduce((s, i) => s + Number(i.oldPrice || i.price) * i.quantity, 0)
  const totalCount = items.reduce((s, i) => s + i.quantity, 0)
  const savings = totalOldAmount - (totals?.basket_price ?? totalAmount)
  const points = Math.round((totals?.basket_price ?? totalAmount) * 0.03)
  const activeDelivery = deliveryMethods.find((d) => String(d.id) === String(deliveryMethod))
  const deliveryPrice = totals ? totals.delivery_price : 0
  const totalPrice = totals ? totals.total_price : totalAmount + deliveryPrice

  const fmt = (n) => Math.floor(n).toLocaleString('ru-RU')
  const priceLabel = (p) => (p > 0 ? `${fmt(p)} ₽` : 'Бесплатно')

  // ── Redirect если корзина пуста ─────────────────────────
  useEffect(() => {
    if (items.length === 0) navigate('/cart/', { replace: true })
  }, [items.length, navigate])

  // ── DaData: debounced suggest ───────────────────────────
  const handleCityInput = (val) => {
    setCityInput(val)
    if (cityConfirmed) {
      setCityConfirmed('')
      setDeliveryMethods([])
      setDeliveryMethod(null)
      setPaymentMethods([])
      setPaymentMethod(null)
    }
    clearTimeout(suggestTimer.current)
    if (val.length < 2) { setSuggestions([]); return }
    suggestTimer.current = setTimeout(async () => {
      const list = await suggestCity(val)
      setSuggestions(list)
      setShowSuggestions(list.length > 0)
    }, 250)
  }

  const pickCity = (item) => {
    setCityInput(item.value)
    setCityConfirmed(item.city)
    setSuggestions([])
    setShowSuggestions(false)
  }

  // Закрыть подсказки по клику вне
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Утилита применения checkout ответа ───────────────────
  const applyCheckoutResponse = (data) => {
    const co = data.checkout || data
    if (co.available_deliveries) {
      const deliveries = co.available_deliveries.filter((d) => d.available !== false)
      setDeliveryMethods(deliveries)
      const selected = deliveries.find((d) => d.selected) || deliveries[0]
      if (selected && String(selected.id) !== String(deliveryMethod)) {
        setDeliveryMethod(String(selected.id))
      } else if (!deliveryMethod && selected) {
        setDeliveryMethod(String(selected.id))
      }
    }
    if (co.available_pay_systems) {
      const payments = co.available_pay_systems.filter((p) => p.available !== false)
      setPaymentMethods(payments)
      const selected = payments.find((p) => p.selected) || payments[0]
      if (selected && String(selected.id) !== String(paymentMethod)) {
        setPaymentMethod(String(selected.id))
      } else if (!paymentMethod && selected) {
        setPaymentMethod(String(selected.id))
      }
    }
    if (co.person_types?.length && !personTypeId) {
      setPersonTypeId(co.person_types[0].id)
    }
    if (co.selected?.person_type_id && !personTypeId) {
      setPersonTypeId(co.selected.person_type_id)
    }
    if (co.properties) setCheckoutProperties(co.properties)
    if (co.totals) setTotals(co.totals)
    if (typeof data.can_submit !== 'undefined') setCanSubmit(data.can_submit)
    if (data.errors?.length) setCheckoutErrors(data.errors)
    else setCheckoutErrors([])
  }

  // ── Получаем location code при подтверждении города ─────
  useEffect(() => {
    if (!cityConfirmed) return
    let cancelled = false
    ;(async () => {
      try {
        const locRes = await getLocationCode(cityConfirmed)
        if (!cancelled) setLocationCode(locRes.data?.data?.location_code || '')
      } catch {
        if (!cancelled) setLocationCode('')
      }
    })()
    return () => { cancelled = true }
  }, [cityConfirmed])

  // ── Загрузка контекста checkout (нужна авторизация) ─────
  useEffect(() => {
    if (!cityConfirmed || !isAuthenticated || !locationCode) return
    let cancelled = false
    setDeliveryLoading(true)
    setDeliveryMethod(null)
    setPaymentMethods([])
    setPaymentMethod(null)
    setTotals(null)

    ;(async () => {
      try {
        // Синхронизируем локальную корзину на сервер
        await syncCartToServer(items)

        const params = { person_type_id: 1 }
        if (locationCode) params.location = locationCode
        const ctxRes = await getCheckoutContext(params)
        if (cancelled) return
        applyCheckoutResponse(ctxRes.data)
      } catch (err) {
        console.error('checkout context error:', err)
        const errMsg = err.response?.data?.errors || err.response?.data?.message || err.message
        setCheckoutErrors(Array.isArray(errMsg) ? errMsg : [String(errMsg)])
      }
      if (!cancelled) setDeliveryLoading(false)
    })()

    // Магазины (самовывоз) — из Bitrix catalog.store.list
    getBitrixStoreList()
      .then(async (res) => {
        if (cancelled) return
        const raw = res.data?.result?.stores || []
        const active = raw.filter((s) => s.active === 'Y' && s.address)
        if (!active.length) return
        const mapped = active.map((s) => ({
          id: s.id,
          name: s.title || 'Пункт выдачи',
          address: s.address,
          hours: s.schedule || '',
          phone: s.phone || '',
          lat: Number(s.gpsN || 0),
          lng: Number(s.gpsS || 0),
        }))
        // Геокодируем адреса без координат через DaData
        const needGeo = mapped.filter((s) => !s.lat && !s.lng)
        if (needGeo.length) {
          const results = await Promise.allSettled(
            needGeo.map((s) => geocodeAddress(s.address))
          )
          results.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value) {
              needGeo[i].lat = r.value.lat
              needGeo[i].lng = r.value.lng
            }
          })
        }
        if (!cancelled) setStores([...mapped])
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [cityConfirmed, isAuthenticated, locationCode])

  // ── Пересчёт при смене доставки ─────────────────────────
  useEffect(() => {
    if (!deliveryMethod || !cityConfirmed) return
    let cancelled = false
    setPaymentLoading(true)

    ;(async () => {
      try {
        const data = {
          delivery_id: Number(deliveryMethod),
          location: locationCode || undefined,
          properties: {
            PHONE: phone.replace(/\D/g, '') || undefined,
            EMAIL: email || undefined,
          },
        }
        if (personTypeId) data.person_type_id = personTypeId
        if (paymentMethod) data.pay_system_id = Number(paymentMethod)
        const res = await calculateCheckout(data)
        if (!cancelled) applyCheckoutResponse(res.data)
      } catch (err) {
        console.error('checkout calculate (delivery) error:', err)
      }
      if (!cancelled) setPaymentLoading(false)
    })()

    return () => { cancelled = true }
  }, [deliveryMethod])

  // ── Пересчёт при смене оплаты ──────────────────────────
  const paymentCalculateTimer = useRef(null)
  useEffect(() => {
    if (!paymentMethod || !deliveryMethod || !cityConfirmed) return
    clearTimeout(paymentCalculateTimer.current)
    paymentCalculateTimer.current = setTimeout(async () => {
      try {
        const data = {
          delivery_id: Number(deliveryMethod),
          pay_system_id: Number(paymentMethod),
          location: locationCode || undefined,
          properties: {
            PHONE: phone.replace(/\D/g, '') || undefined,
            EMAIL: email || undefined,
          },
        }
        if (personTypeId) data.person_type_id = personTypeId
        const res = await calculateCheckout(data)
        applyCheckoutResponse(res.data)
      } catch (err) {
        console.error('checkout calculate (payment) error:', err)
      }
    }, 300)
    return () => clearTimeout(paymentCalculateTimer.current)
  }, [paymentMethod])

  // Сброс выбранного магазина при смене способа доставки
  useEffect(() => {
    setSelectedStore(null)
  }, [deliveryMethod])

  // ── SMS авторизация для неавторизованных ───────────────
  const handleSendSms = async () => {
    if (!phone.trim() || phone.replace(/\D/g, '').length < 11) {
      setSmsError('Укажите корректный номер телефона')
      return
    }
    setSmsSending(true)
    setSmsError('')
    try {
      await sendSmsCode(phone)
      setSmsModalOpen(true)
    } catch (err) {
      setSmsError(err.response?.data?.message || 'Ошибка отправки SMS')
    }
    setSmsSending(false)
  }

  // ── Submit ──────────────────────────────────────────────
  const handleSubmitOrder = async () => {
    if (!phone.trim()) { alert('Укажите телефон'); return }
    if (!cityConfirmed) { alert('Выберите город из подсказок'); return }
    if (isPickup && !selectedStore) { alert('Выберите магазин для самовывоза'); return }
    await doCreateOrder()
  }

  const doCreateOrder = async () => {
    setSubmitting(true)
    try {
      // Делаем финальный calculate перед submit (рекомендация API)
      const submitData = {
        person_type_id: personTypeId || 1,
        delivery_id: Number(deliveryMethod),
        pay_system_id: Number(paymentMethod),
        location: locationCode || undefined,
        properties: {
          PHONE: phone.replace(/\D/g, ''),
          EMAIL: email || undefined,
          FIO: [lastName, firstName].filter(Boolean).join(' ') || undefined,
          LOCATION: locationCode || undefined,
        },
        comment: comment || undefined,
      }

      const result = await submitCheckout(submitData)
      const data = result.data

      if (!data.success && data.errors?.length) {
        alert('Ошибка: ' + data.errors.join(', '))
        setSubmitting(false)
        return
      }

      dispatch(clearCart())

      // Проверяем наличие онлайн-оплаты
      const payment = data.payment?.find((p) => !p.paid)
      if (payment) {
        const payUrl = `https://topdisc.ru/personal/order/payment/?ORDER_ID=${data.order.id}&PAYMENT_ID=${payment.id}`
        window.location.href = payUrl
        return
      }

      // Оффлайн-оплата → страница успеха
      navigate('/cart/success/', {
        state: {
          orderNumber: data.order?.account_number || String(data.order?.id),
          items,
          totalAmount: data.order?.price || totalPrice,
          deliveryName: activeDelivery?.name || '',
          selectedStore,
          firstName,
          lastName,
          phone,
        },
      })
    } catch (err) {
      const msg = err.response?.data?.errors?.join(', ') || err.message || 'Попробуйте позже'
      alert('Ошибка при создании заказа: ' + msg)
    }
    setSubmitting(false)
  }

  const handleSmsConfirm = async () => {
    const code = smsCode.join('')
    if (code.length < 6) return
    setSmsSending(true)
    setSmsError('')
    try {
      const res = await verifySmsCode(phone, code)
      const token = res.data?.message?.Authorization
      if (token) {
        dispatch(setToken(token))
        setSmsModalOpen(false)
        setSmsCode(['', '', '', '', '', ''])
      } else {
        setSmsError('Неверный код')
      }
    } catch (err) {
      setSmsError(err.response?.data?.message || 'Неверный код')
    }
    setSmsSending(false)
  }

  const handleSmsInput = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/\d/.test(value)) return
    const next = [...smsCode]
    next[index] = value
    setSmsCode(next)
    if (value && index < 5) document.getElementById(`sms-digit-${index + 1}`)?.focus()
  }

  const handleSmsKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !smsCode[index] && index > 0)
      document.getElementById(`sms-digit-${index - 1}`)?.focus()
  }

  // ── Определяем является ли доставка самовывозом ─────────
  const isPickup = (() => {
    const name = activeDelivery?.name?.toLowerCase() || ''
    return deliveryMethod === 'pickup' || name.includes('самовывоз')
  })()

  // Курьерская доставка по Пензе (не СДЭК)
  const isCourierPenza = (() => {
    const name = activeDelivery?.name?.toLowerCase() || ''
    return (name.includes('курьер') && name.includes('пенз')) || name.includes('такси')
  })()

  // Слоты времени доставки
  const TIME_SLOTS = [
    { value: '10:00-12:00', label: 'с 10:00 до 12:00', startHour: 10, startMin: 0 },
    { value: '12:00-14:00', label: 'с 12:00 до 14:00', startHour: 12, startMin: 0 },
    { value: '14:00-16:00', label: 'с 14:00 до 16:00', startHour: 14, startMin: 0 },
    { value: '16:00-18:00', label: 'с 16:00 до 18:00', startHour: 16, startMin: 0 },
    { value: '18:00-20:00', label: 'с 18:00 до 20:00', startHour: 18, startMin: 0 },
    { value: '20:00-22:00', label: 'с 20:00 до 22:00', startHour: 20, startMin: 0 },
  ]

  const todayStr = new Date().toISOString().slice(0, 10)
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const maxDateStr = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

  const availableSlots = (() => {
    if (!deliveryDate) return TIME_SLOTS
    if (deliveryDate !== todayStr) return TIME_SLOTS
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return TIME_SLOTS.filter((s) => (s.startHour * 60 + s.startMin) - nowMinutes >= 30)
  })()

  // Если на сегодня нет слотов, минимальная дата — завтра
  const minDateStr = (() => {
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const lastSlotStart = TIME_SLOTS[TIME_SLOTS.length - 1].startHour * 60 + TIME_SLOTS[TIME_SLOTS.length - 1].startMin
    return nowMinutes >= lastSlotStart - 30 ? tomorrowStr : todayStr
  })()

  // Автовыбор ближайшей даты и времени при смене доставки
  useEffect(() => {
    if (!isCourierPenza) { setDeliveryDate(''); setDeliveryTime(''); return }
    const bestDate = minDateStr
    setDeliveryDate(bestDate)
    // Определяем доступные слоты для этой даты
    if (bestDate === todayStr) {
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const slots = TIME_SLOTS.filter((s) => (s.startHour * 60 + s.startMin) - nowMin >= 30)
      setDeliveryTime(slots.length ? slots[0].value : '')
    } else {
      setDeliveryTime(TIME_SLOTS[0].value)
    }
  }, [deliveryMethod])

  // При смене даты — ставим ближайший доступный слот
  useEffect(() => {
    if (!deliveryDate) { setDeliveryTime(''); return }
    if (deliveryDate === todayStr) {
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const slots = TIME_SLOTS.filter((s) => (s.startHour * 60 + s.startMin) - nowMin >= 30)
      setDeliveryTime(slots.length ? slots[0].value : '')
    } else {
      if (!deliveryTime) setDeliveryTime(TIME_SLOTS[0].value)
    }
  }, [deliveryDate])

  // ═══════════════════════════ RENDER ═════════════════════
  return (
    <>
      <Helmet><title>Оформление заказа — TopDisc</title></Helmet>
      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item"><Link className="breadcrumbs-link" to="/">Главная</Link></li>
            <li className="breadcrumbs-item"><Link className="breadcrumbs-link" to="/cart/">Корзина</Link></li>
          </ul>
        </div>
      </div>

      <div className="category-page">
        <div className="container">
          <h1 className="catalog__title">Оформление заказа</h1>

          <div className="checkout__layout">
            {/* ═════════════ LEFT ═════════════ */}
            <div className="checkout__main">

              {/* ▸▸▸ ШАГ 1: Город + Персональные данные ▸▸▸ */}
              <div className="checkout__step">
                <div className="checkout__step-badge">Шаг 1</div>

                <div className="checkout__block">
                  <h3 className="checkout__block-title">Укажите город</h3>
                  <div className="checkout__city-wrapper" ref={wrapperRef}>
                    <input
                      type="text"
                      className="checkout__input"
                      value={cityInput}
                      onChange={(e) => handleCityInput(e.target.value)}
                      onFocus={() => suggestions.length && setShowSuggestions(true)}
                      placeholder="Начните вводить город..."
                      autoComplete="off"
                    />
                    {cityConfirmed && (
                      <span className="checkout__city-check" title="Город подтверждён">✓</span>
                    )}
                    {showSuggestions && (
                      <ul className="checkout__suggest-list">
                        {suggestions.map((s, i) => (
                          <li key={i} className="checkout__suggest-item" onMouseDown={() => pickCity(s)}>
                            <span className="checkout__suggest-city">{s.value}</span>
                            {s.region && <span className="checkout__suggest-region">{s.region}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="checkout__block">
                  <h3 className="checkout__block-title">Покупатель</h3>
                  <div className="checkout__form-grid">
                    <div className="checkout__field">
                      <label>Телефон</label>
                      <div className="checkout__phone-row">
                        <input type="tel" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="+7" />
                        {!isAuthenticated && cityConfirmed && (
                          <button
                            className="checkout__sms-send-btn"
                            onClick={handleSendSms}
                            disabled={smsSending || !phone.trim()}
                          >
                            {smsSending ? '...' : 'Подтвердить'}
                          </button>
                        )}
                      </div>
                      {!isAuthenticated && cityConfirmed && smsError && (
                        <p className="checkout__sms-error" style={{marginTop:4}}>{smsError}</p>
                      )}
                    </div>
                    <div className="checkout__field">
                      <label>E-mail</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="checkout__field">
                      <label>Имя</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="checkout__field">
                      <label>Фамилия</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <div className="checkout__field checkout__field--wide">
                      <label>Комментарий к заказу</label>
                      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ▸▸▸ ШАГ 2: Доставка ▸▸▸ */}
              <div className={`checkout__step${(!cityConfirmed || !isAuthenticated) ? ' is-disabled' : ''}`}>
                <div className="checkout__step-badge">Шаг 2</div>
                <h3 className="checkout__block-title">Способ доставки</h3>

                {!cityConfirmed ? (
                  <div className="checkout__disabled-hint">Сначала укажите город доставки</div>
                ) : !isAuthenticated ? (
                  <div className="checkout__disabled-hint">Подтвердите номер телефона</div>
                ) : deliveryLoading ? (
                  <div className="checkout__loading">Загрузка способов доставки…</div>
                ) : checkoutErrors.length > 0 && deliveryMethods.length === 0 ? (
                  <div className="checkout__errors">
                    {checkoutErrors.map((e, i) => <p key={i} className="checkout__error-msg">{e}</p>)}
                  </div>
                ) : (
                  <>
                    <div className="checkout__block">
                      <div className="checkout__delivery-methods">
                        {deliveryMethods.map((d) => (
                          <button
                            key={d.id}
                            className={`checkout__delivery-btn${String(deliveryMethod) === String(d.id) ? ' is-active' : ''}`}
                            onClick={() => setDeliveryMethod(String(d.id))}
                          >
                            {d.logotip && <img src={d.logotip} alt="" className="checkout__delivery-logo" />}
                            <span className="checkout__delivery-label">{d.name}</span>
                            {d.price_formatted && (
                              <span className="checkout__delivery-price">{d.price_formatted}</span>
                            )}
                            {d.period_text && (
                              <span className="checkout__delivery-desc">{d.period_text}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Курьерская по Пензе → дата и время доставки */}
                    {isCourierPenza && (
                      <div className="checkout__block">
                        <h3 className="checkout__block-title">Дата и время доставки</h3>
                        <div className="checkout__datetime-row">
                          <div className="checkout__datetime-field">
                            <label>Дата доставки</label>
                            <input
                              type="date"
                              value={deliveryDate}
                              min={minDateStr}
                              max={maxDateStr}
                              onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                          </div>
                          <div className="checkout__datetime-field">
                            <label>Время доставки</label>
                            <select
                              value={deliveryTime}
                              onChange={(e) => setDeliveryTime(e.target.value)}
                              disabled={!deliveryDate}
                            >
                              <option value="">Выберите время</option>
                              {availableSlots.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Самовывоз → выбор / отображение магазина */}
                    {isPickup && (
                      <div className="checkout__block">
                        <h3 className="checkout__block-title">Адрес самовывоза</h3>

                        {/* Выбранный магазин */}
                        {selectedStore && (
                          <div className="checkout__pickup-info">
                            <div className="checkout__pickup-details">
                              <strong>{selectedStore.name}</strong>
                              <p>{selectedStore.address}</p>
                              {selectedStore.hours && <p className="checkout__pickup-hours">{selectedStore.hours}</p>}
                              {selectedStore.phone && <p className="checkout__pickup-phone">{selectedStore.phone}</p>}
                              <button className="checkout__change-btn" onClick={() => setStorePickerOpen((v) => !v)}>Изменить</button>
                            </div>
                            {selectedStore.lat > 0 && (
                              <div className="checkout__pickup-map">
                                <YandexMap lat={selectedStore.lat} lng={selectedStore.lng} height={250} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Список магазинов (всегда виден если не выбран, или по кнопке «Изменить») */}
                        {(!selectedStore || storePickerOpen) && (
                          <div className="checkout__store-inline">
                            <div className="checkout__store-search">
                              <input type="text" placeholder="Поиск по адресу" value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)} />
                            </div>
                            <div className="checkout__store-layout">
                              <div className="checkout__store-list">
                                {stores
                                  .filter((s) => !storeSearch || s.name.toLowerCase().includes(storeSearch.toLowerCase()) || s.address.toLowerCase().includes(storeSearch.toLowerCase()))
                                  .map((store) => (
                                    <div className="checkout__store-item" key={store.id}>
                                      <strong>{store.name}</strong>
                                      <p>{store.address}</p>
                                      {store.hours && <p className="checkout__store-hours">{store.hours}</p>}
                                      <button
                                        className={`checkout__store-select${selectedStore?.id === store.id ? ' is-active' : ''}`}
                                        onClick={() => { setSelectedStore(store); setStorePickerOpen(false) }}
                                      >
                                        {selectedStore?.id === store.id ? 'Выбрано' : 'Выбрать'}
                                      </button>
                                    </div>
                                  ))}
                              </div>
                              <div className="checkout__store-map">
                                <YandexMap
                                  lat={selectedStore ? selectedStore.lat : 53.1867}
                                  lng={selectedStore ? selectedStore.lng : 45.0052}
                                  zoom={13}
                                  points={stores.filter((s) => s.lat && s.lng)}
                                  height={400}
                                  onSelect={(store) => { setSelectedStore(store); setStorePickerOpen(false) }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ▸▸▸ ШАГ 3: Оплата ▸▸▸ */}
              <div className={`checkout__step${!deliveryMethod ? ' is-disabled' : ''}`}>
                <div className="checkout__step-badge">Шаг 3</div>
                <h3 className="checkout__block-title">Оплата</h3>

                {!deliveryMethod ? (
                  <div className="checkout__disabled-hint">Сначала выберите способ доставки</div>
                ) : paymentLoading ? (
                  <div className="checkout__loading">Загрузка способов оплаты…</div>
                ) : (
                  <div className="checkout__payment-grid">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        className={`checkout__payment-btn${String(paymentMethod) === String(pm.id) ? ' is-active' : ''}`}
                        onClick={() => setPaymentMethod(String(pm.id))}
                      >
                        {pm.logotip && <img src={pm.logotip} alt="" className="checkout__payment-logo" />}
                        <span className="checkout__payment-label">{pm.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ═════════════ RIGHT: Sidebar ═════════════ */}
            <div className="checkout__sidebar">
              <div className="checkout__sidebar-products">
                <div className="checkout__sidebar-count">{totalCount} {totalCount === 1 ? 'товар' : totalCount < 5 ? 'товара' : 'товаров'}</div>
                {items.map((item) => (
                  <div className="checkout__sidebar-item" key={item.id}>
                    <div className="checkout__sidebar-img">
                      <ImageWithFallback src={item.image} alt={decodeHtml(item.name)} />
                    </div>
                    <div className="checkout__sidebar-info">
                      <div className="checkout__sidebar-name">{decodeHtml(item.name)}</div>
                      <div className="checkout__sidebar-price">{fmt(Number(item.price))} ₽</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart__summary">
                <div className="cart__summary-row">
                  <span>{totalCount} {totalCount === 1 ? 'товар' : totalCount < 5 ? 'товара' : 'товаров'} на сумму:</span>
                  <strong>{fmt(totalAmount)} ₽</strong>
                </div>
                {totalOldAmount > totalAmount && (
                  <div className="cart__summary-old">{fmt(totalOldAmount)} ₽</div>
                )}
                <div className="cart__summary-row">
                  <span>Доставка:</span>
                  <span className="cart__summary-green">{deliveryPrice > 0 ? priceLabel(deliveryPrice) : (cityConfirmed && deliveryMethod ? 'Бесплатно' : 'Рассчитывается')}</span>
                </div>
                {(totals?.discount_price > 0 || savings > 0) && (
                  <div className="cart__summary-row">
                    <span>Скидка:</span>
                    <span className="cart__summary-green">{fmt(totals?.discount_price || savings)} ₽</span>
                  </div>
                )}
                <div className="cart__summary-row">
                  <span>Вы получите:</span>
                  <span>{points} <img src="/img/header/score.png" alt="" className="cart__score-img" /></span>
                </div>

                <div className="cart__summary-divider" />

                <label className="cart__promo-label">
                  <span>Списать баллы</span>
                  <input type="checkbox" className="cart__promo-toggle" />
                </label>

                <div className="cart__promo-row">
                  <input type="text" className="cart__promo-input" placeholder="Промокод" />
                  <button className="cart__promo-btn">Применить</button>
                </div>

                <div className="cart__summary-divider" />

                <div className="cart__summary-total">
                  <span>Итого:</span>
                  <strong>{fmt(totalPrice)} ₽</strong>
                </div>

                {checkoutErrors.length > 0 && (
                  <div className="checkout__errors">
                    {checkoutErrors.map((e, i) => <p key={i} className="checkout__error-msg">{e}</p>)}
                  </div>
                )}

                <button
                  className="cart__checkout-btn"
                  onClick={handleSubmitOrder}
                  disabled={submitting || !isAuthenticated || !cityConfirmed || !deliveryMethod || !paymentMethod}
                >
                  {submitting ? 'Оформляем...' : 'Оформить заказ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Confirmation Modal */}
      {smsModalOpen && (
        <div className="modal-overlay" onClick={() => setSmsModalOpen(false)}>
          <div className="checkout__sms-modal" onClick={(e) => e.stopPropagation()}>
            <button className="checkout__sms-close" onClick={() => setSmsModalOpen(false)}>×</button>
            <h3>Требуется подтверждение</h3>
            <p>На номер <strong>{phone}</strong><br />было отправлено SMS с кодом подтверждения</p>
            <div className="checkout__sms-digits">
              {smsCode.map((digit, i) => (
                <input
                  key={i}
                  id={`sms-digit-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleSmsInput(i, e.target.value)}
                  onKeyDown={(e) => handleSmsKeyDown(i, e)}
                  className="checkout__sms-digit"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {smsError && <p className="checkout__sms-error">{smsError}</p>}
            <button className="checkout__sms-confirm" onClick={handleSmsConfirm} disabled={smsSending}>
              Подтвердить
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Checkout
