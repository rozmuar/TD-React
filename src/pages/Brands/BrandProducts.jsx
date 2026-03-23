import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getBrandProducts } from '../../services/apiClient'
import ProductCard from '../../components/ProductCard/ProductCard'
import { useMatchHeight } from '../../hooks/useMatchHeight'
import { decodeHtml } from '../../utils/decodeHtml'

function BrandProducts() {
  const { brandCode } = useParams()
  const [searchParams] = useSearchParams()
  const currentPage = parseInt(searchParams.get('PAGEN_1')) || 1

  const [brand, setBrand] = useState(null)
  const [products, setProducts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || '')

  useMatchHeight('.catalog__main-title', [products, loading])

  useEffect(() => {
    const controller = new AbortController()

    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = { brand_code: brandCode, page: currentPage, prods: 20 }
        if (sortOrder) params.sort = sortOrder

        const response = await getBrandProducts(params, { signal: controller.signal })
        const result = response.data.result

        setBrand(result.brand || null)
        setProducts(result.data || [])
        setTotalPages(parseInt(result.pagination?.total_pages) || 1)
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Ошибка загрузки товаров бренда:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    return () => controller.abort()
  }, [brandCode, currentPage, sortOrder])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const handleSortChange = (e) => {
    setSortOrder(e.target.value)
  }

  const brandName = brand ? decodeHtml(brand.name) : brandCode

  const getPageUrl = (page) => {
    const params = new URLSearchParams(searchParams)
    if (page <= 1) params.delete('PAGEN_1')
    else params.set('PAGEN_1', page)
    if (sortOrder) params.set('sort', sortOrder)
    const qs = params.toString()
    return qs ? `/brands/${brandCode}/?${qs}` : `/brands/${brandCode}/`
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const showEllipsisStart = currentPage > 3
    const showEllipsisEnd = currentPage < totalPages - 2

    pages.push(
      <Link key={1} to={getPageUrl(1)} className={`pagination__btn${currentPage === 1 ? ' active' : ''}`}>1</Link>
    )

    if (showEllipsisStart) {
      pages.push(<span key="es" className="pagination__ellipsis">...</span>)
    }

    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)

    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <Link key={page} to={getPageUrl(page)} className={`pagination__btn${currentPage === page ? ' active' : ''}`}>{page}</Link>
      )
    }

    if (showEllipsisEnd) {
      pages.push(<span key="ee" className="pagination__ellipsis">...</span>)
    }

    if (totalPages > 1) {
      pages.push(
        <Link key={totalPages} to={getPageUrl(totalPages)} className={`pagination__btn${currentPage === totalPages ? ' active' : ''}`}>{totalPages}</Link>
      )
    }

    return (
      <div className="pagination">
        {currentPage > 1 ? (
          <Link to={getPageUrl(currentPage - 1)} className="pagination__btn pagination__btn--prev" aria-label="Предыдущая страница">←</Link>
        ) : (
          <span className="pagination__btn pagination__btn--prev pagination__btn--disabled">←</span>
        )}
        {pages}
        {currentPage < totalPages ? (
          <Link to={getPageUrl(currentPage + 1)} className="pagination__btn pagination__btn--next" aria-label="Следующая страница">→</Link>
        ) : (
          <span className="pagination__btn pagination__btn--next pagination__btn--disabled">→</span>
        )}
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{brandName} — купить в TopDisk</title>
        <meta name="description" content={`Товары бренда ${brandName} в интернет-магазине TopDisk. Выгодные цены, быстрая доставка.`} />
      </Helmet>

      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/brands/">Бренды</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">{brandName}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="catalog">
        <div className="container">
          <h1>{brandName}</h1>

          <div className="catalog__controls">
            <select className="catalog__sort" value={sortOrder} onChange={handleSortChange}>
              <option value="">Популярное</option>
              <option value="new">Новинки</option>
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
            </select>
          </div>

          <div className="catalog__main-list">
            {loading && products.length === 0 ? (
              <div className="catalog__loading">Загрузка товаров...</div>
            ) : products.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="brand-empty">
                <svg className="brand-empty__icon" width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="38" stroke="#E0E0E0" strokeWidth="2" />
                  <path d="M28 44c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#BFBFBF" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="32" cy="34" r="2.5" fill="#BFBFBF" />
                  <circle cx="48" cy="34" r="2.5" fill="#BFBFBF" />
                </svg>
                <p className="brand-empty__title">Товары скоро появятся</p>
                <p className="brand-empty__text">Мы уже работаем над пополнением ассортимента этого бренда</p>
                <Link to="/brands/" className="brand-empty__btn">Ко всем брендам</Link>
              </div>
            )}
          </div>

          {renderPagination()}
        </div>
      </div>
    </>
  )
}

export default BrandProducts
