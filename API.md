# API Документация

## Базовая информация

**Base URL:** `http://localhost:3001/api`

Все запросы должны включать заголовок:
```
Content-Type: application/json
```

## Формат ответов

### Успешный ответ
```json
{
  "data": { ... },
  "success": true
}
```

### Ответ с ошибкой
```json
{
  "error": "Описание ошибки",
  "success": false
}
```

## Endpoints

### Категории

#### Получить все категории
```http
GET /api/categories
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Смартфоны",
      "slug": "smartphones",
      "image": "/img/category/smartphones.jpg",
      "description": "Описание категории",
      "productCount": 150
    }
  ]
}
```

#### Получить категорию по ID
```http
GET /api/categories/:id
```

**Параметры:**
- `id` (number, required) - ID категории

**Ответ:**
```json
{
  "data": {
    "id": 1,
    "name": "Смартфоны",
    "slug": "smartphones",
    "image": "/img/category/smartphones.jpg",
    "description": "Описание категории",
    "subcategories": [
      {
        "id": 11,
        "name": "iPhone",
        "slug": "iphone",
        "image": "/img/subcategory/iphone.jpg",
        "productCount": 25
      }
    ]
  }
}
```

#### Получить подкатегории
```http
GET /api/categories/:id/subcategories
```

**Параметры:**
- `id` (number, required) - ID категории

**Ответ:**
```json
{
  "data": [
    {
      "id": 11,
      "name": "iPhone",
      "slug": "iphone",
      "categoryId": 1,
      "image": "/img/subcategory/iphone.jpg",
      "productCount": 25
    }
  ]
}
```

---

### Товары

#### Получить все товары
```http
GET /api/products
```

**Query параметры:**
- `category` (number, optional) - Фильтр по категории
- `subcategory` (number, optional) - Фильтр по подкатегории
- `minPrice` (number, optional) - Минимальная цена
- `maxPrice` (number, optional) - Максимальная цена
- `brand` (string, optional) - Фильтр по бренду
- `inStock` (boolean, optional) - Только товары в наличии
- `sort` (string, optional) - Сортировка (`price-asc`, `price-desc`, `name`, `popular`)
- `limit` (number, optional) - Количество товаров
- `offset` (number, optional) - Смещение для пагинации

**Примеры:**
```
GET /api/products?category=1&limit=20
GET /api/products?minPrice=10000&maxPrice=50000&sort=price-asc
GET /api/products?inStock=true&brand=Apple
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "iPhone 15 Pro Max 256GB",
      "slug": "iphone-15-pro-max-256gb",
      "price": 129990,
      "oldPrice": 139990,
      "discount": 7,
      "image": "/img/product/iphone-15-pro-max.jpg",
      "inStock": true,
      "rating": 5,
      "reviewsCount": 125,
      "category": 1,
      "subcategory": 11,
      "brand": "Apple"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

#### Получить товар по ID
```http
GET /api/products/:id
```

**Параметры:**
- `id` (number, required) - ID товара

**Ответ:**
```json
{
  "data": {
    "id": 1,
    "name": "iPhone 15 Pro Max 256GB",
    "slug": "iphone-15-pro-max-256gb",
    "price": 129990,
    "oldPrice": 139990,
    "discount": 7,
    "image": "/img/product/iphone-15-pro-max.jpg",
    "images": [
      "/img/product/iphone-15-pro-max-1.jpg",
      "/img/product/iphone-15-pro-max-2.jpg",
      "/img/product/iphone-15-pro-max-3.jpg"
    ],
    "inStock": true,
    "rating": 5,
    "reviewsCount": 125,
    "description": "Полное описание товара...",
    "specifications": {
      "Диагональ экрана": "6.7\"",
      "Процессор": "A17 Pro",
      "Оперативная память": "8 ГБ",
      "Встроенная память": "256 ГБ"
    },
    "category": {
      "id": 1,
      "name": "Смартфоны"
    },
    "subcategory": {
      "id": 11,
      "name": "iPhone"
    },
    "brand": {
      "id": 1,
      "name": "Apple"
    }
  }
}
```

#### Поиск товаров
```http
GET /api/products/search
```

**Query параметры:**
- `q` (string, required) - Поисковый запрос

**Пример:**
```
GET /api/products/search?q=iphone
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "iPhone 15 Pro Max 256GB",
      "price": 129990,
      "image": "/img/product/iphone-15-pro-max.jpg",
      "inStock": true
    }
  ]
}
```

---

### Бренды

#### Получить все бренды
```http
GET /api/brands
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Apple",
      "slug": "apple",
      "logo": "/img/brands/apple.png",
      "productCount": 85
    }
  ]
}
```

#### Получить бренд по ID
```http
GET /api/brands/:id
```

**Параметры:**
- `id` (number, required) - ID бренда

**Ответ:**
```json
{
  "data": {
    "id": 1,
    "name": "Apple",
    "slug": "apple",
    "logo": "/img/brands/apple.png",
    "description": "Описание бренда",
    "website": "https://www.apple.com",
    "productCount": 85
  }
}
```

---

### Корзина

#### Получить корзину
```http
GET /api/cart
```

**Headers:**
```
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "data": {
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "iPhone 15 Pro Max",
          "price": 129990,
          "image": "/img/product/iphone-15-pro-max.jpg"
        },
        "quantity": 2
      }
    ],
    "totalAmount": 259980,
    "totalCount": 2
  }
}
```

#### Добавить товар в корзину
```http
POST /api/cart
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "productId": 1,
  "quantity": 1
}
```

**Ответ:**
```json
{
  "data": {
    "id": 1,
    "productId": 1,
    "quantity": 1
  },
  "success": true
}
```

#### Обновить количество товара
```http
PUT /api/cart/:itemId
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "quantity": 3
}
```

#### Удалить товар из корзины
```http
DELETE /api/cart/:itemId
```

**Headers:**
```
Authorization: Bearer {token}
```

---

### Избранное

#### Получить избранное
```http
GET /api/favorites
```

**Headers:**
```
Authorization: Bearer {token}
```

#### Добавить в избранное
```http
POST /api/favorites
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "productId": 1
}
```

#### Удалить из избранного
```http
DELETE /api/favorites/:productId
```

**Headers:**
```
Authorization: Bearer {token}
```

---

### Заказы

#### Создать заказ
```http
POST /api/orders
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "delivery": {
    "address": "г. Москва, ул. Примерная, д. 1",
    "recipientName": "Иван Иванов",
    "phone": "+79999999999"
  },
  "payment": {
    "method": "card",
    "amount": 259980
  }
}
```

**Ответ:**
```json
{
  "data": {
    "id": 1,
    "orderNumber": "ORD-2026-00001",
    "status": "pending",
    "totalAmount": 259980,
    "createdAt": "2026-02-09T12:00:00Z"
  },
  "success": true
}
```

#### Получить заказы пользователя
```http
GET /api/orders
```

**Headers:**
```
Authorization: Bearer {token}
```

#### Получить заказ по ID
```http
GET /api/orders/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

---

### Авторизация

#### Регистрация
```http
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Иван Иванов",
  "phone": "+79999999999"
}
```

**Ответ:**
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Иван Иванов"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "success": true
}
```

#### Вход
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Получить текущего пользователя
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer {token}
```

---

## Коды ответов

- `200` - Успешно
- `201` - Создано
- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Не найдено
- `500` - Ошибка сервера

## Примеры использования

### JavaScript (Axios)
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Получить товары
const products = await api.get('/products', {
  params: { category: 1, limit: 20 }
})

// Получить товар по ID
const product = await api.get(`/products/${productId}`)

// Добавить в корзину (с авторизацией)
api.defaults.headers.common['Authorization'] = `Bearer ${token}`
await api.post('/cart', { productId: 1, quantity: 2 })
```

### Fetch API
```javascript
// Получить категории
const response = await fetch('http://localhost:3001/api/categories')
const data = await response.json()

// Поиск товаров
const searchResponse = await fetch(
  'http://localhost:3001/api/products/search?q=iphone'
)
const searchData = await searchResponse.json()
```
