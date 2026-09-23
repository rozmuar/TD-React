import { useSelector } from 'react-redux'

// Оптовик видит цену ценовой группы "опт" (opt_price с бэкенда) вместо розничной.
// Если у товара оптовой цены нет — остаётся розничная, без пометки.
export function useWholesalePrice(product) {
  const isWholesaleUser = useSelector((s) => Boolean(s.auth?.user?.is_wholesale))
  const optPrice = parseFloat(product?.opt_price ?? product?.optPrice)
  const isOpt = isWholesaleUser && optPrice > 0
  const price = isOpt ? optPrice : product?.price

  return { price, isOpt }
}
