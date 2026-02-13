import { configureStore } from '@reduxjs/toolkit'
import categoriesReducer from './slices/categoriesSlice'
import productsReducer from './slices/productsSlice'
import cartReducer from './slices/cartSlice'

export const store = configureStore({
  reducer: {
    categories: categoriesReducer,
    products: productsReducer,
    cart: cartReducer,
  },
})

export default store
