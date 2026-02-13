import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

function Header() {
  const cartCount = useSelector((state) => state.cart.totalCount)

  return (
    <header className="header">
      <div className="container">
        {/* ВЕРХНЯЯ ПОЛОСА */}
        <div className="header__top">
          <div className="header__row">
            {/* Навигация слева */}
            <nav className="header__nav">
              <ul className="header__nav-list">
                <li className="header__nav-item"><Link to="/about/">О компании</Link></li>
                <li className="header__nav-item"><a href="#">Поставщикам</a></li>
                <li className="header__nav-item"><Link to="/delivery/">Доставка и оплата</Link></li>
                <li className="header__nav-item"><a href="#">Трейд-ин</a></li>
                <li className="header__nav-item"><a href="#">Возврат</a></li>
                <li className="header__nav-item"><Link to="/contacts/">Контакты</Link></li>
              </ul>
            </nav>

            {/* «Обратный звонок» + телефон */}
            <div className="header__contacts">
              <a href="#" className="header__callback">Обратный звонок</a>
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
            <Link to="/catalog/" className="header__catalog">
              <span className="header__catalog-icon">
                <img src="/img/header/burger.png" alt="Каталог" />
              </span>
              <span className="header__catalog-text">Каталог</span>
            </Link>

            {/* Поиск */}
            <form className="header__search" onSubmit={(e) => e.preventDefault()}>
              <button className="header__search-btn" aria-label="Найти"></button>
              <input type="search" className="header__search-input" placeholder="Поиск по каталогу" />
            </form>

            {/* Иконки действий справа */}
            <ul className="header__actions">
              <li className="header__action header__action--account">
                <Link to="/profile/" aria-label="Кабинет">
                  <img src="/img/header/user.png" alt="Кабинет" />
                  <span>Кабинет</span>
                </Link>
              </li>
              <li className="header__action header__action--compare">
                <Link to="/compare/" aria-label="Сравнение">
                  <img src="/img/header/ves.png" alt="Сравнение" />
                  <span>Сравнение</span>
                </Link>
              </li>
              <li className="header__action header__action--favorite">
                <Link to="/favorites/" aria-label="Избранное">
                  <img src="/img/header/heart.png" alt="Избранное" />
                  <span>Избранное</span>
                </Link>
              </li>
              <li className="header__action header__action--cart">
                <Link to="/cart/" aria-label="Корзина">
                  <img src="/img/header/cart.png" alt="Корзина" />
                  <span>Корзина</span>
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
