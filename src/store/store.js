import { configureStore } from '@reduxjs/toolkit'
import categoriesReducer from './slices/categoriesSlice'
import productsReducer from './slices/productsSlice'
import cartReducer from './slices/cartSlice'
import authReducer from './slices/authSlice'
import compareReducer from './slices/compareSlice'
import favoritesReducer from './slices/favoritesSlice'
import userReducer from './slices/userSlice'
import checkoutReducer from './slices/checkoutSlice'

export const store = configureStore({
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

export default store
