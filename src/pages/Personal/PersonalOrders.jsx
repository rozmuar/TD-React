import { useEffect, useState } from 'react'
import { getOrders, getOrderById, getSaleStatuses } from '../../services/apiClient'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'

function PersonalOrders() {
  const [orders, setOrders] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [details, setDetails] = useState({})
  const [detailLoading, setDetailLoading] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [ordersRes, statusesRes] = await Promise.allSettled([
          getOrders(),
          getSaleStatuses(),
        ])

        if (cancelled) return

        if (statusesRes.status === 'fulfilled') {
          setStatuses(statusesRes.value.data?.message || {})
        }

        if (ordersRes.status === 'fulfilled') {
          const raw = ordersRes.value.data
          const msg = raw?.message
          let list = []
          const source = msg?.data && typeof msg.data === 'object' && !Array.isArray(msg.data) ? msg.data : msg
          if (Array.isArray(source)) {
            list = source
          } else if (source && typeof source === 'object') {
            if (Array.isArray(source.items)) list = source.items
            else if (Array.isArray(source.list)) list = source.list
            else {
              const entries = Object.entries(source)
              if (entries.length > 0 && typeof entries[0][1] === 'object' && entries[0][1] !== null) {
                list = entries.map(([key, val]) => ({ ...val, ID: val.ID || val.id || key }))
              }
            }
          }
          setOrders(list)
        } else {
          const errData = ordersRes.reason?.response?.data
          setError(errData?.message || 'Ошибка загрузки заказов')
        }
      } catch {
        if (!cancelled) setError('Ошибка загрузки заказов')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const toggleOrder = async (orderId) => {
    if (expandedId === orderId) {
      setExpandedId(null)
      return
    }
    setExpandedId(orderId)
    if (details[orderId]) return

    setDetailLoading(orderId)
    try {
      const res = await getOrderById(orderId)
      const msg = res.data?.message
      const data = msg?.data && typeof msg.data === 'object' ? msg.data : msg
      setDetails((prev) => ({ ...prev, [orderId]: data || {} }))
    } catch (err) {

    }
    setDetailLoading(null)
  }

  const getStatusName = (statusId) => statuses[statusId] || statusId || ''

  if (loading) return <div className="personal__loading">Загрузка...</div>

  return (
    <div className="personal-orders">
      <h2 className="personal__section-title">История заказов</h2>

      {error && <p className="personal-orders__error">{error}</p>}

      {orders.length === 0 && !error ? (
        <p className="personal-orders__empty">Заказов пока нет</p>
      ) : (
        <div className="personal-orders__list">
          {orders.map((order) => {
            const id = order.ID || order.id
            const isOpen = expandedId === id
            const detail = details[id]
            const statusName = getStatusName(order.STATUS_ID)

            return (
              <div className={'order-card' + (isOpen ? ' order-card--open' : '')} key={id}>
                <button className="order-card__header" onClick={() => toggleOrder(id)}>
                  <span className="order-card__number">Заказ №{order.ACCOUNT_NUMBER || id}</span>
                  <span className={'order-card__badge order-card__badge--' + (order.STATUS_ID || 'default')}>
                    {statusName}
                  </span>
                  <span className="order-card__price">{formatPrice(order.PRICE || order.price)} ₽</span>
                  <span className="order-card__toggle">
                    {isOpen ? 'Скрыть' : 'Подробнее'}
                    <svg className={'order-card__arrow' + (isOpen ? ' order-card__arrow--open' : '')} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </button>

                {isOpen && (
                  <div className="order-card__body">
                    {detailLoading === id ? (
                      <p className="order-card__loading">Загрузка...</p>
                    ) : detail ? (
                      <OrderDetail data={detail} order={order} statuses={statuses} />
                    ) : (
                      <p className="order-card__loading">Не удалось загрузить детали заказа</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function extractArray(data, ...keys) {
  for (const key of keys) {
    const val = data?.[key]
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') {
      const arr = Object.values(val)
      if (arr.length > 0 && typeof arr[0] === 'object') return arr
    }
  }
  return []
}

function findProp(properties, ...codes) {
  for (const code of codes) {
    const p = properties.find(
      (pr) => (pr.CODE || pr.code || '').toUpperCase() === code.toUpperCase()
        || (pr.NAME || pr.name || '').toUpperCase().includes(code.toUpperCase())
    )
    if (p) return p.VALUE || p.value || ''
  }
  return ''
}

function OrderDetail({ data, order, statuses }) {
  if (!data || typeof data !== 'object') return null

  const basket = extractArray(data, 'basket', 'BASKET', 'items', 'ITEMS', 'basketItems')
  const shipments = extractArray(data, 'shipment', 'SHIPMENT', 'shipments', 'delivery')
  const payments = extractArray(data, 'payment', 'PAYMENT', 'payments')
  const properties = extractArray(data, 'properties', 'PROPERTIES', 'props', 'orderProperties')

  // Собираем информацию для нижней секции
  const deliveryName = shipments[0]?.DELIVERY_NAME || shipments[0]?.delivery_name || ''
  const paymentName = payments[0]?.PAY_SYSTEM_NAME || payments[0]?.pay_system_name || ''
  const recipient = findProp(properties, 'FIO', 'NAME', 'Получатель', 'ФИО', 'Имя')
  const phone = findProp(properties, 'PHONE', 'Телефон')
  const address = findProp(properties, 'ADDRESS', 'Адрес')
  const dateDelivered = order.DATE_ALLOW_DELIVERY || shipments[0]?.DATE_ALLOW_DELIVERY || ''

  return (
    <>
      {/* Товары */}
      {basket.length > 0 && (
        <div className="order-card__products">
          {basket.map((item, i) => {
            const price = Number(item.PRICE || item.price || 0)
            const basePrice = Number(item.BASE_PRICE || 0)
            const qty = Number(item.QUANTITY || item.quantity || 1)
            const img = item.PICTURE_URL || item.DETAIL_PICTURE || item.PREVIEW_PICTURE || ''
            const imgSrc = img && !img.startsWith('http') ? `https://topdisc.ru${img}` : img
            const productUrl = item.DETAIL_PAGE_URL || ''
            const name = item.NAME || item.name || item.PRODUCT_NAME || '—'

            return (
              <div className="order-card__product" key={item.ID || item.id || i}>
                <div className="order-card__product-img">
                  {imgSrc ? (
                    <ImageWithFallback src={imgSrc} alt={name} />
                  ) : (
                    <div className="order-card__product-noimg" />
                  )}
                </div>
                <div className="order-card__product-info">
                  {productUrl ? (
                    <a className="order-card__product-name" href={productUrl}>{name}</a>
                  ) : (
                    <p className="order-card__product-name">{name}</p>
                  )}
                  <span className="order-card__product-qty">{qty} шт.</span>
                </div>
                <div className="order-card__product-prices">
                  <span className="order-card__product-price">{formatPrice(price)} ₽</span>
                  {basePrice > price && (
                    <span className="order-card__product-old">{formatPrice(basePrice)} ₽</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Нижняя секция с информацией */}
      <div className="order-card__info">
        {deliveryName && (
          <div className="order-card__info-item">
            <span className="order-card__info-label">Способ получения:</span>
            <span className="order-card__info-value">{deliveryName}</span>
          </div>
        )}
        {(recipient || phone) && (
          <div className="order-card__info-item">
            <span className="order-card__info-label">Получатель:</span>
            <span className="order-card__info-value">{[recipient, phone].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {address && (
          <div className="order-card__info-item">
            <span className="order-card__info-label">Адрес:</span>
            <span className="order-card__info-value">{address}</span>
          </div>
        )}
        {dateDelivered && (
          <div className="order-card__info-item">
            <span className="order-card__info-label">Получено:</span>
            <span className="order-card__info-value">{dateDelivered}</span>
          </div>
        )}
        {paymentName && (
          <div className="order-card__info-item">
            <span className="order-card__info-label">Оплата:</span>
            <span className="order-card__info-value">{paymentName}</span>
          </div>
        )}
        {order.CANCELED === 'Y' && order.REASON_CANCELED && (
          <div className="order-card__info-item">
            <span className="order-card__info-label">Причина отмены:</span>
            <span className="order-card__info-value">{order.REASON_CANCELED}</span>
          </div>
        )}
        {order.USER_DESCRIPTION && (
          <div className="order-card__info-item">
            <span className="order-card__info-label">Комментарий:</span>
            <span className="order-card__info-value">{order.USER_DESCRIPTION}</span>
          </div>
        )}
      </div>
    </>
  )
}

function formatPrice(value) {
  if (!value && value !== 0) return '—'
  const num = Number(value)
  if (isNaN(num)) return value
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default PersonalOrders
