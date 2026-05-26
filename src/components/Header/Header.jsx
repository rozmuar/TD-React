import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import AuthPopup from '../AuthPopup/AuthPopup'
import CatalogMenu from '../CatalogMenu/CatalogMenu'
import CallbackModal from '../CallbackModal/CallbackModal'

function Header() {
  const cartCount = useSelector((state) => state.cart.totalCount)
  const compareCount = useSelector((state) => state.compare.items.length)
  const favoritesCount = useSelector((state) => state.favorites.items.length)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [authOpen, setAuthOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [callbackOpen, setCallbackOpen] = useState(false)

  // Автоматически открываем модалку авторизации при редиректе с защищённой страницы
  useEffect(() => {
    if (location.state?.requireAuth && !isAuthenticated) {
      setAuthOpen(true)
      // Очищаем state после открытия модалки
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, isAuthenticated, location.pathname, navigate])

  const openAuth = useCallback(() => setAuthOpen(true), [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])
  const toggleCatalog = useCallback(() => setCatalogOpen(prev => !prev), [])
  const closeCatalog = useCallback(() => setCatalogOpen(false), [])

  return (
    <header className="header">
      <div className="container">
        {/* ВЕРХНЯЯ ПОЛОСА */}
        <div className="header__top">
          <div className="header__row">
            {/* Навигация слева */}
            <nav className="header__nav">
              <ul className="header__nav-list">
                <li className="header__nav-item"><Link to="/o-nas/">О компании</Link></li>
                <li className="header__nav-item"><Link to="/suppliers/">Поставщикам</Link></li>
                <li className="header__nav-item"><Link to="/dostavka/">Доставка и оплата</Link></li>
                <li className="header__nav-item"><Link to="/tradein/">Трейд-ин</Link></li>
                <li className="header__nav-item"><Link to="/obmen-i-vozvraty/">Возврат</Link></li>
                <li className="header__nav-item"><Link to="/contacts/">Контакты</Link></li>
              </ul>
            </nav>

            {/* «Обратный звонок» + телефон */}
            <div className="header__contacts">
              <a href="#" className="header__callback" onClick={(e) => { e.preventDefault(); setCallbackOpen(true) }}>Обратный звонок</a>
              <a href="tel:+78005002141" className="header__phone">8 (800) 500-21-41</a>
            </div>
          </div>
        </div>

        {/* НИЖНЯЯ ПОЛОСА */}
        <div className="header__bottom">
          <div className="header__row">
            {/* Логотип */}
            <Link to="/" className="header__logo">
              <img src="/img/header/logo.png" alt="logo" />
            </Link>

            {/* Каталог */}
            <button type="button" className={`header__catalog${catalogOpen ? ' is-active' : ''}`} onClick={toggleCatalog}>
              <span className="header__catalog-icon">
                {catalogOpen ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 4l10 10M14 4L4 14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <img src="/img/header/burger.png" alt="Каталог" />
                )}
              </span>
              <span className="header__catalog-text">Каталог</span>
            </button>

            {/* Поиск */}
            <form className="header__search" onSubmit={(e) => e.preventDefault()}>
              <button className="header__search-btn" aria-label="Найти"></button>
              <input type="search" className="header__search-input" placeholder="Поиск по каталогу" />
            </form>

            {/* Иконки действий справа */}
            <ul className="header__actions">
              <li className="header__action header__action--account">
                {isAuthenticated ? (
                  <Link to="/personal/" aria-label="Кабинет">
                    <img src="/img/header/user.png" alt="Кабинет" />
                    <span>Кабинет</span>
                  </Link>
                ) : (
                  <button type="button" className="header__action-btn" onClick={openAuth} aria-label="Войти">
                    <img src="/img/header/user.png" alt="Войти" />
                    <span>Войти</span>
                  </button>
                )}
              </li>
              <li className="header__action header__action--compare">
                <Link to="/compare/" aria-label="Сравнение">
                  <img src="/img/header/ves.png" alt="Сравнение" />
                  <span>Сравнение</span>
                  {compareCount > 0 && <span className="compare-count">{compareCount}</span>}
                </Link>
              </li>
              <li className="header__action header__action--favorite">
                <Link to="/favorites/" aria-label="Избранное">
                  <img src="/img/header/heart.png" alt="Избранное" />
                  <span>Избранное</span>
                  {favoritesCount > 0 && <span className="favorites-count">{favoritesCount}</span>}
                </Link>
              </li>
              <li className="header__action header__action--cart">
                <Link to="/cart/" aria-label="Корзина">
                  <img src="/img/footer/cart.svg" alt="Корзина" />
                  <span>Корзина</span>
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <CatalogMenu isOpen={catalogOpen} onClose={closeCatalog} />
      <AuthPopup isOpen={authOpen} onClose={closeAuth} />
      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
    </header>
  )
}

export default Header
