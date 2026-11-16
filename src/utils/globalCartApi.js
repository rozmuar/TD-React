import { addToCartById, fetchServerCart, removeFromCart } from '../store/slices/cartSlice'
import { toggleFavorite } from '../store/slices/favoritesSlice'
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice'
import { addToServerBasket, deleteServerBasketItem, getProductById } from '../services/apiClient'

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
  exposeDigiLayer(store)
}

// Товар по ID для избранного/сравнения — им нужен объект (название, картинка,
// цена), а платформа передаёт только offer_id (= ID товара в Bitrix и в фиде).
async function loadProduct(id) {
  try {
    const p = (await getProductById(id)).data?.result
    if (p && p.id) {
      return {
        id: Number(p.id),
        name: p.name || '',
        code: p.code || '',
        section_code: p.category_code || '',
        category_code: p.category_code || '',
        image: p.image || '',
        price: Number(p.price) || 0,
        oldPrice: Number(p.old_price) || null,
      }
    }
  } catch (e) {
    console.warn('[digiLayer] товар не загружен:', id, e?.message)
  }
  return { id }
}

// window.digiLayer — функциональные кнопки виджетов Diginetica/AnyQuery
// (корзина, избранное, сравнение). Требования платформы: доступны на всех
// страницах, без перезагрузки, возвращают Promise; addToCart суммирует
// количество, removeFromCart вычитает (amount < 1 — удалить позицию
// целиком); *State() отдают актуальное состояние: корзина — {id: qty},
// избранное/сравнение — [id, …]. Состояние живёт в Redux + localStorage,
// поэтому переживает «Назад» в браузере, а счётчики в шапке обновляются сами.
export function exposeDigiLayer(store) {
  const state = () => store.getState()
  const cartState = async () => {
    const out = {}
    for (const i of state().cart.items) out[i.id] = i.quantity
    return out
  }
  const favoritesState = async () => state().favorites.items.map((i) => i.id)
  const compareState = async () => state().compare.items.map((i) => i.id)

  window.digiLayer = Object.assign(window.digiLayer || {}, {
    async addToCart(offerId, amount = 1) {
      const id = Number(offerId)
      if (!id) return false
      const qty = Math.max(1, Math.floor(Number(amount) || 1))
      try {
        await addToServerBasket(id, qty) // сервер суммирует с тем, что уже в корзине
      } catch (e) {
        console.warn('[digiLayer] addToCart:', e?.message)
      }
      await store.dispatch(fetchServerCart()) // счётчик в шапке и cartState() — сразу актуальны
      return true
    },

    async removeFromCart(offerId, amount = 1) {
      const id = Number(offerId)
      if (!id) return false
      const item = state().cart.items.find((i) => Number(i.id) === id)
      if (!item) return true
      const n = Math.floor(Number(amount))
      if (!(n >= 1) || n >= item.quantity) {
        await store.dispatch(removeFromCart(item.id))
      } else {
        try {
          for (let k = 0; k < n; k++) await deleteServerBasketItem(item.id, 'decrement')
        } catch (e) {
          console.warn('[digiLayer] removeFromCart:', e?.message)
        }
        await store.dispatch(fetchServerCart())
      }
      return true
    },

    cartState,

    async addToFavorites(offerId) {
      const id = Number(offerId)
      if (!id) return false
      if (!state().favorites.items.some((i) => Number(i.id) === id)) {
        await store.dispatch(toggleFavorite(await loadProduct(id)))
      }
      return true
    },

    async removeFromFavorites(offerId) {
      const id = Number(offerId)
      const item = state().favorites.items.find((i) => Number(i.id) === id)
      if (item) await store.dispatch(toggleFavorite(item))
      return true
    },

    favoritesState,

    async addToCompare(offerId) {
      const id = Number(offerId)
      if (!id) return false
      if (!state().compare.items.some((i) => Number(i.id) === id)) {
        store.dispatch(addToCompare(await loadProduct(id)))
      }
      return true
    },

    async removeFromCompare(offerId) {
      const id = Number(offerId)
      const item = state().compare.items.find((i) => Number(i.id) === id)
      if (item) store.dispatch(removeFromCompare(item.id))
      return true
    },

    // В документации встречаются оба названия — объявляем оба
    compareState,
    comparesState: compareState,
  })
}
