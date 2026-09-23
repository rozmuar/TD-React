// Старый REST (app_mobile.*.json) и mobile/v1 отдают ссылки на файлы уже
// готовыми абсолютными URL вида "https://topdisc.ru/upload/..." — сам Bitrix
// ещё не знает, что его домен сменился на back.topdisc.ru (настройка "адрес
// сайта" в админке не обновлена), и topdisc.ru эти файлы больше не отдаёт
// вообще. Приводим такие ссылки к правильному абсолютному URL на
// back.topdisc.ru. Общий код для apiClient.js (браузер) и
// src/ssr/fetchPageData.js (SSR) — раньше SSR использовал отдельные axios-
// инстансы без этой обработки, из-за чего в серверно отрисованном HTML
// оставались "сырые" ссылки на topdisc.ru.
const STALE_HOST_RE = /^https?:\/\/(?:back\.)?topdisc\.ru(\/.*)?$/i

export function stripStaleHost(value) {
  if (typeof value === 'string') {
    const m = value.match(STALE_HOST_RE)
    if (!m) return value
    // Без пути (голый "https://topdisc.ru") — это Bitrix-плейсхолдер
    // "картинки/файла нет", а не реальная ссылка.
    if (!m[1]) return ''
    return `https://back.topdisc.ru${m[1]}`
  }
  if (Array.isArray(value)) return value.map(stripStaleHost)
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = stripStaleHost(value[key])
    return value
  }
  return value
}
