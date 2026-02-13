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
        <Route path="catalog/:categoryCode/:productCode/" element={<Product />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </HelmetProvider>
  )
}

export default App
