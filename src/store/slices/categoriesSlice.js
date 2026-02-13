import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { categoriesAPI } from '../../services/api'

export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await categoriesAPI.getAll()
    return response.data
  }
)

export const fetchCategoryById = createAsyncThunk(
  'categories/fetchCategoryById',
  async (categoryId) => {
    const response = await categoriesAPI.getById(categoryId)
    return response.data
  }
)

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    currentCategory: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false
        state.currentCategory = action.payload
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  },
})

export default categoriesSlice.reducer
