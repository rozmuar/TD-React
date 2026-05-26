import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import App from './App'
import categoriesReducer from './store/slices/categoriesSlice'
import productsReducer from './store/slices/productsSlice'
import cartReducer from './store/slices/cartSlice'
import authReducer from './store/slices/authSlice'
import compareReducer from './store/slices/compareSlice'
import favoritesReducer from './store/slices/favoritesSlice'
import userReducer from './store/slices/userSlice'
import checkoutReducer from './store/slices/checkoutSlice'

// Создаём свежий store для каждого SSR-запроса (без localStorage)
function createSSRStore() {
  return configureStore({
    reducer: {
      categories: categoriesReducer,
      products: productsReducer,
      cart: cartReducer,
      auth: authReducer,
      compare: compareReducer,
      favorites: favoritesReducer,
      user: userReducer,
      checkout: checkoutReducer,
    },
  })
}

export function render(url) {
  const helmetContext = {}
  const store = createSSRStore()

  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={url}>
        <App helmetContext={helmetContext} />
      </StaticRouter>
    </Provider>
  )

  const { helmet } = helmetContext
  return { html, helmet }
}
