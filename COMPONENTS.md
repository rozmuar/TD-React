# Структура компонентов

## Архитектура

```
src/
├── components/          # Переиспользуемые компоненты
├── pages/              # Компоненты страниц
├── store/              # Redux состояние
├── services/           # API и внешние сервисы
└── styles/             # Глобальные стили
```

## Компоненты

### Layout компоненты

#### Layout
**Путь:** `src/components/Layout/Layout.jsx`

Основной layout компонент, содержащий Header, Footer и Outlet для дочерних маршрутов.

**Использование:**
```jsx
<Layout>
  <Outlet />
</Layout>
```

#### Header
**Путь:** `src/components/Header/Header.jsx`

Шапка сайта с навигацией, поиском и иконками корзины/избранного.

**Props:**
Нет props, использует Redux для получения количества товаров в корзине.

**Функционал:**
- Навигация по сайту
- Поиск товаров
- Отображение количества товаров в корзине

#### Footer
**Путь:** `src/components/Footer/Footer.jsx`

Подвал сайта с полезными ссылками и контактами.

### Product компоненты

#### ProductCard
**Путь:** `src/components/ProductCard/ProductCard.jsx`

Карточка товара для отображения в списках/сетках.

**Props:**
```typescript
interface ProductCardProps {
  product: {
    id: number
    name: string
    price: number
    oldPrice?: number
    discount?: number
    image: string
    inStock: boolean
    rating?: number
    reviewsCount?: number
  }
}
```

**Функционал:**
- Отображение информации о товаре
- Добавление в корзину
- Добавление в избранное
- Переход на страницу товара

### Страницы

#### Home
**Путь:** `src/pages/Home/Home.jsx`

Главная страница сайта.

**Секции:**
- Hero секция с баннером
- Список категорий
- Популярные товары
- Преимущества магазина

**Redux действия:**
- `fetchCategories()` - загрузка категорий
- `fetchProducts({ limit: 8 })` - загрузка популярных товаров

#### Catalog
**Путь:** `src/pages/Catalog/Catalog.jsx`

Страница каталога со всеми товарами и фильтрами.

**Функционал:**
- Боковая панель с фильтрами
- Сетка товаров
- Сортировка товаров
- Пагинация

**Redux состояние:**
- `products.items` - список товаров
- `products.filters` - активные фильтры
- `categories.items` - список категорий для фильтров

#### Category
**Путь:** `src/pages/Category/Category.jsx`

Страница категории с подкатегориями.

**URL:** `/category/:categoryId`

**Функционал:**
- Отображение подкатегорий
- Хлебные крошки
- Описание категории

**Redux действия:**
- `fetchCategoryById(categoryId)` - загрузка категории

#### Subcategory
**Путь:** `src/pages/Subcategory/Subcategory.jsx`

Страница подкатегории с товарами.

**URL:** `/subcategory/:subcategoryId`

**Функционал:**
- Список товаров подкатегории
- Сортировка
- Хлебные крошки

**Redux действия:**
- `fetchProductsByCategory(subcategoryId)` - загрузка товаров

#### Product
**Путь:** `src/pages/Product/Product.jsx`

Детальная страница товара.

**URL:** `/product/:productId`

**Функционал:**
- Галерея изображений
- Полная информация о товаре
- Характеристики
- Добавление в корзину с выбором количества
- Добавление в избранное
- Рейтинг и отзывы

**Redux действия:**
- `fetchProductById(productId)` - загрузка товара
- `addToCart(product)` - добавление в корзину

#### NotFound
**Путь:** `src/pages/NotFound/NotFound.jsx`

Страница 404.

## Redux Store

### Store структура

```javascript
{
  categories: {
    items: [],           // Список категорий
    currentCategory: null, // Текущая категория
    loading: false,
    error: null
  },
  products: {
    items: [],           // Список товаров
    currentProduct: null, // Текущий товар
    loading: false,
    error: null,
    filters: {
      category: null,
      subcategory: null,
      priceRange: [0, 100000],
      brands: []
    }
  },
  cart: {
    items: [],           // Товары в корзине
    totalAmount: 0,      // Общая сумма
    totalCount: 0        // Количество товаров
  }
}
```

### Slices

#### categoriesSlice
**Путь:** `src/store/slices/categoriesSlice.js`

**Async actions:**
- `fetchCategories()` - получить все категории
- `fetchCategoryById(id)` - получить категорию по ID

**Selectors:**
```javascript
const categories = useSelector(state => state.categories.items)
const currentCategory = useSelector(state => state.categories.currentCategory)
const loading = useSelector(state => state.categories.loading)
```

#### productsSlice
**Путь:** `src/store/slices/productsSlice.js`

**Async actions:**
- `fetchProducts(params)` - получить товары
- `fetchProductById(id)` - получить товар
- `fetchProductsByCategory(categoryId)` - товары категории

**Sync actions:**
- `setFilters(filters)` - установить фильтры
- `clearFilters()` - очистить фильтры

**Selectors:**
```javascript
const products = useSelector(state => state.products.items)
const currentProduct = useSelector(state => state.products.currentProduct)
const filters = useSelector(state => state.products.filters)
```

#### cartSlice
**Путь:** `src/store/slices/cartSlice.js`

**Actions:**
- `addToCart(product)` - добавить в корзину
- `removeFromCart(productId)` - удалить из корзины
- `incrementQuantity(productId)` - увеличить количество
- `decrementQuantity(productId)` - уменьшить количество
- `clearCart()` - очистить корзину

**Selectors:**
```javascript
const cartItems = useSelector(state => state.cart.items)
const totalAmount = useSelector(state => state.cart.totalAmount)
const totalCount = useSelector(state => state.cart.totalCount)
```

## Роутинг

```jsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
    <Route path="catalog" element={<Catalog />} />
    <Route path="category/:categoryId" element={<Category />} />
    <Route path="subcategory/:subcategoryId" element={<Subcategory />} />
    <Route path="product/:productId" element={<Product />} />
    <Route path="*" element={<NotFound />} />
  </Route>
</Routes>
```

## Стилизация

### CSS Modules

Каждый компонент имеет свой `.module.css` файл:

```jsx
// Component.jsx
import styles from './Component.module.css'

function Component() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Title</h1>
    </div>
  )
}
```

### Глобальные стили

**normalize.css** - базовые reset стили
**bootstrap-grid.css** - Bootstrap Grid System
**global.css** - глобальные стили и CSS переменные

### CSS переменные

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --font-family: 'Roboto', sans-serif;
  --transition: all 0.3s ease;
}
```

## Примеры использования

### Создание нового компонента

```jsx
// src/components/MyComponent/MyComponent.jsx
import styles from './MyComponent.module.css'

function MyComponent({ title, children }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}

export default MyComponent
```

```css
/* src/components/MyComponent/MyComponent.module.css */
.container {
  padding: 20px;
  background: #f8f9fa;
}

.title {
  font-size: 24px;
  margin-bottom: 15px;
}

.content {
  line-height: 1.6;
}
```

### Подключение Redux

```jsx
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '../store/slices/productsSlice'

function MyComponent() {
  const dispatch = useDispatch()
  const products = useSelector(state => state.products.items)
  const loading = useSelector(state => state.products.loading)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  if (loading) return <div>Загрузка...</div>

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Использование API

```jsx
import { productsAPI } from '../services/api'

async function loadProducts() {
  try {
    const response = await productsAPI.getAll({ limit: 10 })
    console.log(response.data)
  } catch (error) {
    console.error('Ошибка загрузки:', error)
  }
}
```
