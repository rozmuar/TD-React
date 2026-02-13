import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productsAPI } from '../../services/api'

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params) => {
    const response = await productsAPI.getAll(params)
    return response.data
  }
)

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId) => {
    const response = await productsAPI.getById(productId)
    return response.data
  }
)

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async (categoryId) => {
    const response = await productsAPI.getByCategory(categoryId)
    return response.data
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    currentProduct: null,
    loading: false,
    error: null,
    filters: {
      category: null,
      subcategory: null,
      priceRange: [0, 100000],
      brands: [],
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        category: null,
        subcategory: null,
        priceRange: [0, 100000],
        brands: [],
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false
        state.currentProduct = action.payload
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  },
})

export const { setFilters, clearFilters } = productsSlice.actions
export default productsSlice.reducer
