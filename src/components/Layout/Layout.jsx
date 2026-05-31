import { Outlet } from 'react-router-dom'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import JsonLd from '../JsonLd/JsonLd'
import { organizationSchema, webSiteSchema } from '../../utils/jsonLd'

function Layout() {
  return (
    <>
      <JsonLd data={[organizationSchema(), webSiteSchema()]} />
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

export default Layout
