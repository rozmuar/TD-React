import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { memo, useMemo } from 'react'
import { addToCart } from '../../store/slices/cartSlice'
import ImageWithFallback from '../ImageWithFallback/ImageWithFallback'
import { decodeHtml } from '../../utils/decodeHtml'

function ProductCard({ product }) {
  const dispatch = useDispatch()

  const handleAddToCart = () => {
    dispatch(addToCart(product))
  }

  // Кешируем форматирование цен
  const formattedPrice = useMemo(() => 
    Math.floor(product.price).toLocaleString('ru-RU'), 
    [product.price]
  )
  
  const formattedOldPrice = useMemo(() => 
    product.oldPrice ? Math.floor(product.oldPrice).toLocaleString('ru-RU') : null,
    [product.oldPrice]
  )

  return (
    <div className="catalog__main-item">
      <div className="catalog__main-imagewrapper">
        <div className="catalog__main-item-action-buttons">
          <button className="action-btn favorite" type="button" aria-label="Добавить в избранное"></button>
          <button className="action-btn compare" type="button" aria-label="Добавить к сравнению"></button>
        </div>
        <Link to={`/catalog/${product.section_code}/${product.code}/`}>
            <ImageWithFallback className="catalog__main-image" alt={decodeHtml(product.name)} src={product.image} />
        </Link>
      </div>
      <Link to={`/catalog/${product.section_code}/${product.code}/`} className="catalog__main-title">{decodeHtml(product.name)}</Link>
      <div className="catalog__main-row">
        <div className="catalog__main-prices">
          <div className="catalog__main-price">{formattedPrice} ₽</div>
          {formattedOldPrice && (
            <div className="catalog__main-oldprice">{formattedOldPrice} ₽</div>
          )}
        </div>
        <div className="catalog__main-score">
          <div className="catalog__main-score-num">740</div>
          <img className="catalog__main-score-img" alt="Score" src="/img/header/score.png" />
        </div>
      </div>
      <button className="catalog__main-button" onClick={handleAddToCart}>В корзину</button>
    </div>
  )
}

// Мемоизация - рендерим только при изменении product.id
export default memo(ProductCard, (prevProps, nextProps) => 
  prevProps.product.id === nextProps.product.id
)
