import { createSlice } from '@reduxjs/toolkit'

const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('compare_items') || '[]') : []

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: saved,
  },
  reducers: {
    addToCompare: (state, action) => {
      if (!state.items.find((i) => i.id === action.payload.id)) {
        state.items.push(action.payload)
        localStorage.setItem('compare_items', JSON.stringify(state.items))
      }
    },
    removeFromCompare: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
      localStorage.setItem('compare_items', JSON.stringify(state.items))
    },
    clearCompare: (state) => {
      state.items = []
      localStorage.removeItem('compare_items')
    },
  },
})

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions
export default compareSlice.reducer
