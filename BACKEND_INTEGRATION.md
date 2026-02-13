# Интеграция с Backend API

Это руководство поможет подключить React приложение к вашему backend API.

## Текущее состояние

Проект настроен на использование **mock данных** для разработки без backend.
Когда backend будет готов, интеграция займет минимум времени.

## Шаг 1: Подготовка Backend

### Требования к API

Backend должен предоставлять REST API со следующими endpoints:

**Базовый URL:** `http://your-domain.com/api`

### Обязательные endpoints:

1. **GET /categories** - список категорий
2. **GET /categories/:id** - категория с подкатегориями
3. **GET /products** - список товаров (с фильтрами)
4. **GET /products/:id** - детальная информация о товаре

Полный список endpoints см. в [API.md](API.md)

### Формат данных

#### Категория
```json
{
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
```

#### Товар
```json
{
  "id": 1,
  "name": "iPhone 15 Pro Max",
  "slug": "iphone-15-pro-max",
  "price": 129990,
  "oldPrice": 139990,
  "discount": 7,
  "image": "/img/product/iphone.jpg",
  "images": ["/img/product/iphone-1.jpg", "/img/product/iphone-2.jpg"],
  "inStock": true,
  "rating": 5,
  "reviewsCount": 125,
  "description": "Описание товара",
  "specifications": {
    "Экран": "6.7\"",
    "Процессор": "A17 Pro"
  },
  "category": 1,
  "subcategory": 11
}
```

## Шаг 2: Настройка CORS на Backend

Чтобы React мог обращаться к API, настройте CORS headers:

### Node.js (Express)
```javascript
const cors = require('cors')

app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com'],
  credentials: true
}))
```

### Python (Flask)
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'https://your-domain.com'])
```

### PHP
```php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## Шаг 3: Обновление React приложения

### 3.1 Обновите .env файл

```env
# Замените на URL вашего API
VITE_API_BASE_URL=http://localhost:3001/api

# Отключите mock данные
VITE_USE_MOCK_DATA=false
```

### 3.2 Перезапустите dev-сервер

```bash
npm run dev
```

Vite автоматически подхватит изменения в .env.

## Шаг 4: Тестирование

### 4.1 Проверьте Network в DevTools

1. Откройте Chrome DevTools (F12)
2. Перейдите на вкладку Network
3. Обновите страницу
4. Вы должны увидеть запросы к вашему API

### 4.2 Проверьте данные

Откройте главную страницу - должны загрузиться категории и товары из вашего API.

## Шаг 5: Обработка ошибок

### Если данные не загружаются:

#### 1. Проверьте Console в DevTools
```
Возможные ошибки:
- CORS error → настройте CORS на backend
- 404 Not Found → проверьте URL endpoints
- 500 Server Error → проверьте логи backend
```

#### 2. Проверьте формат данных

API должен возвращать данные в формате:
```json
{
  "data": [...],
  "success": true
}
```

Или просто массив/объект (тогда обновите `api.js`).

#### 3. Обновите сервис API при необходимости

Если ваш backend возвращает данные в другом формате, обновите `src/services/api.js`:

```javascript
// Пример: если API возвращает { result: [...] } вместо { data: [...] }
export const categoriesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/categories')
    return { data: response.result } // Адаптер
  }
}
```

## Авторизация (опционально)

Если ваш API требует авторизации:

### 1. Сохраните токен после логина

```javascript
// В компоненте Login
const handleLogin = async (credentials) => {
  const response = await authAPI.login(credentials)
  localStorage.setItem('token', response.data.token)
}
```

### 2. Добавьте токен в headers

Обновите `src/services/api.js`:

```javascript
// Interceptor для добавления токена
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)
```

### 3. Обработка 401 ошибок

```javascript
// Interceptor для обработки ошибок авторизации
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Удалить токен и редирект на login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## Дополнительные endpoints

### Корзина (если хотите хранить на сервере)

Создайте новые actions в `cartSlice.js`:

```javascript
export const syncCart = createAsyncThunk(
  'cart/sync',
  async (_, { getState }) => {
    const { items } = getState().cart
    const response = await cartAPI.sync(items)
    return response.data
  }
)
```

### Избранное

Создайте `favoritesSlice.js` и API:

```javascript
export const favoritesAPI = {
  getAll: () => apiClient.get('/favorites'),
  add: (productId) => apiClient.post('/favorites', { productId }),
  remove: (productId) => apiClient.delete(`/favorites/${productId}`)
}
```

## Production deployment

### 1. Обновите .env для production

Создайте `.env.production`:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_USE_MOCK_DATA=false
```

### 2. Собрать проект

```bash
npm run build
```

### 3. Деплой

См. подробнее в [DEPLOYMENT.md](DEPLOYMENT.md)

## Proxy для разработки (опционально)

Если хотите избежать проблем с CORS в разработке, настройте proxy в `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

Тогда в `.env`:
```env
VITE_API_BASE_URL=/api
```

## Полезные инструменты

### Postman / Insomnia
Протестируйте API endpoints вручную перед интеграцией.

### Redux DevTools
Проверяйте состояние Redux во время разработки:
1. Установите расширение Redux DevTools
2. Откройте в браузере и проверяйте actions

### React DevTools
Проверяйте props и state компонентов.

## Чеклист интеграции

- [ ] Backend API готов и запущен
- [ ] CORS настроен на backend
- [ ] Endpoints возвращают данные в правильном формате
- [ ] `.env` обновлен с URL API
- [ ] `VITE_USE_MOCK_DATA=false`
- [ ] Dev-сервер перезапущен
- [ ] Данные загружаются на страницах
- [ ] Нет ошибок в Console
- [ ] Network показывает успешные запросы
- [ ] Авторизация работает (если есть)

## Troubleshooting

### Проблема: CORS error
```
Access to fetch at 'http://localhost:3001/api/products' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**Решение:** Настройте CORS на backend (см. Шаг 2)

### Проблема: 404 Not Found
```
GET http://localhost:3001/api/products 404 (Not Found)
```

**Решение:** 
1. Проверьте, что backend запущен
2. Проверьте правильность URL в `.env`
3. Проверьте routes на backend

### Проблема: Данные не отображаются
```
Нет ошибок, но товары не показываются
```

**Решение:**
1. Проверьте формат данных в Network → Response
2. Сравните с форматом в `mockData.js`
3. Обновите mapping в API сервисе

### Проблема: Медленная загрузка
```
Запросы к API занимают много времени
```

**Решение:**
1. Добавьте индексы в БД
2. Включите кэширование на backend
3. Используйте pagination
4. Оптимизируйте запросы

## Пример полной интеграции

### 1. Backend готов на http://localhost:3001

### 2. Обновить .env
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_USE_MOCK_DATA=false
```

### 3. Перезапустить
```bash
npm run dev
```

### 4. Проверить
- Открыть http://localhost:5173
- Проверить Console - нет ошибок
- Проверить Network - запросы успешны
- Категории и товары отображаются

### 5. Готово! 🎉

## Контакты

Если возникли проблемы с интеграцией:
1. Проверьте [API.md](API.md) для полной документации
2. Проверьте примеры в `mockData.js`
3. Проверьте Console и Network в DevTools

---

**После интеграции проект полностью готов к работе с реальными данными!**
