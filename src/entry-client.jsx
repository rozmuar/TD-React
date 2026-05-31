import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SSRDataContext } from './context/SSRDataContext'
import { store } from './store/store'
import { injectStore } from './services/apiClient'
import { fetchFavorites } from './store/slices/favoritesSlice'
import { fetchServerCart } from './store/slices/cartSlice'
import { getGuestFuserId } from './services/apiClient'
import './styles/normalize.css'
import './styles/bootstrap-grid.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import './styles/style.css'

// Передаём store в apiClient для обработки 401
injectStore(store)

// Если пользователь авторизован — загружаем избранное и серверную корзину.
// Для гостей с сохранённым fuser_id тоже подтягиваем корзину с сервера.
if (store.getState().auth.isAuthenticated) {
  store.dispatch(fetchFavorites())
  store.dispatch(fetchServerCart())
} else if (getGuestFuserId()) {
  store.dispatch(fetchServerCart())
}

// Читаем данные, инжектированные сервером, для точного совпадения при гидратации
const ssrData = window.__SSR_DATA__ || null

// hydrateRoot подхватывает SSR-разметку без повторного рендера DOM
hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
    <SSRDataContext.Provider value={ssrData}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </SSRDataContext.Provider>
  </React.StrictMode>
)
