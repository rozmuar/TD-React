import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getNewsList, getNewsDetail } from '../../services/apiClient'
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

function NewsDetail() {
  const { newsCode } = useParams()
  const navigate = useNavigate()
  
  const [newsItem, setNewsItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableOfContents, setTableOfContents] = useState([])

  // Функция для создания slug из текста для якорей
  const createSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^а-яёa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Функция для преобразования относительных URL в абсолютные и добавления ID к h2
  const processDetailText = (html) => {
    if (!html) return ''
    
    let counter = 0
    
    return html
      // Сначала заменяем относительные src у изображений на абсолютные
      .replace(/src="\/([^"]+)"/g, 'src="https://topdisc.ru/$1"')
      // Заменяем относительные href у ссылок на абсолютные
      .replace(/href="\/([^"]+)"/g, 'href="https://topdisc.ru/$1"')
      // Затем заменяем абсолютные href на topdisc.ru обратно на относительные
      .replace(/href="https:\/\/topdisc\.ru\/([^"]+)"/g, 'href="/$1"')
      // Добавляем ID к h2
      .replace(/<h2>(.*?)<\/h2>/g, (match, title) => {
        counter++
        const slug = `heading-${counter}-${createSlug(title.replace(/<[^>]*>/g, ''))}`
        return `<h2 id="${slug}">${title}</h2>`
      })
  }

  // Функция для извлечения оглавления из HTML
  const extractTableOfContents = (html) => {
    if (!html) return []
    
    const toc = []
    let counter = 0
    
    html.replace(/<h2>(.*?)<\/h2>/g, (match, title) => {
      counter++
      const cleanTitle = title.replace(/<[^>]*>/g, '')
      const slug = `heading-${counter}-${createSlug(cleanTitle)}`
      toc.push({ id: slug, title: cleanTitle })
      return match
    })
    
    return toc
  }

  // Функция плавного скролла к якорю
  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100 // Отступ сверху
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Сначала получаем список новостей, чтобы найти ID по code
        const listResponse = await getNewsList({ limit: 100, page: 1 })
        
        const newsListData = listResponse.data.result?.data || []
        const newsFromList = newsListData.find(item => item.code === newsCode)
        
        if (!newsFromList) {
          setError('Новость не найдена')
          setLoading(false)
          return
        }
        
        // Теперь получаем полную информацию о новости по ID
        const detailResponse = await getNewsDetail({ id: newsFromList.id })
        
        if (detailResponse.data.result) {
          setNewsItem(detailResponse.data.result)
          // Извлекаем оглавление после получения данных
          const toc = extractTableOfContents(detailResponse.data.result.detail_text)
          setTableOfContents(toc)
        } else {
          setError('Ошибка загрузки новости')
        }
      } catch (error) {
        console.error('Ошибка загрузки новости:', error)
        setError('Ошибка загрузки новости')
      } finally {
        setLoading(false)
      }
    }

    fetchNewsDetail()
  }, [newsCode])
// Обработчик кликов по ссылкам внутри контента для SPA навигации
  const handleContentClick = (e) => {
    const target = e.target.closest('a')
    if (!target) return

    const href = target.getAttribute('href')
    // Если это внутренняя относительная ссылка
    if (href && href.startsWith('/')) {
      e.preventDefault()
      navigate(href)
    }
  }

  
  if (loading) {
    return <div className="container">Загрузка...</div>
  }

  if (error || !newsItem) {
    return (
      <div className="container">
        <p>{error || 'Новость не найдена'}</p>
        <Link to="/company/news/">← Вернуться к списку новостей</Link>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{newsItem.name} - TopDisk</title>
        <meta name="description" content={newsItem.preview_text || newsItem.name} />
      </Helmet>

      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/company/news/">Новости</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">{newsItem.name}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container">
        <article className="news-detail">
          <h1 className="subcategory__title">{newsItem.name}</h1>
          
          {newsItem.date && (
            <time className="news-detail__date">{newsItem.date}</time>
          )}
          
          {newsItem.image && (
            <ImageWithFallback 
              className="news-detail__image" 
              src={newsItem.image} 
              alt={newsItem.name} 
            />
          )}

          {tableOfContents.length > 0 && (
            <nav className="news-detail__toc">
              <h3 className="news-detail__toc-title">Содержание статьи</h3>
              <ul className="news-detail__toc-list">
                {tableOfContents.map((item) => (
                  <li key={item.id} className="news-detail__toc-item">
                    <a 
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToHeading(item.id)
                      }}
                      className="news-detail__toc-link"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          
          {newsItem.detail_text && (
            <div 
              className="news-detail__content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(processDetailText(newsItem.detail_text)) }}
              onClick={handleContentClick}
            />
          )}
          
          <Link className="news-detail__back" to="/company/news/">
            ← Вернуться к списку новостей
          </Link>
        </article>
      </div>
    </>
  )
}

export default NewsDetail
