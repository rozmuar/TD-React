import { Outlet } from 'react-router-dom'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import JsonLd from '../JsonLd/JsonLd'
import Analytics from '../Analytics/Analytics'
import MaintenanceBanner from '../MaintenanceBanner/MaintenanceBanner'
import { organizationSchema, webSiteSchema } from '../../utils/jsonLd'

function Layout() {
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
