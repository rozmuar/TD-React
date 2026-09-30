import { addToCartById } from '../store/slices/cartSlice'

// window.addToCart(productId, quantity) — точка входа для кода ВНЕ нашего
// React-дерева (сторонние виджеты, инлайн-скрипты на странице и т.п.),
// которому нужно добавить товар в корзину, не имея доступа к Redux dispatch
// напрямую. Вызывается из main.jsx/entry-client.jsx (только клиент — на
// SSR window нет и вызывать это оттуда некому).
export function exposeAddToCart(store) {
  window.addToCart = (productId, quantity = 1) => {
    const id = Number(productId)
    if (!id) {
      console.warn('[addToCart] некорректный productId:', productId)
      return
    }
    store.dispatch(addToCartById(id, quantity))
  }
}
