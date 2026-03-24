import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const sidebarLinks = [
  { to: '/o-nas/', label: 'О компании' },
  { to: '/contacts/', label: 'Контакты' },
  { to: '/suppliers/', label: 'Поставщикам' },
  { to: '/opt/', label: 'Оптовикам' },
  { to: '/vacancy/', label: 'Вакансии' },
  { to: '/obmen-i-vozvraty/', label: 'Обмен и возврат' },
  { to: '/tradein/', label: 'Трейд-ин' },
  { to: '/dostavka/', label: 'Доставка' },
  { to: '/payment/', label: 'Оплата' },
  { to: '/club-card/', label: 'Клубная карта' },
  { to: '/low-price/', label: 'Гарантия низкой цены' },
  { to: '/pravila/', label: 'Правила продажи' },
  { to: '/politika-konfidentsialnosti/', label: 'Политика конфиденциальности' },
  { to: '/dogovor-oferty/', label: 'Публичная оферта' },
]

function InfoLayout() {
  const { pathname } = useLocation()
  const currentLink = sidebarLinks.find((l) => pathname.startsWith(l.to))
  const currentLabel = currentLink ? currentLink.label : ''

  return (
    <>
      <div className="breadcrumbs">
        <div className="container">
          <ul className="breadcrumbs-list">
            <li className="breadcrumbs-item">
              <Link className="breadcrumbs-link" to="/">Главная</Link>
            </li>
            <li className="breadcrumbs-item">
              <span className="breadcrumbs-link">{currentLabel}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container">
      <div className="page">
        <nav className="sidebar">
          <ul className="sidebar__list">
            {sidebarLinks.map((link) => (
              <li className="sidebar__item" key={link.to}>
                <NavLink
                  className={({ isActive }) =>
                    'sidebar__link' + (isActive ? ' sidebar__link--active' : '')
                  }
                  to={link.to}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="page__main">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  )
}

export default InfoLayout
