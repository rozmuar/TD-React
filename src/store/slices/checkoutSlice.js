import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  getLocationCode,
  getCheckoutContext,
  calculateCheckout,
  submitCheckout,
  getSaleStores,
  getPersonTypes,
} from '../../services/apiClient'

const initialState = {
  // Контекст checkout
  personTypes: [],
  deliveries: [],
  paymentSystems: [],
  properties: {},
  missingProperties: [],
  
  // Склады и пункты самовывоза
  stores: [],
  pickupPoints: [],
  
  // Выбранные значения
  selectedPersonType: null,
  selectedDelivery: null,
  selectedPayment: null,
  selectedPickupPoint: null,
  location: null,
  
  // Итоговые данные
  totals: {
    subtotal: 0,
    delivery: 0,
    discount: 0,
    total: 0,
  },
  
  // Данные формы
  formData: {
    phone: '',
    name: '',
    surname: '',
    email: '',
    address: '',
    comment: '',
  },
  
  // Результат оформления
  order: null,
  payment: null,
  
  // Флаги
  canSubmit: false,
  loading: false,
  error: null,
}

// Получение location code по городу
export const fetchLocationCode = createAsyncThunk(
  'checkout/fetchLocationCode',
  async (city, { rejectWithValue }) => {
    try {
      const res = await getLocationCode(city)
      const code = res.data?.data?.location_code || res.data?.location_code
      if (!code) throw new Error('Location code not found')
      return code
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка получения кода города')
    }
  }
)

// Загрузка начального контекста checkout
export const fetchCheckoutContext = createAsyncThunk(
  'checkout/fetchCheckoutContext',
  async (params, { rejectWithValue }) => {
    try {
      const res = await getCheckoutContext(params)
      const data = res.data?.data || res.data?.checkout || res.data
      return {
        personTypes: data.person_types || [],
        deliveries: data.available_deliveries || [],
        paymentSystems: data.available_pay_systems || [],
        properties: data.properties || {},
        missingProperties: data.missing_required_properties || [],
        totals: data.totals || {},
        canSubmit: data.can_submit || false,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки контекста')
    }
  }
)

// Пересчёт checkout
export const recalculateCheckout = createAsyncThunk(
  'checkout/recalculateCheckout',
  async (data, { rejectWithValue }) => {
    try {
      const res = await calculateCheckout(data)
      const result = res.data?.data || res.data?.checkout || res.data
      return {
        deliveries: result.available_deliveries || [],
        paymentSystems: result.available_pay_systems || [],
        properties: result.properties || {},
        missingProperties: result.missing_required_properties || [],
        totals: result.totals || {},
        canSubmit: result.can_submit || false,
        pickupPoints: result.selected_delivery?.pickup_points || [],
        selectedPickupPointId: result.selected_delivery?.selected_pickup_point_id || null,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка пересчёта')
    }
  }
)

// Финальное оформление заказа
export const finalizeCheckout = createAsyncThunk(
  'checkout/finalizeCheckout',
  async (data, { rejectWithValue }) => {
    try {
      const res = await submitCheckout(data)
      const result = res.data?.data || res.data
      return {
        order: result.order || {},
        payment: result.payment || {},
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка оформления заказа')
    }
  }
)

// Загрузка складов/пунктов выдачи
export const fetchStores = createAsyncThunk(
  'checkout/fetchStores',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getSaleStores()
      const stores = res.data?.data || res.data?.stores || res.data || []
      return Array.isArray(stores) ? stores : []
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки складов')
    }
  }
)

// Загрузка типов плательщиков
export const fetchPersonTypes = createAsyncThunk(
  'checkout/fetchPersonTypes',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getPersonTypes()
      const types = res.data?.data || res.data?.person_types || res.data || []
      return Array.isArray(types) ? types : []
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки типов плательщиков')
    }
  }
)

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setPersonType: (state, action) => {
      state.selectedPersonType = action.payload
    },
    setDelivery: (state, action) => {
      state.selectedDelivery = action.payload
    },
    setPayment: (state, action) => {
      state.selectedPayment = action.payload
    },
    setPickupPoint: (state, action) => {
      state.selectedPickupPoint = action.payload
    },
    setLocation: (state, action) => {
      state.location = action.payload
    },
    updateFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload }
    },
    clearCheckout: (state) => {
      state.selectedPersonType = null
      state.selectedDelivery = null
      state.selectedPayment = null
      state.selectedPickupPoint = null
      state.location = null
      state.formData = initialState.formData
      state.order = null
      state.payment = null
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Location code
      .addCase(fetchLocationCode.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLocationCode.fulfilled, (state, action) => {
        state.loading = false
        state.location = action.payload
      })
      .addCase(fetchLocationCode.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Checkout context
      .addCase(fetchCheckoutContext.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCheckoutContext.fulfilled, (state, action) => {
        state.loading = false
        state.personTypes = action.payload.personTypes
        state.deliveries = action.payload.deliveries
        state.paymentSystems = action.payload.paymentSystems
        state.properties = action.payload.properties
        state.missingProperties = action.payload.missingProperties
        state.totals = action.payload.totals
        state.canSubmit = action.payload.canSubmit
      })
      .addCase(fetchCheckoutContext.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Recalculate
      .addCase(recalculateCheckout.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(recalculateCheckout.fulfilled, (state, action) => {
        state.loading = false
        state.deliveries = action.payload.deliveries
        state.paymentSystems = action.payload.paymentSystems
        state.properties = action.payload.properties
        state.missingProperties = action.payload.missingProperties
        state.totals = action.payload.totals
        state.canSubmit = action.payload.canSubmit
        state.pickupPoints = action.payload.pickupPoints
        if (action.payload.selectedPickupPointId) {
          state.selectedPickupPoint = action.payload.selectedPickupPointId
        }
      })
      .addCase(recalculateCheckout.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Submit
      .addCase(finalizeCheckout.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(finalizeCheckout.fulfilled, (state, action) => {
        state.loading = false
        state.order = action.payload.order
        state.payment = action.payload.payment
      })
      .addCase(finalizeCheckout.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Stores
      .addCase(fetchStores.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false
        state.stores = action.payload
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Person types
      .addCase(fetchPersonTypes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPersonTypes.fulfilled, (state, action) => {
        state.loading = false
        state.personTypes = action.payload
      })
      .addCase(fetchPersonTypes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  setPersonType,
  setDelivery,
  setPayment,
  setPickupPoint,
  setLocation,
  updateFormData,
  clearCheckout,
  clearError,
} = checkoutSlice.actions

export default checkoutSlice.reducer
