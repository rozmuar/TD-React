import { createSlice } from '@reduxjs/toolkit'

const LOCAL_KEY = 'cart_items'

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY))
    if (data && Array.isArray(data.items)) return data
  } catch {}
  return { items: [], totalAmount: 0, totalCount: 0 }
}

function saveCart(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify({
    items: state.items,
    totalAmount: state.totalAmount,
    totalCount: state.totalCount,
  }))
}

const saved = loadCart()

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: saved.items,
    totalAmount: saved.totalAmount,
    totalCount: saved.totalCount,
  },
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.items.push({ ...action.payload, quantity: 1, selected: true })
      }
      state.totalCount += 1
      state.totalAmount += Number(action.payload.price)
      saveCart(state)
    },
    removeFromCart: (state, action) => {
      const itemIndex = state.items.findIndex(item => item.id === action.payload)
      if (itemIndex !== -1) {
        const item = state.items[itemIndex]
        state.totalAmount -= Number(item.price) * item.quantity
        state.totalCount -= item.quantity
        state.items.splice(itemIndex, 1)
      }
      saveCart(state)
    },
    removeSelected: (state) => {
      const remaining = []
      for (const item of state.items) {
        if (item.selected) {
          state.totalAmount -= Number(item.price) * item.quantity
          state.totalCount -= item.quantity
        } else {
          remaining.push(item)
        }
      }
      state.items = remaining
      saveCart(state)
    },
    incrementQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload)
      if (item) {
        item.quantity += 1
        state.totalCount += 1
        state.totalAmount += Number(item.price)
      }
      saveCart(state)
    },
    decrementQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload)
      if (item && item.quantity > 1) {
        item.quantity -= 1
        state.totalCount -= 1
        state.totalAmount -= Number(item.price)
      }
      saveCart(state)
    },
    toggleItemSelected: (state, action) => {
      const item = state.items.find(item => item.id === action.payload)
      if (item) item.selected = !item.selected
      saveCart(state)
    },
    selectAll: (state, action) => {
      state.items.forEach(item => { item.selected = action.payload })
      saveCart(state)
    },
    clearCart: (state) => {
      state.items = []
      state.totalAmount = 0
      state.totalCount = 0
      localStorage.removeItem(LOCAL_KEY)
    },
  },
})

export const { 
  addToCart, 
  removeFromCart,
  removeSelected,
  incrementQuantity, 
  decrementQuantity, 
  toggleItemSelected,
  selectAll,
  clearCart 
} = cartSlice.actions
export default cartSlice.reducer
