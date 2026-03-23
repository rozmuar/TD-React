import DOMPurify from 'dompurify'

/**
 * Санитизирует HTML-строку, удаляя опасные скрипты и атрибуты.
 * Безопасно для вставки через dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  if (typeof window === 'undefined') {
    // Node.js fallback: удаляем script-теги и on*-атрибуты
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  }
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'frameborder'],
  })
}
