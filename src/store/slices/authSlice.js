import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  userLogout,
  tidInit,
  tidComplete,
} from '../../services/apiClient'

const TOKEN_KEY = 'auth_token'

// Проверяем exp-поле JWT не обращаясь к серверу
function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const storedToken = localStorage.getItem(TOKEN_KEY)
const tokenValid = storedToken && !isTokenExpired(storedToken)
// Сразу удаляем просроченный токен из localStorage
if (storedToken && !tokenValid) {
  localStorage.removeItem(TOKEN_KEY)
}

const initialState = {
  token: tokenValid ? storedToken : null,
  isAuthenticated: !!tokenValid,
  user: null,
  loading: false,
  error: null,
  tidSession: null,
}

// Загрузка профиля пользователя
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getUserProfile()
      const user = res.data?.data || res.data?.user || res.data
      return {
        id: user.id || user.ID,
        email: user.email || user.EMAIL,
        name: user.name || user.NAME,
        lastName: user.last_name || user.LAST_NAME,
        phone: user.phone || user.PERSONAL_PHONE,
        gender: user.gender || user.PERSONAL_GENDER,
        photo: user.photo || user.PERSONAL_PHOTO,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки профиля')
    }
  }
)

// Обновление профиля
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const res = await updateUserProfile(data)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка обновления профиля')
    }
  }
)

// Смена пароля
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async ({ oldPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const res = await changePassword(oldPassword, newPassword, confirmPassword)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка смены пароля')
    }
  }
)

// Инициализация T-ID авторизации
export const initTidAuth = createAsyncThunk(
  'auth/initTidAuth',
  async (phone, { rejectWithValue }) => {
    try {
      const res = await tidInit(phone)
      return {
        redirectUrl: res.data?.redirect_url || res.data?.data?.redirect_url,
        sessionId: res.data?.session_id || res.data?.data?.session_id,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка инициализации T-ID')
    }
  }
)

// Завершение T-ID авторизации
export const completeTidAuth = createAsyncThunk(
  'auth/completeTidAuth',
  async (code, { rejectWithValue }) => {
    try {
      const res = await tidComplete(code)
      const token = res.data?.message?.Authorization || res.data?.Authorization || res.data?.token
      if (!token) throw new Error('Токен не получен')
      return token
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка завершения T-ID авторизации')
    }
  }
)

// Логаут
export const performLogout = createAsyncThunk(
  'auth/performLogout',
  async (_, { rejectWithValue }) => {
    try {
      await userLogout()
    } catch (error) {
      console.warn('Logout API error:', error)
    }
    return null
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action) {
      const token = action.payload
      state.token = token
      state.isAuthenticated = true
      state.error = null
      localStorage.setItem(TOKEN_KEY, token)
    },
    logout(state) {
      state.token = null
      state.isAuthenticated = false
      state.user = null
      state.tidSession = null
      state.error = null
      localStorage.removeItem(TOKEN_KEY)
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Загрузка профиля
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Обновление профиля
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Смена пароля
      .addCase(updatePassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // T-ID init
      .addCase(initTidAuth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(initTidAuth.fulfilled, (state, action) => {
        state.loading = false
        state.tidSession = action.payload
      })
      .addCase(initTidAuth.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // T-ID complete
      .addCase(completeTidAuth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(completeTidAuth.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload
        state.isAuthenticated = true
        state.tidSession = null
        localStorage.setItem(TOKEN_KEY, action.payload)
      })
      .addCase(completeTidAuth.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.tidSession = null
      })
      // Logout
      .addCase(performLogout.fulfilled, (state) => {
        state.token = null
        state.isAuthenticated = false
        state.user = null
        state.tidSession = null
        state.error = null
        localStorage.removeItem(TOKEN_KEY)
      })
  },
})

export const { setToken, logout, clearError } = authSlice.actions
export default authSlice.reducer
