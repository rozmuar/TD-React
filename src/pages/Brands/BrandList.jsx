import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getBrandList } from '../../services/apiClient'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'

function BrandList() {
  const [searchParams] = useSearchParams()
  const currentPage = parseInt(searchParams.get('PAGEN_1')) || 1

  const [brands, setBrands] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchBrands = async () => {
      setLoading(true)
      try {
        const response = await getBrandList(currentPage, { signal: controller.signal })
        const result = response.data.result
        setBrands(result.data || [])
        setTotalPages(parseInt(result.pagination?.total_pages) || 1)
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Ошибка загрузки брендов:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
    return () => controller.abort()
  }, [currentPage])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const filtered = search
    ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands

  const getPageUrl = (page) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('PAGEN_1', page)
    const qs = params.toString()
    return qs ? `/brands/?${qs}` : '/brands/'
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
        <title>Бренды — TopDisk</title>
        <meta name="description" content="Каталог брендов интернет-магазина TopDisk. Техника и электроника ведущих мировых производителей." />
      </Helmet>

      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">Бренды</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container">
        <h1>Бренды</h1>

        <div className="brands-search">
          <input
            type="text"
            className="brands-search__input"
            placeholder="Найти бренд..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="catalog__loading">Загрузка брендов...</div>
        ) : filtered.length > 0 ? (
          <div className="brands-grid">
            {filtered.map(brand => (
              <Link
                key={brand.id}
                to={brand.code ? `/brands/${brand.code}/` : '#'}
                className="brands-grid__item"
              >
                <div className="brands-grid__image">
                  <ImageWithFallback
                    src={brand.image}
                    alt={brand.name}
                  />
                </div>
                <div className="brands-grid__name">{brand.name}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="catalog__empty"><p>Бренды не найдены</p></div>
        )}

        {!search && renderPagination()}
      </div>
    </>
  )
}

export default BrandList
