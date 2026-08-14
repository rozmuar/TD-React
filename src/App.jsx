import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Home from './pages/Home/Home'
import Catalog from './pages/Catalog/Catalog'
import Category from './pages/Category/Category'
import Product from './pages/Product/Product'
import NewsList from './pages/NewsList/NewsList'
import NewsDetail from './pages/NewsDetail/NewsDetail'
import NotFound from './pages/NotFound/NotFound'
import BrandList from './pages/Brands/BrandList'
import BrandProducts from './pages/Brands/BrandProducts'
import Compare from './pages/Compare/Compare'
import Favorites from './pages/Favorites/Favorites'
import Cart from './pages/Cart/Cart'
import Checkout from './pages/Cart/Checkout'
import OrderSuccess from './pages/Cart/OrderSuccess'
import InfoLayout from './pages/Info/InfoLayout'
import About from './pages/Info/About'
import Contacts from './pages/Info/Contacts'
import Delivery from './pages/Info/Delivery'
import Payment from './pages/Info/Payment'
import Suppliers from './pages/Info/Suppliers'
import Wholesale from './pages/Info/Wholesale'
import Bonus from './pages/Info/Bonus'
import PersonalService from './pages/Info/PersonalService'
import Exchange from './pages/Info/Exchange'
import TradeIn from './pages/Info/TradeIn'
import LowPrice from './pages/Info/LowPrice'
import PlatnyyRemont from './pages/Info/PlatnyyRemont'
import Rules from './pages/Info/Rules'
import Privacy from './pages/Info/Privacy'
import Oferta from './pages/Info/Oferta'

const PersonalLayout = lazy(() => import('./pages/Personal/PersonalLayout'))
const PersonalHome = lazy(() => import('./pages/Personal/PersonalHome'))
const PersonalInfo = lazy(() => import('./pages/Personal/PersonalInfo'))
const PersonalLoyalty = lazy(() => import('./pages/Personal/PersonalLoyalty'))
const PersonalOrders = lazy(() => import('./pages/Personal/PersonalOrders'))
const PersonalAddresses = lazy(() => import('./pages/Personal/PersonalAddresses'))

function App({ helmetContext }) {
  return (
    <HelmetProvider context={helmetContext}>
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog/" element={<Catalog />} />
        <Route path="company/news/" element={<NewsList />} />
        <Route path="company/news/:newsCode/" element={<NewsDetail />} />
        <Route path="category/:categoryId/" element={<Category />} />
        <Route path="category/premium/:categoryId/" element={<Category />} />
        <Route path="catalog/:categoryId/" element={<Category />} />
        <Route path="catalog_oth/:categoryId/" element={<Category />} />
        <Route path="catalog/:categoryCode/:productCode/" element={<Product />} />
        <Route path="catalog_oth/:categoryCode/:productCode/" element={<Product />} />
        <Route path="compare/" element={<Compare />} />
        <Route path="favorites/" element={<Favorites />} />
        <Route path="brands/" element={<BrandList />} />
        <Route path="brands/:brandCode/" element={<BrandProducts />} />
        <Route path="cart/" element={<Cart />} />
        <Route path="cart/checkout/" element={<Checkout />} />
        <Route path="cart/success/" element={<OrderSuccess />} />
        <Route element={<InfoLayout />}>
          <Route path="o-nas/" element={<About />} />
          <Route path="contacts/" element={<Contacts />} />
          <Route path="suppliers/" element={<Suppliers />} />
          <Route path="opt/" element={<Wholesale />} />
          <Route path="dostavka/" element={<Delivery />} />
          <Route path="payment/" element={<Payment />} />
          <Route path="bonus/" element={<Bonus />} />
          <Route path="personal-service/" element={<PersonalService />} />
          <Route path="obmen-i-vozvraty/" element={<Exchange />} />
          <Route path="tradein/" element={<TradeIn />} />
          <Route path="garantiya-nizkoy-tseny/" element={<LowPrice />} />
          <Route path="platnyy-remont/" element={<PlatnyyRemont />} />
          <Route path="pravila/" element={<Rules />} />
          <Route path="politika-konfidentsialnosti/" element={<Privacy />} />
          <Route path="dogovor-oferty/" element={<Oferta />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="personal/" element={<Suspense fallback={<div />}><PersonalLayout /></Suspense>}>
            <Route index element={<Suspense fallback={<div />}><PersonalHome /></Suspense>} />
            <Route path="info/" element={<Suspense fallback={<div />}><PersonalInfo /></Suspense>} />
            <Route path="loyalty/" element={<Suspense fallback={<div />}><PersonalLoyalty /></Suspense>} />
            <Route path="orders/" element={<Suspense fallback={<div />}><PersonalOrders /></Suspense>} />
            <Route path="addresses/" element={<Suspense fallback={<div />}><PersonalAddresses /></Suspense>} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </HelmetProvider>
  )
}

export default App
