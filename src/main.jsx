import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { store } from './store/store'
import { fetchFavorites } from './store/slices/favoritesSlice'
import './styles/normalize.css'
import './styles/bootstrap-grid.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import './styles/style.css'

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

// Всегда createRoot — hydrate вызывает mismatch из-за динамического контента
rootElement.innerHTML = ''
createRoot(rootElement).render(app)
