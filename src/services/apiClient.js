import axios from 'axios'

// Centralized Bitrix REST API base URL
const BITRIX_REST_URL = import.meta.env.VITE_BITRIX_REST_URL || 'https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e'

// Inject Redux store для 401-interceptor (вызывается из main.jsx, избегает circular imports)
let _store = null
export const injectStore = (store) => {
  _store = store
}

// Filter API base URL (separate service)
// SSR (Node.js) — используем абсолютный URL из env
// Браузер — всегда релятивный /api/mobile/v1 (через nginx proxy), игнорируем VITE_FILTER_API_URL
const _isSSR = typeof window === 'undefined'
const FILTER_API_URL = _isSSR
  ? (import.meta.env.VITE_FILTER_API_URL || 'https://topdisc.ru/mobile/v1')
  : '/api/mobile/v1'

export const bitrixClient = axios.create({
  baseURL: BITRIX_REST_URL,
})

export const filterClient = axios.create({
  baseURL: FILTER_API_URL,
})

// При 401 — токен протух/недействителен → автоматический логаут
filterClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('cart_items')
      localStorage.removeItem('guest_fuser_id')
      // dispatch через строковый тип чтобы избежать circular import
      _store?.dispatch({ type: 'auth/logout' })
      _store?.dispatch({ type: 'cart/clearCart' })
    }
    return Promise.reject(error)
  }
)

// ============================================================
// Категории
// ============================================================
export const getCategoryFirst = (opts) =>
  bitrixClient.get('/app_mobile.categoryFirst.json', opts)

export const getCategoryById = (id, opts) =>
  bitrixClient.get('/app_mobile.categoryId.json', { params: { id }, ...opts })

export const getCategoryByCode = (code, premium, opts) =>
  bitrixClient.get('/app_mobile.categoryIdByCode.json', { params: { code, premium: premium ? 1 : undefined }, ...opts })

export const getAllCategories = (opts) =>
  bitrixClient.get('/app_mobile.category.json', opts)

// ============================================================
// Товары
// ============================================================
export const getProductList = (params, opts) =>
  bitrixClient.get('/app_mobile.product_list.json', {
    params,
    paramsSerializer: (p) => {
      const sp = new URLSearchParams()
      for (const [key, value] of Object.entries(p)) {
        if (value === undefined || value === '') continue
        if (Array.isArray(value)) {
          value.forEach(v => sp.append(key, v))
        } else {
          sp.append(key, value)
        }
      }
      return sp.toString()
    },
    ...opts,
  })

export const getProductById = (id, opts) =>
  bitrixClient.get('/app_mobile.product.json', { params: { id }, ...opts })

export const getProductIdByCode = (code, opts) =>
  bitrixClient.get('/app_mobile.getProductIdByCode.json', { params: { code }, ...opts })

// ============================================================
// Меню каталога
// ============================================================
export const getMenu = (opts) =>
  bitrixClient.get('/app_mobile.menu.json', opts)

// ============================================================
// Главная страница
// ============================================================
export const getBigBanners = (opts) =>
  bitrixClient.get('/app_mobile.bigBaner.json', opts)

export const getForYou = (limit = 20, opts) =>
  bitrixClient.get('/app_mobile.forYou.json', { params: { limit }, ...opts })

export const getPopularCategories = (limit = 9, opts) =>
  bitrixClient.get('/app_mobile.popularCategories.json', { params: { limit }, ...opts })

export const getHurryToBuy = (limit = 20, opts) =>
  bitrixClient.get('/app_mobile.hurryToBuy.json', { params: { limit }, ...opts })

// ============================================================
// Новости
// ============================================================
export const getNewsForHome = (limit = 6, opts) =>
  bitrixClient.get('/app_mobile.news.json', { params: { limit }, ...opts })

export const getNewsList = (params, opts) =>
  bitrixClient.get('/app_mobile.newsList.json', { params, ...opts })

export const getNewsDetail = (params, opts) =>
  bitrixClient.get('/app_mobile.newsDetail.json', { params, ...opts })

export const getInfoPost = (code, opts) =>
  bitrixClient.get('/app_mobile.posts.json', { params: { code }, ...opts })

export const getTradeInData = (opts) =>
  bitrixClient.get('/app_mobile.tradein.json', { ...opts })

// ============================================================
// Фильтры
// ============================================================
// Премиум-товары (инфоблок 71, см. api_metods.php appMobile::PREMIUM_*):
// id раздела на фронте смещён на PREMIUM_ID_OFFSET (см. Category.jsx),
// а /filter/{iblock}/{id} на бэкенде принимает iblock и id как есть, без
// своего снятия смещения — поэтому распаковываем его здесь.
const PREMIUM_IBLOCK_ID = 71
const PREMIUM_ID_OFFSET = 10000000

export const getFilters = (categoryId, opts) => {
  const id = Number(categoryId)
  const isPremium = id >= PREMIUM_ID_OFFSET
  const iblock = isPremium ? PREMIUM_IBLOCK_ID : 4
  const sectionId = isPremium ? id - PREMIUM_ID_OFFSET : id
  return filterClient.get(`/filter/${iblock}/${sectionId}`, opts)
}

// ============================================================
// Бренды
// ============================================================
export const getBrandList = (page = 1, opts) =>
  bitrixClient.get('/app_mobile.brandList.json', { params: { page }, ...opts })

export const getBrandProducts = (params, opts) =>
  bitrixClient.get('/app_mobile.brandProducts.json', { params, ...opts })

// ============================================================
// Авторизация
// ============================================================
// Нормализация номера: 79xx → +79xx, 89xx → +79xx
function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) {
    digits = '7' + digits.slice(1)
  }
  return '+' + digits
}

export const sendSmsCode = (phone) => {
  const fd = new FormData()
  fd.append('phone', normalizePhone(phone))
  return filterClient.post('/auth/smscode', fd)
}

export const verifySmsCode = (phone, code) => {
  const fd = new FormData()
  fd.append('phone', normalizePhone(phone))
  fd.append('code', code)
  return filterClient.post('/auth/smscode/verify', fd)
}

// ============================================================
// Tinkoff ID
// ============================================================
export const tidInit = (phone) => {
  if (phone) {
    return filterClient.post('/auth/tid/init', { phone: normalizePhone(phone) }, {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return filterClient.post('/auth/tid/init', new FormData())
}

export const tidComplete = (code) => {
  const params = code ? { code } : {}
  return filterClient.get('/auth/tid/complete', { params })
}

// ============================================================
// Пользователь (bearer token required)
// ============================================================
function authHeaders() {
  const token = localStorage.getItem('auth_token')
  if (!token) return {}
  const header = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  return { Authorization: header }
}

export const getUserProfile = () =>
  filterClient.get('/user/profile', { headers: authHeaders() })

export const updateUserProfile = (data) => {
  const fd = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value)
  })
  return filterClient.post('/user/profile', fd, { headers: authHeaders() })
}

export const changePassword = (oldPassword, newPassword, confirmPassword) => {
  const fd = new FormData()
  fd.append('old_password', oldPassword)
  fd.append('new_password', newPassword)
  fd.append('confirm_password', confirmPassword)
  return filterClient.post('/user/password/change', fd, { headers: authHeaders() })
}

export const userLogout = () =>
  filterClient.post('/user/logout', new FormData(), { headers: authHeaders() })

// ============================================================
// Заказы (bearer token required)
// ============================================================
export const getOrders = (params) =>
  filterClient.get('/user/orders', { params, headers: authHeaders() })

export const getOrderById = (id) =>
  filterClient.get(`/user/orders/${id}`, { headers: authHeaders() })

export const getOrderStatus = (id) =>
  filterClient.get(`/orders/status/${id}`, { headers: authHeaders() })

export const getSaleStatuses = () =>
  filterClient.get('/sale/statuses', { headers: authHeaders() })

// ============================================================
// Адреса доставки (bearer token required)
// ============================================================
export const getUserAddresses = () =>
  filterClient.get('/user/addresses', { headers: authHeaders() })

export const addUserAddress = (data) =>
  filterClient.post('/user/addresses', data, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  })

export const updateUserAddress = (id, data) =>
  filterClient.put(`/user/addresses/${id}`, data, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  })

export const deleteUserAddress = (id) =>
  filterClient.delete(`/user/addresses/${id}`, { headers: authHeaders() })

// ============================================================
// Избранное (bearer token required)
// ============================================================
export const getFavorites = () =>
  filterClient.get('/favorites/list', { headers: authHeaders() })

export const addFavorite = (id) => {
  const fd = new FormData()
  fd.append('product_id', id)
  return filterClient.post('/favorites/add', fd, { headers: authHeaders() })
}

export const deleteFavorite = (id) => {
  const fd = new FormData()
  fd.append('product_id', id)
  return filterClient.post('/favorites/delete', fd, { headers: authHeaders() })
}

// ============================================================
// Гостевая корзина (fuser_id)
// ============================================================
const FUSER_KEY = 'guest_fuser_id'

export function getGuestFuserId() {
  return localStorage.getItem(FUSER_KEY)
}

export function saveGuestFuserId(id) {
  if (id) localStorage.setItem(FUSER_KEY, id)
}

export function clearGuestFuserId() {
  localStorage.removeItem(FUSER_KEY)
}

function isAuthenticated() {
  return !!localStorage.getItem('auth_token')
}

// ============================================================
// Серверная корзина (basket)
// ============================================================

/** Получить текущую серверную корзину */
export const getServerBasket = async () => {
  const auth = isAuthenticated()
  const fuserId = getGuestFuserId()
  console.log('[BASKET] getServerBasket →', auth ? 'авторизован' : `гость fuser_id=${fuserId}`)
  const res = auth
    ? await filterClient.get('/sale/basket', { headers: authHeaders() })
    : await filterClient.get('/sale/basket', { params: fuserId ? { fuser_id: fuserId } : {} })
  const basket = res.data?.basket || res.data?.data || []
  console.log('[BASKET] getServerBasket ←', { items: basket.length, total_price: res.data?.total_price, raw_keys: Object.keys(res.data || {}) })
  return res
}

/** Добавить товар в серверную корзину */
export const addToServerBasket = async (productId, quantity = 1) => {
  console.log('[BASKET] addToServerBasket →', { productId, quantity })
  const fd = new FormData()
  fd.append('product_id', productId)
  fd.append('quantity', quantity)
  if (!isAuthenticated()) {
    const fuserId = getGuestFuserId()
    if (fuserId) fd.append('fuser_id', fuserId)
  }
  const headers = isAuthenticated() ? authHeaders() : {}
  const res = await filterClient.post('/sale/basket/add', fd, { headers })
  // Сервер возвращает fuser_id для гостей — сохраняем
  const returnedFuserId = res.data?.fuser_id || res.data?.data?.fuser_id
  if (returnedFuserId && !isAuthenticated()) {
    saveGuestFuserId(returnedFuserId)
  }
  console.log('[BASKET] addToServerBasket ←', { success: res.data?.success, fuser_id: returnedFuserId, message: res.data?.message })
  return res
}

/** Удалить товар из серверной корзины */
export const deleteServerBasketItem = async (productId, mode = 'full') => {
  console.log('[BASKET] deleteServerBasketItem →', { productId, mode })
  const fd = new FormData()
  fd.append('product_id', productId)
  fd.append('mode', mode)
  if (!isAuthenticated()) {
    const fuserId = getGuestFuserId()
    if (fuserId) fd.append('fuser_id', fuserId)
  }
  const headers = isAuthenticated() ? authHeaders() : {}
  const res = await filterClient.post('/sale/basket/delete', fd, { headers })
  console.log('[BASKET] deleteServerBasketItem ←', { success: res.data?.success, message: res.data?.message })
  return res
}

/** Объединить гостевую корзину с авторизованной */
export const mergeBasket = (guestFuserId) =>
  filterClient.post('/sale/basket/merge', { guest_fuser_id: guestFuserId }, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  })

// ============================================================
// Checkout API (new)
// ============================================================

/** Получение location code по названию города */
export const getLocationCode = async (city) => {
  console.log('[CHECKOUT] getLocationCode →', city)
  const res = await filterClient.get('/sale/location/code', { params: { city }, headers: authHeaders() })
  console.log('[CHECKOUT] getLocationCode ←', res.data?.data)
  return res
}

/** Стартовый контекст checkout: доставки, оплаты, свойства, суммы */
export const getCheckoutContext = async (params = {}) => {
  console.log('[CHECKOUT] getCheckoutContext →', params)
  const res = await filterClient.get('/sale/checkout/context', { params, headers: authHeaders() })
  const co = res.data?.checkout || res.data
  console.log('[CHECKOUT] getCheckoutContext ←', {
    deliveries: co?.available_deliveries?.length,
    pay_systems: co?.available_pay_systems?.length,
    can_submit: res.data?.can_submit,
    totals: co?.totals,
    errors: res.data?.errors,
  })
  return res
}

/** Пересчёт checkout при изменениях пользователя */
export const calculateCheckout = async (data) => {
  console.log('[CHECKOUT] calculateCheckout →', data)
  const res = await filterClient.post('/sale/checkout/calculate', data, { headers: authHeaders() })
  const co = res.data?.checkout || res.data
  console.log('[CHECKOUT] calculateCheckout ←', {
    can_submit: res.data?.can_submit,
    totals: co?.totals,
    errors: res.data?.errors,
    missing: co?.missing_required_properties,
  })
  return res
}

/** Финальное создание заказа */
export const submitCheckout = async (data) => {
  console.log('[CHECKOUT] submitCheckout →', data)
  const res = await filterClient.post('/sale/checkout/submit', data, { headers: authHeaders() })
  console.log('[CHECKOUT] submitCheckout ←', {
    success: res.data?.success,
    order: res.data?.order,
    payment: res.data?.payment,
    errors: res.data?.errors,
  })
  return res
}

// Магазины самовывоза (Bitrix REST)
export const getBitrixStoreList = () =>
  bitrixClient.get('/catalog.store.list.json', {
    params: {
      'select[]': ['ID', 'TITLE', 'ADDRESS', 'DESCRIPTION', 'PHONE', 'SCHEDULE', 'GPS_N', 'GPS_S', 'ACTIVE'],
    },
  })

export const sendOrderSms = (phone) => {
  const fd = new FormData()
  fd.append('phone', normalizePhone(phone))
  return filterClient.post('/order/smscode', fd)
}

export const verifyOrderSms = (phone, code) => {
  const fd = new FormData()
  fd.append('phone', normalizePhone(phone))
  fd.append('code', code)
  return filterClient.post('/order/smscode/verify', fd)
}

// ============================================================
// Склады и пункты самовывоза (Sale API)
// ============================================================
export const getSaleStores = () =>
  filterClient.get('/sale/stores')

export const getPersonTypes = () =>
  filterClient.get('/sale/persontypes')

// ============================================================
// Соглашения и формы
// ============================================================
export const getAgreementList = () =>
  filterClient.get('/forms/agreement/list')

export const getAgreementById = (id) =>
  filterClient.get(`/forms/agreement/${id}`)
