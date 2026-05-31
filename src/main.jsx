import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
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

// Передаём store в apiClient для обработки 401 (автологаут при протухшем токене)
injectStore(store)

// Если пользователь авторизован — загружаем избранное и серверную корзину.
// Для гостей с сохранённым fuser_id тоже подтягиваем корзину с сервера.
if (store.getState().auth.isAuthenticated) {
  store.dispatch(fetchFavorites())
  store.dispatch(fetchServerCart())
} else if (getGuestFuserId()) {
  store.dispatch(fetchServerCart())
}

const rootElement = document.getElementById('root')
const app = (
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)

// Всегда createRoot — hydrate вызывает mismatch из-за динамического контента
rootElement.innerHTML = ''
createRoot(rootElement).render(app)
