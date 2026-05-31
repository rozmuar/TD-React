import { useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { clearFavorites } from '../../store/slices/favoritesSlice'
import { clearCart } from '../../store/slices/cartSlice'
import { userLogout, deleteFavorite, clearGuestFuserId } from '../../services/apiClient'

function PersonalLayout() {
  const { isAuthenticated } = useSelector((s) => s.auth)
  const { items: favItems } = useSelector((s) => s.favorites)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const handleLogout = async () => {
    try { await userLogout() } catch {}
    // Удаляем избранное с сервера (best-effort)
    await Promise.allSettled(
      favItems.map((item) => deleteFavorite(item.id).catch(() => {}))
    )
    dispatch(clearFavorites())
    dispatch(clearCart())
    clearGuestFuserId()
    dispatch(logout())
    navigate('/')
  }

  if (!isAuthenticated) return null

  return (
    <section className="personal">
      <div className="container">
        <ul className="breadcrumbs-list">
          <li className="breadcrumbs-item"><Link className="breadcrumbs-link" to="/">Главная</Link></li>
          <li className="breadcrumbs-item">Личный кабинет</li>
        </ul>

        <h1 className="personal__title">Личный кабинет</h1>

        <div className="personal__grid">
          <aside className="personal__sidebar">
            <nav className="personal__nav">
              <NavLink to="/personal/" end className={({ isActive }) => 'personal__nav-link' + (isActive ? ' personal__nav-link--active' : '')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Главная
              </NavLink>
              <NavLink to="/personal/info/" className={({ isActive }) => 'personal__nav-link' + (isActive ? ' personal__nav-link--active' : '')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Личная информация
              </NavLink>
              <NavLink to="/personal/loyalty/" className={({ isActive }) => 'personal__nav-link' + (isActive ? ' personal__nav-link--active' : '')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                Система лояльности
              </NavLink>
              <NavLink to="/personal/orders/" className={({ isActive }) => 'personal__nav-link' + (isActive ? ' personal__nav-link--active' : '')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                История заказов
              </NavLink>
              <button className="personal__nav-link personal__nav-link--logout" onClick={handleLogout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Выйти
              </button>
            </nav>
          </aside>

          <main className="personal__content">
            <Outlet />
          </main>
        </div>
      </div>
    </section>
  )
}

export default PersonalLayout
