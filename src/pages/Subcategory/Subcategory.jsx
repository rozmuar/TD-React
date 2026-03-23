import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '../../store/slices/productsSlice'
import { fetchCategories } from '../../store/slices/categoriesSlice'
import ProductCard from '../../components/ProductCard/ProductCard'
import { useMatchHeight } from '../../hooks/useMatchHeight'

function Subcategory() {
  const { subcategoryId } = useParams()
  const dispatch = useDispatch()
  const { items: products, loading } = useSelector((state) => state.products)
  const { items: categories } = useSelector((state) => state.categories)

  // Находим родительскую категорию и список подкатегорий
  const { parentCategory, siblingSubcategories } = useMemo(() => {
    for (const category of categories) {
      if (category.subcategories && category.subcategories.length > 0) {
        const found = category.subcategories.some(
          (sub) => String(sub.id) === String(subcategoryId)
        )
        if (found) {
          return {
            parentCategory: category,
            siblingSubcategories: category.subcategories,
          }
        }
      }
    }
    return { parentCategory: null, siblingSubcategories: [] }
  }, [categories, subcategoryId])

  // Выравнивание высоты заголовков товаров
  useMatchHeight('.catalog__main-title', [products, loading])

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchProducts({ subcategory: subcategoryId }))
  }, [dispatch, subcategoryId])

  useEffect(() => {
    if (!loading) {
      const root = document.getElementById('root')
      if (root) root.dataset.ready = 'true'
    }
  }, [loading])

  return (
    <>
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
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/category/1/">Смартфоны и гаджеты</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">Смартфоны</span>
            </li>
          </ul>
        </div>
      </div>

      {/* СПИСОК ТОВАРОВ С ФИЛЬТРАМИ */}
      <div className="catalog">
        <div className="container">
          <h1>Apple iPhone 15 Pro</h1>
          <div className="catalog__row">
            {/* ФИЛЬТРЫ */}
            <aside className="catalog__filters mobile-hidden" data-filters>
              <div className="desktop-hidden filters-title">Фильтры</div>
              
              {/* Цена */}
              <details className="filter" open>
                <summary className="filter__head">
                  <span>Цена, ₽</span>
                  <svg className="filter__arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="filter__body">
                  <div className="price-inputs">
                    <input className="price-input" type="number" min="0" step="1" defaultValue="0" placeholder="0" />
                    <span className="price-dash">—</span>
                    <input className="price-input" type="number" min="0" step="1" defaultValue="10" placeholder="10" />
                  </div>
                </div>
              </details>

              <div className="filter-divider"></div>

              {/* В наличии */}
              <label className="filter-checkbox">
                <input type="checkbox" defaultChecked />
                <span className="checkbox-custom"></span>
                <span>В наличии</span>
              </label>

              <div className="filter-divider"></div>

              {/* Бренд */}
              <details className="filter">
                <summary className="filter__head">
                  <span>Бренд</span>
                  <svg className="filter__arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <div className="filter__body">
                  <ul className="chips">
                    <li><input id="b1" type="checkbox" /><label htmlFor="b1">Apple</label></li>
                    <li><input id="b2" type="checkbox" /><label htmlFor="b2">ASUS</label></li>
                    <li><input id="b3" type="checkbox" /><label htmlFor="b3">BQ</label></li>
                    <li><input id="b4" type="checkbox" /><label htmlFor="b4">Digma</label></li>
                    <li><input id="b5" type="checkbox" /><label htmlFor="b5">HONOR</label></li>
                    <li><input id="b6" type="checkbox" /><label htmlFor="b6">Sony</label></li>
                    <li><input id="b7" type="checkbox" /><label htmlFor="b7">HUAWEI</label></li>
                    <li><input id="b8" type="checkbox" /><label htmlFor="b8">Realme</label></li>
                    <li><input id="b9" type="checkbox" /><label htmlFor="b9">Xiaomi</label></li>
                    <li><input id="b10" type="checkbox" /><label htmlFor="b10">Samsung</label></li>
                  </ul>
                </div>
              </details>

              <div className="filter-divider"></div>

              <div className="filters__actions">
                <button className="filter__button desktop-hidden filters__apply" type="button">Применить</button>
                <button className="filter__button filters__reset" type="button">Сбросить</button>
              </div>
            </aside>

            {/* ОСНОВНАЯ ЧАСТЬ */}
            <div className="catalog__main">
              {/* Список подкатегорий родительской категории */}
              {siblingSubcategories.length > 0 && (
                <div className="catalog__main-bars">
                  {siblingSubcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/subcategory/${sub.id}/`}
                      className={`catalog__main-bar${String(sub.id) === String(subcategoryId) ? ' active' : ''}`}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Панель сортировки и вида */}
              <div className="catalog__main-filters">
                <div className="catalog__main-select">
                  <button className="select__btn" type="button">
                    <span className="select__current">Популярное</span>
                    <svg className="select__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M10.3536 4.35355C10.5488 4.15829 10.5488 3.84171 10.3536 3.64645C10.1583 3.45118 9.84171 3.45118 9.64645 3.64645L10.3536 4.35355ZM6 8L5.64645 8.35355C5.84171 8.54882 6.15829 8.54882 6.35355 8.35355L6 8ZM2.35355 3.64645C2.15829 3.45118 1.84171 3.45118 1.64645 3.64645C1.45118 3.84171 1.45118 4.15829 1.64645 4.35355L2.35355 3.64645ZM9.64645 3.64645L5.64645 7.64645L6.35355 8.35355L10.3536 4.35355L9.64645 3.64645ZM6.35355 7.64645L2.35355 3.64645L1.64645 4.35355L5.64645 8.35355L6.35355 7.64645Z" fill="#5D5D5D" />
                    </svg>
                  </button>
                  <input className="select__value" type="hidden" name="sort" value="popular" />
                  <ul className="select__list">
                    <li className="select__option active" data-value="popular">Популярное</li>
                    <li className="select__option" data-value="new">Новинки</li>
                    <li className="select__option" data-value="price-asc">Дешевле</li>
                    <li className="select__option" data-value="price-desc">Дороже</li>
                  </ul>
                </div>

                <div className="catalog__main-views mobile-hidden">
                  <input className="view-input" type="radio" name="view" id="view-cards" defaultChecked />
                  <label className="view-btn view-btn--grid" htmlFor="view-cards" title="Вид карточками"></label>
                  <input className="view-input" type="radio" name="view" id="view-list" />
                  <label className="view-btn view-btn--list" htmlFor="view-list" title="Вид списком"></label>
                </div>

                <button className="desktop-hidden btn--filter" data-filters-open>
                  <div className="action-btn filter-ico"></div>Фильтры
                </button>
              </div>

              {/* Список товаров */}
              <div className="catalog__main-list">
                {loading ? (
                  <div style={{minHeight: '300px'}}></div>
                ) : (
                  products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </div>

              {/* Пагинация */}
              <div className="pagination">
                <button className="pagination__btn pagination__btn--prev" disabled>←</button>
                <button className="pagination__btn pagination__btn--page active">1</button>
                <button className="pagination__btn pagination__btn--page">2</button>
                <button className="pagination__btn pagination__btn--page">3</button>
                <button className="pagination__btn pagination__btn--next">→</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Subcategory
