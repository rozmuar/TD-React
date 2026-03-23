import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { store } from './store/store'
import { fetchFavorites } from './store/slices/favoritesSlice'
import './styles/normalize.css'
import './styles/bootstrap-grid.css'
import './styles/style.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Если пользователь авторизован — загружаем избранное из API
if (store.getState().auth.isAuthenticated) {
  store.dispatch(fetchFavorites())
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

// Используем hydrate для pre-rendered контента, иначе render
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}
