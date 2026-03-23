import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserProfile, getOrders, getSaleStatuses } from '../../services/apiClient'

function PersonalHome() {
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [profileRes, ordersRes, statusesRes] = await Promise.allSettled([
          getUserProfile(),
          getOrders({ limit: 5 }),
          getSaleStatuses(),
        ])
        if (cancelled) return

        if (statusesRes.status === 'fulfilled') {
          setStatuses(statusesRes.value.data?.message || {})
        }

        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data?.message || profileRes.value.data)

        if (ordersRes.status === 'fulfilled') {
          const msg = ordersRes.value.data?.message
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
          setOrders(list.slice(0, 5))
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="personal__loading">Загрузка...</div>

  return (
    <div className="personal-home">
      {/* Карточка лояльности */}
      <div className="personal-home__loyalty-card">
        <div className="personal-home__loyalty-inner">
          <div className="personal-home__loyalty-logo">TopDisc</div>
          <div className="personal-home__loyalty-info">
            <span className="personal-home__loyalty-label">Карта лояльности</span>
            <span className="personal-home__loyalty-name">{profile?.name || profile?.NAME || 'Пользователь'}</span>
          </div>
          <div className="personal-home__loyalty-bonus">
            <span className="personal-home__loyalty-bonus-label">Бонусы</span>
            <span className="personal-home__loyalty-bonus-value">{profile?.bonus ?? profile?.BONUS ?? '—'}</span>
          </div>
        </div>
        <Link to="/personal/loyalty/" className="personal-home__loyalty-link">Подробнее →</Link>
      </div>

      {/* Быстрые ссылки */}
      <div className="personal-home__quick">
        <Link to="/personal/info/" className="personal-home__quick-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Личная информация</span>
        </Link>
        <Link to="/personal/orders/" className="personal-home__quick-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <span>История заказов</span>
        </Link>
        <Link to="/personal/loyalty/" className="personal-home__quick-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
          <span>Система лояльности</span>
        </Link>
      </div>

      {/* Последние заказы */}
      <div className="personal-home__orders">
        <div className="personal-home__orders-header">
          <h2 className="personal-home__section-title">Последние заказы</h2>
          <Link to="/personal/orders/" className="personal-home__orders-all">Все заказы →</Link>
        </div>
        {orders.length === 0 ? (
          <p className="personal-home__empty">Заказов пока нет</p>
        ) : (
          <div className="personal-home__orders-list">
            {orders.map((order) => {
              const id = order.ID || order.id
              return (
                <div className="personal-home__order-row" key={id}>
                  <span className="personal-home__order-num">№{order.ACCOUNT_NUMBER || id}</span>
                  <span className="personal-home__order-date">{order.DATE_INSERT || ''}</span>
                  <span className="personal-home__order-status">{statuses[order.STATUS_ID] || order.STATUS_ID || ''}</span>
                  <span className="personal-home__order-total">{formatPrice(order.PRICE)} ₽</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function formatPrice(value) {
  if (!value && value !== 0) return '—'
  const num = Number(value)
  if (isNaN(num)) return value
  return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default PersonalHome
