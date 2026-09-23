import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { fetchUserProfile } from '../../store/slices/authSlice'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import JsonLd from '../JsonLd/JsonLd'
import Analytics from '../Analytics/Analytics'
import MaintenanceBanner from '../MaintenanceBanner/MaintenanceBanner'
import { organizationSchema, webSiteSchema } from '../../utils/jsonLd'

function Layout() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)
  const hasUser = useSelector((s) => Boolean(s.auth.user))

  // Профиль нужен глобально: по нему определяется оптовик (is_wholesale) и цены
  useEffect(() => {
    if (isAuthenticated && !hasUser) dispatch(fetchUserProfile())
  }, [isAuthenticated, hasUser, dispatch])

  return (
    <>
      <JsonLd data={[organizationSchema(), webSiteSchema()]} />
      <Analytics />
      <MaintenanceBanner />
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

export default Layout
