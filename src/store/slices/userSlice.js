import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getOrders,
  getOrderById,
} from '../../services/apiClient'

const initialState = {
  addresses: [],
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
}

// Загрузка адресов пользователя
export const fetchUserAddresses = createAsyncThunk(
  'user/fetchUserAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getUserAddresses()
      const addresses = res.data?.data || res.data?.addresses || res.data || []
      return Array.isArray(addresses) ? addresses : []
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки адресов')
    }
  }
)

// Добавление адреса
export const createAddress = createAsyncThunk(
  'user/createAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const res = await addUserAddress(addressData)
      return res.data?.data || res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка добавления адреса')
    }
  }
)

// Обновление адреса
export const editAddress = createAsyncThunk(
  'user/editAddress',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateUserAddress(id, data)
      return { id, data: res.data?.data || res.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления адреса')
    }
  }
)

// Удаление адреса
export const removeAddress = createAsyncThunk(
  'user/removeAddress',
  async (id, { rejectWithValue }) => {
    try {
      await deleteUserAddress(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка удаления адреса')
    }
  }
)

// Загрузка заказов пользователя
export const fetchUserOrders = createAsyncThunk(
  'user/fetchUserOrders',
  async (params, { rejectWithValue }) => {
    try {
      const res = await getOrders(params)
      const orders = res.data?.data || res.data?.orders || res.data || []
      return Array.isArray(orders) ? orders : []
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заказов')
    }
  }
)

// Загрузка детальной информации о заказе
export const fetchOrderDetails = createAsyncThunk(
  'user/fetchOrderDetails',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await getOrderById(orderId)
      return res.data?.data || res.data?.order || res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки заказа')
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearOrders: (state) => {
      state.orders = []
      state.currentOrder = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Загрузка адресов
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.loading = false
        state.addresses = action.payload
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Добавление адреса
      .addCase(createAddress.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.loading = false
        state.addresses.push(action.payload)
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Обновление адреса
      .addCase(editAddress.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(editAddress.fulfilled, (state, action) => {
        state.loading = false
        const index = state.addresses.findIndex(addr => addr.id === action.payload.id)
        if (index !== -1) {
          state.addresses[index] = { ...state.addresses[index], ...action.payload.data }
        }
      })
      .addCase(editAddress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Удаление адреса
      .addCase(removeAddress.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(removeAddress.fulfilled, (state, action) => {
        state.loading = false
        state.addresses = state.addresses.filter(addr => addr.id !== action.payload)
      })
      .addCase(removeAddress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Загрузка заказов
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Загрузка деталей заказа
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearOrders } = userSlice.actions
export default userSlice.reducer
