import { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  removeFromCart,
  removeSelected,
  incrementQuantity,
  decrementQuantity,
  toggleItemSelected,
  selectAll,
} from '../../store/slices/cartSlice'
import { toggleFavorite } from '../../store/slices/favoritesSlice'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import ProductCard from '../../components/ProductCard/ProductCard'
import { decodeHtml } from '../../utils/decodeHtml'
import { useMatchHeight } from '../../hooks/useMatchHeight'
import { getForYou } from '../../services/apiClient'
import { useState, useEffect } from 'react'

function Cart() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items } = useSelector((s) => s.cart)
  const favoriteItems = useSelector((s) => s.favorites.items)
  const [recommended, setRecommended] = useState([])

  const allSelected = items.length > 0 && items.every((i) => i.selected !== false)
  const selectedItems = items.filter((i) => i.selected !== false)

  const selectedAmount = useMemo(
    () => selectedItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
    [selectedItems]
  )
  const selectedOldAmount = useMemo(
    () => selectedItems.reduce((sum, i) => sum + Number(i.oldPrice || i.price) * i.quantity, 0),
    [selectedItems]
  )
  const selectedCount = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.quantity, 0),
    [selectedItems]
  )
  const savings = selectedOldAmount - selectedAmount
  const points = Math.round(selectedAmount * 0.03)

  useEffect(() => {
    let cancelled = false
    getForYou(6)
      .then((res) => {
        if (cancelled) return
        const list = res.data?.result || []
        setRecommended(
          list.map((p) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            section_code: p.section_code,
            image: p.image,
            price: p.price,
            oldPrice: p.oldPrice,
          }))
        )
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useMatchHeight('.catalog__main-title', [recommended])

  const fmt = (n) => Math.floor(n).toLocaleString('ru-RU')

  const handleToggleAll = () => dispatch(selectAll(!allSelected))
  const handleDeleteSelected = () => dispatch(removeSelected())

  if (items.length === 0) {
    return (
      <>
        <Helmet><title>Корзина — TopDisc</title></Helmet>
        <div className="breadcrumbs">
          <div className="container">
            <ul className="breadcrumbs-list">
              <li className="breadcrumbs-item"><Link className="breadcrumbs-link" to="/">Главная</Link></li>
              <li className="breadcrumbs-item"><span className="breadcrumbs-link">Корзина</span></li>
            </ul>
          </div>
        </div>
        <div className="category-page">
          <div className="container">
            <h1 className="catalog__title">Корзина</h1>
            <div className="cart__empty">
              <p>Корзина пуста</p>
              <Link to="/catalog/" className="cart__empty-link">Перейти в каталог</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet><title>Корзина — TopDisc</title></Helmet>
      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item"><Link className="breadcrumbs-link" to="/">Главная</Link></li>
            <li className="breadcrumbs-item"><span className="breadcrumbs-link">Корзина</span></li>
          </ul>
        </div>
      </div>

      <div className="category-page">
        <div className="container">
          <h1 className="catalog__title">Корзина</h1>

          <div className="cart__layout">
            {/* LEFT: Cart items */}
            <div className="cart__items">
              <div className="cart__toolbar">
                <label className="cart__select-all">
                  <input type="checkbox" checked={allSelected} onChange={handleToggleAll} />
                  <span>Выбрать все</span>
                </label>
                <button className="cart__delete-selected" onClick={handleDeleteSelected} disabled={selectedItems.length === 0}>
                  Удалить выбранное
                </button>
              </div>

              {items.map((item) => {
                const isInFav = favoriteItems.some((f) => f.id === item.id)
                return (
                  <div className="cart__item" key={item.id}>
                    <label className="cart__item-checkbox">
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={() => dispatch(toggleItemSelected(item.id))}
                      />
                    </label>
                    <Link to={`/catalog/${item.section_code}/${item.code}/`} className="cart__item-img">
                      <ImageWithFallback src={item.image} alt={decodeHtml(item.name)} />
                    </Link>
                    <div className="cart__item-info">
                      <Link to={`/catalog/${item.section_code}/${item.code}/`} className="cart__item-name">
                        {decodeHtml(item.name)}
                      </Link>
                      <div className="cart__item-controls">
                        <div className="cart__quantity">
                          <button className="cart__qty-btn" onClick={() => dispatch(decrementQuantity(item.id))} disabled={item.quantity <= 1}>−</button>
                          <span className="cart__qty-value">{item.quantity}</span>
                          <button className="cart__qty-btn" onClick={() => dispatch(incrementQuantity(item.id))}>+</button>
                        </div>
                      </div>
                    </div>
                    <div className="cart__item-right">
                      <div className="cart__item-price">{fmt(Number(item.price) * item.quantity)} ₽</div>
                      {item.oldPrice && Number(item.oldPrice) > Number(item.price) && (
                        <div className="cart__item-oldprice">{fmt(Number(item.oldPrice) * item.quantity)} ₽</div>
                      )}
                    </div>
                    <div className="cart__item-actions">
                      <button
                        className={`cart__item-fav${isInFav ? ' is-active' : ''}`}
                        onClick={() => dispatch(toggleFavorite(item))}
                        aria-label="В избранное"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isInFav ? '#e53935' : 'none'} stroke={isInFav ? '#e53935' : '#999'} strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      <button className="cart__item-delete" onClick={() => dispatch(removeFromCart(item.id))} aria-label="Удалить">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* RIGHT: Summary */}
            <div className="cart__summary">
              <div className="cart__summary-row">
                <span>{selectedCount} {selectedCount === 1 ? 'товар' : selectedCount < 5 ? 'товара' : 'товаров'} на сумму:</span>
                <strong>{fmt(selectedAmount)} ₽</strong>
              </div>
              {selectedOldAmount > selectedAmount && (
                <div className="cart__summary-old">{fmt(selectedOldAmount)} ₽</div>
              )}
              <div className="cart__summary-row">
                <span>Доставка:</span>
                <span className="cart__summary-green">Бесплатно</span>
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
                <strong>{fmt(selectedAmount)} ₽</strong>
              </div>

              <button className="cart__checkout-btn" onClick={() => navigate('/cart/checkout/')} disabled={selectedItems.length === 0}>
                Перейти к оформлению
              </button>
            </div>
          </div>

          {/* Рекомендации */}
          {recommended.length > 0 && (
            <div className="cart__recommended">
              <h2 className="cart__recommended-title">С этим часто берут</h2>
              <div className="catalog__main-list">
                {recommended.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Cart
