import axios from 'axios'

// Centralized Bitrix REST API base URL
const BITRIX_REST_URL = import.meta.env.VITE_BITRIX_REST_URL || 'https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e'

// Filter API base URL (separate service)
// In dev mode, use Vite proxy to avoid CORS issues
const FILTER_API_URL = import.meta.env.DEV
  ? '/api/mobile/v1'
  : (import.meta.env.VITE_FILTER_API_URL || 'https://topdisc.ru/mobile/v1')

export const bitrixClient = axios.create({
  baseURL: BITRIX_REST_URL,
})

export const filterClient = axios.create({
  baseURL: FILTER_API_URL,
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

export const deleteFavorite = (id) =>
  filterClient.delete('/favorites/delete', { data: { product_id: id }, headers: authHeaders() })

// ============================================================
// Оформление заказа
// ============================================================

// Bitrix REST: способы доставки и оплаты
export const getBitrixDeliveryList = () =>
  bitrixClient.get('/sale.delivery.getlist.json')

export const getBitrixPaymentList = () =>
  bitrixClient.get('/sale.paysystem.list.json')

export const getBitrixStoreList = () =>
  bitrixClient.get('/catalog.store.list.json', {
    params: {
      'select[]': ['ID', 'TITLE', 'ADDRESS', 'DESCRIPTION', 'PHONE', 'SCHEDULE', 'GPS_N', 'GPS_S', 'ACTIVE'],
    },
  })

export const getDeliveryMethods = (city) => {
  const fd = new FormData()
  fd.append('city', city)
  return filterClient.post('/order/delivery', fd, { headers: authHeaders() })
}

export const getPaymentMethods = (deliveryId) => {
  const fd = new FormData()
  if (deliveryId) fd.append('delivery_id', deliveryId)
  return filterClient.post('/order/payment', fd, { headers: authHeaders() })
}

export const getPickupPoints = (city) => {
  const fd = new FormData()
  fd.append('city', city)
  return filterClient.post('/order/pickup-points', fd, { headers: authHeaders() })
}

export const getCdekPoints = (city) => {
  const fd = new FormData()
  fd.append('city', city)
  return filterClient.post('/order/cdek-points', fd, { headers: authHeaders() })
}

export const createOrder = (orderData) =>
  filterClient.post('/order/create', orderData, { headers: authHeaders() })

// ============================================================
// Создание заказа через Bitrix REST API
// ============================================================

// ID свойств заказа для PERSON_TYPE_ID = 5 (Физическое лицо, сайт s2)
const ORDER_PROP = {
  PHONE: 51,
  EMAIL: 38,
  NAME: 86,
  SURNAME: 87,
  LOCATION: 35,
  COMMENT: 63,
}

// Платёжные системы, считающиеся онлайн-оплатой
const ONLINE_PAY_IDS = new Set(['43', '56', '57', '52', '59'])

export function isOnlinePayment(paySystemId) {
  return ONLINE_PAY_IDS.has(String(paySystemId))
}

/**
 * Полный цикл создания заказа через Bitrix REST:
 * 1. sale.order.add — создаём заказ
 * 2. sale.basketitem.add — добавляем товары
 * 3. sale.propertyvalue.modify — записываем контактные данные
 * 4. sale.shipment.add — привязываем способ доставки
 * 5. sale.payment.add — привязываем способ оплаты
 *
 * @returns {{ orderId, accountNumber, paymentId, paymentUrl }}
 */
export async function createBitrixOrder({
  items,        // [{ id, name, price, quantity }]
  totalPrice,
  phone,
  email,
  firstName,
  lastName,
  city,
  comment,
  deliveryId,
  paySystemId,
  userId,
}) {
  // 1. Создаём заказ
  const orderFields = {
    personTypeId: 5,
    currency: 'RUB',
    lid: 's2',
    userId: userId ? Number(userId) : 1,
    price: totalPrice,
    comments: comment || undefined,
  }

  let orderRes
  try {
    orderRes = await bitrixClient.post('/sale.order.add.json', {
      fields: orderFields,
    })
  } catch (err) {
    const resp = err.response?.data
    if (resp?.result?.order) {
      orderRes = { data: resp }
    } else {
      console.error('sale.order.add error:', resp || err.message)
      throw new Error(resp?.error_description || 'Не удалось создать заказ')
    }
  }

  const order = orderRes.data?.result?.order
  if (!order?.id) throw new Error(orderRes.data?.error_description || 'Не удалось создать заказ')
  const orderId = Number(order.id)

  // 2. Добавляем товары в корзину заказа
  await Promise.all(
    items.map((item) =>
      bitrixClient.post('/sale.basketitem.add.json', {
        fields: {
          orderId,
          productId: Number(item.id),
          quantity: item.quantity,
          price: Number(item.price),
          name: item.name || `Товар #${item.id}`,
          currency: 'RUB',
          module: 'catalog',
          lid: 's2',
        },
      })
    )
  )

  // 3. Свойства заказа (контакт, город)
  const propertyValues = [
    { orderPropsId: ORDER_PROP.PHONE, value: phone },
    { orderPropsId: ORDER_PROP.EMAIL, value: email || '' },
    { orderPropsId: ORDER_PROP.NAME, value: firstName || '' },
    { orderPropsId: ORDER_PROP.SURNAME, value: lastName || '' },
    { orderPropsId: ORDER_PROP.LOCATION, value: city || '' },
    { orderPropsId: ORDER_PROP.COMMENT, value: comment || '' },
  ]
  await bitrixClient.post('/sale.propertyvalue.modify.json', {
    fields: { order: { id: orderId, propertyValues } },
  })

  // 4. Доставка (shipment)
  if (deliveryId) {
    await bitrixClient.post('/sale.shipment.add.json', {
      fields: {
        orderId,
        deliveryId: Number(deliveryId),
        allowDelivery: 'N',
        deducted: 'N',
        priceDelivery: 0,
        currency: 'RUB',
      },
    })
  }

  // 5. Оплата (payment)
  let paymentId = null
  if (paySystemId) {
    const payRes = await bitrixClient.post('/sale.payment.add.json', {
      fields: {
        orderId,
        paySystemId: Number(paySystemId),
        sum: totalPrice,
        currency: 'RUB',
      },
    })
    paymentId = payRes.data?.result?.payment?.id || null
  }

  // URL оплаты (для онлайн-платежей на сайте Bitrix)
  const paymentUrl = paymentId && isOnlinePayment(paySystemId)
    ? `https://topdisc.ru/personal/order/payment/?ORDER_ID=${orderId}&PAYMENT_ID=${paymentId}`
    : null

  return {
    orderId,
    accountNumber: order.accountNumber || String(orderId),
    paymentId,
    paymentUrl,
  }
}

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
