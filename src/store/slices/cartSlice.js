import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getServerBasket,
  addToServerBasket,
  deleteServerBasketItem,
  mergeBasket,
  syncCartToServer,
  getGuestFuserId,
  clearGuestFuserId,
} from '../../services/apiClient'

const LOCAL_KEY = 'cart_items'

function loadCart() {
  if (typeof window === 'undefined') return { items: [], totalAmount: 0, totalCount: 0 }
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

// Загрузка корзины с сервера
export const fetchServerCart = createAsyncThunk(
  'cart/fetchServerCart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getServerBasket()
      console.log('[CART] fetchServerCart raw response:', res.data)
      const data = res.data?.basket || res.data?.data || []
      const items = Array.isArray(data) ? data : []
      console.log('[CART] fetchServerCart items count:', items.length)
      return items.map(item => ({
        id: Number(item.product_id || item.ID || item.id),
        name: item.name || item.NAME || '',
        price: Number(item.price || item.PRICE || 0),
        quantity: Number(item.quantity || item.QUANTITY || 1),
        image: item.image || item.PREVIEW_PICTURE || '',
        selected: true,
      }))
    } catch (error) {
      console.error('[CART] fetchServerCart error:', error?.response?.data || error?.message)
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки корзины')
    }
  }
)

// Добавление товара в серверную корзину
export const addToServerCart = createAsyncThunk(
  'cart/addToServerCart',
  async ({ product, quantity = 1 }, { rejectWithValue }) => {
    try {
      await addToServerBasket(product.id, quantity)
      return { product, quantity }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка добавления товара')
    }
  }
)

// Удаление товара из серверной корзины
export const removeFromServerCart = createAsyncThunk(
  'cart/removeFromServerCart',
  async (productId, { rejectWithValue }) => {
    try {
      await deleteServerBasketItem(productId, 'full')
      return productId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления товара')
    }
  }
)

// Синхронизация локальной корзины на сервер
export const syncLocalCartToServer = createAsyncThunk(
  'cart/syncLocalCartToServer',
  async (items, { rejectWithValue }) => {
    try {
      await syncCartToServer(items)
      return true
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка синхронизации')
    }
  }
)

// Слияние гостевой корзины с авторизованной
export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuestCart',
  async (_, { rejectWithValue }) => {
    try {
      const guestFuserId = getGuestFuserId()
      console.log('[CART] mergeGuestCart → guestFuserId:', guestFuserId)
      if (!guestFuserId) {
        throw new Error('Guest fuser_id not found')
      }
      const res = await mergeBasket(guestFuserId)
      clearGuestFuserId()
      console.log('[CART] mergeGuestCart raw response:', res.data)
      const data = res.data?.basket || res.data?.data?.basket || []
      const items = Array.isArray(data) ? data : []
      return items.map(item => ({
        id: Number(item.product_id || item.ID || item.id),
        name: item.name || item.NAME || '',
        price: Number(item.price || item.PRICE || 0),
        quantity: Number(item.quantity || item.QUANTITY || 1),
        image: item.image || item.PREVIEW_PICTURE || '',
        selected: true,
      }))
    } catch (error) {
      console.error('[CART] mergeGuestCart error:', error?.response?.data || error?.message)
      return rejectWithValue(error.response?.data?.message || 'Ошибка слияния корзин')
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: saved.items,
    totalAmount: saved.totalAmount,
    totalCount: saved.totalCount,
    loading: false,
    error: null,
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
      state.error = null
      localStorage.removeItem(LOCAL_KEY)
    },
    setCartItems: (state, action) => {
      state.items = action.payload
      state.totalAmount = action.payload.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
      state.totalCount = action.payload.reduce((sum, item) => sum + item.quantity, 0)
      saveCart(state)
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Загрузка корзины с сервера
      .addCase(fetchServerCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchServerCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.totalAmount = action.payload.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
        state.totalCount = action.payload.reduce((sum, item) => sum + item.quantity, 0)
        saveCart(state)
      })
      .addCase(fetchServerCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Добавление в серверную корзину
      .addCase(addToServerCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addToServerCart.fulfilled, (state, action) => {
        state.loading = false
        const { product, quantity } = action.payload
        const existingItem = state.items.find(item => item.id === product.id)
        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          state.items.push({ ...product, quantity, selected: true })
        }
        state.totalCount += quantity
        state.totalAmount += Number(product.price) * quantity
        saveCart(state)
      })
      .addCase(addToServerCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Удаление из серверной корзины
      .addCase(removeFromServerCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(removeFromServerCart.fulfilled, (state, action) => {
        state.loading = false
        const itemIndex = state.items.findIndex(item => item.id === action.payload)
        if (itemIndex !== -1) {
          const item = state.items[itemIndex]
          state.totalAmount -= Number(item.price) * item.quantity
          state.totalCount -= item.quantity
          state.items.splice(itemIndex, 1)
        }
        saveCart(state)
      })
      .addCase(removeFromServerCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Синхронизация на сервер
      .addCase(syncLocalCartToServer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(syncLocalCartToServer.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(syncLocalCartToServer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Слияние корзин
      .addCase(mergeGuestCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.totalAmount = action.payload.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
        state.totalCount = action.payload.reduce((sum, item) => sum + item.quantity, 0)
        saveCart(state)
      })
      .addCase(mergeGuestCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
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
  clearCart,
  setCartItems,
  clearError,
} = cartSlice.actions
export default cartSlice.reducer
