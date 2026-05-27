import { useEffect, useState, useMemo, useRef } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getNewsList } from '../../services/apiClient'
import { useMatchHeight } from '../../hooks/useMatchHeight'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import { useSSRData } from '../../context/SSRDataContext'

function NewsList() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const currentPage = parseInt(searchParams.get('PAGEN_1') || '1', 10)

  const ssrData = useSSRData()
  const ssrMatch = ssrData?.type === 'newsList'
  const ssrUsed = useRef(false)

  const [news, setNews] = useState(ssrMatch ? ssrData.news : [])
  const [totalPages, setTotalPages] = useState(ssrMatch ? ssrData.totalPages : 1)
  const [loading, setLoading] = useState(!ssrMatch)

  // Выравнивание высоты заголовков новостей
  useMatchHeight('.news-card__title', [news, loading])

  useEffect(() => {
    // Если SSR предоставил данные — пропускаем первый запрос
    if (ssrMatch && !ssrUsed.current) {
      ssrUsed.current = true
      return
    }
    ssrUsed.current = true

    const fetchNews = async () => {
      try {
        setLoading(true)
        const response = await getNewsList({ limit: 20, page: currentPage })
        
        if (response.data.result?.data) {
          setNews(response.data.result.data)
          const paginationData = response.data.result.pagination
          if (paginationData) {
            setTotalPages(parseInt(paginationData.total_pages) || 1)
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки новостей:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Мемоизация кнопок пагинации (как у товаров)
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

  if (loading && news.length === 0) {
    return <div className="container">Загрузка...</div>
  }

  return (
    <>
      <Helmet>
        <title>Новости - TopDisk</title>
        <meta name="description" content="Новости интернет-магазина TopDisk" />
      </Helmet>

      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">Новости</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container">
        <h1 className="subcategory__title">Новости</h1>

        <section className="news">
          <div className="news__list">
            {news.map((item) => (
              <Link 
                to={`/company/news/${item.code}/`} 
                className="news-card" 
                key={item.id}
              >
                <ImageWithFallback className="news-card__img" src={item.image} alt={item.name} />
                <h3 className="news-card__title">{item.name}</h3>
                <time className="news-card__date">{item.date}</time>
              </Link>
            ))}
          </div>

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
        </section>
      </div>
    </>
  )
}

export default NewsList
