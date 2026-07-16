import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { removeFromCompare, clearCompare } from '../../store/slices/compareSlice'
import { getProductById } from '../../services/apiClient'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import { decodeHtml } from '../../utils/decodeHtml'
import AddToCartButton from '../../components/AddToCartButton/AddToCartButton'

function Compare() {
  const dispatch = useDispatch()
  const items = useSelector((s) => s.compare.items)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'diff'

  // Загружаем полные данные товаров (с properties)
  useEffect(() => {
    if (items.length === 0) {
      setProducts([])
      return
    }

    let cancelled = false
    async function loadProducts() {
      setLoading(true)
      const results = await Promise.allSettled(
        items.map((item) =>
          getProductById(item.id).then((res) => ({
            ...item,
            ...(res.data?.result || {}),
            properties: res.data?.result?.properties || [],
          }))
        )
      )
      if (cancelled) return
      setProducts(
        results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
      )
      setLoading(false)
    }
    loadProducts()
    return () => { cancelled = true }
  }, [items])

  // Собираем все уникальные свойства
  const allPropNames = []
  const seen = new Set()
  products.forEach((p) => {
    ;(p.properties || []).forEach((prop) => {
      if (prop.name && prop.name !== 'Галерея' && prop.name !== 'Артикул' && !seen.has(prop.name)) {
        seen.add(prop.name)
        allPropNames.push(prop.name)
      }
    })
  })

  // Фильтруем: только различия
  const filteredProps = filter === 'diff'
    ? allPropNames.filter((name) => {
        const values = products.map((p) => {
          const prop = p.properties?.find((pr) => pr.name === name)
          return prop?.value || '–'
        })
        return new Set(values).size > 1
      })
    : allPropNames

  const handleRemove = (id) => dispatch(removeFromCompare(id))
  const handleClear = () => dispatch(clearCompare())

  const formatPrice = (val) => {
    const n = Number(val)
    return isNaN(n) ? '—' : Math.floor(n).toLocaleString('ru-RU')
  }

  return (
    <>
      <Helmet>
        <title>Сравнение товаров — TopDisc</title>
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
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">Сравнение товаров</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="category-page">
        <div className="container">
          <h1 className="catalog__title">Сравнение товаров</h1>

          {items.length === 0 ? (
            <div className="compare__empty">
              <p>Нет товаров для сравнения.</p>
              <p>Добавьте товары, нажав на иконку <img src="/img/catalog/vesi.svg" alt="" className="compare__empty-icon" /> в карточке товара.</p>
            </div>
          ) : (
            <>
              {/* Товары */}
              <div className="compare__products">
                <div className="compare__products-scroll">
                {products.map((p) => (
                  <div className="compare__product" key={p.id}>
                    <button className="compare__product-remove" onClick={() => handleRemove(p.id)} aria-label="Убрать">×</button>
                    <Link to={`/catalog/${p.section_code}/${p.code}/`} className="compare__product-img">
                      <ImageWithFallback src={p.image} alt={decodeHtml(p.name)} />
                    </Link>
                    <Link to={`/catalog/${p.section_code}/${p.code}/`} className="compare__product-name">
                      {decodeHtml(p.name)}
                    </Link>
                    <div className="compare__product-prices">
                      <span className="compare__product-price">{formatPrice(p.price)} ₽</span>
                      {p.oldPrice && Number(p.oldPrice) > Number(p.price) && (
                        <span className="compare__product-old">{formatPrice(p.oldPrice)} ₽</span>
                      )}
                    </div>
                    <AddToCartButton product={p} className="compare__product-cart" />
                  </div>
                ))}

                {/* Слот «Добавить товар» */}
                <Link to="/catalog/" className="compare__product compare__product--add">
                  <div className="compare__add-icon">+</div>
                  <span>Добавить товар</span>
                </Link>
              </div>

              <div className="compare__actions">
                <button className="compare__clear" onClick={handleClear}>
                  Удалить все
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="compare__loading">Загрузка характеристик...</div>
            ) : products.length > 0 && filteredProps.length > 0 && (
              <div className="compare__specs">
                <div className="compare__specs-header">
                  <h2 className="compare__specs-title">Сравнение характеристик</h2>
                  <select className="compare__filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Все характеристики</option>
                    <option value="diff">Все различия</option>
                  </select>
                </div>

                <div className="compare__table">
                  {filteredProps.map((propName) => {
                    const values = products.map((p) => {
                      const prop = p.properties?.find((pr) => pr.name === propName)
                      return prop?.value || '–'
                    })
                    const isDiff = new Set(values).size > 1

                    return (
                      <div className={'compare__row' + (isDiff ? ' compare__row--diff' : '')} key={propName}>
                        <div className="compare__row-label">{decodeHtml(propName)}</div>
                        <div className="compare__row-values">
                          {values.map((val, i) => (
                            <div className="compare__row-value" key={i}>{decodeHtml(val)}</div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </>
  )
}

export default Compare
