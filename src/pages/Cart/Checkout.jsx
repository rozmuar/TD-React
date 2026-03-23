import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { clearCart } from '../../store/slices/cartSlice'
import {
  createBitrixOrder, isOnlinePayment,
  sendOrderSms, verifyOrderSms,
  getBitrixDeliveryList, getBitrixPaymentList, getBitrixStoreList,
  getUserProfile,
} from '../../services/apiClient'
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

// ── Фоллбэки: способы доставки / оплаты (если API не ответит) ─────
const FALLBACK_DELIVERY_PENZA = [
  { id: '4', name: 'Самовывоз', description: '', children: [] },
  { id: '77', name: 'Самовывоз Ставского 4', description: '', children: [] },
  { id: '2', name: 'Курьерская служба доставки по г. Пенза', description: '', children: [] },
  { id: '30', name: 'Отправка на такси в течение 1 часа по г. Пенза', description: '', children: [] },
  { id: '38', name: 'Грузовая доставка по г. Пенза', description: '', children: [] },
  { id: '71', name: 'СДЭК', description: '', children: [
    { id: '72', name: 'Доставка курьером', description: '' },
    { id: '73', name: 'Самовывоз', description: '' },
    { id: '74', name: 'Постамат', description: '' },
  ] },
]

const FALLBACK_DELIVERY_OTHER = [
  { id: '71', name: 'СДЭК', description: '', children: [
    { id: '72', name: 'Доставка курьером', description: '' },
    { id: '73', name: 'Самовывоз', description: '' },
    { id: '74', name: 'Постамат', description: '' },
  ] },
]

const FALLBACK_PAYMENT_LOCAL = [
  { id: '29', name: 'Наличные при получении' },
  { id: '40', name: 'Картой при получении' },
  { id: '43', name: 'Т-Банк оплата картой' },
  { id: '56', name: 'Онлайн картой' },
  { id: '57', name: 'Яндекс Пэй' },
  { id: '52', name: 'Рассрочки и кредиты от Тинькофф' },
  { id: '59', name: 'Частями' },
]

const FALLBACK_PAYMENT_REMOTE = [
  { id: '43', name: 'Т-Банк оплата картой' },
  { id: '56', name: 'Онлайн картой' },
  { id: '57', name: 'Яндекс Пэй' },
  { id: '52', name: 'Рассрочки и кредиты от Тинькофф' },
  { id: '59', name: 'Частями' },
]

// ── Фильтрация по городу и способу доставки ───────────────
const isPenzaCity = (city) => (city || '').toLowerCase().includes('пенза')

// ID оплат, доступных только при локальной доставке (наличные / карта при получении)
const CASH_PAYMENT_IDS = new Set(['29', '38', '40', '58'])

// Проверяет, является ли доставка локальной (Пенза)
const isLocalDeliveryName = (name) => {
  const n = (name || '').toLowerCase()
  return n.includes('пенза') || (n.startsWith('самовывоз') && !n.includes('сдэк')) || n.includes('такси')
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

  // ── Шаг 2: доставка (загружается после подтверждения города) ──
  const [deliveryMethods, setDeliveryMethods] = useState([])
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState(null)
  const [courierServices, setCourierServices] = useState([])
  const [courierService, setCourierService] = useState(null)
  const [stores, setStores] = useState(DEFAULT_STORES)
  const [selectedStore, setSelectedStore] = useState(null)
  const [storePickerOpen, setStorePickerOpen] = useState(false)
  const [storeSearch, setStoreSearch] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')

  // ── Шаг 3: оплата (загружается после выбора доставки) ───
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(null)

  // ── SMS / Submit ────────────────────────────────────────
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsCode, setSmsCode] = useState(['', '', '', ''])
  const [smsSending, setSmsSending] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── Computed ────────────────────────────────────────────
  const totalAmount = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  const totalOldAmount = items.reduce((s, i) => s + Number(i.oldPrice || i.price) * i.quantity, 0)
  const totalCount = items.reduce((s, i) => s + i.quantity, 0)
  const savings = totalOldAmount - totalAmount
  const points = Math.round(totalAmount * 0.03)
  const activeDelivery = deliveryMethods.find((d) => d.id === deliveryMethod)
  const activeCourier = courierServices.find((c) => c.id === courierService)
  const deliveryPrice = activeCourier?.price ?? activeDelivery?.price ?? 0

  const fmt = (n) => Math.floor(n).toLocaleString('ru-RU')
  const priceLabel = (p) => (p > 0 ? `${fmt(p)} ₽` : 'Рассчитывается')

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

  // ── Загрузка доставок при подтверждении города ──────────
  useEffect(() => {
    if (!cityConfirmed) return
    let cancelled = false
    setDeliveryLoading(true)
    setDeliveryMethod(null)
    setPaymentMethods([])
    setPaymentMethod(null)

    const penza = isPenzaCity(cityConfirmed)
    const fallback = penza ? FALLBACK_DELIVERY_PENZA : FALLBACK_DELIVERY_OTHER

    getBitrixDeliveryList()
      .then((res) => {
        if (cancelled) return
        const all = res.data?.result || []
        // Только активные верхнего уровня (PARENT_ID=0)
        const active = all.filter((d) => d.ACTIVE === 'Y' && String(d.PARENT_ID) === '0')
        const parsed = active.map((d) => ({
          id: String(d.ID),
          name: d.NAME,
          description: stripHtml(d.DESCRIPTION),
          children: all
            .filter((ch) => String(ch.PARENT_ID) === String(d.ID) && ch.ACTIVE === 'Y')
            .map((ch) => ({ id: String(ch.ID), name: ch.NAME, description: stripHtml(ch.DESCRIPTION) })),
        }))
        // Фильтрация по городу + скрыть опт (только для юр.лиц)
        const hideIds = new Set(['1']) // «Без доставки»
        const isOpt = (name) => name.toLowerCase().includes('опт')
        const filtered = penza
          ? parsed.filter((d) => !hideIds.has(d.id) && !isOpt(d.name))
          : parsed.filter((d) => {
              if (hideIds.has(d.id) || isOpt(d.name)) return false
              const name = d.name.toLowerCase()
              if (name.includes('пенза')) return false
              if (name.startsWith('самовывоз') && !name.includes('сдэк')) return false
              return true
            })
        if (filtered.length) {
          setDeliveryMethods(filtered)
          setDeliveryMethod(filtered[0].id)
        } else {
          setDeliveryMethods(fallback)
          setDeliveryMethod(fallback[0].id)
        }
      })
      .catch(() => {
        if (!cancelled) { setDeliveryMethods(fallback); setDeliveryMethod(fallback[0].id) }
      })
      .finally(() => { if (!cancelled) setDeliveryLoading(false) })

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
  }, [cityConfirmed])

  // ── Загрузка способов оплаты при выборе доставки ────────
  useEffect(() => {
    if (!deliveryMethod) return
    let cancelled = false
    setPaymentLoading(true)
    setPaymentMethod(null)

    // Определяем тип доставки: локальная (Пенза) или удалённая
    const currentDelivery = deliveryMethods.find((d) => d.id === deliveryMethod)
    const isLocal = isLocalDeliveryName(currentDelivery?.name)
    const payFallback = isLocal ? FALLBACK_PAYMENT_LOCAL : FALLBACK_PAYMENT_REMOTE

    getBitrixPaymentList()
      .then((res) => {
        if (cancelled) return
        const all = res.data?.result || []
        // Только активные, для розничных типов (PERSON_TYPE_ID = 5, null или без привязки)
        const active = all.filter((p) => {
          if (p.ACTIVE !== 'Y') return false
          const pt = p.PERSON_TYPE_ID
          return !pt || pt === '5' || pt === null
        })
        const parsed = active.map((p) => ({
          id: String(p.ID),
          name: p.PSA_NAME || p.NAME,
          logo: p.LOGOTYPE ? `https://topdisc.ru/upload/resize_cache/${p.LOGOTYPE}/100_50_1/` : null,
        }))
        // Фильтрация по способу доставки:
        // Удалённая доставка (СДЭК и т.п.) → только онлайн-оплата
        // Локальная (Пенза) → все способы оплаты
        const filtered = isLocal
          ? parsed
          : parsed.filter((p) => !CASH_PAYMENT_IDS.has(p.id))
        if (filtered.length) {
          setPaymentMethods(filtered)
          setPaymentMethod(filtered[0].id)
        } else {
          setPaymentMethods(payFallback)
          setPaymentMethod(payFallback[0].id)
        }
      })
      .catch(() => {
        if (!cancelled) { setPaymentMethods(payFallback); setPaymentMethod(payFallback[0].id) }
      })
      .finally(() => { if (!cancelled) setPaymentLoading(false) })

    // Дочерние способы (СДЭК и т.п.)
    const current = deliveryMethods.find((d) => d.id === deliveryMethod)
    if (current?.children?.length) {
      setCourierServices(current.children)
      setCourierService(current.children[0]?.id || null)
    } else {
      setCourierServices([])
      setCourierService(null)
    }

    return () => { cancelled = true }
  }, [deliveryMethod, cityConfirmed, deliveryMethods])

  // Сброс выбранного магазина при смене способа доставки
  useEffect(() => {
    setSelectedStore(null)
  }, [deliveryMethod])

  // ── Submit ──────────────────────────────────────────────
  const handleSubmitOrder = async () => {
    if (!phone.trim()) { alert('Укажите телефон'); return }
    if (!cityConfirmed) { alert('Выберите город из подсказок'); return }
    if (isPickup && !selectedStore) { alert('Выберите магазин для самовывоза'); return }

    if (!isAuthenticated) {
      setSmsSending(true)
      setSmsError('')
      try { await sendOrderSms(phone) } catch { /* demo */ }
      setSmsSending(false)
      setSmsModalOpen(true)
      return
    }
    await doCreateOrder()
  }

  const doCreateOrder = async () => {
    setSubmitting(true)
    try {
      // Получаем ID текущего пользователя из профиля
      let userId
      try {
        const profileRes = await getUserProfile()
        const profile = profileRes.data?.message || profileRes.data
        console.log('User profile for order:', profile)
        userId = profile?.id || profile?.ID || profile?.user_id || profile?.USER_ID
        console.log('Resolved userId:', userId)
      } catch (e) { console.warn('getUserProfile failed:', e.message) }

      const result = await createBitrixOrder({
        items: items.map((i) => ({ id: i.id, name: decodeHtml(i.name), price: i.price, quantity: i.quantity })),
        totalPrice: totalAmount,
        phone: phone.replace(/\D/g, ''),
        email,
        firstName,
        lastName,
        city: cityConfirmed,
        comment,
        deliveryId: courierService || deliveryMethod,
        paySystemId: paymentMethod,
        userId,
      })
      dispatch(clearCart())

      // Онлайн-оплата → переходим на страницу оплаты Bitrix
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
        return
      }

      // Оффлайн-оплата → страница успеха
      navigate('/cart/success/', {
        state: {
          orderNumber: result.accountNumber,
          items,
          totalAmount,
          deliveryName: activeDelivery?.name || '',
          selectedStore,
          firstName,
          lastName,
          phone,
        },
      })
    } catch (err) {
      alert('Ошибка при создании заказа: ' + (err.message || 'Попробуйте позже'))
    }
    setSubmitting(false)
  }

  const handleSmsConfirm = async () => {
    const code = smsCode.join('')
    if (code.length < 4) return
    setSmsSending(true)
    setSmsError('')
    try { await verifyOrderSms(phone, code) } catch { /* demo */ }
    setSmsModalOpen(false)
    setSmsSending(false)
    await doCreateOrder()
  }

  const handleSmsInput = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/\d/.test(value)) return
    const next = [...smsCode]
    next[index] = value
    setSmsCode(next)
    if (value && index < 3) document.getElementById(`sms-digit-${index + 1}`)?.focus()
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

  const isCourier = courierServices.length > 0

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
                      <input type="tel" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="+7" />
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
              <div className={`checkout__step${!cityConfirmed ? ' is-disabled' : ''}`}>
                <div className="checkout__step-badge">Шаг 2</div>
                <h3 className="checkout__block-title">Способ доставки</h3>

                {!cityConfirmed ? (
                  <div className="checkout__disabled-hint">Сначала укажите город доставки</div>
                ) : deliveryLoading ? (
                  <div className="checkout__loading">Загрузка способов доставки…</div>
                ) : (
                  <>
                    <div className="checkout__block">
                      <div className="checkout__delivery-methods">
                        {deliveryMethods.map((d) => (
                          <button
                            key={d.id}
                            className={`checkout__delivery-btn${deliveryMethod === d.id ? ' is-active' : ''}`}
                            onClick={() => { setDeliveryMethod(d.id); setCourierService(null) }}
                          >
                            <span className="checkout__delivery-label">{d.name}</span>
                            {d.description && (
                              <span className="checkout__delivery-desc">{d.description}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Курьер → СДЭК варианты */}
                    {isCourier && (
                      <div className="checkout__block">
                        <h3 className="checkout__block-title">Способ получения</h3>
                        <div className="checkout__courier-services">
                          {courierServices.map((s) => (
                            <button
                              key={s.id}
                              className={`checkout__courier-btn${courierService === s.id ? ' is-active' : ''}`}
                              onClick={() => setCourierService(s.id)}
                            >
                              <span>{s.name}</span>
                              {s.description && (
                                <span className="checkout__courier-desc">{s.description}</span>
                              )}
                            </button>
                          ))}
                        </div>
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
                        className={`checkout__payment-btn${paymentMethod === pm.id ? ' is-active' : ''}`}
                        onClick={() => setPaymentMethod(pm.id)}
                      >
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
                  <span className="cart__summary-green">{priceLabel(deliveryPrice)}</span>
                </div>
                {savings > 0 && (
                  <div className="cart__summary-row">
                    <span>Экономия:</span>
                    <span className="cart__summary-green">{fmt(savings)} ₽</span>
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
                  <strong>{fmt(totalAmount + deliveryPrice)} ₽</strong>
                </div>

                <button
                  className="cart__checkout-btn"
                  onClick={handleSubmitOrder}
                  disabled={submitting || !cityConfirmed || !deliveryMethod}
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
