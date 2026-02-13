import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import axios from 'axios'

function Catalog() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e/app_mobile.categoryFirst.json')
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
        <title>Каталог товаров - TopDisk</title>
        <meta name="description" content="Каталог товаров интернет-магазина TopDisk. Смартфоны, бытовая техника, электроника, компьютеры и многое другое." />
        <meta property="og:title" content="Каталог товаров - TopDisk" />
      </Helmet>
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
            <div className="catalog__grid">
              <div style={{padding: '20px'}}>Загрузка категорий...</div>
            </div>
          ) : categories.length === 0 ? (
            <div className="catalog__grid">
              <div style={{padding: '20px'}}>Нет доступных категорий</div>
            </div>
          ) : (
            <div className="catalog__grid">
              {categories.map((category, index) => (
                <Link 
                  key={category.id} 
                  to={`/category/${category.code}/`} 
                  className={`catalog__card ${index === 0 ? 'catalog__card--xl' : ''}`}
                  style={{ '--pic': `url(${category.ico})` }}
                >
                  <span className="catalog__name" dangerouslySetInnerHTML={{ __html: category.name.replace(/\s/g, ' ') }} />
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
