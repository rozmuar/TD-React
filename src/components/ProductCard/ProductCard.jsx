import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { memo, useMemo, useState } from 'react'
import { addToCompare, removeFromCompare } from '../../store/slices/compareSlice'
import { toggleFavorite } from '../../store/slices/favoritesSlice'
import ImageWithFallback from '../ImageWithFallback/ImageWithFallback'
import { decodeHtml } from '../../utils/decodeHtml'
import PreorderModal from '../PreorderModal/PreorderModal'
import AddToCartButton from '../AddToCartButton/AddToCartButton'

function ProductCard({ product }) {
  const dispatch = useDispatch()
  const compareItems = useSelector((s) => s.compare.items)
  const isInCompare = compareItems.some((i) => i.id === product.id)
  const favoriteItems = useSelector((s) => s.favorites.items)
  const isInFavorites = favoriteItems.some((i) => i.id === product.id)
  const [showPreorder, setShowPreorder] = useState(false)

  const handleToggleCompare = () => {
    if (isInCompare) {
      dispatch(removeFromCompare(product.id))
    } else {
      dispatch(addToCompare(product))
    }
  }

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(product))
  }

  // Доступность: цена > 0 и наличие
  const hasStock = parseInt(product.quantity) > 0
  const hasPrice = parseFloat(product.price) > 0
  const isAvailable = hasPrice && hasStock

  // Кешируем форматирование цен
  const formattedPrice = useMemo(() => 
    Math.floor(product.price).toLocaleString('ru-RU'), 
    [product.price]
  )
  
  const formattedOldPrice = useMemo(() => 
    product.oldPrice ? Math.floor(product.oldPrice).toLocaleString('ru-RU') : null,
    [product.oldPrice]
  )

  // Баллы приходят с бэкенда полем bonus (app_mobile.product_list)
  const score = useMemo(() =>
    Math.round(parseFloat(product.bonus) || 0),
    [product.bonus]
  )

  return (
    <div className="catalog__main-item">
      <div className="catalog__main-imagewrapper">
        <div className="catalog__main-item-action-buttons">
          <button className={`action-btn favorite${isInFavorites ? ' is-active' : ''}`} type="button" aria-label="Добавить в избранное" onClick={handleToggleFavorite}></button>
          <button className="action-btn compare" type="button" aria-label="Добавить к сравнению" onClick={handleToggleCompare} style={isInCompare ? { backgroundColor: 'var(--accent, #44BD31)' } : undefined}></button>
        </div>
        <Link to={`/catalog/${product.section_code}/${product.code}/`}>
            <ImageWithFallback className="catalog__main-image" alt={decodeHtml(product.name)} src={product.image} />
        </Link>
      </div>
      <Link to={`/catalog/${product.section_code}/${product.code}/`} className="catalog__main-title">{decodeHtml(product.name)}</Link>
      {isAvailable ? (
        <>
          <div className="catalog__main-row">
            <div className="catalog__main-prices">
              <div className="catalog__main-price">{formattedPrice} ₽</div>
              {formattedOldPrice && (
                <div className="catalog__main-oldprice">{formattedOldPrice} ₽</div>
              )}
            </div>
            {score > 0 && (
              <div className="catalog__main-score">
                <div className="catalog__main-score-num">{score}</div>
                <img className="catalog__main-score-img" alt="Score" src="/img/header/score.png" />
              </div>
            )}
          </div>
          <AddToCartButton product={product} className="catalog__main-button" />
        </>
      ) : (
        <>
          <div className="catalog__main-row">
            <div className="catalog__main-prices">
              <div className="catalog__main-price catalog__main-price--muted">Цена по запросу</div>
            </div>
          </div>
          <button className="catalog__main-button catalog__main-button--preorder" onClick={() => setShowPreorder(true)}>Хочу под заказ</button>
          {showPreorder && (
            <PreorderModal
              productName={decodeHtml(product.name)}
              productId={product.id}
              onClose={() => setShowPreorder(false)}
            />
          )}
        </>
      )}
    </div>
  )
}

// Мемоизация - рендерим только при изменении product.id
export default memo(ProductCard, (prevProps, nextProps) => 
  prevProps.product.id === nextProps.product.id
)
