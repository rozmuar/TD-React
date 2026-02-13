/**
 * Декодирует HTML-сущности в строке
 * @param {string} text - Текст с HTML-сущностями
 * @returns {string} - Декодированный текст
 */
export function decodeHtml(text) {
  if (!text) return text
  
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}
