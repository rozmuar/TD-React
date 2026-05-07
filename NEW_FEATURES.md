# Новый функционал TopDisk - Руководство по использованию

Обновление от **7 мая 2026** — добавлены все функции из API v8.

---

## 📋 Что нового

### 1. **T-ID авторизация (T-Bank)**
Быстрый вход через Т-Банк вместо SMS.

**Как использовать:**
- Открыть попап авторизации
- Выбрать "Войти через Т‑ID"
- Подтвердить в окне T-Bank
- Вернуться и нажать "Я авторизовался"

**Компонент:** `AuthPopup` автоматически поддерживает оба метода

---

### 2. **Управление адресами доставки**
Сохранённые адреса для быстрого оформления заказов.

**Компонент:** `AddressManager`

```jsx
import AddressManager from './components/AddressManager/AddressManager'

function PersonalPage() {
  return <AddressManager />
}
```

**Redux actions:**
```js
import { 
  fetchUserAddresses, 
  createAddress, 
  editAddress, 
  removeAddress 
} from './store/slices/userSlice'

// Загрузить адреса
dispatch(fetchUserAddresses())

// Добавить новый адрес
dispatch(createAddress({
  city: 'Москва',
  street: 'ул. Пример',
  house: '1',
  apartment: '42',
  zip: '101000'
}))

// Обновить адрес
dispatch(editAddress({ 
  id: 123, 
  data: { city: 'Санкт-Петербург' } 
}))

// Удалить адрес
dispatch(removeAddress(123))
```

---

### 3. **Пункты самовывоза в checkout**
Выбор конкретного склада/ПВЗ при самовывозе.

**Компонент:** `PickupPointSelector`

```jsx
import PickupPointSelector from './components/PickupPointSelector/PickupPointSelector'

function CheckoutPage() {
  return (
    <>
      {/* Выбор доставки */}
      <DeliverySelector />
      
      {/* Автоматически показывается только для самовывоза */}
      <PickupPointSelector />
    </>
  )
}
```

**Redux actions:**
```js
import { 
  fetchStores, 
  setPickupPoint,
  recalculateCheckout,
  finalizeCheckout
} from './store/slices/checkoutSlice'

// Загрузить пункты выдачи
dispatch(fetchStores())

// Выбрать пункт
dispatch(setPickupPoint(pickupPointId))

// Пересчитать с выбранным пунктом
dispatch(recalculateCheckout({
  person_type_id: 5,
  delivery_id: 4,
  pay_system_id: 40,
  pickup_point_id: pickupPointId,
  location: '0000073738',
  properties: { ... }
}))

// Финальное оформление
dispatch(finalizeCheckout({ ... }))
```

---

### 4. **Слияние корзин**
Автоматическое объединение гостевой и авторизованной корзины.

**Автоматически работает в `AuthPopup`:**
```js
// При успешной авторизации автоматически вызывается:
dispatch(mergeGuestCart())
```

**Ручной вызов (если нужно):**
```js
import { mergeGuestCart } from './store/slices/cartSlice'

// Объединить корзины
dispatch(mergeGuestCart())
  .unwrap()
  .then(() => console.log('Корзины объединены'))
  .catch((error) => console.error('Ошибка:', error))
```

---

### 5. **Расширенный профиль пользователя**
Редактирование фото, пола, смена пароля.

**Компонент:** `UserProfileEditor`

```jsx
import UserProfileEditor from './components/UserProfileEditor/UserProfileEditor'

function ProfilePage() {
  return <UserProfileEditor />
}
```

**Redux actions:**
```js
import { 
  fetchUserProfile, 
  updateProfile, 
  updatePassword 
} from './store/slices/authSlice'

// Загрузить профиль
dispatch(fetchUserProfile())

// Обновить данные
dispatch(updateProfile({
  name: 'Иван',
  last_name: 'Иванов',
  email: 'ivan@example.com',
  phone: '+79991234567',
  gender: 'M',
  photo: fileObject // или null
}))

// Сменить пароль
dispatch(updatePassword({
  oldPassword: 'old123',
  newPassword: 'new456',
  confirmPassword: 'new456'
}))
```

---

## 🔧 Структура Redux Store

Добавлены новые slices:

```js
store = {
  auth: {
    token, 
    isAuthenticated, 
    user,          // Новое: данные профиля
    tidSession,    // Новое: сессия T-ID
    loading, 
    error
  },
  cart: {
    items, 
    totalAmount, 
    totalCount,
    loading,       // Новое: для серверных операций
    error          // Новое
  },
  user: {          // Новый slice
    addresses,     // Список адресов
    orders,        // История заказов
    currentOrder,  // Детали заказа
    loading,
    error
  },
  checkout: {      // Новый slice
    personTypes,
    deliveries,
    paymentSystems,
    stores,        // Склады/ПВЗ
    pickupPoints,  // Пункты самовывоза для выбранной доставки
    selectedPickupPoint,
    location,
    totals,
    canSubmit,
    loading,
    error
  }
}
```

---

## 📡 API методы

Все методы в `src/services/apiClient.js`:

### Авторизация
- `sendSmsCode(phone)` — SMS-авторизация
- `verifySmsCode(phone, code)` — Проверка SMS
- `tidInit(phone?)` — Инициализация T-ID
- `tidComplete(code?)` — Завершение T-ID

### Профиль
- `getUserProfile()` — Получить данные
- `updateUserProfile(data)` — Обновить профиль
- `changePassword(oldPass, newPass, confirmPass)` — Сменить пароль
- `userLogout()` — Выход

### Адреса
- `getUserAddresses()` — Список адресов
- `addUserAddress(data)` — Добавить
- `updateUserAddress(id, data)` — Обновить
- `deleteUserAddress(id)` — Удалить

### Корзина
- `getServerBasket()` — Получить с сервера
- `addToServerBasket(productId, quantity)` — Добавить
- `deleteServerBasketItem(productId, mode)` — Удалить
- `mergeBasket(guestFuserId)` — Объединить корзины

### Checkout
- `getLocationCode(city)` — Код города
- `getCheckoutContext(params)` — Начальный контекст
- `calculateCheckout(data)` — Пересчёт
- `submitCheckout(data)` — Создание заказа
- `getSaleStores()` — Склады/ПВЗ
- `getPersonTypes()` — Типы плательщиков

---

## 🎨 Компоненты

### AddressManager
Полное управление адресами доставки.

**Props:** нет  
**Используемый store:** `user`

### PickupPointSelector
Выбор пункта самовывоза (автоматически скрывается для курьерской доставки).

**Props:** нет  
**Используемый store:** `checkout`

### UserProfileEditor
Редактирование профиля с двумя вкладками: личные данные и смена пароля.

**Props:** нет  
**Используемый store:** `auth`

### AuthPopup (обновлён)
Теперь поддерживает 3 метода авторизации:
1. SMS
2. T-ID
3. Логин/пароль (если был ранее)

**Props:** 
- `isOpen` — показывать попап
- `onClose` — колбэк закрытия

---

## ⚡ Quick Start

### 1. Добавить новые компоненты в роутинг

```jsx
// App.jsx
import { Routes, Route } from 'react-router-dom'
import UserProfileEditor from './components/UserProfileEditor/UserProfileEditor'
import AddressManager from './components/AddressManager/AddressManager'

function App() {
  return (
    <Routes>
      <Route path="/personal/profile" element={<UserProfileEditor />} />
      <Route path="/personal/addresses" element={<AddressManager />} />
      {/* ... остальные роуты */}
    </Routes>
  )
}
```

### 2. Использовать PickupPointSelector в checkout

```jsx
// Cart.jsx или Checkout.jsx
import PickupPointSelector from './components/PickupPointSelector/PickupPointSelector'

function CheckoutPage() {
  return (
    <div className="checkout">
      <h1>Оформление заказа</h1>
      
      {/* Ваши существующие поля */}
      <DeliveryOptions />
      
      {/* Добавить сюда */}
      <PickupPointSelector />
      
      <PaymentOptions />
      <button onClick={handleSubmit}>Оформить заказ</button>
    </div>
  )
}
```

### 3. Обновить AuthPopup (уже готово)

`AuthPopup` автоматически поддерживает T-ID и слияние корзин после авторизации.

---

## 🐛 Troubleshooting

### Ошибка "Guest fuser_id not found"
**Причина:** Пользователь не добавлял товары до авторизации.  
**Решение:** Нормальная ситуация, игнорируйте ошибку.

### Пункты самовывоза не загружаются
**Проверить:**
1. Выбрана ли доставка с типом самовывоза
2. Вызван ли `dispatch(fetchStores())`
3. API `/sale/stores` доступен

### Фото профиля не загружается
**Проверить:**
1. Размер файла ≤ 5 МБ
2. Формат: jpg, png, gif, webp
3. API принимает `FormData` с полем `photo`

---

## 📝 Migration Guide

### Обновление старого кода

**Было (localStorage корзина):**
```js
dispatch(addToCart(product))
```

**Стало (серверная корзина):**
```js
// Для авторизованных пользователей
dispatch(addToServerCart({ product, quantity: 1 }))

// Или используйте старое действие для локальной корзины
dispatch(addToCart(product))
```

**Было (простой logout):**
```js
dispatch(logout())
```

**Стало (с вызовом API):**
```js
dispatch(performLogout())
```

---

## ✅ Checklist внедрения

- [x] API методы добавлены в `apiClient.js`
- [x] Redux slices обновлены (`auth`, `cart`, `user`, `checkout`)
- [x] Компоненты созданы (`AddressManager`, `PickupPointSelector`, `UserProfileEditor`)
- [x] `AuthPopup` обновлён для T-ID и merge
- [ ] Добавить компоненты в роутинг приложения
- [ ] Протестировать авторизацию через T-ID
- [ ] Протестировать слияние корзин
- [ ] Протестировать checkout с самовывозом
- [ ] Обновить документацию для команды

---

**Дата обновления:** 7 мая 2026  
**Версия API:** topdisk8_personal_section
