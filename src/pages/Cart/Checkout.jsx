import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { clearCart, fetchServerCart, mergeGuestCart } from '../../store/slices/cartSlice'
import { fetchUserAddresses } from '../../store/slices/userSlice'
import {
  getLocationCode, getCheckoutContext, calculateCheckout, submitCheckout,
  sendSmsCode, verifySmsCode,
  getBitrixStoreList,
  getUserProfile,
  getGuestFuserId,
} from '../../services/apiClient'
import { setToken } from '../../store/slices/authSlice'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import { decodeHtml } from '../../utils/decodeHtml'
import { getPropValue } from '../../utils/addressProperties'
import { getDefaultAddressId } from '../../utils/defaultAddress'

// ── DaData подсказки городов ──────────────────────────────
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN
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

  // ── Сохранённые адреса пользователя ──────────────────────
  const userAddresses = useSelector((s) => s.user.addresses)
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  // Загрузка адресов для авторизованных пользователей
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserAddresses())
    }
  }, [isAuthenticated, dispatch])

  // Обработчик выбора сохранённого адреса — заполняет город и адрес
  // доставки целиком, чтобы ускорить оформление для вернувшегося покупателя.
  // Адрес хранится одной строкой в properties (ADDRESS) — город это первый
  // сегмент до запятой, остальное — адрес доставки. В отличие от DaData
  // (которая отдаёт чистое "Пенза"), в сохранённом адресе первый сегмент
  // может содержать префикс "г./с./пос." — /sale/location/code с таким
  // префиксом код города вообще не находит, поэтому его нужно срезать
  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id)
    const addressLine = getPropValue(address.properties, 'ADDRESS')
    if (addressLine) {
      const [rawCity, ...rest] = addressLine.split(',').map((s) => s.trim())
      const city = rawCity?.replace(/^(г|гор|город|с|село|пос|посёлок|поселок|д|дер|деревня)\.?\s+/i, '').trim()
      if (city) {
        setCityInput(city)
        setCityConfirmed(city)
      }
      setDeliveryAddress(rest.join(', '))
    }
  }

  // Автовыбор сохранённого адреса сразу после загрузки — приоритет у адреса
  // "по умолчанию" (фронтенд-only, бэкенд его не хранит), иначе первый из списка.
  // Не заставляем повторно выбирать город, если он уже есть в профиле
  useEffect(() => {
    if (!isAuthenticated || !userAddresses.length) return
    if (selectedAddressId || cityConfirmed) return
    const defaultId = getDefaultAddressId()
    const defaultAddr = defaultId && userAddresses.find((a) => String(a.id) === String(defaultId))
    handleSelectAddress(defaultAddr || userAddresses[0])
  }, [isAuthenticated, userAddresses])

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
  const [stores, setStores] = useState(DEFAULT_STORES)        // магазины самовывоза
  const [cdekPoints, setCdekPoints] = useState([])            // ПВЗ СДЭК
  const [cdekLoading, setCdekLoading] = useState(false)
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
  const [deliveryAddress, setDeliveryAddress] = useState('')

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
  // autoSelectDelivery=true только при первоначальном getCheckoutContext
  // В calculate-ответах НЕ меняем deliveryMethod — иначе infinite loop
  const applyCheckoutResponse = (data, { autoSelectDelivery = false, autoSelectPayment = true } = {}) => {
    const co = data.checkout || data
    if (co.available_deliveries) {
      const deliveries = co.available_deliveries
      setDeliveryMethods(deliveries)
      if (autoSelectDelivery) {
        const selected = deliveries.find((d) => d.selected)
          || deliveries.find((d) => d.available !== false)
          || deliveries[0]
        if (selected) setDeliveryMethod(String(selected.id))
      }
    }
    if (autoSelectPayment && co.available_pay_systems) {
      const payments = co.available_pay_systems.filter((p) => p.available !== false)
      setPaymentMethods(payments)
      const selected = payments.find((p) => p.selected) || payments[0]
      if (selected && String(selected.id) !== String(paymentMethod)) {
        setPaymentMethod(String(selected.id))
      } else if (!paymentMethod && selected) {
        setPaymentMethod(String(selected.id))
      }
    }
    if (co.person_types?.length) {
      // Берём person_type_id из API, а не хардкодим
      if (!personTypeId) setPersonTypeId(co.person_types[0].id)
    }
    if (co.selected?.person_type_id) {
      setPersonTypeId(co.selected.person_type_id)
    }
    if (co.properties) setCheckoutProperties(co.properties)
    if (co.totals) setTotals(co.totals)
    if (typeof data.can_submit !== 'undefined') setCanSubmit(data.can_submit)
    if (data.errors?.length) setCheckoutErrors(data.errors)
    else setCheckoutErrors([])

    // Пункты самовывоза СДЭК — из ответа calculate/context
    const cdek = co.selected_delivery?.pickup_points
      || co.available_deliveries?.find((d) => d.selected)?.pickup_points
      || []
    if (cdek.length) {
      const mapped = cdek.map((p) => ({
        id: p.id || p.code,
        name: p.name || p.city_name || 'Пункт СДЭК',
        address: p.address || p.full_address || '',
        hours: p.work_time || p.schedule || '',
        phone: p.phones?.[0]?.number || '',
        lat: Number(p.latitude || p.lat || 0),
        lng: Number(p.longitude || p.lng || 0),
      }))
      setCdekPoints(mapped)
    }
  }

  // ── Получаем location code при подтверждении города ─────
  useEffect(() => {
    if (!cityConfirmed) return
    let cancelled = false
    ;(async () => {
      try {
        const locRes = await getLocationCode(cityConfirmed)
        if (!cancelled) {
          const d = locRes.data?.data
          const code = d?.location_code
            || (Array.isArray(d?.items) && d.items[0]?.code)
            || ''
          console.log('[CHECKOUT] locationCode resolved:', code, '| raw data:', d)
          setLocationCode(code)
        }
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
        // Подтягиваем актуальную серверную корзину перед расчётом.
        // Все add/remove/qty уже синхронизированы в момент действия пользователя.
        await dispatch(fetchServerCart()).unwrap().catch(() => {})

        const params = {}
        if (locationCode) params.location = locationCode
        const ctxRes = await getCheckoutContext(params)
        if (cancelled) return
        applyCheckoutResponse(ctxRes.data, { autoSelectDelivery: true })
      } catch (err) {
        const errMsg = err.response?.data?.errors || err.response?.data?.message || err.message
        console.error('[CHECKOUT] context/sync error:', err?.response?.data || err?.message)
        setCheckoutErrors(Array.isArray(errMsg) ? errMsg : [String(errMsg)])
      }
      if (!cancelled) setDeliveryLoading(false)
    })()

    // Магазины (самовывоз) — из Bitrix catalog.store.list
    getBitrixStoreList()
      .then(async (res) => {
        if (cancelled) return
        const raw = res.data?.result?.stores || []
        // shippingCenter='Y' — внутренний склад/буфер отгрузки (не точка
        // самовывоза для клиента), у таких записей в ADDRESS часто лежит
        // не адрес, а служебное название ("Депо", "Склад - Технопорт"),
        // что дополнительно ломало геокодирование на карте.
        const active = raw.filter((s) => s.active === 'Y' && s.address && s.shippingCenter !== 'Y')
        if (!active.length) return
        const mapped = active.map((s) => ({
          id: s.id,
          name: s.title || 'Пункт выдачи',
          address: s.address,
          hours: s.schedule || '',
          phone: s.phone || '',
          lat: Number(s.GPS_N || s.gpsN || 0),
          lng: Number(s.GPS_S || s.gpsS || 0),
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

  // ── Пересчёт checkout/calculate ──────────────────────────
  // По документации API вызывается после ЛЮБОГО изменения данных
  // checkout: город/адрес, плательщик, доставка, оплата, пункт самовывоза
  const buildCalculatePayload = () => {
    const activeD = deliveryMethods.find((d) => String(d.id) === String(deliveryMethod))
    const pickupPointId = selectedStore?.id || activeD?.selected_pickup_point_id || null
    const data = {
      delivery_id: Number(deliveryMethod),
      location: locationCode || undefined,
      properties: {
        LOCATION: locationCode || undefined,
        PHONE: phone.replace(/\D/g, '') || undefined,
        EMAIL: email || undefined,
        ADDRESS: deliveryAddress ? `${cityConfirmed}, ${deliveryAddress}` : (cityConfirmed || undefined),
      },
    }
    if (personTypeId) data.person_type_id = personTypeId
    if (paymentMethod) data.pay_system_id = Number(paymentMethod)
    if (pickupPointId) data.pickup_point_id = pickupPointId
    return data
  }

  // ── Пересчёт при смене доставки (сразу) ─────────────────
  useEffect(() => {
    if (!deliveryMethod || !cityConfirmed) return
    let cancelled = false
    setPaymentLoading(true)

    ;(async () => {
      try {
        const res = await calculateCheckout(buildCalculatePayload())
        if (!cancelled) applyCheckoutResponse(res.data, { autoSelectDelivery: false })
      } catch (calcErr) {
        console.error('[CHECKOUT] calculateCheckout error:', calcErr?.response?.data || calcErr?.message)
      }
      if (!cancelled) setPaymentLoading(false)
    })()

    return () => { cancelled = true }
  }, [deliveryMethod])

  // ── Пересчёт при смене оплаты (debounce) ────────────────
  const paymentCalculateTimer = useRef(null)
  useEffect(() => {
    if (!paymentMethod || !deliveryMethod || !cityConfirmed) return
    clearTimeout(paymentCalculateTimer.current)
    paymentCalculateTimer.current = setTimeout(async () => {
      try {
        const res = await calculateCheckout(buildCalculatePayload())
        applyCheckoutResponse(res.data, { autoSelectDelivery: false })
      } catch (calcErr) {
        console.error('[CHECKOUT] payment calculateCheckout error:', calcErr?.response?.data || calcErr?.message)
      }
    }, 300)
    return () => clearTimeout(paymentCalculateTimer.current)
  }, [paymentMethod])

  // ── Пересчёт при смене адреса или пункта самовывоза (debounce) ──
  // Раньше ADDRESS/pickup_point_id попадали на backend только при смене
  // способа доставки — калькуляция не знала о введённом адресе или
  // выбранном ПВЗ до самого submit
  const addressCalculateTimer = useRef(null)
  useEffect(() => {
    if (!deliveryMethod || !cityConfirmed) return
    clearTimeout(addressCalculateTimer.current)
    addressCalculateTimer.current = setTimeout(async () => {
      try {
        const res = await calculateCheckout(buildCalculatePayload())
        applyCheckoutResponse(res.data, { autoSelectDelivery: false })
      } catch (calcErr) {
        console.error('[CHECKOUT] address/pickup calculateCheckout error:', calcErr?.response?.data || calcErr?.message)
      }
    }, 500)
    return () => clearTimeout(addressCalculateTimer.current)
  }, [deliveryAddress, selectedStore])

  // Сброс выбранного магазина при смене способа доставки
  useEffect(() => {
    setSelectedStore(null)
    setStoreSearch('')
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
        person_type_id: personTypeId,
        delivery_id: Number(deliveryMethod),
        pay_system_id: Number(paymentMethod),
        location: locationCode || undefined,
        properties: {
          LOCATION: locationCode || undefined,
          PHONE: phone.replace(/\D/g, ''),
          NAME: firstName || undefined,
          SURNAME: lastName || undefined,
          EMAIL: email || undefined,
          ADDRESS: deliveryAddress ? `${cityConfirmed}, ${deliveryAddress}` : (cityConfirmed || undefined),
        },
        comment: comment || undefined,
      }
      // pickup_point_id для самовывоза
      if (selectedStore?.id) submitData.pickup_point_id = selectedStore.id
      else if (activeDelivery?.selected_pickup_point_id) {
        submitData.pickup_point_id = activeDelivery.selected_pickup_point_id
      }

      console.log('[CHECKOUT] submitCheckout → submitData:', submitData)
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
      console.error('[CHECKOUT] doCreateOrder error:', err?.response?.data || err?.message)
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
        // Объединяем гостевую корзину с корзиной аккаунта (или просто
        // подтягиваем серверную, если гостевой fuser_id не было).
        const guestFuserId = getGuestFuserId()
        if (guestFuserId) {
          try {
            await dispatch(mergeGuestCart()).unwrap()
          } catch {
            dispatch(fetchServerCart())
          }
        } else {
          dispatch(fetchServerCart())
        }
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

  // Bitrix магазины самовывоза есть только в Пензе
  // Для любого другого города самовывоз = СДЭК ПВЗ
  const isPenzaCity = !!cityConfirmed?.toLowerCase().includes('пенз')

  // Самовывоз из магазина — только Пенза
  const isPickupStore = isPickup && isPenzaCity

  // Самовывоз из ПВЗ СДЭК — любой другой город
  const isPickupCdek = isPickup && !isPenzaCity

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

  // ── Загрузка ПВЗ СДЭК при выборе СДЭК-самовывоза ────────
  // ПВЗ приходят из поля pickup_points в ответе calculateCheckout / getCheckoutContext
  // Прямой вызов api.cdek.ru невозможен из браузера (CORS + OAuth2)
  useEffect(() => {
    if (!isPickupCdek) return
    // Сброс при смене доставки на СДЭК (новый город)
    setCdekPoints([])
    setCdekLoading(false)
  }, [isPickupCdek, cityConfirmed])

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

                {/* Сохранённые адреса — быстрый путь: выбор сразу
                    заполняет город и адрес доставки (см. handleSelectAddress) */}
                {isAuthenticated && userAddresses.length > 0 && (
                  <div className="checkout__block">
                    <div className="checkout__saved-addresses-header">
                      <h3 className="checkout__block-title">Мои адреса</h3>
                      <Link to="/personal/addresses/" className="checkout__manage-addresses-link">
                        Управление адресами
                      </Link>
                    </div>
                    <select
                      className="checkout__saved-address-select"
                      value={selectedAddressId ?? ''}
                      onChange={(e) => {
                        const addr = userAddresses.find((a) => String(a.id) === e.target.value)
                        if (addr) handleSelectAddress(addr)
                      }}
                    >
                      <option value="" disabled>Выберите адрес</option>
                      {userAddresses.map((addr) => {
                        const addrLine = getPropValue(addr.properties, 'ADDRESS')
                        const isDefault = String(getDefaultAddressId()) === String(addr.id)
                        // name профиля часто совпадает с адресом (так создаётся
                        // через форму) — не дублируем в одной строке
                        const label = addrLine && addrLine !== addr.name
                          ? `${addr.name} — ${addrLine}`
                          : (addr.name || addrLine)
                        return (
                          <option key={addr.id} value={addr.id}>
                            {label}{isDefault ? ' (по умолчанию)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

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

                {/* Данные покупателя — доступны только после выбора города
                    (либо сразу, если город пришёл из сохранённого адреса) */}
                <div className={`checkout__block${!cityConfirmed ? ' is-disabled' : ''}`}>
                  <h3 className="checkout__block-title">Покупатель</h3>
                  {!cityConfirmed ? (
                    <div className="checkout__disabled-hint">Сначала укажите город доставки</div>
                  ) : (
                    <div className="checkout__form-grid">
                      <div className="checkout__field">
                        <label>Телефон</label>
                        <div className="checkout__phone-row">
                          <input type="tel" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="+7" />
                          {!isAuthenticated && (
                            <button
                              className="checkout__sms-send-btn"
                              onClick={handleSendSms}
                              disabled={smsSending || !phone.trim()}
                            >
                              {smsSending ? '...' : 'Подтвердить'}
                            </button>
                          )}
                        </div>
                        {!isAuthenticated && smsError && (
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
                  )}
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
                        {deliveryMethods.map((d) => {
                          const isUnavailable = d.available === false
                          // price_formatted из Bitrix содержит HTML-теги → считаем сами
                          const priceText = d.price != null
                            ? (d.price > 0 ? `${fmt(d.price)} ₽` : 'Бесплатно')
                            : null
                          return (
                            <button
                              key={d.id}
                              className={`checkout__delivery-btn${String(deliveryMethod) === String(d.id) ? ' is-active' : ''}${isUnavailable ? ' is-unavailable' : ''}`}
                              onClick={() => !isUnavailable && setDeliveryMethod(String(d.id))}
                              disabled={isUnavailable}
                              title={isUnavailable ? 'Недоступно для выбранного города' : undefined}
                            >
                              {d.logotip && <img src={d.logotip} alt="" className="checkout__delivery-logo" />}
                              <span className="checkout__delivery-label">{d.name}</span>
                              {priceText && (
                                <span className="checkout__delivery-price">{priceText}</span>
                              )}
                              {d.period_text && (
                                <span className="checkout__delivery-desc">{d.period_text}</span>
                              )}
                              {isUnavailable && (
                                <span className="checkout__delivery-unavailable">Недоступно</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Адрес доставки — только для курьерских способов */}
                    {!isPickup && deliveryMethod && (
                      <div className="checkout__block">
                        <h3 className="checkout__block-title">Адрес доставки</h3>
                        <input
                          type="text"
                          className="checkout__input"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Улица, дом, квартира"
                        />
                      </div>
                    )}

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

                    {/* Самовывоз из магазина (не СДЭК) */}
                    {isPickupStore && (
                      <div className="checkout__block">
                        <h3 className="checkout__block-title">Выберите магазин</h3>

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

                    {/* Самовывоз из ПВЗ СДЭК */}
                    {isPickupCdek && (
                      <div className="checkout__block">
                        <h3 className="checkout__block-title">Выберите пункт выдачи СДЭК</h3>

                        {cdekLoading && <div className="checkout__loading">Загрузка пунктов выдачи…</div>}

                        {/* Выбранный ПВЗ */}
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

                        {(!selectedStore || storePickerOpen) && cdekPoints.length > 0 && (
                          <div className="checkout__store-inline">
                            <div className="checkout__store-search">
                              <input type="text" placeholder="Поиск по адресу" value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)} />
                            </div>
                            <div className="checkout__store-layout">
                              <div className="checkout__store-list">
                                {cdekPoints
                                  .filter((s) => !storeSearch || s.name.toLowerCase().includes(storeSearch.toLowerCase()) || s.address.toLowerCase().includes(storeSearch.toLowerCase()))
                                  .map((point) => (
                                    <div className="checkout__store-item" key={point.id}>
                                      <strong>{point.name}</strong>
                                      <p>{point.address}</p>
                                      {point.hours && <p className="checkout__store-hours">{point.hours}</p>}
                                      <button
                                        className={`checkout__store-select${selectedStore?.id === point.id ? ' is-active' : ''}`}
                                        onClick={() => { setSelectedStore(point); setStorePickerOpen(false) }}
                                      >
                                        {selectedStore?.id === point.id ? 'Выбрано' : 'Выбрать'}
                                      </button>
                                    </div>
                                  ))}
                              </div>
                              <div className="checkout__store-map">
                                <YandexMap
                                  lat={selectedStore ? selectedStore.lat : (cdekPoints[0]?.lat || 53.1867)}
                                  lng={selectedStore ? selectedStore.lng : (cdekPoints[0]?.lng || 45.0052)}
                                  zoom={13}
                                  points={cdekPoints.filter((s) => s.lat && s.lng)}
                                  height={400}
                                  onSelect={(point) => { setSelectedStore(point); setStorePickerOpen(false) }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {!cdekLoading && cdekPoints.length === 0 && (
                          <div className="checkout__disabled-hint">
                            Пункты выдачи СДЭК будут доступны после расчёта стоимости доставки.
                            Если список не появился — уточните пункты самовывоза на сайте <a href="https://cdek.ru/ru/offices" target="_blank" rel="noopener noreferrer">cdek.ru</a>
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
