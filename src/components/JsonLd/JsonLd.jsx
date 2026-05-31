import { Helmet } from 'react-helmet-async'

/**
 * Рендерит JSON-LD внутри <head> через react-helmet-async.
 * Принимает один объект или массив объектов; null/undefined игнорируются.
 *
 * Защита от XSS: данные сериализуются JSON.stringify; экранируем только
 * последовательность "</", чтобы не закрыть скрипт-тег раньше времени.
 */
function safeStringify(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

export default function JsonLd({ data }) {
  if (!data) return null
  const arr = Array.isArray(data) ? data.filter(Boolean) : [data]
  if (!arr.length) return null
  return (
    <Helmet>
      {arr.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {safeStringify(item)}
        </script>
      ))}
    </Helmet>
  )
}
