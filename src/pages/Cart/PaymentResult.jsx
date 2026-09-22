import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { decodeHtml } from '../../utils/decodeHtml'
import { getOrderById } from '../../services/apiClient'

// Страница возврата с платёжного шлюза (Т-Банк и любая другая онлайн-оплата).
// В отличие от OrderSuccess.jsx (работает только сразу после submit(), берёт
// данные из React Router state) — эта страница рассчитана на заход по прямой
// ссылке из другого домена/приложения (банк открывает её в том же окне
// браузера, никакого state тут нет и быть не может), поэтому вытягивает
// данные о заказе через API по orderId из самого URL. Именно эту ссылку
// нужно прописать как "URL успешной оплаты" в настройках платёжной системы
// в админке Bitrix — раньше там стоял адрес на back.topdisc.ru, клиент
// видел чужой домен и, возможно, страницу без нашего оформления.
function PaymentResult() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getOrderById(orderId)
      .then((res) => {
        if (!cancelled) setOrder(res.data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [orderId])

  const fmt = (n) => Math.floor(Number(n) || 0).toLocaleString('ru-RU')

  return (
    <>
      <Helmet><title>Оплата заказа — TopDisc</title></Helmet>
      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item"><Link className="breadcrumbs-link" to="/">Главная</Link></li>
            <li className="breadcrumbs-item"><Link className="breadcrumbs-link" to="/personal/orders/">Мои заказы</Link></li>
          </ul>
        </div>
      </div>

      <div className="category-page">
        <div className="container">
          <div className="order-success">

            {loading ? (
              <div className="order-success__hero">
                <h1 className="order-success__title">Проверяем оплату…</h1>
              </div>
            ) : error || !order ? (
              <>
                <div className="order-success__hero">
                  <h1 className="order-success__title">Не удалось получить данные заказа</h1>
                </div>
                <p>
                  Если оплата прошла успешно — деньги списаны, заказ обработается в обычном порядке.
                  Проверить статус можно в личном кабинете.
                </p>
                <Link to="/personal/orders/" className="order-success__home-btn">Мои заказы</Link>
              </>
            ) : (
              <>
                <div className="order-success__hero">
                  <div className="order-success__check">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#04B31B" /><path d="M14 24l7 7 13-13" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h1 className="order-success__title">Оплата получена</h1>
                </div>

                <div className="order-success__layout">
                  <div className="order-success__composition">
                    <h2 className="order-success__section-title">Состав заказа</h2>
                    <div className="order-success__items">
                      {(order.basket_items || []).map((item) => (
                        <div className="order-success__item" key={item.id}>
                          <div className="order-success__item-info">
                            <div className="order-success__item-name">{decodeHtml(item.name)}</div>
                            <div className="order-success__item-qty">{item.quantity} шт.</div>
                          </div>
                          <div className="order-success__item-price">{fmt(item.price * item.quantity)} ₽</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-success__details">
                    <h2 className="order-success__section-title">Детали заказа</h2>
                    <div className="order-success__detail-rows">
                      <div className="order-success__detail-row">
                        <span>Заказ:</span>
                        <strong>№{order.id}</strong>
                      </div>
                      <div className="order-success__detail-row order-success__total-row">
                        <span>Сумма заказа:</span>
                        <strong>{fmt(order.price)} ₽</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <p>
                  Спасибо за оплату! Актуальный статус заказа всегда можно посмотреть в личном кабинете.
                </p>
                <Link to="/personal/orders/" className="order-success__home-btn">Мои заказы</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PaymentResult
