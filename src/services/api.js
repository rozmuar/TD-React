import axios from 'axios'
import {
  getMockCategories,
  getMockCategoryById,
  getMockProducts,
  getMockProductById,
} from './mockData'

// Переключатель между mock данными и реальным API
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// API для категорий
export const categoriesAPI = {
  getAll: () => {
    if (USE_MOCK_DATA) {
      return getMockCategories()
    }
    return apiClient.get('/categories')
  },
  getById: (id) => {
    if (USE_MOCK_DATA) {
      return getMockCategoryById(id)
    }
    return apiClient.get(`/categories/${id}`)
  },
  getSubcategories: (id) => {
    if (USE_MOCK_DATA) {
      return getMockCategoryById(id).then((res) => ({
        data: res.data.subcategories || [],
      }))
    }
    return apiClient.get(`/categories/${id}/subcategories`)
  },
}

// API для продуктов
export const productsAPI = {
  getAll: (params) => {
    if (USE_MOCK_DATA) {
      return getMockProducts(params)
    }
    return apiClient.get('/products', { params })
  },
  getById: (id) => {
    if (USE_MOCK_DATA) {
      return getMockProductById(id)
    }
    return apiClient.get(`/products/${id}`)
  },
  getByCategory: (categoryId) => {
    if (USE_MOCK_DATA) {
      return getMockProducts({ category: categoryId })
    }
    return apiClient.get(`/products?category=${categoryId}`)
  },
  getBySubcategory: (subcategoryId) => {
    if (USE_MOCK_DATA) {
      return getMockProducts({ subcategory: subcategoryId })
    }
    return apiClient.get(`/products?subcategory=${subcategoryId}`)
  },
  search: (query) => {
    if (USE_MOCK_DATA) {
      return getMockProducts().then((res) => ({
        data: res.data.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
        ),
      }))
    }
    return apiClient.get(`/products/search?q=${query}`)
  },
}

// API для брендов
export const brandsAPI = {
  getAll: () => {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ data: [] })
    }
    return apiClient.get('/brands')
  },
  getById: (id) => {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ data: null })
    }
    return apiClient.get(`/brands/${id}`)
  },
}

export default apiClient
