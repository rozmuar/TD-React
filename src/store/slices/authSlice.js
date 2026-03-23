import { createSlice } from '@reduxjs/toolkit'

const TOKEN_KEY = 'auth_token'

const initialState = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action) {
      state.token = action.payload
      state.isAuthenticated = true
      localStorage.setItem(TOKEN_KEY, action.payload)
    },
    logout(state) {
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem(TOKEN_KEY)
    },
  },
})

export const { setToken, logout } = authSlice.actions
export default authSlice.reducer
