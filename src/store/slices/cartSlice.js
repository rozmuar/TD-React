import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getServerBasket,
  addToServerBasket,
  deleteServerBasketItem,
  mergeBasket,
  getGuestFuserId,
  clearGuestFuserId,
  getProductById,
} from '../../services/apiClient'

const LOCAL_KEY = 'cart_items'
const SITE_ORIGIN = 'https://topdisc.ru'

function resolveImage(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : SITE_ORIGIN + url
}

function loadCart() {
  if (typeof window === 'undefined') return { items: [], totalAmount: 0, totalCount: 0, serverTotalPrice: null }
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_KEY))
    if (data && Array.isArray(data.items)) {
      return {
        items: data.items,
        totalAmount: data.totalAmount || 0,
        totalCount: data.totalCount || 0,
        serverTotalPrice: data.serverTotalPrice ?? null,
      }
    }
  } catch {}
  return { items: [], totalAmount: 0, totalCount: 0, serverTotalPrice: null }
}

function saveCart(state) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY, JSON.stringify({
    items: state.items,
    totalAmount: state.totalAmount,
    totalCount: state.totalCount,
    serverTotalPrice: state.serverTotalPrice,
  }))
}

function recalcTotals(state) {
  state.totalAmount = state.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  state.totalCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
}

function mapServerItem(item) {
  return {
    id: Number(item.product_id || item.ID || item.id),
    name: item.name || item.NAME || '',
    code: item.code || item.CODE || item.product_code || '',
    section_code: item.section_code || item.SECTION_CODE || item.category_code || '',
    price: Number(item.price || item.PRICE || 0),
    oldPrice: item.old_price ?? item.oldPrice ?? item.OLD_PRICE ?? null,
    quantity: Number(item.quantity || item.QUANTITY || 1),
    image: resolveImage(item.imageUrl || item.image || item.PREVIEW_PICTURE || ''),
    selected: true,
  }
}

const saved = loadCart()

// Серверная корзина (/sale/basket) не возвращает code/section_code товара —
// без них ссылка на карточку товара в корзине ведёт в никуда. Дотягиваем
// эти поля отдельным запросом по id, как и для картинок в PersonalOrders.
async function enrichMissingCodes(items) {
  const missing = items.filter((i) => i.id && (!i.code || !i.section_code))
  if (!missing.length) return items
  const details = await Promise.all(
    missing.map((i) =>
      getProductById(i.id)
        .then((res) => res.data?.result || res.data?.data || null)
        .catch(() => null)
    )
  )
  const byId = new Map(missing.map((item, idx) => [item.id, details[idx]]))
  return items.map((item) => {
    const detail = byId.get(item.id)
    if (!detail) return item
    return {
      ...item,
      code: item.code || detail.code || '',
      section_code: item.section_code || detail.category_code || detail.section_code || '',
    }
  })
}

// ============================================================
// Thunks
// ============================================================

export const fetchServerCart = createAsyncThunk(
  'cart/fetchServerCart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getServerBasket()
      const data = res.data?.basket || res.data?.data || []
      const items = Array.isArray(data) ? data : []
      return {
        items: await enrichMissingCodes(items.map(mapServerItem)),
        serverTotalPrice: res.data?.total_price ?? null,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки корзины')
    }
  }
)

export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuestCart',
  async (_, { rejectWithValue }) => {
    try {
      const guestFuserId = getGuestFuserId()
      if (!guestFuserId) {
        return rejectWithValue('Guest fuser_id not found')
      }
      const res = await mergeBasket(guestFuserId)
      clearGuestFuserId()
      const data = res.data?.basket || res.data?.data?.basket || []
      const items = Array.isArray(data) ? data : []
      return {
        items: await enrichMissingCodes(items.map(mapServerItem)),
        serverTotalPrice: res.data?.total_price ?? null,
        skippedProductIds: Array.isArray(res.data?.skipped_product_ids) ? res.data.skipped_product_ids : [],
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка слияния корзин')
    }
  }
)

// Public thunks: оптимистичное обновление + серверный вызов.
// На ошибку — откатываемся через fetchServerCart.
export const addToCart = (product, quantity = 1) => async (dispatch) => {
  if (!product || !product.id) return
  const qty = Math.max(1, Math.floor(Number(quantity) || 1))
  dispatch(cartSlice.actions._addItemLocal({ product, quantity: qty }))
  try {
    await addToServerBasket(product.id, qty)
  } catch (e) {
    console.warn('[CART] addToCart server error:', e?.message)
    dispatch(fetchServerCart())
  }
}

export const removeFromCart = (productId) => async (dispatch) => {
  if (!productId) return
  dispatch(cartSlice.actions._removeItemLocal(productId))
  try {
    await deleteServerBasketItem(productId, 'full')
  } catch (e) {
    console.warn('[CART] removeFromCart server error:', e?.message)
    dispatch(fetchServerCart())
  }
}

export const incrementQuantity = (productId) => async (dispatch) => {
  if (!productId) return
  dispatch(cartSlice.actions._incQtyLocal(productId))
  try {
    await addToServerBasket(productId, 1)
  } catch (e) {
    console.warn('[CART] incrementQuantity server error:', e?.message)
    dispatch(fetchServerCart())
  }
}

export const decrementQuantity = (productId) => async (dispatch, getState) => {
  if (!productId) return
  const item = getState().cart.items.find((i) => i.id === productId)
  if (!item || item.quantity <= 1) return
  dispatch(cartSlice.actions._decQtyLocal(productId))
  try {
    await deleteServerBasketItem(productId, 'decrement')
  } catch (e) {
    console.warn('[CART] decrementQuantity server error:', e?.message)
    dispatch(fetchServerCart())
  }
}

export const removeSelected = () => async (dispatch, getState) => {
  const selected = getState().cart.items.filter((i) => i.selected !== false)
  if (!selected.length) return
  dispatch(cartSlice.actions._removeSelectedLocal())
  let hadError = false
  for (const item of selected) {
    try {
      await deleteServerBasketItem(item.id, 'full')
    } catch (e) {
      hadError = true
      console.warn('[CART] removeSelected server error for', item.id, e?.message)
    }
  }
  if (hadError) dispatch(fetchServerCart())
}

// ============================================================
// Slice
// ============================================================

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: saved.items,
    totalAmount: saved.totalAmount,
    totalCount: saved.totalCount,
    serverTotalPrice: saved.serverTotalPrice,
    loading: false,
    error: null,
    skippedProductIds: [],
  },
  reducers: {
    _addItemLocal: (state, action) => {
      const { product, quantity } = action.payload
      const existing = state.items.find((i) => i.id === product.id)
      if (existing) {
        existing.quantity += quantity
      } else {
        state.items.push({
          id: product.id,
          name: product.name || '',
          code: product.code || '',
          section_code: product.section_code || '',
          price: Number(product.price) || 0,
          oldPrice: product.oldPrice ?? null,
          image: product.image || '',
          quantity,
          selected: true,
        })
      }
      recalcTotals(state)
      saveCart(state)
    },
    _removeItemLocal: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
      recalcTotals(state)
      saveCart(state)
    },
    _removeSelectedLocal: (state) => {
      state.items = state.items.filter((i) => i.selected === false)
      recalcTotals(state)
      saveCart(state)
    },
    _incQtyLocal: (state, action) => {
      const item = state.items.find((i) => i.id === action.payload)
      if (item) {
        item.quantity += 1
        recalcTotals(state)
        saveCart(state)
      }
    },
    _decQtyLocal: (state, action) => {
      const item = state.items.find((i) => i.id === action.payload)
      if (item && item.quantity > 1) {
        item.quantity -= 1
        recalcTotals(state)
        saveCart(state)
      }
    },
    toggleItemSelected: (state, action) => {
      const item = state.items.find((i) => i.id === action.payload)
      if (item) item.selected = !item.selected
      saveCart(state)
    },
    selectAll: (state, action) => {
      state.items.forEach((i) => { i.selected = action.payload })
      saveCart(state)
    },
    clearCart: (state) => {
      state.items = []
      state.totalAmount = 0
      state.totalCount = 0
      state.serverTotalPrice = null
      state.skippedProductIds = []
      state.error = null
      if (typeof window !== 'undefined') localStorage.removeItem(LOCAL_KEY)
    },
    setCartItems: (state, action) => {
      state.items = action.payload
      recalcTotals(state)
      saveCart(state)
    },
    clearError: (state) => {
      state.error = null
    },
    clearSkipped: (state) => {
      state.skippedProductIds = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServerCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchServerCart.fulfilled, (state, action) => {
        state.loading = false
        const prevSelected = new Map(state.items.map((i) => [i.id, i.selected]))
        state.items = action.payload.items.map((i) => ({
          ...i,
          selected: prevSelected.has(i.id) ? prevSelected.get(i.id) : true,
        }))
        state.serverTotalPrice = action.payload.serverTotalPrice
        recalcTotals(state)
        saveCart(state)
      })
      .addCase(fetchServerCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(mergeGuestCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.serverTotalPrice = action.payload.serverTotalPrice
        state.skippedProductIds = action.payload.skippedProductIds || []
        recalcTotals(state)
        saveCart(state)
      })
      .addCase(mergeGuestCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  toggleItemSelected,
  selectAll,
  clearCart,
  setCartItems,
  clearError,
  clearSkipped,
} = cartSlice.actions
export default cartSlice.reducer
