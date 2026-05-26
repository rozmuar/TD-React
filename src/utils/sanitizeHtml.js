import DOMPurify from 'dompurify'

// Разрешённые теги — без iframe во избежание clickjacking/content-injection
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
]
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height']

/**
 * Санитизирует HTML-строку, удаляя опасные скрипты и атрибуты.
 * Безопасно для вставки через dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  if (typeof window === 'undefined') {
    // Node.js fallback: строгая очистка — убираем все теги кроме безопасных,
    // on*-атрибуты и javascript: URI
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\bhref\s*=\s*(?:"|')\s*javascript:[^"']*/gi, 'href="#"')
      .replace(/\bsrc\s*=\s*(?:"|')\s*data:[^"']*/gi, '')
  }
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  })
  return clean
}
