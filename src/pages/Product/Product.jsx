import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../../store/slices/cartSlice'
import { addToCompare, removeFromCompare } from '../../store/slices/compareSlice'
import { toggleFavorite } from '../../store/slices/favoritesSlice'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs } from 'swiper/modules'
import { Helmet } from 'react-helmet-async'
import { getCategoryByCode, getProductIdByCode, getProductById } from '../../services/apiClient'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import { decodeHtml } from '../../utils/decodeHtml'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

function Product() {
  const { categoryCode, productCode } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [thumbsSwiper, setThumbsSwiper] = useState(null)
  const [gallery, setGallery] = useState([])
  const [selectedColor, setSelectedColor] = useState(null)
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  const [sostText, setSostText] = useState([])
  const abortControllerRef = useRef(null)
  const compareItems = useSelector((s) => s.compare.items)
  const isInCompare = product ? compareItems.some((i) => i.id === product.id) : false
  const favoriteItems = useSelector((s) => s.favorites.items)
  const isInFavorites = product ? favoriteItems.some((i) => i.id === product.id) : false

  const handleToggleFavorite = () => {
    if (!product) return
    dispatch(toggleFavorite({ id: product.id, name: product.name, code: product.code, section_code: categoryCode, image: product.image, price: product.price, oldPrice: product.oldPrice }))
  }

  const handleToggleCompare = () => {
    if (!product) return
    if (isInCompare) {
      dispatch(removeFromCompare(product.id))
    } else {
      dispatch(addToCompare({ id: product.id, name: product.name, code: product.code, section_code: categoryCode, image: product.image, price: product.price, oldPrice: product.oldPrice }))
    }
  }

  // Сброс состояния при смене товара
  useEffect(() => {
    setProduct(null)
    setLoading(true)
    setGallery([])
    setShowAllSpecs(false)
  }, [productCode, categoryCode])

  useEffect(() => {
    // Отменяем предыдущий запрос если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    const fetchProduct = async () => {
      try {
        setLoading(true)
        
        // Параллельно загружаем данные категории и товара
        const [categoryByCodeResponse, codeResponse] = await Promise.all([
          getCategoryByCode(categoryCode, { signal: abortControllerRef.current.signal }),
          getProductIdByCode(productCode, { signal: abortControllerRef.current.signal })
        ])
        
        // Устанавливаем данные категории
        if (categoryByCodeResponse.data.result.error === 0) {
          setCategory(categoryByCodeResponse.data.result)
        }
        
        if (codeResponse.data.result.error !== 0) {
          console.error('Товар не найден по code:', productCode)
          return
        }
        
        const productId = codeResponse.data.result.id
        
        // Затем загружаем товар по ID
        const response = await getProductById(productId, { signal: abortControllerRef.current.signal })
        
        if (response.data.result) {
          const productData = response.data.result
          
          setProduct(productData)
          
          // Парсим sost_text для составного описания
          if (productData.sost_text && Array.isArray(productData.sost_text)) {
            setSostText(productData.sost_text)
          } else {
            setSostText([])
          }
          
          // Парсим галерею из properties
          const galleryProp = productData.properties?.find(p => p.name === 'Галерея')
          if (galleryProp && galleryProp.value) {
            try {
              const images = JSON.parse(galleryProp.value)
              setGallery([productData.image, ...images])
            } catch {
              setGallery([productData.image])
            }
          } else {
            setGallery([productData.image])
          }
        }
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Ошибка загрузки товара:', error)
        }
      } finally {
        setLoading(false)
        const root = document.getElementById('root')
        if (root) root.dataset.ready = 'true'
      }
    }

    fetchProduct()
    
    // Cleanup: отменяем запрос при размонтировании или смене зависимостей
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [productCode, categoryCode])

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image
      }))
    }
  }

  const handleColorChange = (colorCode) => {
    navigate(`/catalog/${categoryCode}/${colorCode}/`)
  }

  const getArtikul = () => {
    return product?.properties?.find(p => p.name === 'Артикул')?.value || product?.id
  }

  // Всегда рендерим все характеристики, скрываем через CSS
  const allSpecs = product?.properties || []

  if (!product && !loading) {
    return <div className="container">Товар не найден</div>
  }

  if (!product) {
    return null // Показываем prerendered контент
  }

  return (
    <>
      <Helmet>
        <title>{decodeHtml(product.name)} - TopDisk</title>
        <meta name="description" content={`Купить ${decodeHtml(product.name)} в интернет-магазине TopDisk`} />
      </Helmet>

      {/* ХЛЕБНЫЕ КРОШКИ */}
      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/catalog/">Каталог</Link>
            </li>
            {category && (
              <li className="breadcrumbs-item">
                <Link className="breadcrumbs-link" to={`/category/${category.code}/`}>{decodeHtml(category.name)}</Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="container">
        <div className="product-info">
          {/* ГАЛЕРЕЯ */}
          <div className="product-gallery">
            <div className="desktop-hidden product__action-btns">
              <div className="arrow-back">
                <button onClick={() => navigate(-1)} className="action-btn back" aria-label="назад"></button>
              </div>
              <div className="catalog__main-item-action-buttons">
                <button className={`action-btn favorite${isInFavorites ? ' is-active' : ''}`} type="button" aria-label="Добавить в избранное" onClick={handleToggleFavorite}></button>
                <button className="action-btn compare" type="button" aria-label="Добавить к сравнению" onClick={handleToggleCompare} style={isInCompare ? { backgroundColor: '#44BD31' } : {}}></button>
              </div>
            </div>

            {/* Миниатюры */}
            <div className="product-gallery__thumbs swiper">
              <Swiper
                modules={[Thumbs]}
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={4}
                direction="vertical"
                watchSlidesProgress={true}
                className="swiper-wrapper"
              >
                {gallery.map((img, i) => (
                  <SwiperSlide key={i}>
                    <ImageWithFallback src={img} alt={`${decodeHtml(product.name)} ${i + 1}`} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Большой слайдер */}
            <div className="product-gallery__main">
              <button className="gallery-nav gallery-prev" aria-label="prev"></button>

              <div className="swiper product-gallery__swiper">
                <Swiper
                  modules={[Navigation, Pagination, Thumbs]}
                  navigation={{
                    prevEl: '.gallery-prev',
                    nextEl: '.gallery-next',
                  }}
                  pagination={{
                    el: '.swiper-pagination',
                    clickable: true,
                  }}
                  thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                >
                  {gallery.map((img, i) => (
                    <SwiperSlide key={i}>
                      <ImageWithFallback src={img} alt={`${decodeHtml(product.name)} ${i + 1}`} />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="swiper-pagination"></div>
              </div>

              <button className="gallery-nav gallery-next" aria-label="next"></button>
            </div>
          </div>

          {/* ИНФОРМАЦИЯ О ТОВАРЕ */}
          <div className="product">
            <header className="product__header">
              <div className="product__row-badge">
                <span className="product__badge product__badge--hit">Хит</span>
                <span className="product__bonus mobile-hidden">
                  {Math.round(parseFloat(product.price) * 0.03)} <img className="catalog__main-score-img" alt="Score" src="/img/header/score.png" />
                </span>
              </div>
              <h1 className="product__title">
                {decodeHtml(product.name)}
                <span className="product__bonus desktop-hidden">
                  {Math.round(parseFloat(product.price) * 0.03)} <img className="catalog__main-score-img" alt="Score" src="/img/header/score.png" />
                </span>
              </h1>
            </header>

            {/* ЦЕНА (mobile) */}
            <div className="product__price-block desktop-hidden">
              <span className="product__price">{parseFloat(product.price).toLocaleString()} ₽</span>
            </div>

            {/* Рейтинг / Артикул */}
            <div className="product__meta">
              <span className="product__sku">Артикул: {getArtikul()}</span>
              <div className="product__meta-right">
                <span className="product__rating">
                  <img src="/img/star.png" alt="star" />
                  5.0
                </span>
                <div className="catalog__main-item-action-buttons mobile-hidden">
                  <button className={`action-btn favorite${isInFavorites ? ' is-active' : ''}`} type="button" aria-label="Добавить в избранное" onClick={handleToggleFavorite}></button>
                  <button className="action-btn compare" type="button" aria-label="Добавить к сравнению" onClick={handleToggleCompare} style={isInCompare ? { backgroundColor: '#44BD31' } : {}}></button>
                </div>
              </div>
            </div>

            {/* ОПЦИИ */}
            <div className="product__options">
              {/* Выбор цвета */}
              {product.other_color?.value && product.other_color.value.length > 0 && (
                <div className="product__option">
                  <span className="product__option-label">Цвет:</span>
                  <div className="product__switches" data-switch="color">
                    {product.other_color.value.map((color) => (
                      <button
                        key={color.ID}
                        className={`product__switch ${color.code === productCode ? 'is-active' : ''}`}
                        onClick={() => handleColorChange(color.code)}
                        title={color.color}
                        aria-label={color.color}
                      >
                        <ImageWithFallback src={color.img} alt={color.color} style={{width: '40px', height: '40px', objectFit: 'contain'}} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ЦЕНА (desktop) */}
            <div className="product__price-block mobile-hidden">
              <span className="product__price">{parseFloat(product.price).toLocaleString()} ₽</span>
            </div>

            {/* НАЛИЧИЕ В МАГАЗИНАХ */}
            {product.store && Array.isArray(product.store) && product.store.length > 0 && (
              <div className="product__stores">
                <h3 className="product__stores-title">Наличие в магазинах:</h3>
                <div className="product__stores-list">
                  {product.store.map((store) => (
                    <div key={store.ID} className="product__store-item">
                      <div className="product__store-info">
                        <div className="product__store-name">{store.TITLE}</div>
                        <div className="product__store-address">{store.ADDRESS}</div>
                      </div>
                      <div className="product__store-amount">
                        {parseInt(store.AMOUNT) > 0 ? (
                          <span className="in-stock">В наличии: {store.AMOUNT} шт.</span>
                        ) : (
                          <span className="out-of-stock">Нет в наличии</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* КНОПКИ (desktop) */}
            <div className="product__actions mobile-hidden">
              <button className="product__btn product__btn--primary" onClick={handleAddToCart}>
                Добавить в корзину
              </button>
              <button className="product__btn product__btn--outline">Купить в 1 клик</button>
            </div>
          </div>
        </div>

        {/* БАННЕРЫ */}
        <div className="product-banners">
          <div className="banner1">
            <div className="banner1-text">Кредит или рассрочка от</div>
            <div className="banner1-price">
              {Math.ceil(parseFloat(product.price) / 24).toLocaleString()} ₽/мес
            </div>
          </div>
          <div className="banner2">
            <div className="banner2-text">Нашли<br />дешевле?</div>
          </div>
        </div>
      </div>

      {/* ХАРАКТЕРИСТИКИ */}
      <section className="product-specs">
        <div className="container">
          <button className="specs__header" type="button" onClick={() => setShowAllSpecs(!showAllSpecs)}>
            <h2 className="specs__title">Характеристики</h2>
            <span className="specs__arrow"></span>
          </button>

          <div className="specs__body">
            <dl className="specs__list">
              {allSpecs
                .filter(prop => prop.name !== 'Галерея' && prop.name !== 'Артикул')
                .map((prop, index) => (
                  <div key={index} className={`specs__row ${!showAllSpecs && index >= 6 ? 'specs__row--extra' : ''}`}>
                    <dt>{decodeHtml(prop.name)}</dt>
                    <dd>{decodeHtml(prop.value)}</dd>
                  </div>
                ))}
            </dl>

            {product.properties && product.properties.length > 6 && (
              <button className="specs__more" type="button" onClick={() => setShowAllSpecs(!showAllSpecs)}>
                {showAllSpecs ? 'Скрыть' : 'Все характеристики'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ОПИСАНИЕ ТОВАРА */}
      {(!product.detail_text && sostText.length > 0) ? (
        <div className="container">
          <div className="product-description">
            <div className="description-wrapper">
              {sostText.map((block, index) => {
                const position = block.position || 'RIGHT'
                const title = block.title || ''
                const text = block.text || ''
                const image = block.image || ''
                
                return (
                  <div 
                    key={index} 
                    className={`description-row flex-column ${position === 'LEFT' ? 'flex-lg-row-reverse' : 'flex-lg-row'}`} 
                    style={{gap: '80px'}}
                  >
                    <div className="description-col" style={{maxWidth: '592px'}}>
                      <div className="description-block">
                        {title && <h5>{title}</h5>}
                        {text && <p dangerouslySetInnerHTML={{__html: sanitizeHtml(text)}} />}
                      </div>
                    </div>
                    {image && (
                      <div className="description-col">
                        <div className="description__image-wrapper">
                          <ImageWithFallback 
                            className="description__image" 
                            src={image} 
                            alt={title}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : product.detail_text ? (
        <div className="container">
          <div className="product-description">
            <div className="description-wrapper">
              <div className="description-block">
                <div dangerouslySetInnerHTML={{__html: sanitizeHtml(product.detail_text)}} />
              </div>
            </div>
          </div>
        </div>
      ) : null}


      {/* МОБИЛЬНАЯ КНОПКА ПОКУПКИ */}
      <div className="product__actions-mobile desktop-hidden" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px',
        background: '#fff',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        zIndex: 100
      }}>
        <button className="product__btn product__btn--primary" onClick={handleAddToCart} style={{width: '100%'}}>
          Добавить в корзину
        </button>
      </div>
    </>
  )
}

export default Product
