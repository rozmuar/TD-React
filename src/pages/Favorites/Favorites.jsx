import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { clearFavorites } from '../../store/slices/favoritesSlice'
import ProductCard from '../../components/ProductCard/ProductCard'
import { useMatchHeight } from '../../hooks/useMatchHeight'

function Favorites() {
  const dispatch = useDispatch()
  const items = useSelector((s) => s.favorites.items)
  const loading = useSelector((s) => s.favorites.loading)

  useMatchHeight('.catalog__main-title', [items])

  return (
    <>
      <Helmet>
        <title>Избранное — TopDisc</title>
      </Helmet>

      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">Избранное</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="category-page">
        <div className="container">
          <h1 className="catalog__title">Избранное</h1>

          {loading ? (
            <div className="favorites__empty"><p>Загрузка...</p></div>
          ) : items.length === 0 ? (
            <div className="favorites__empty">
              <p>В избранном пока пусто.</p>
              <p>Добавляйте товары, нажимая на <img src="/img/catalog/heart/heart_default.svg" alt="" className="favorites__empty-icon" /> в карточке товара.</p>
            </div>
          ) : (
            <>
              <div className="favorites__actions">
                <button className="favorites__clear" onClick={() => dispatch(clearFavorites())}>
                  Очистить избранное
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
              <div className="catalog__main-list">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Favorites
