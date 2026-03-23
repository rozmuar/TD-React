import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Catalog from './pages/Catalog/Catalog'
import Category from './pages/Category/Category'
import Product from './pages/Product/Product'
import NewsList from './pages/NewsList/NewsList'
import NewsDetail from './pages/NewsDetail/NewsDetail'
import NotFound from './pages/NotFound/NotFound'
import Compare from './pages/Compare/Compare'
import Favorites from './pages/Favorites/Favorites'
import Cart from './pages/Cart/Cart'
import Checkout from './pages/Cart/Checkout'
import OrderSuccess from './pages/Cart/OrderSuccess'

const PersonalLayout = lazy(() => import('./pages/Personal/PersonalLayout'))
const PersonalHome = lazy(() => import('./pages/Personal/PersonalHome'))
const PersonalInfo = lazy(() => import('./pages/Personal/PersonalInfo'))
const PersonalLoyalty = lazy(() => import('./pages/Personal/PersonalLoyalty'))
const PersonalOrders = lazy(() => import('./pages/Personal/PersonalOrders'))

function App() {
  return (
    <HelmetProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog/" element={<Catalog />} />
        <Route path="company/news/" element={<NewsList />} />
        <Route path="company/news/:newsCode/" element={<NewsDetail />} />
        <Route path="category/:categoryId/" element={<Category />} />
        <Route path="catalog/:categoryCode/" element={<Category />} />
        <Route path="catalog_oth/:categoryId/" element={<Category />} />
        <Route path="catalog/:categoryCode/:productCode/" element={<Product />} />
        <Route path="catalog_oth/:categoryCode/:productCode/" element={<Product />} />
        <Route path="compare/" element={<Compare />} />
        <Route path="favorites/" element={<Favorites />} />
        <Route path="cart/" element={<Cart />} />
        <Route path="cart/checkout/" element={<Checkout />} />
        <Route path="cart/success/" element={<OrderSuccess />} />
        <Route path="personal/" element={<Suspense fallback={<div />}><PersonalLayout /></Suspense>}>
          <Route index element={<Suspense fallback={<div />}><PersonalHome /></Suspense>} />
          <Route path="info/" element={<Suspense fallback={<div />}><PersonalInfo /></Suspense>} />
          <Route path="loyalty/" element={<Suspense fallback={<div />}><PersonalLoyalty /></Suspense>} />
          <Route path="orders/" element={<Suspense fallback={<div />}><PersonalOrders /></Suspense>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </HelmetProvider>
  )
}

export default App
