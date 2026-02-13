import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalAmount: 0,
    totalCount: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({ ...action.payload, quantity: 1 })
      }
      state.totalCount += 1
      state.totalAmount += action.payload.price
    },
    removeFromCart: (state, action) => {
      const itemIndex = state.items.findIndex(item => item.id === action.payload)
      if (itemIndex !== -1) {
        const item = state.items[itemIndex]
        state.totalAmount -= item.price * item.quantity
        state.totalCount -= item.quantity
        state.items.splice(itemIndex, 1)
      }
    },
    incrementQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload)
      if (item) {
        item.quantity += 1
        state.totalCount += 1
        state.totalAmount += item.price
      }
    },
    decrementQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload)
      if (item && item.quantity > 1) {
        item.quantity -= 1
        state.totalCount -= 1
        state.totalAmount -= item.price
      }
    },
    clearCart: (state) => {
      state.items = []
      state.totalAmount = 0
      state.totalCount = 0
    },
  },
})

export const { 
  addToCart, 
  removeFromCart, 
  incrementQuantity, 
  decrementQuantity, 
  clearCart 
} = cartSlice.actions
export default cartSlice.reducer
