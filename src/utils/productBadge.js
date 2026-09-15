/**
 * Модификатор цвета для бейджа товара (product.badge из API):
 * скидка в процентах ("-15%"), "Хит", "Новинка", "Акция".
 */
export function getBadgeClass(badge) {
  if (!badge) return ''
  if (badge.startsWith('-')) return 'sale'
  if (badge === 'Хит') return 'hit'
  if (badge === 'Новинка') return 'new'
  if (badge === 'Акция') return 'sale'
  return ''
}
