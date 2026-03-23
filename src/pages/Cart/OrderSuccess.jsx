import { Link, useLocation, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { decodeHtml } from '../../utils/decodeHtml'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'

function OrderSuccess() {
  const { state } = useLocation()

  if (!state || !state.orderNumber) return <Navigate to="/cart/" replace />

  const { orderNumber, items = [], totalAmount = 0, deliveryName, selectedStore, firstName, lastName, phone } = state
  const fmt = (n) => Math.floor(n).toLocaleString('ru-RU')

  const deliveryLabel = deliveryName || 'Доставка'

  const now = new Date()
  const day = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <Helmet><title>Заказ принят — TopDisc</title></Helmet>
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
          <div className="order-success">

            <div className="order-success__hero">
              <div className="order-success__check">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#04B31B" /><path d="M14 24l7 7 13-13" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h1 className="order-success__title">Ваш заказ принят!</h1>
            </div>

            <div className="order-success__layout">
              {/* Состав заказа */}
              <div className="order-success__composition">
                <h2 className="order-success__section-title">Состав заказа</h2>
                <div className="order-success__items">
                  {items.map((item) => (
                    <div className="order-success__item" key={item.id}>
                      <div className="order-success__item-img">
                        <ImageWithFallback src={item.image} alt={decodeHtml(item.name)} />
                      </div>
                      <div className="order-success__item-info">
                        <div className="order-success__item-name">{decodeHtml(item.name)}</div>
                        <div className="order-success__item-qty">{item.quantity} шт.</div>
                      </div>
                      <div className="order-success__item-price">{fmt(Number(item.price) * item.quantity)} ₽</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Детали заказа */}
              <div className="order-success__details">
                <h2 className="order-success__section-title">Детали заказа</h2>
                <div className="order-success__detail-rows">
                  <div className="order-success__detail-row">
                    <span>Заказ:</span>
                    <strong>№{orderNumber}</strong>
                  </div>
                  <div className="order-success__detail-row">
                    <span>Статус:</span>
                    <span className="order-success__status">Новый</span>
                  </div>
                  <div className="order-success__detail-row">
                    <span>Способ доставки:</span>
                    <span>{deliveryLabel}</span>
                  </div>
                  {selectedStore && (
                    <div className="order-success__detail-row">
                      <span>Магазин:</span>
                      <span>{selectedStore.address}</span>
                    </div>
                  )}
                  <div className="order-success__detail-row">
                    <span>Дата:</span>
                    <span>{day}, {time}</span>
                  </div>
                  <div className="order-success__detail-row">
                    <span>Получатель:</span>
                    <span>{firstName} {lastName}</span>
                  </div>
                  <div className="order-success__detail-row order-success__total-row">
                    <span>Сумма заказа:</span>
                    <strong>{fmt(totalAmount)} ₽</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Что делать дальше */}
            <div className="order-success__steps">
              <h2 className="order-success__section-title">Что делать дальше</h2>
              <div className="order-success__steps-grid">
                <div className="order-success__step-card">
                  <div className="order-success__step-num">1</div>
                  <p>Ваш менеджер скоро свяжется с вами для подтверждения</p>
                </div>
                <div className="order-success__step-card">
                  <div className="order-success__step-num">2</div>
                  <p>После подтверждения вы сможете отследить статус заказа в личном кабинете</p>
                </div>
                <div className="order-success__step-card">
                  <div className="order-success__step-num">3</div>
                  <p>Приезжайте за товаром или дождитесь доставки</p>
                </div>
              </div>
            </div>

            <Link to="/" className="order-success__home-btn">Вернуться на главную</Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default OrderSuccess
