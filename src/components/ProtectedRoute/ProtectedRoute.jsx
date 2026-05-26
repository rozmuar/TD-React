import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Сохраняем путь, куда пользователь пытался попасть
    return <Navigate to="/" state={{ from: location, requireAuth: true }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
