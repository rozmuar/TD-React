# Быстрый старт

## Что уже готово ✅

### Структура проекта
- ✅ React 18 с Vite
- ✅ React Router для навигации
- ✅ Redux Toolkit для управления состоянием
- ✅ CSS Modules для стилизации
- ✅ Адаптивная верстка

### Страницы
- ✅ Главная (Home)
- ✅ Каталог (Catalog)
- ✅ Категория (Category)
- ✅ Подкатегория (Subcategory)
- ✅ Товар (Product)
- ✅ 404 страница

### Компоненты
- ✅ Layout с Header и Footer
- ✅ ProductCard
- ✅ Навигация с хлебными крошками

### Функционал
- ✅ Redux store с slices для:
  - Категорий
  - Товаров
  - Корзины
- ✅ API сервисы с возможностью использования mock данных
- ✅ Базовые фильтры и сортировка

## Первые шаги

### 1. Проверка установки

Убедитесь, что проект запустился:
```bash
npm run dev
```

Откройте http://localhost:5173 - должна открыться главная страница.

### 2. Режим разработки

Проект настроен на использование mock данных. Это позволяет работать без backend.

Файл `.env`:
```env
VITE_USE_MOCK_DATA=true
```

Mock данные находятся в файле `src/services/mockData.js`.

### 3. Навигация по проекту

Откройте в браузере и попробуйте:
- `/` - главная страница
- `/catalog` - каталог товаров
- `/category/1` - страница категории
- `/product/1` - страница товара

## Что нужно доработать 🔧

### Приоритет 1 (Основное)

#### 1. Подключить реальный API

**Файл:** `src/services/api.js`

Когда backend будет готов:

1. Обновите `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_USE_MOCK_DATA=false
```

2. Убедитесь, что API возвращает данные в правильном формате (см. `API.md`).

#### 2. Страница корзины

**Задача:** Создать страницу `/cart` для отображения товаров в корзине.

**Файлы для создания:**
- `src/pages/Cart/Cart.jsx`
- `src/pages/Cart/Cart.module.css`

**Компоненты:**
- Список товаров в корзине
- Кнопки изменения количества
- Итоговая сумма
- Кнопка "Оформить заказ"

**Redux уже готов:** используйте `cartSlice` actions.

**Пример:**
```jsx
import { useSelector, useDispatch } from 'react-redux'
import { removeFromCart, incrementQuantity, decrementQuantity } from '../../store/slices/cartSlice'

function Cart() {
  const dispatch = useDispatch()
  const { items, totalAmount } = useSelector(state => state.cart)

  return (
    <div>
      <h1>Корзина</h1>
      {items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <button onClick={() => dispatch(decrementQuantity(item.id))}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => dispatch(incrementQuantity(item.id))}>+</button>
          <button onClick={() => dispatch(removeFromCart(item.id))}>Удалить</button>
        </div>
      ))}
      <div>Итого: {totalAmount} ₽</div>
    </div>
  )
}
```

#### 3. Поиск товаров

**Задача:** Реализовать функционал поиска.

**Компонент:** `src/components/SearchBar/SearchBar.jsx`

**Где добавить:**
- В Header уже есть кнопка поиска
- Создайте модальное окно или выпадающий список с результатами

**Redux:**
Создайте новый slice или добавьте в productsSlice:
```javascript
searchResults: [],
searchLoading: false
```

#### 4. Избранное

**Задача:** Добавить функционал избранного.

**Redux slice:** `src/store/slices/favoritesSlice.js`

**Страница:** `src/pages/Favorites/Favorites.jsx`

**В Header:** Обновить иконку избранного с счетчиком.

### Приоритет 2 (Важное)

#### 5. Авторизация

**Страницы:**
- `/login` - вход
- `/register` - регистрация

**Redux slice:** `src/store/slices/authSlice.js`

**Функционал:**
- Форма входа/регистрации
- Сохранение токена в localStorage
- Защищенные маршруты
- Личный кабинет

#### 6. Оформление заказа

**Страница:** `/checkout`

**Шаги:**
1. Проверка корзины
2. Форма доставки
3. Выбор оплаты
4. Подтверждение заказа

**API endpoints:**
- POST `/api/orders` - создание заказа

#### 7. Фильтры в каталоге

**Текущее состояние:** Базовая разметка есть, но не работает.

**Задача:**
- Подключить чекбоксы к Redux
- Фильтрация по цене
- Фильтрация по брендам
- Применение фильтров

**Redux:** используйте `productsSlice.filters` и action `setFilters`.

#### 8. Пагинация

**Задача:** Добавить пагинацию в каталоге.

**Компонент:** `src/components/Pagination/Pagination.jsx`

**Где использовать:**
- Catalog
- Результаты поиска

### Приоритет 3 (Дополнительно)

#### 9. Отзывы на товары

- Компонент отображения отзывов
- Форма добавления отзыва
- Рейтинг товара

#### 10. Сравнение товаров

- Redux slice для сравнения
- Страница сравнения
- Кнопка "Добавить к сравнению"

#### 11. История заказов

- Страница с историей заказов
- Детальная информация о заказе
- Отслеживание статуса

#### 12. Адаптация Header

**Задача:** Мобильное меню (бургер).

Текущий Header не адаптирован для мобильных устройств.

## Структура файлов для новых фич

### Создание новой страницы

```
src/pages/NewPage/
├── NewPage.jsx
└── NewPage.module.css
```

1. Создайте компонент
2. Добавьте маршрут в `App.jsx`
3. Добавьте ссылку в навигацию

### Создание нового компонента

```
src/components/NewComponent/
├── NewComponent.jsx
└── NewComponent.module.css
```

### Новый Redux slice

```
src/store/slices/newSlice.js
```

И добавьте в `store.js`:
```javascript
import newReducer from './slices/newSlice'

export const store = configureStore({
  reducer: {
    // ...
    new: newReducer,
  },
})
```

## Полезные команды для разработки

### Запуск проекта
```bash
npm run dev
```

### Сборка для production
```bash
npm run build
```

### Проверка ошибок
Откройте Developer Tools (F12) → Console

### Установка новых пакетов
```bash
npm install package-name
```

### Популярные пакеты для добавления

**React Hook Form** - для форм:
```bash
npm install react-hook-form
```

**Yup** - валидация:
```bash
npm install yup @hookform/resolvers
```

**React Toastify** - уведомления:
```bash
npm install react-toastify
```

**Date-fns** - работа с датами:
```bash
npm install date-fns
```

**Swiper** - слайдеры:
```bash
npm install swiper
```

## Рекомендации по коду

### 1. Именование компонентов
- PascalCase для компонентов: `ProductCard.jsx`
- camelCase для утилит: `formatPrice.js`
- kebab-case для CSS: `product-card.module.css`

### 2. Структура компонента
```jsx
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from './Component.module.css'

function Component({ prop1, prop2 }) {
  // 1. Хуки
  const [state, setState] = useState()
  const dispatch = useDispatch()
  const data = useSelector(state => state.data)

  // 2. Effects
  useEffect(() => {
    // ...
  }, [])

  // 3. Handlers
  const handleClick = () => {
    // ...
  }

  // 4. Render
  return (
    <div className={styles.container}>
      {/* ... */}
    </div>
  )
}

export default Component
```

### 3. CSS Modules
```css
/* Используйте осмысленные имена классов */
.container { }
.title { }
.button { }

/* BEM методология необязательна, но помогает */
.card { }
.cardTitle { }
.cardButton { }
```

### 4. Redux best practices
```javascript
// Используйте createAsyncThunk для async операций
export const fetchData = createAsyncThunk(
  'slice/fetchData',
  async () => {
    const response = await api.getData()
    return response.data
  }
)

// Обрабатывайте все состояния: pending, fulfilled, rejected
.addCase(fetchData.pending, (state) => {
  state.loading = true
})
.addCase(fetchData.fulfilled, (state, action) => {
  state.loading = false
  state.data = action.payload
})
.addCase(fetchData.rejected, (state, action) => {
  state.loading = false
  state.error = action.error.message
})
```

## Тестирование

### Проверка на разных устройствах
В Chrome DevTools:
- F12 → Toggle device toolbar (Ctrl+Shift+M)
- Тестируйте на разных разрешениях

### Проверка производительности
- F12 → Lighthouse
- Запустите аудит

### Проверка доступности
- Используйте семантические HTML теги
- Добавляйте alt к изображениям
- Используйте aria-labels для кнопок

## Частые вопросы

**Q: Как изменить цвета сайта?**
A: Отредактируйте CSS переменные в `src/styles/global.css`

**Q: Как добавить новую категорию в mock данные?**
A: Отредактируйте файл `src/services/mockData.js`

**Q: Как изменить порт dev-сервера?**
A: В `vite.config.js` добавьте:
```javascript
server: {
  port: 3000
}
```

**Q: Нужно ли использовать TypeScript?**
A: Необязательно, но рекомендуется для больших проектов.

## Дальнейшее обучение

### Документация
- [React](https://react.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [React Router](https://reactrouter.com)
- [Vite](https://vitejs.dev)

### Курсы
- React: официальный tutorial
- Redux: Redux Essentials
- JavaScript: learn.javascript.ru

## Поддержка

Если возникли вопросы:
1. Проверьте документацию в папке проекта
2. Посмотрите примеры кода в существующих компонентах
3. Проверьте Console в DevTools на наличие ошибок

---

**Готовы начать? 🚀**

```bash
npm run dev
```

Откройте http://localhost:5173 и начинайте разработку!
