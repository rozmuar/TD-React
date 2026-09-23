import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getCategoryFirst } from '../../services/apiClient'
import { sanitizeHtml } from '../../utils/sanitizeHtml'
import JsonLd from '../../components/JsonLd/JsonLd'
import { breadcrumbSchema, collectionPageSchema } from '../../utils/jsonLd'

// ── Skeleton-заглушка на время загрузки списка категорий ──
function CatalogSkeleton() {
  return (
    <div className="catalog__grid">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className={`catalog__card ${i === 0 ? 'catalog__card--xl' : ''}`}
          style={{ backgroundImage: 'none' }}
        >
          <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 18 }} />
        </div>
      ))}
    </div>
  )
}

function Catalog() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategoryFirst()
        setCategories(response.data.result || [])
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error)
      } finally {
        setLoading(false)
        // Флаг для prerender скрипта
        const root = document.getElementById('root')
        if (root) root.dataset.ready = 'true'
      }
    }

    fetchCategories()
  }, [])

  // Показываем скелетон во время загрузки вместо return null для SSG
  // if (loading && categories.length === 0) {
  //   return null
  // }

  return (
    <>
      <Helmet>
        <title>Каталог товаров - TopDisc</title>
        <meta name="description" content="Каталог товаров интернет-магазина TopDisc. Смартфоны, бытовая техника, электроника, компьютеры и многое другое." />
        <meta property="og:title" content="Каталог товаров - TopDisc" />
      </Helmet>
      <JsonLd data={[
        collectionPageSchema({
          name: 'Каталог товаров',
          description: 'Каталог товаров интернет-магазина TopDisc',
          path: '/catalog/',
          breadcrumbs: breadcrumbSchema([
            { name: 'Главная', url: '/' },
            { name: 'Каталог' },
          ]),
        }),
        breadcrumbSchema([
          { name: 'Главная', url: '/' },
          { name: 'Каталог' },
        ]),
      ]} />
      {/* ХЛЕБНЫЕ КРОШКИ */}
      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">Каталог</span>
            </li>
          </ul>
        </div>
      </div>

      {/* КАТАЛОГ - список всех категорий */}
      <div className="category-page">
        <div className="container">
          <h1 className="catalog__title">Каталог</h1>

          {loading ? (
            <CatalogSkeleton />
          ) : categories.length === 0 ? (
            <div className="catalog__grid">
              <div style={{padding: '20px'}}>Нет доступных категорий</div>
            </div>
          ) : (
            <div className="catalog__grid">
              {categories.map((category, index) => (
                <Link 
                  key={category.id} 
                  to={`/catalog/${category.code}/`}
                  className={`catalog__card ${index === 0 ? 'catalog__card--xl' : ''}`}
                  style={{ '--pic': `url(${category.ico})` }}
                >
                  <span className="catalog__name" dangerouslySetInnerHTML={{ __html: sanitizeHtml(category.name.replace(/\s/g, ' ')) }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Catalog
