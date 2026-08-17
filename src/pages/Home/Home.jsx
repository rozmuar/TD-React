import { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { getBigBanners, getForYou, getPopularCategories, getHurryToBuy, getNewsForHome } from '../../services/apiClient'
import { useMatchHeight } from '../../hooks/useMatchHeight'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import { decodeHtml } from '../../utils/decodeHtml'
import { sanitizeHtml } from '../../utils/sanitizeHtml'
import { useSSRData } from '../../context/SSRDataContext'
import AddToCartButton from '../../components/AddToCartButton/AddToCartButton'

function Home() {
  const dispatch = useDispatch()
  const ssrData = useSSRData()
  const ssrMatch = ssrData?.type === 'home'

  // SSR-guard: пропускаем первый запрос если данные уже пришли с сервера
  const ssrUsed = useRef(false)

  const [banners, setBanners] = useState(ssrMatch ? ssrData.banners : [])
  const [bannersLoading, setBannersLoading] = useState(!ssrMatch)
  const [forYouProducts, setForYouProducts] = useState(ssrMatch ? ssrData.forYouProducts : [])
  const [popularCategories, setPopularCategories] = useState(ssrMatch ? ssrData.popularCategories : [])
  const [hurryToBuyProducts, setHurryToBuyProducts] = useState(ssrMatch ? ssrData.hurryToBuyProducts : [])
  const [news, setNews] = useState(ssrMatch ? ssrData.news : [])
  const [dataLoading, setDataLoading] = useState(!ssrMatch)
  const heroPaginationRef = useRef(null)

  // Выравнивание высоты заголовков товаров
  useMatchHeight('.catalog__main-title', [forYouProducts, hurryToBuyProducts, dataLoading])
  
  // Выравнивание высоты заголовков новостей
  useMatchHeight('.news-card__title', [news])

  useEffect(() => {
    // Если SSR уже предоставил данные — пропускаем первый запрос
    if (ssrMatch && !ssrUsed.current) {
      ssrUsed.current = true
      return
    }
    ssrUsed.current = true

    const fetchHomeData = async () => {
      try {
        const [bannersResponse, forYouResponse, categoriesResponse, hurryToBuyResponse, newsResponse] = await Promise.all([
          getBigBanners(),
          getForYou(20),
          getPopularCategories(9),
          getHurryToBuy(20),
          getNewsForHome(6)
        ])
        
        // Баннеры
        if (bannersResponse.data.result && Array.isArray(bannersResponse.data.result)) {
          setBanners(bannersResponse.data.result)
        }
        
        // Специально для вас
        if (forYouResponse.data.result && Array.isArray(forYouResponse.data.result) && forYouResponse.data.result.length > 0) {
          setForYouProducts(forYouResponse.data.result)
        }
        
        // Популярные категории
        if (categoriesResponse.data.result && Array.isArray(categoriesResponse.data.result)) {
          setPopularCategories(categoriesResponse.data.result)
        }
        
        // Успейте купить
        if (hurryToBuyResponse.data.result?.data && Array.isArray(hurryToBuyResponse.data.result.data)) {
          setHurryToBuyProducts(hurryToBuyResponse.data.result.data)
        }
        
        // Новости
        if (newsResponse.data.result && Array.isArray(newsResponse.data.result)) {
          setNews(newsResponse.data.result)
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setBannersLoading(false)
        setDataLoading(false)
      }
    }
    
    fetchHomeData()
  }, [dispatch])

  useEffect(() => {
    if (!bannersLoading && !dataLoading) {
      // Флаг для prerender скрипта
      const root = document.getElementById('root')
      if (root) root.dataset.ready = 'true'
    }
  }, [bannersLoading, dataLoading])

  // Маппинг кодов категорий на CSS классы
  const categoryClassMap = {
    'smartfony_i_gadzhety': 'card--smartphones1',
    'bytovaya_tekhnika': 'card--home-tech',
    'elektrotekhnika': 'card--electronics',
    'kompyutery_i_noutbuki': 'card--computers',
    'sport_i_otdykh': 'card--sports',
    'audiotekhnika': 'card--audio',
    'dom_i_sad': 'card--home-garden',
    'igrushki_i_khobbi': 'card--toys',
    'avtotovary': 'card--auto'
  }
  
  const getCategoryClass = (code) => categoryClassMap[code] || 'card--electronics'

  // Товары "для вас"
  const displayedForYou = forYouProducts.slice(0, 20)

  return (
    <>
      <Helmet>
        <title>TopDisk - Интернет-магазин электроники и бытовой техники</title>
        <meta name="description" content="TopDisk - интернет-магазин электроники, смартфонов, гаджетов, бытовой техники. Быстрая доставка, низкие цены, гарантия качества." />
        <meta property="og:title" content="TopDisk - Интернет-магазин электроники" />
        <meta property="og:description" content="Интернет-магазин электроники и бытовой техники" />
      </Helmet>
      {/* HERO-секция */}
      <div className="container">
        <div className="hero">
          <div className="hero-slider">
            <div className="hero-slider-wrapper">
              <button className="hero-slider-nav hero-slider-prev" aria-label="prev"></button>

              <Swiper
                modules={[Navigation, Pagination]}
                speed={400}
                loop={banners.length > 1}
                navigation={{
                  prevEl: '.hero-slider-prev',
                  nextEl: '.hero-slider-next',
                }}
                pagination={{
                  clickable: true,
                }}
                onBeforeInit={(swiper) => {
                  swiper.params.pagination.el = heroPaginationRef.current
                }}
                className="swiper hero-slider__swiper"
              >
                {!bannersLoading && banners.length > 0 ? (
                  banners.map((banner) => {
                    // Очистка URL от дублирования домена
                    let cleanLink = banner.link || '#'
                    if (cleanLink.includes('https://topdisc.ruhttps://')) {
                      cleanLink = cleanLink.replace('https://topdisc.ru', '')
                    }
                    // Блокируем javascript: и data: URI
                    if (/^\s*javascript:/i.test(cleanLink) || /^\s*data:/i.test(cleanLink)) {
                      cleanLink = '#'
                    }
                    const isExternal = cleanLink.startsWith('http')
                    
                    return (
                      <SwiperSlide key={banner.id}>
                        <a 
                          href={cleanLink} 
                          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          <ImageWithFallback src={banner.image} alt={banner.name} />
                          {banner.text && banner.text.trim() !== '' && (
                            <div className="hero-slider-content">
                              <div className="hero-slider-content-wrapper">
                                <div className="hero-slider-content-title">{banner.name}</div>
                                <div className="hero-slider-content-text">{banner.text}</div>
                              </div>
                            </div>
                          )}
                        </a>
                      </SwiperSlide>
                    )
                  })
                ) : (
                  // Заглушка на время загрузки
                  <SwiperSlide>
                    <img src="/img/hero/slide.png" alt="" />
                  </SwiperSlide>
                )}
              </Swiper>

              <button className="hero-slider-nav hero-slider-next" aria-label="next"></button>
            </div>
            <div ref={heroPaginationRef} className="swiper-pagination hero-slider__pagination"></div>
          </div>

          <div className="hero-row">
            <div className="hero-block hero-block--price">
              <span className="hero-block__text">Низкая<br />цена</span>
            </div>
            <div className="hero-block hero-block--fast">
              <span className="hero-block__text">Доставка<br /> за 2 часа</span>
            </div>
            <div className="hero-block hero-block--stock">
              <span className="hero-block__text">Все<br />в наличии</span>
            </div>
            <div className="hero-block hero-block--free">
              <span className="hero-block__text">Бесплатная<br />доставка</span>
            </div>
          </div>
        </div>
      </div>

      {/* СПЕЦИАЛЬНО ДЛЯ ВАС */}
      <section className="hits">
        <div className="container">
          <h2 className="hits__title">Специально для вас</h2>
          <div className="hits-slider-wrapper">
            <button className="hits__nav hits__nav--prev" aria-label="Предыдущий"></button>

            <Swiper
              modules={[Navigation]}
              speed={400}
              spaceBetween={8}
              slidesPerView={2}
              navigation={{
                nextEl: '.hits__nav--next',
                prevEl: '.hits__nav--prev',
              }}
              breakpoints={{
                576: { slidesPerView: 3, spaceBetween: 16 },
                992: { slidesPerView: 4.5, spaceBetween: 37 },
              }}
              watchOverflow={true}
              className="swiper hits__swiper"
            >
              {displayedForYou.map((product) => {
                const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
                const oldPrice = product.oldPrice ? (typeof product.oldPrice === 'string' ? parseFloat(product.oldPrice) : product.oldPrice) : null
                
                // Определяем URL товара
                const productUrl = product.code && (product.section_code || product.category_code)
                  ? `/catalog/${product.section_code || product.category_code}/${product.code}/`
                  : '#'
                
                return (
                  <SwiperSlide key={product.id}>
                    <div className="catalog__main-item">
                      <div className="catalog__main-imagewrapper">
                        <div className="catalog__main-item-action-buttons">
                          <button className="action-btn favorite" type="button" aria-label="Добавить в избранное"></button>
                          <button className="action-btn compare" type="button" aria-label="Добавить к сравнению"></button>
                        </div>
                        <Link to={productUrl}>
                          <ImageWithFallback className="catalog__main-image" alt={decodeHtml(product.name)} src={product.image} />
                        </Link>
                      </div>
                      <Link to={productUrl} className="catalog__main-title">{decodeHtml(product.name)}</Link>
                      <div className="catalog__main-row">
                        <div className="catalog__main-prices">
                          <div className="catalog__main-price">{price.toLocaleString()} ₽</div>
                          {oldPrice && (
                            <div className="catalog__main-oldprice">{oldPrice.toLocaleString()} ₽</div>
                          )}
                        </div>
                        <div className="catalog__main-score">
                          <div className="catalog__main-score-num">{Math.round(price * 0.03)}</div>
                          <img className="catalog__main-score-img" alt="Score" src="/img/header/score.png" />
                        </div>
                      </div>
                      <AddToCartButton product={product} className="catalog__main-button" />
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>

            <button className="hits__nav hits__nav--next" aria-label="Следующий"></button>
          </div>
        </div>
      </section>

      {/* ПОПУЛЯРНЫЕ КАТЕГОРИИ */}
      {popularCategories.length > 0 && (
      <section className="popular-cats">
        <div className="container">
          <h2 className="popular-cats__heading">Популярные категории</h2>

          <div className="popular-cats__grid">
            {popularCategories.slice(0, 9).map((category, index) => (
              <Link
                key={category.id}
                to={`/category/${category.code}/`}
                className={`popular-card ${index === 0 ? 'popular-card--xl' : ''} ${getCategoryClass(category.code)}`}
                style={category.ico ? { backgroundImage: `url(${category.ico})` } : {}}
              >
                <span className="popular-card__title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(category.name.replace(/ /g, '<br />')) }} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* БРЕНДЫ - временно скрыто, пока API не готов */}
      {false && (
      <section className="brands">
        <div className="container">
          <h2 className="brands__title">Популярные бренды</h2>
          <div className="brands__wrapper">
            <button className="brands__arrow brands__arrow--prev" aria-label="Назад"></button>

            <Swiper
              modules={[Navigation]}
              spaceBetween={10}
              slidesPerView={3}
              navigation={{
                nextEl: '.brands__arrow--next',
                prevEl: '.brands__arrow--prev',
              }}
              breakpoints={{
                576: { slidesPerView: 4 },
                768: { slidesPerView: 6 },
                992: { slidesPerView: 8 },
              }}
              className="brands__slider swiper"
            >
              {[...Array(13)].map((_, i) => (
                <SwiperSlide key={i}>
                  <div className="brands__slide">
                    <span className="brands__pill">
                      <img src="/img/brands/sony.png" alt="Sony" />
                    </span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button className="brands__arrow brands__arrow--next" aria-label="Вперёд"></button>
          </div>
        </div>
      </section>
      )}

      {/* УСПЕЙТЕ КУПИТЬ */}
      {hurryToBuyProducts.length > 0 && (
      <section className="hits-green">
        <div className="container">
          <h2 className="hits-green__title">Успейте купить</h2>
          <div className="hits-slider-wrapper">
            <button className="hits-green__nav hits-green__nav--prev" aria-label="Предыдущий"></button>

            <Swiper
              modules={[Navigation]}
              speed={400}
              spaceBetween={8}
              slidesPerView={2}
              navigation={{
                nextEl: '.hits-green__nav--next',
                prevEl: '.hits-green__nav--prev',
              }}
              breakpoints={{
                576: { slidesPerView: 3, spaceBetween: 16 },
                992: { slidesPerView: 4.5, spaceBetween: 37 },
              }}
              watchOverflow={true}
              className="swiper hits-green__swiper"
            >
              {hurryToBuyProducts.slice(0, 20).map((product) => (
                <SwiperSlide key={product.id}>
                  <div className="catalog__main-item">
                    <div className="catalog__main-imagewrapper">
                      <Link to={`/catalog/${product.section_code || product.category_code}/${product.code}/`}>
                        <ImageWithFallback className="catalog__main-image" alt={decodeHtml(product.name)} src={product.image} />
                      </Link>
                    </div>
                    <div className="catalog__main-prices">
                      <div className="catalog__main-price">{parseFloat(product.price).toLocaleString()} ₽</div>
                    </div>
                    <Link to={`/catalog/${product.section_code || product.category_code}/${product.code}/`} className="catalog__main-title">{decodeHtml(product.name)}</Link>
                    <AddToCartButton product={product} className="catalog__main-button" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button className="hits-green__nav hits-green__nav--next" aria-label="Следующий"></button>
          </div>
        </div>
      </section>
      )}

      {/* НОВОСТИ */}
      {news.length > 0 && (
      <section className="news">
        <div className="container">
          <div className="news__top">
            <h2 className="news__title">Новости</h2>
            <Link to="/company/news/" className="news__more btn--outline-accent">Смотреть все</Link>
          </div>

          <div className="news__list">
            {news.map((item, index) => (
              <Link to={`/company/news/${item.code}/`} className={`news-card ${index >= 4 ? 'mobile-hidden' : ''}`} key={item.id}>
                <ImageWithFallback className="news-card__img" src={item.image} alt={item.name} />
                <h3 className="news-card__title">{item.name}</h3>
                <time className="news-card__date">{item.date}</time>
              </Link>
            ))}
          </div>

          <Link to="/company/news/" className="news__more news__more--mobile btn--outline-accent btn--full">Смотреть все</Link>
        </div>
      </section>
      )}

      {/* ОТЗЫВЫ */}
      <section className="reviews">
        <div className="container">
          <h2 className="reviews__title">Отзывы</h2>

          <div className="reviews__wrapper">
            <Swiper
              modules={[Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              navigation={{
                nextEl: '.reviews__arrow--next',
                prevEl: '.reviews__arrow--prev',
              }}
              breakpoints={{
                576: { slidesPerView: 2 },
                992: { slidesPerView: 3 },
              }}
              className="reviews__slider swiper"
            >
              {[...Array(6)].map((_, i) => (
                <SwiperSlide key={i}>
                  <div className="reviews__slide">
                    <article className="review-card">
                      <header className="review-card__head">
                        <span className="review-card__author">Марина</span>
                        <img className="review-card__logo" src="/img/2gis.png" alt="2ГИС" />
                      </header>
                      <ul className="review-card__stars">
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                      </ul>
                      <p className="review-card__text">
                        Магазин с широким ассортиментом товаров, можно предварительно выбрать на сайте, а самое главное – цена! Рекомендую!
                      </p>
                    </article>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <button className="reviews__arrow reviews__arrow--prev" aria-label="Назад"></button>
            <button className="reviews__arrow reviews__arrow--next" aria-label="Вперёд"></button>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
