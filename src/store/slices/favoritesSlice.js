import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getFavorites, addFavorite, deleteFavorite } from '../../services/apiClient'

const LOCAL_KEY = 'favorite_items'

function getLocal() {
  return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
}

function saveLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

function isAuth() {
  return !!localStorage.getItem('auth_token')
}

const SITE_ORIGIN = 'https://topdisc.ru'

function resolveImage(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return SITE_ORIGIN + url
}

// Загрузить избранное из API (при авторизации)
export const fetchFavorites = createAsyncThunk(
  'favorites/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getFavorites()
      const list = res.data?.favorites || res.data?.message?.data || res.data?.message || []
      const items = Array.isArray(list)
        ? list
        : Object.values(list).filter((v) => v && typeof v === 'object')
      return items.map((item) => ({
        id: Number(item.product_id || item.ID || item.id),
        name: item.name || item.NAME || '',
        code: item.code || item.CODE || '',
        section_code: item.section_code || item.SECTION_CODE || '',
        image: resolveImage(item.imageUrl || item.PREVIEW_PICTURE || item.image),
        price: Number(item.price || item.PRICE || 0),
        oldPrice: Number(item.oldPrice || item.OLD_PRICE || 0),
      }))
    } catch (e) {
      return rejectWithValue(e.message)
    }
  }
)

// Добавить в избранное (API + localStorage)
export const toggleFavorite = createAsyncThunk(
  'favorites/toggle',
  async (product, { getState }) => {
    const { favorites } = getState()
    const exists = favorites.items.some((i) => i.id === product.id)

    if (exists) {
      if (isAuth()) {
        try { await deleteFavorite(product.id) } catch {}
      }
      return { action: 'remove', id: product.id }
    } else {
      if (isAuth()) {
        try { await addFavorite(product.id) } catch {}
      }
      return { action: 'add', product }
    }
  }
)

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: getLocal(),
    loading: false,
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = []
      localStorage.removeItem(LOCAL_KEY)
    },
    setFavoriteItems: (state, action) => {
      state.items = action.payload
      saveLocal(state.items)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false
        const apiItems = action.payload
        const localItems = getLocal()
        // Мержим: API — приоритет, потом локальные без дубликатов
        const seen = new Set()
        const merged = []
        for (const item of apiItems) {
          const nid = Number(item.id)
          if (!seen.has(nid)) {
            seen.add(nid)
            merged.push({ ...item, id: nid })
          }
        }
        for (const li of localItems) {
          const nid = Number(li.id)
          if (!seen.has(nid)) {
            seen.add(nid)
            merged.push({ ...li, id: nid })
            // Синхронизируем новые локальные в API
            if (isAuth()) {
              addFavorite(nid).catch(() => {})
            }
          }
        }
        state.items = merged
        saveLocal(merged)
      })
      .addCase(fetchFavorites.rejected, (state) => {
        state.loading = false
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { action: act, id, product } = action.payload
        if (act === 'remove') {
          state.items = state.items.filter((i) => i.id !== id)
        } else if (act === 'add' && !state.items.find((i) => i.id === product.id)) {
          state.items.push(product)
        }
        saveLocal(state.items)
      })
  },
})

export const { clearFavorites, setFavoriteItems } = favoritesSlice.actions
export default favoritesSlice.reducer
