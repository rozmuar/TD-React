import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getCategoryFirst, getCategoryById, getCategoryByCode, getProductList, getFilters } from '../../services/apiClient'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import ProductCard from '../../components/ProductCard/ProductCard'
import { useMatchHeight } from '../../hooks/useMatchHeight'
import { sanitizeHtml } from '../../utils/sanitizeHtml'
import { decodeHtml } from '../../utils/decodeHtml'
import { useSSRData } from '../../context/SSRDataContext'
import JsonLd from '../../components/JsonLd/JsonLd'
import { breadcrumbSchema, collectionPageSchema, itemListSchema } from '../../utils/jsonLd'

// Кеш категорий для ускорения навигации
const categoryCache = new Map()
// Кеш промежуточных запросов (categoryFirst, categoryId)
let cachedMainCategories = null
const childrenCache = new Map()

function Category() {
  const { categoryId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  // SSR данные
  const ssrData = useSSRData()
  const ssrMatch = ssrData?.type === 'category' && ssrData?.categoryId === categoryId
  // Два guard-рефа: один для reset-эффекта, другой для fetch-эффекта
  const ssrResetGuard = useRef(ssrMatch)
  const ssrFetchGuard = useRef(ssrMatch)

  const [subcategories, setSubcategories] = useState(ssrMatch ? ssrData.subcategories : [])
  const [products, setProducts] = useState(ssrMatch ? ssrData.products : [])
  const [filters, setFilters] = useState(ssrMatch ? ssrData.filters : null)
  const [loading, setLoading] = useState(!ssrMatch)
  const [mainCategory, setMainCategory] = useState(ssrMatch ? ssrData.mainCategory : null)
  const [categoryDescription, setCategoryDescription] = useState(ssrMatch ? ssrData.categoryDescription : '')
  const [breadcrumbsPath, setBreadcrumbsPath] = useState(ssrMatch ? ssrData.breadcrumbsPath : [])
  const [totalPages, setTotalPages] = useState(ssrMatch ? ssrData.totalPages : 1)
  const [isProductListPage, setIsProductListPage] = useState(ssrMatch ? ssrData.isProductListPage : false)
  const [childSubcategories, setChildSubcategories] = useState(ssrMatch ? ssrData.childSubcategories : [])
  const [activeFilters, setActiveFilters] = useState({})
  const [appliedFilters, setAppliedFilters] = useState({})
  const [sortOrder, setSortOrder] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [floatingBtnPos, setFloatingBtnPos] = useState(null)
  const filtersAsideRef = useRef(null)
  const abortControllerRef = useRef(null)
  const filtersInitRef = useRef(false)
  
  // Читаем currentPage из URL (?PAGEN_1=2)
  const currentPage = parseInt(searchParams.get('PAGEN_1') || '1', 10)

  // Восстанавливаем фильтры из URL при первом рендере
  useEffect(() => {
    if (filtersInitRef.current) return
    filtersInitRef.current = true
    const restored = {}
    for (const [key, value] of searchParams.entries()) {
      if (key === 'PAGEN_1' || key === 'sort') continue
      if (key === 'price_min') {
        restored._price = { ...(restored._price || {}), min: Number(value) }
      } else if (key === 'price_max') {
        restored._price = { ...(restored._price || {}), max: Number(value) }
      } else if (key === 'inStock') {
        restored._inStock = value === '1'
      } else {
        // Обычные фильтры: может быть несколько значений через повторяющиеся params
        if (!restored[key]) restored[key] = []
        restored[key].push(value)
      }
    }
    if (searchParams.has('sort')) {
      setSortOrder(searchParams.get('sort'))
    }
    const hasFilters = Object.keys(restored).length > 0
    if (hasFilters) {
      setActiveFilters(restored)
      setAppliedFilters(restored)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Синхронизация appliedFilters и sortOrder в URL
  const syncFiltersToUrl = useCallback((newApplied, newSort) => {
    const params = new URLSearchParams()
    const page = parseInt(searchParams.get('PAGEN_1') || '1', 10)
    if (page > 1) params.set('PAGEN_1', page)
    if (newSort) params.set('sort', newSort)
    for (const [key, values] of Object.entries(newApplied)) {
      if (key === '_price') {
        if (values?.min !== undefined) params.set('price_min', values.min)
        if (values?.max !== undefined) params.set('price_max', values.max)
      } else if (key === '_inStock') {
        if (values) params.set('inStock', '1')
      } else if (Array.isArray(values)) {
        values.forEach(v => params.append(key, v))
      }
    }
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  // Применить фильтры
  const applyFilters = useCallback(() => {
    const newApplied = { ...activeFilters }
    setAppliedFilters(newApplied)
    setFiltersOpen(false)
    setFloatingBtnPos(null)
    syncFiltersToUrl(newApplied, sortOrder)
  }, [activeFilters, sortOrder, syncFiltersToUrl])

  // Выравнивание высоты заголовков товаров
  useMatchHeight('.catalog__main-title', [products, loading])

  // Получение закешированных детей категории
  const getCachedChildren = async (parentId) => {
    if (childrenCache.has(parentId)) return childrenCache.get(parentId)
    const resp = await getCategoryById(parentId)
    const children = resp.data.result || []
    childrenCache.set(parentId, children)
    return children
  }

  // Получение закешированных категорий первого уровня
  const getCachedMainCategories = async () => {
    if (cachedMainCategories) return cachedMainCategories
    const resp = await getCategoryFirst()
    cachedMainCategories = resp.data.result || []
    return cachedMainCategories
  }

  // Поиск категории по code с кешированием промежуточных результатов
  const findCategory = async (code) => {
    if (categoryCache.has(code)) return categoryCache.get(code)

    try {
      const categoryByCodeResponse = await getCategoryByCode(code)
      
      if (categoryByCodeResponse.data.result.error !== 0) {
        return null
      }

      const category = categoryByCodeResponse.data.result
      const mainCategories = await getCachedMainCategories()
      
      // Уровень 1?
      if (mainCategories.some(cat => cat.id == category.id)) {
        const result = { category, path: [] }
        categoryCache.set(code, result)
        return result
      }
      
      // Уровень 2? — ищем параллельно во всех level-1
      const level2Results = await Promise.all(
        mainCategories.map(async (mainCat) => {
          try {
            const children = await getCachedChildren(mainCat.id)
            if (children.some(sub => sub.id == category.id)) {
              return { id: mainCat.id, name: mainCat.name, code: mainCat.code }
            }
            return null
          } catch { return null }
        })
      )
      const parent = level2Results.find(p => p !== null)
      
      if (parent) {
        const result = { category, path: [parent] }
        categoryCache.set(code, result)
        return result
      }
      
      // Уровень 3? — ищем в подкатегориях уровня 2
      for (const mainCat of mainCategories) {
        try {
          const level2Cats = await getCachedChildren(mainCat.id)
          const level3Results = await Promise.all(
            level2Cats.map(async (l2) => {
              try {
                const level3Cats = await getCachedChildren(l2.id)
                if (level3Cats.some(cat => cat.id == category.id)) {
                  return {
                    mainCat: { id: mainCat.id, name: mainCat.name, code: mainCat.code },
                    level2Cat: { id: l2.id, name: l2.name, code: l2.code }
                  }
                }
                return null
              } catch { return null }
            })
          )
          const found = level3Results.find(r => r !== null)
          if (found) {
            const result = { category, path: [found.mainCat, found.level2Cat] }
            categoryCache.set(code, result)
            return result
          }
        } catch { /* skip */ }
      }
      
      // Не определён уровень
      const result = { category, path: [] }
      categoryCache.set(code, result)
      return result
    } catch (error) {
      console.error('Ошибка поиска категории:', error)
      return null
    }
  }

  // Сброс состояния при смене категории
  useEffect(() => {
    // Если SSR предоставил данные для этого маршрута — пропускаем первый сброс
    if (ssrResetGuard.current) {
      ssrResetGuard.current = false
      return
    }
    setLoading(true)
    setProducts([])
    setSubcategories([])
    setFilters(null)
    setIsProductListPage(false)
    setTotalPages(1)
    setMainCategory(null)
    setChildSubcategories([])
    setActiveFilters({})
    setAppliedFilters({})
    setFloatingBtnPos(null)
    filtersInitRef.current = false
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
    // Если SSR предоставил данные для этого маршрута — пропускаем первый запрос
    if (ssrFetchGuard.current) {
      ssrFetchGuard.current = false
      return
    }

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
        
        // Всегда запрашиваем дочерние подкатегории текущей категории
        const childrenResponse = await getCategoryById(foundCategory.id, { signal: abortControllerRef.current.signal })
        const childrenData = childrenResponse.data.result || []

        if (level === 0 && childrenData.length > 0) {
          // УРОВЕНЬ 1 с подкатегориями: показыва сетку подкатегорий
          subcatsData = childrenData
          setSubcategories(subcatsData)
          setChildSubcategories([])
          setProducts([])
          setTotalPages(1)
          showProductList = false
          needProducts = false
          
        } else {
          // УРОВЕНЬ 2+ или категория без дочерних: показываем товары
          setSubcategories([])
          setChildSubcategories(childrenData)
          showProductList = true
          needProducts = true
        }
        
        setIsProductListPage(showProductList)
        
        // Загрузка фильтров
        if (needProducts) {
          try {
            const filtersResponse = await getFilters(foundCategory.id, { signal: abortControllerRef.current.signal })
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
          // Собираем фильтры для API
          const filterParams = []
          for (const [key, values] of Object.entries(appliedFilters)) {
            if (key.startsWith('_')) continue
            if (!values || !values.length) continue
            // API поддерживает одно значение на ключ (берёт последнее)
            // Если выбрано одно значение — отправляем. Если несколько — не отправляем (фильтруем клиентски)
            if (values.length === 1) {
              filterParams.push(`${key}=${values[0]}`)
            }
          }

          const productParams = { cat: foundCategory.id, page: currentPage, prods: 20, sort: sortOrder }
          if (filterParams.length > 0) {
            productParams.filters = filterParams
          }

          const productsResponse = await getProductList(
            productParams,
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
  }, [categoryId, currentPage, sortOrder, appliedFilters])

  // Мемоизация кнопок пагинации
  const paginationButtons = useMemo(() => {
    if (totalPages <= 1) return null
    
    const pages = []
    const showEllipsisStart = currentPage > 3
    const showEllipsisEnd = currentPage < totalPages - 2
    
    const getPageUrl = (page) => {
      const params = new URLSearchParams(searchParams)
      if (page <= 1) {
        params.delete('PAGEN_1')
      } else {
        params.set('PAGEN_1', page)
      }
      const qs = params.toString()
      return qs ? `${location.pathname}?${qs}` : location.pathname
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
  }, [currentPage, totalPages, location.pathname, searchParams])

  // === ЛОГИКА ФИЛЬТРОВ ===
  // Показ плавающей кнопки рядом с изменённым элементом
  const showFloatingBtn = useCallback((e) => {
    if (!filtersAsideRef.current) return
    const target = e?.target || e?.currentTarget
    if (!target) return
    const aside = filtersAsideRef.current
    const asideRect = aside.getBoundingClientRect()
    const targetRect = target.closest('.filter')?.getBoundingClientRect() || target.getBoundingClientRect()
    setFloatingBtnPos(targetRect.bottom - asideRect.top + aside.scrollTop + 8)
  }, [])

  const handleFilterChange = useCallback((filterKey, value, checked, e) => {
    setActiveFilters(prev => {
      const current = prev[filterKey] || []
      const next = checked
        ? [...current, value]
        : current.filter(v => v !== value)
      return { ...prev, [filterKey]: next }
    })
    if (e) showFloatingBtn(e)
  }, [showFloatingBtn])

  const handlePriceChange = useCallback((field, value) => {
    setActiveFilters(prev => ({
      ...prev,
      _price: { ...(prev._price || {}), [field]: value === '' ? undefined : Number(value) }
    }))
  }, [])

  const handleInStockChange = useCallback((checked) => {
    setActiveFilters(prev => ({ ...prev, _inStock: checked }))
  }, [])

  const handleResetFilters = useCallback(() => {
    setActiveFilters({})
    setAppliedFilters({})
    setFloatingBtnPos(null)
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  // Фильтрация товаров на клиенте (цена, наличие, мультизначения)
  const filteredProducts = useMemo(() => {
    if (!products.length) return products

    // Мультизначные CODE-фильтры (не отправленные в API)
    const multiValueFilters = {}
    for (const [key, values] of Object.entries(appliedFilters)) {
      if (key.startsWith('_')) continue
      if (values && values.length > 1) {
        multiValueFilters[key] = values
      }
    }

    const hasPrice = appliedFilters._price && (appliedFilters._price.min !== undefined || appliedFilters._price.max !== undefined)
    const hasInStock = appliedFilters._inStock === true
    const hasMultiValue = Object.keys(multiValueFilters).length > 0

    if (!hasPrice && !hasInStock && !hasMultiValue) return products

    return products.filter(product => {
      // Фильтр по цене
      if (hasPrice) {
        const price = parseFloat(product.price)
        if (appliedFilters._price.min !== undefined && price < appliedFilters._price.min) return false
        if (appliedFilters._price.max !== undefined && price > appliedFilters._price.max) return false
      }
      // Фильтр «В наличии»
      if (hasInStock) {
        const hasStore = product.store && Array.isArray(product.store) &&
          product.store.some(s => parseInt(s.AMOUNT) > 0)
        const inStock = product.inStock !== undefined ? product.inStock : hasStore
        if (!inStock) return false
      }
      // Мультизначные фильтры — клиентская фильтрация по свойствам товара
      if (hasMultiValue && product.properties) {
        for (const [code, allowedValues] of Object.entries(multiValueFilters)) {
          const prop = product.properties.find(p => p.CODE === code)
          if (prop && !allowedValues.includes(prop.VALUE)) return false
        }
      }
      return true
    })
  }, [products, appliedFilters])

  // Категория не найдена (загрузка завершена, но данных нет)
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

  // Показываем заглушку пока категория загружается
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

  return (
    <>
      <Helmet>
        <title>{mainCategory.name} - TopDisk</title>
        <meta name="description" content={`Купить ${mainCategory.name} в интернет-магазине TopDisk`} />
      </Helmet>
      {(() => {
        const path = `/category/${mainCategory.code}/`
        const crumbs = [
          { name: 'Главная', url: '/' },
          { name: 'Каталог', url: '/catalog/' },
          ...breadcrumbsPath.map((c) => ({ name: decodeHtml(c.name), url: `/category/${c.code}/` })),
          { name: decodeHtml(mainCategory.name) },
        ]
        const breadcrumbs = breadcrumbSchema(crumbs)
        const itemList = isProductListPage ? itemListSchema(products, {
          name: decodeHtml(mainCategory.name),
        }) : null
        const collection = collectionPageSchema({
          name: decodeHtml(mainCategory.name),
          description: `Купить ${decodeHtml(mainCategory.name)} в интернет-магазине TopDisk`,
          path,
          breadcrumbs,
          itemList,
        })
        return <JsonLd data={[collection, breadcrumbs, itemList]} />
      })()}

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
                <Link className="breadcrumbs-link" to={`/category/${crumb.code}/`}>{decodeHtml(crumb.name)}</Link>
              </li>
            ))}
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">{decodeHtml(mainCategory.name)}</span>
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
              <h1 className="subcategory__title">{decodeHtml(mainCategory.name)}</h1>

              {subcategories.length > 0 && (
                <div className="subcategory__grid">
                  {subcategories.map((subcat, index) => (
                    <Link 
                      key={subcat.id} 
                      to={`/category/${subcat.code}/`}
                      className={`subcategory__card ${index === 6 ? 'subcategory__card--xl' : ''}`}
                      style={{ '--pic': `url(${subcat.ico})` }}
                    >
                      <span className="subcategory__name" dangerouslySetInnerHTML={{ __html: sanitizeHtml(subcat.name.replace(/\s/g, '<br />')) }} />
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
                    {filteredProducts.map(product => (
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
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(categoryDescription) }} 
                />
              </div>
            </section>
          )}
        </>
      ) : (
        /* УРОВЕНЬ 2: СПИСОК ТОВАРОВ С ФИЛЬТРАМИ */
        <div className="catalog">
          <div className="container">
            <h1>{decodeHtml(mainCategory.name)}</h1>
            <div className="catalog__row">
              {/* ФИЛЬТРЫ */}
              <aside ref={filtersAsideRef} className={`catalog__filters${filtersOpen ? ' is-open' : ' mobile-hidden'}`} data-filters style={{ position: 'relative' }}>
                <div className="desktop-hidden filters-title">
                  Фильтры
                  <button className="filters-close" type="button" onClick={() => setFiltersOpen(false)}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
                
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
                    const filterKey = filterData.CODE || filterData.ID || String(index)
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
                                  <input className="price-input" type="number" min="0" step="1"
                                    value={activeFilters._price?.min ?? ''}
                                    onChange={(e) => handlePriceChange('min', e.target.value)}
                                    placeholder="0" />
                                  <span className="price-dash">—</span>
                                  <input className="price-input" type="number" min="0" step="1"
                                    value={activeFilters._price?.max ?? ''}
                                    onChange={(e) => handlePriceChange('max', e.target.value)}
                                    placeholder="∞" />
                                </div>
                                {/* В наличии под ценой */}
                                <div style={{ marginTop: '16px' }}>
                                  <label className="filter-checkbox">
                                    <input type="checkbox"
                                      checked={activeFilters._inStock ?? false}
                                      onChange={(e) => handleInStockChange(e.target.checked)} />
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
                                        checked={(activeFilters[filterKey] || []).includes(displayValue)}
                                        onChange={(e) => {
                                          handleFilterChange(filterKey, displayValue, e.target.checked, e)
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
                                          <input id={inputId} type="checkbox"
                                            checked={(activeFilters[filterKey] || []).includes(displayValue)}
                                            onChange={(e) => handleFilterChange(filterKey, displayValue, e.target.checked, e)} />
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
                                        <input type="checkbox"
                                          checked={(activeFilters[filterKey] || []).includes(displayValue)}
                                          onChange={(e) => handleFilterChange(filterKey, displayValue, e.target.checked, e)} />
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
                  <button className="filter__button filters__apply" type="button" onClick={applyFilters}>
                    Применить
                  </button>
                  <button className="filter__button filters__reset" type="button" onClick={() => { handleResetFilters(); setFiltersOpen(false) }}>
                    Сбросить
                  </button>
                </div>

                {/* Плавающая кнопка Применить */}
                {floatingBtnPos !== null && (
                  <button
                    className="filter__floating-apply"
                    type="button"
                    style={{ top: floatingBtnPos }}
                    onClick={applyFilters}
                  >
                    Применить
                  </button>
                )}
              </aside>

              {/* СПИСОК ТОВАРОВ */}
              <div className="catalog__main">
                {/* Дочерние подкатегории текущей категории */}
                {childSubcategories.length > 0 && (
                  <div className="catalog__main-bars">
                    {childSubcategories.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/category/${sub.code}/`}
                        className="catalog__main-bar"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
                {/* Открыть фильтры на мобильном */}
                <button className="catalog__filters-btn desktop-hidden" onClick={() => setFiltersOpen(true)}>
                  Фильтры
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 4h14M4 9h10M6 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Сортировка */}
                <div className="catalog__controls">
                  <select
                    className="catalog__sort"
                    value={sortOrder}
                    onChange={(e) => {
                      const val = e.target.value
                      setSortOrder(val)
                      syncFiltersToUrl(appliedFilters, val)
                    }}
                  >
                    <option value="">Популярное</option>
                    <option value="new">Новинки</option>
                    <option value="price_asc">Дешевле</option>
                    <option value="price_desc">Дороже</option>
                  </select>
                </div>

                {/* Товары */}
                <div className="catalog__main-list">
                  {loading && filteredProducts.length === 0 ? (
                    <div className="catalog__loading">Загрузка товаров...</div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
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
                        to={(() => { const p = new URLSearchParams(searchParams); if (currentPage <= 2) p.delete('PAGEN_1'); else p.set('PAGEN_1', currentPage - 1); const qs = p.toString(); return qs ? `${location.pathname}?${qs}` : location.pathname })()}
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
                        to={(() => { const p = new URLSearchParams(searchParams); p.set('PAGEN_1', currentPage + 1); return `${location.pathname}?${p.toString()}` })()}
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
