import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import axios from 'axios'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import ProductCard from '../../components/ProductCard/ProductCard'
import { useMatchHeight } from '../../hooks/useMatchHeight'

// Кеш категорий для ускорения навигации
const categoryCache = new Map()

function Category() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [subcategories, setSubcategories] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mainCategory, setMainCategory] = useState(null)
  const [categoryDescription, setCategoryDescription] = useState('')
  const [breadcrumbsPath, setBreadcrumbsPath] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [isProductListPage, setIsProductListPage] = useState(false)
  const abortControllerRef = useRef(null)
  
  // Читаем currentPage из URL (?PAGEN_1=2)
  const currentPage = parseInt(searchParams.get('PAGEN_1') || '1', 10)

  // Выравнивание высоты заголовков товаров
  useMatchHeight('.catalog__main-title', [products, loading])

  // Поиск категории по code с использованием categoryIdByCode API
  const findCategory = async (code) => {
    // Проверяем кеш
    if (categoryCache.has(code)) {
      console.log('Категория из кеша:', code)
      return categoryCache.get(code)
    }

    try {
      // Быстро получаем ID и базовую информацию по code
      const categoryByCodeResponse = await axios.get(
        `https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.categoryIdByCode.json?code=${code}`
      )
      
      if (categoryByCodeResponse.data.result.error !== 0) {
        console.error('Категория не найдена:', code)
        return null
      }

      const category = categoryByCodeResponse.data.result
      
      // Теперь определяем уровень: проверяем является ли категория главной
      const mainResponse = await axios.get(
        'https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.categoryFirst.json'
      )
      const mainCategories = mainResponse.data.result || []
      
      // Проверяем есть ли в главных категориях
      const isMainCategory = mainCategories.some(cat => cat.id == category.id)
      
      if (isMainCategory) {
        // Уровень 1 - главная категория
        const result = { category, path: [] }
        categoryCache.set(code, result)
        return result
      }
      
      // Уровень 2 - нужно найти родительскую категорию
      // Ищем параллельно во всех главных категориях
      const parentSearchPromises = mainCategories.map(async (mainCat) => {
        try {
          const subResponse = await axios.get(
            `https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.categoryId.json?id=${mainCat.id}`
          )
          const subCategories = subResponse.data.result || []
          
          // Проверяем есть ли наша категория среди подкатегорий
          const found = subCategories.some(subCat => subCat.id == category.id)
          if (found) {
            return { id: mainCat.id, name: mainCat.name, code: mainCat.code }
          }
          return null
        } catch (error) {
          return null
        }
      })
      
      const parents = await Promise.all(parentSearchPromises)
      const parent = parents.find(p => p !== null)
      
      if (parent) {
        // Нашли родителя - это уровень 2
        const result = {
          category,
          path: [parent]
        }
        categoryCache.set(code, result)
        return result
      }
      
      // Не нашли среди подкатегорий уровня 1 → это может быть уровень 3
      // Ищем во всех подкатегориях уровня 2
      const level3SearchPromises = mainCategories.map(async (mainCat) => {
        try {
          const level2Response = await axios.get(
            `https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.categoryId.json?id=${mainCat.id}`
          )
          const level2Categories = level2Response.data.result || []
          
          for (const level2Cat of level2Categories) {
            const level3Response = await axios.get(
              `https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.categoryId.json?id=${level2Cat.id}`
            )
            const level3Categories = level3Response.data.result || []
            
            const found = level3Categories.some(cat => cat.id == category.id)
            if (found) {
              return {
                mainCat: { id: mainCat.id, name: mainCat.name, code: mainCat.code },
                level2Cat: { id: level2Cat.id, name: level2Cat.name, code: level2Cat.code }
              }
            }
          }
          return null
        } catch (error) {
          return null
        }
      })
      
      const level3Results = await Promise.all(level3SearchPromises)
      const level3Parent = level3Results.find(r => r !== null)
      
      if (level3Parent) {
        // Уровень 3 - путь с двумя родителями
        const result = {
          category,
          path: [level3Parent.mainCat, level3Parent.level2Cat]
        }
        categoryCache.set(code, result)
        return result
      }
      
      // Не нашли нигде - возвращаем как есть
      const result = {
        category,
        path: []
      }
      categoryCache.set(code, result)
      return result
      
    } catch (error) {
      console.error('Ошибка поиска категории:', error)
      return null
    }
  }

  // Сброс состояния при смене категории
  useEffect(() => {
    setLoading(true)
    setProducts([])
    setSubcategories([])
    setFilters(null)
    setIsProductListPage(false)
    setTotalPages(1)
    setMainCategory(null)
  }, [categoryId])

  // Прокрутка к началу страницы при смене пагинации
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Функция для получения цвета из названия
  const getColorFromName = (colorName) => {
    const colorMap = {
      'белый': '#FFFFFF',
      'черный': '#000000',
      'черный титан': '#2c2c2c',
      'серый': '#808080',
      'красный': '#FF0000',
      'синий': '#0000FF',
      'голубой': '#87CEEB',
      'зеленый': '#008000',
      'желтый': '#FFFF00',
      'оранжевый': '#FFA500',
      'розовый': '#FFC0CB',
      'фиолетовый': '#800080',
      'коричневый': '#8B4513',
      'золотой': '#FFD700',
      'серебряный': '#C0C0C0',
      'бежевый': '#F5F5DC',
      'бордовый': '#800020',
      'мятный': '#98FF98',
      'серебристый': '#C0C0C0',
      'титановый': '#878681',
      'графитовый': '#383838',
    }
    
    const lowerName = colorName.toLowerCase().trim()
    
    // Поиск точного совпадения
    if (colorMap[lowerName]) {
      return colorMap[lowerName]
    }
    
    // Поиск частичного совпадения
    for (const [key, value] of Object.entries(colorMap)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return value
      }
    }
    
    // Если цвет не найден, возвращаем серый
    return '#CCCCCC'
  }

  useEffect(() => {
    // Отменяем предыдущий запрос если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Ищем категорию
        const result = await findCategory(categoryId)
        
        if (!result) {
          setLoading(false)
          return
        }

        const { category: foundCategory, path } = result
        setMainCategory(foundCategory)
        setBreadcrumbsPath(path)

        // Определяем уровень
        const level = path.length // 0 = уровень 1, 1+ = уровень 2+
        
        let showProductList = false
        let needProducts = false
        let subcatsData = []
        
        if (level === 0) {
          // УРОВЕНЬ 1: Всегда подкатегории, товары НЕ нужны
          const subcategoriesResponse = await axios.get(
            `https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.categoryId.json?id=${foundCategory.id}`,
            { signal: abortControllerRef.current.signal }
          )
          subcatsData = subcategoriesResponse.data.result || []
          
          setSubcategories(subcatsData)
          setProducts([])
          setTotalPages(1)
          showProductList = false
          needProducts = false
          
        } else {
          // УРОВЕНЬ 2+: Всегда товары, подкатегории НЕ запрашиваем
          setSubcategories([])
          showProductList = true
          needProducts = true
        }
        
        setIsProductListPage(showProductList)
        
        // Загрузка фильтров
        if (needProducts) {
          try {
            const filtersResponse = await axios.get(
              `https://topdisc.ru/mobile/v1/filter/4/${foundCategory.id}`,
              { signal: abortControllerRef.current.signal }
            )
            // Берем только объект filter из ответа
            const filtersData = filtersResponse.data?.filter || null
            setFilters(filtersData)
          } catch (error) {
            if (error.name !== 'CanceledError') {
              console.error('Ошибка загрузки фильтров:', error)
              setFilters(null)
            }
          }
        } else {
          setFilters(null)
        }
        
        // Берем описание из текущей категории или первой подкатегории
        if (foundCategory.text) {
          setCategoryDescription(foundCategory.text)
        } else if (subcatsData.length > 0 && subcatsData[0].text) {
          setCategoryDescription(subcatsData[0].text)
        }

        // Товары запрашиваем ТОЛЬКО если они нужны для отображения
        if (needProducts) {
          const productsResponse = await axios.get(
            `https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.product_list.json?cat=${foundCategory.id}&page=${currentPage}&prods=20&sort`,
            { signal: abortControllerRef.current.signal }
          )
          
          if (productsResponse.data.result?.data && Array.isArray(productsResponse.data.result.data)) {
            setProducts(productsResponse.data.result.data)
            if (productsResponse.data.result.pagination) {
              const totalPages = parseInt(productsResponse.data.result.pagination.total_pages) || 1
              setTotalPages(totalPages)
            }
          } else {
            setProducts([])
            setTotalPages(1)
          }
        }

      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Ошибка загрузки данных:', error)
        }
      } finally {
        setLoading(false)
        // Флаг для prerender скрипта
        const root = document.getElementById('root')
        if (root) root.dataset.ready = 'true'
      }
    }

    fetchData()
    
    // Cleanup: отменяем запрос при размонтировании или смене зависимостей
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [categoryId, currentPage])

  // Мемоизация кнопок пагинации
  const paginationButtons = useMemo(() => {
    if (totalPages <= 1) return null
    
    const pages = []
    const showEllipsisStart = currentPage > 3
    const showEllipsisEnd = currentPage < totalPages - 2
    
    const getPageUrl = (page) => {
      return page === 1 ? location.pathname : `${location.pathname}?PAGEN_1=${page}`
    }
    
    // Первая страница
    pages.push(
      <Link
        key={1}
        to={getPageUrl(1)}
        className={`pagination__btn ${currentPage === 1 ? 'active' : ''}`}
      >
        1
      </Link>
    )
    
    // Многоточие в начале
    if (showEllipsisStart) {
      pages.push(<span key="ellipsis-start" className="pagination__ellipsis">...</span>)
    }
    
    // Страницы вокруг текущей
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)
    
    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <Link
          key={page}
          to={getPageUrl(page)}
          className={`pagination__btn ${currentPage === page ? 'active' : ''}`}
        >
          {page}
        </Link>
      )
    }
    
    // Многоточие в конце
    if (showEllipsisEnd) {
      pages.push(<span key="ellipsis-end" className="pagination__ellipsis">...</span>)
    }
    
    // Последняя страница
    if (totalPages > 1) {
      pages.push(
        <Link
          key={totalPages}
          to={getPageUrl(totalPages)}
          className={`pagination__btn ${currentPage === totalPages ? 'active' : ''}`}
        >
          {totalPages}
        </Link>
      )
    }
    
    return pages
  }, [currentPage, totalPages, location.pathname])

  // Показываем заглушку если категория еще загружается (для SSG)
  if (!mainCategory) {
    return (
      <>
        <Helmet>
          <title>Загрузка... - TopDisk</title>
        </Helmet>
        <div className="breadcrumbs">
          <div className="container">
            <ul className="breadcrumbs-list">
              <li className="breadcrumbs-item">
                <Link className="breadcrumbs-link" to="/">Главная</Link>
              </li>
              <li className="breadcrumbs-item">
                <Link className="breadcrumbs-link" to="/catalog/">Каталог</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="container">
          <div className="catalog__loading">Загрузка категории...</div>
        </div>
      </>
    )
  }
  
  if (!mainCategory && !loading) {
    return (
      <>
        <Helmet>
          <title>Категория не найдена - TopDisk</title>
        </Helmet>
        <div className="breadcrumbs">
          <div className="container">
            <ul className="breadcrumbs-list">
              <li className="breadcrumbs-item">
                <Link className="breadcrumbs-link" to="/">Главная</Link>
              </li>
              <li className="breadcrumbs-item">
                <Link className="breadcrumbs-link" to="/catalog/">Каталог</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="container">
          <h1>Категория не найдена</h1>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{mainCategory.name} - TopDisk</title>
        <meta name="description" content={`Купить ${mainCategory.name} в интернет-магазине TopDisk`} />
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
            {breadcrumbsPath.map((crumb) => (
              <li key={crumb.id} className="breadcrumbs-item">
                <Link className="breadcrumbs-link" to={`/category/${crumb.code}/`}>{crumb.name}</Link>
              </li>
            ))}
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">{mainCategory.name}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ПОДКАТЕГОРИИ ИЛИ СПИСОК ТОВАРОВ */}
      {!isProductListPage ? (
        /* УРОВЕНЬ 1: СЕТКА ПОДКАТЕГОРИЙ */
        <>
          <div className="subcategory-page">
            <div className="container">
              <h1 className="subcategory__title">{mainCategory.name}</h1>

              {subcategories.length > 0 && (
                <div className="subcategory__grid">
                  {subcategories.map((subcat, index) => (
                    <Link 
                      key={subcat.id} 
                      to={`/category/${subcat.code}/`}
                      className={`subcategory__card ${index === 6 ? 'subcategory__card--xl' : ''}`}
                      style={{ '--pic': `url(${subcat.ico})` }}
                    >
                      <span className="subcategory__name" dangerouslySetInnerHTML={{ __html: subcat.name.replace(/\s/g, '<br />') }} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ХИТЫ ПРОДАЖ */}
          {products.length > 0 && (
            <section className="hits">
              <div className="container">
                <h2 className="hits__title">Хиты продаж</h2>
                <div className="hits-slider-wrapper">
                  <button className="hits__nav hits__nav--prev" aria-label="Предыдущий"></button>
                  
                  <Swiper
                    className="swiper hits__swiper"
                    modules={[Navigation]}
                    spaceBetween={20}
                    slidesPerView={5}
                    navigation={{
                      prevEl: '.hits__nav--prev',
                      nextEl: '.hits__nav--next'
                    }}
                    breakpoints={{
                      320: { slidesPerView: 1 },
                      768: { slidesPerView: 3 },
                      1024: { slidesPerView: 4 },
                      1280: { slidesPerView: 5 }
                    }}
                  >
                    {products.map(product => (
                      <SwiperSlide key={product.id}>
                        <ProductCard product={product} />
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  <button className="hits__nav hits__nav--next" aria-label="Следующий"></button>
                </div>
              </div>
            </section>
          )}

          {/* SEO описание */}
          {categoryDescription && (
            <section className="category-seo">
              <div className="container">
                <div 
                  className="category-seo__content" 
                  dangerouslySetInnerHTML={{ __html: categoryDescription }} 
                />
              </div>
            </section>
          )}
        </>
      ) : (
        /* УРОВЕНЬ 2: СПИСОК ТОВАРОВ С ФИЛЬТРАМИ */
        <div className="catalog">
          <div className="container">
            <h1>{mainCategory.name}</h1>
            <div className="catalog__row">
              {/* ФИЛЬТРЫ */}
              <aside className="catalog__filters mobile-hidden" data-filters>
                <div className="desktop-hidden filters-title">Фильтры</div>
                
                {/* Динамические фильтры */}
                {(() => {
                  if (!filters || !filters.ITEMS || !Array.isArray(filters.ITEMS)) {
                    return null
                  }
                  
                  // Фильтруем нежелательные элементы
                  const filterItems = filters.ITEMS.filter(item => {
                    if (!item || !item.NAME) return false
                    const name = item.NAME
                    // Исключаем фильтры, начинающиеся с *, OLD, Yandex.Market, Страна
                    if (name.startsWith('*')) return false
                    if (name === 'OLD') return false
                    if (name === 'Yandex.Market') return false
                    if (name === 'Страна') return false
                    return true
                  })
                  
                  // Сортируем так, чтобы "Цена" была первой
                  const sortedFilters = filterItems.sort((a, b) => {
                    const aIsPrice = a.NAME === 'Цена' || a.NAME.toLowerCase().includes('цена')
                    const bIsPrice = b.NAME === 'Цена' || b.NAME.toLowerCase().includes('цена')
                    if (aIsPrice && !bIsPrice) return -1
                    if (!aIsPrice && bIsPrice) return 1
                    return 0
                  })
                  
                  return sortedFilters.map((filterData, index) => {
                    const filterKey = filterData.ID || filterData.CODE || index
                    const isPrice = filterData.NAME === 'Цена' || filterData.NAME.toLowerCase().includes('цена')
                    const isColor = filterData.NAME === 'Цвет' || filterData.NAME.toLowerCase().includes('цвет')
                  
                    return (
                      <div key={filterKey}>
                        <details className="filter" open={isPrice}>
                          <summary className="filter__head">
                            <span>{filterData.NAME}</span>
                            <svg className="filter__arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                              <path d="M1 1L5 5L9 1" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </summary>
                          <div className="filter__body">
                            {/* Специальная обработка для фильтра "Цена" */}
                            {isPrice ? (
                              <>
                                <div className="price-inputs">
                                  <input className="price-input" type="number" min="0" step="1" defaultValue="0" placeholder="0" />
                                  <span className="price-dash">—</span>
                                  <input className="price-input" type="number" min="0" step="1" placeholder="10000" />
                                </div>
                                {/* В наличии под ценой */}
                                <div style={{ marginTop: '16px' }}>
                                  <label className="filter-checkbox">
                                    <input type="checkbox" defaultChecked />
                                    <span className="checkbox-custom"></span>
                                    <span>В наличии</span>
                                  </label>
                                </div>
                              </>
                            ) : isColor && filterData.VALUES && Array.isArray(filterData.VALUES) ? (
                              /* Специальная обработка для фильтра "Цвет" - плитки с цветами */
                              <div className="color-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {filterData.VALUES.map((valueItem, idx) => {
                                  const inputId = `filter-${filterKey}-${idx}`
                                  const displayValue = typeof valueItem === 'string' ? valueItem : (valueItem.VALUE || valueItem.NAME || valueItem)
                                  const colorValue = typeof valueItem === 'object' && valueItem.COLOR ? valueItem.COLOR : getColorFromName(displayValue)
                                  
                                  return (
                                    <div key={idx} style={{ position: 'relative' }}>
                                      <input 
                                        id={inputId} 
                                        type="checkbox" 
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                          const label = e.target.nextElementSibling
                                          if (e.target.checked) {
                                            label.style.borderColor = '#333'
                                            label.style.borderWidth = '3px'
                                            label.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)'
                                          } else {
                                            label.style.borderColor = '#ddd'
                                            label.style.borderWidth = '2px'
                                            label.style.boxShadow = 'none'
                                          }
                                        }}
                                      />
                                      <label 
                                        htmlFor={inputId}
                                        title={displayValue}
                                        style={{
                                          display: 'block',
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '4px',
                                          backgroundColor: colorValue,
                                          border: '2px solid #ddd',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s',
                                          boxShadow: colorValue.toLowerCase() === '#ffffff' ? 'inset 0 0 0 1px #ddd' : 'none'
                                        }}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              /* Обычные фильтры */
                              filterData.VALUES && Array.isArray(filterData.VALUES) ? (
                                filterData.NAME.toLowerCase().includes('бренд') || 
                                filterData.NAME.toLowerCase().includes('brand') ||
                                filterData.NAME.toLowerCase().includes('производител') ? (
                                  <ul className="chips">
                                    {filterData.VALUES.map((valueItem, idx) => {
                                      const inputId = `filter-${filterKey}-${idx}`
                                      const displayValue = typeof valueItem === 'string' ? valueItem : (valueItem.VALUE || valueItem.NAME || valueItem)
                                      return (
                                        <li key={idx}>
                                          <input id={inputId} type="checkbox" />
                                          <label htmlFor={inputId}>{displayValue}</label>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                ) : (
                                  filterData.VALUES.map((valueItem, idx) => {
                                    const displayValue = typeof valueItem === 'string' ? valueItem : (valueItem.VALUE || valueItem.NAME || valueItem)
                                    return (
                                      <label key={idx} className="filter-checkbox">
                                        <input type="checkbox" />
                                        <span className="checkbox-custom"></span>
                                        <span>{displayValue}</span>
                                      </label>
                                    )
                                  })
                                )
                              ) : null
                            )}
                          </div>
                        </details>
                        {index < sortedFilters.length - 1 && (
                          <div className="filter-divider"></div>
                        )}
                      </div>
                    )
                  })
                })()}
                
                {/* Кнопки фильтров */}
                <div className="filter-divider"></div>
                <div className="filters__actions">
                  <button className="filter__button desktop-hidden filters__apply" type="button">
                    Применить
                  </button>
                  <button className="filter__button filters__reset" type="button">
                    Сбросить
                  </button>
                </div>
              </aside>

              {/* СПИСОК ТОВАРОВ */}
              <div className="catalog__main">
                {/* Открыть фильтры на мобильном */}
                <button className="catalog__filters-btn desktop-hidden" data-filters-open>
                  Фильтры
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 4h14M4 9h10M6 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Сортировка и вид */}
                <div className="catalog__controls">
                  <select className="catalog__sort">
                    <option>Популярное</option>
                    <option>Новинки</option>
                    <option>Дешевле</option>
                    <option>Дороже</option>
                  </select>

                  <div className="catalog__view">
                    <input type="radio" name="view" id="view-grid" defaultChecked />
                    <label htmlFor="view-grid">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="12" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </label>

                    <input type="radio" name="view" id="view-list" />
                    <label htmlFor="view-list">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="2" y="4" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="2" y="10" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        <rect x="2" y="16" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </label>
                  </div>
                </div>

                {/* Товары */}
                <div className="catalog__main-list">
                  {loading && products.length === 0 ? (
                    <div className="catalog__loading">Загрузка товаров...</div>
                  ) : products.length > 0 ? (
                    products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  ) : (
                    <div className="catalog__empty">
                      <p>В этой категории пока нет товаров</p>
                    </div>
                  )}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="pagination">
                    {currentPage === 1 ? (
                      <span 
                        className="pagination__btn pagination__btn--prev pagination__btn--disabled" 
                        aria-label="Предыдущая страница"
                      >
                        ←
                      </span>
                    ) : (
                      <Link
                        to={currentPage === 2 ? location.pathname : `${location.pathname}?PAGEN_1=${currentPage - 1}`}
                        className="pagination__btn pagination__btn--prev"
                        aria-label="Предыдущая страница"
                      >
                        ←
                      </Link>
                    )}
                    
                    {paginationButtons}
                    
                    {currentPage === totalPages ? (
                      <span
                        className="pagination__btn pagination__btn--next pagination__btn--disabled"
                        aria-label="Следующая страница"
                      >
                        →
                      </span>
                    ) : (
                      <Link
                        to={`${location.pathname}?PAGEN_1=${currentPage + 1}`}
                        className="pagination__btn pagination__btn--next"
                        aria-label="Следующая страница"
                      >
                        →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default Category
