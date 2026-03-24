import axios from 'axios'

// Centralized Bitrix REST API base URL
const BITRIX_REST_URL = import.meta.env.VITE_BITRIX_REST_URL || 'https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e'

// Filter API base URL (separate service)
// В dev — через Vite proxy, в prod — напрямую
const FILTER_API_URL = import.meta.env.DEV
  ? '/api/mobile/v1'
  : (import.meta.env.VITE_FILTER_API_URL || 'https://topdisc.ru/mobile/v1')

export const bitrixClient = axios.create({
  baseURL: BITRIX_REST_URL,
})

export const filterClient = axios.create({
  baseURL: FILTER_API_URL,
  withCredentials: true,
})

// ============================================================
// Категории
// ============================================================
export const getCategoryFirst = (opts) =>
  bitrixClient.get('/app_mobile.categoryFirst.json', opts)

export const getCategoryById = (id, opts) =>
  bitrixClient.get('/app_mobile.categoryId.json', { params: { id }, ...opts })

export const getCategoryByCode = (code, opts) =>
  bitrixClient.get('/app_mobile.categoryIdByCode.json', { params: { code }, ...opts })

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

// ============================================================
// Фильтры
// ============================================================
export const getFilters = (categoryId, opts) =>
  filterClient.get(`/filter/4/${categoryId}`, opts)

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
export const tidInit = () =>
  filterClient.post('/auth/tid/init', new FormData())

export const tidComplete = (code) => {
  const fd = new FormData()
  if (code) fd.append('code', code)
  return filterClient.post('/auth/tid/complete', fd)
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
  filterClient.get('/orders', { params, headers: authHeaders() })

export const getOrderById = (id) =>
  filterClient.get(`/orders/${id}`, { headers: authHeaders() })

export const getOrderStatus = (id) =>
  filterClient.get(`/orders/status/${id}`, { headers: authHeaders() })

export const getSaleStatuses = () =>
  filterClient.get('/sale/statuses', { headers: authHeaders() })

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
// Серверная корзина (basket)
// ============================================================

/** Получить текущую серверную корзину */
export const getServerBasket = () =>
  filterClient.get('/sale/basket', { headers: authHeaders() })

/** Добавить товар в серверную корзину */
export const addToServerBasket = (productId, quantity = 1) => {
  const fd = new FormData()
  fd.append('product_id', productId)
  fd.append('quantity', quantity)
  return filterClient.post('/sale/basket/add', fd, { headers: authHeaders() })
}

/** Удалить товар из серверной корзины */
export const deleteServerBasketItem = (productId, mode = 'full') => {
  const fd = new FormData()
  fd.append('product_id', productId)
  fd.append('mode', mode)
  return filterClient.post('/sale/basket/delete', fd, { headers: authHeaders() })
}

/** Синхронизировать локальную корзину на сервер */
export async function syncCartToServer(items) {
  console.log('[syncCart] start, local items:', JSON.stringify(items.map(i => ({ id: i.id, qty: i.quantity }))))
  // Очищаем серверную корзину
  try {
    const basketRes = await getServerBasket()
    console.log('[syncCart] server basket before clear:', basketRes.data)
    const serverItems = basketRes.data?.data || basketRes.data?.result?.data || []
    for (const si of serverItems) {
      try {
        await deleteServerBasketItem(si.product_id || si.id)
      } catch {}
    }
  } catch (e) {
    console.warn('[syncCart] getServerBasket/clear error:', e.response?.data || e.message)
  }
  // Добавляем товары последовательно (Bitrix может не обрабатывать параллельные запросы к корзине)
  for (const item of items) {
    try {
      const res = await addToServerBasket(item.id, item.quantity)
      console.log('[syncCart] add OK:', item.id, res?.data)
      if (res?.data?.success === false) {
        console.warn('[syncCart] add returned success:false:', item.id, res.data)
      }
    } catch (e) {
      console.warn('[syncCart] add FAIL:', item.id, e.response?.status, e.response?.data || e.message)
    }
  }
  // Проверяем итоговую корзину
  const checkRes = await getServerBasket()
  console.log('[syncCart] server basket after sync:', checkRes.data)
  const finalItems = checkRes.data?.data || checkRes.data?.result?.data || []
  if (finalItems.length === 0 && items.length > 0) {
    throw new Error('Серверная корзина пуста после синхронизации')
  }
  return checkRes.data
}

// ============================================================
// Checkout API (new)
// ============================================================

/** Получение location code по названию города */
export const getLocationCode = (city) =>
  filterClient.get('/sale/location/code', { params: { city }, headers: authHeaders() })

/** Стартовый контекст checkout: доставки, оплаты, свойства, суммы */
export const getCheckoutContext = (params = {}) =>
  filterClient.get('/sale/checkout/context', { params, headers: authHeaders() })

/** Пересчёт checkout при изменениях пользователя */
export const calculateCheckout = (data) =>
  filterClient.post('/sale/checkout/calculate', data, { headers: authHeaders() })

/** Финальное создание заказа */
export const submitCheckout = (data) =>
  filterClient.post('/sale/checkout/submit', data, { headers: authHeaders() })

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
