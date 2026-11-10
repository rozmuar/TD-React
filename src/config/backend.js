// Всё, что привязывает фронтенд к конкретной установке Bitrix-бэкенда, —
// в одном месте. Значения по умолчанию = текущий прод (back.topdisc.ru);
// другой бэк подключается через env, без правок кода. Например,
// `npm run dev:newback` берёт .env.newback (новый чистый бэк
// cw325546.tw1.ru, 2026-11-10 — там другие ID инфоблоков и вебхука).

const env = import.meta.env || {}

// Origin Bitrix-бэкенда: картинки/файлы (/upload/...), заглушки, ссылки.
export const BACKEND_ORIGIN = (env.VITE_BACKEND_ORIGIN || 'https://back.topdisc.ru').replace(/\/+$/, '')

// "{USER_ID}/{КЛЮЧ}" входящего вебхука для app_mobile.* (/rest/{...}/).
export const REST_WEBHOOK = env.VITE_REST_WEBHOOK || '28531/ky7kc0zinte6jb7e'

// ID инфоблоков, которые фронт передаёт в mobile/v1 (/filter/{iblock}/...).
export const CATALOG_IBLOCK_ID = Number(env.VITE_CATALOG_IBLOCK_ID) || 4
export const PREMIUM_IBLOCK_ID = Number(env.VITE_PREMIUM_IBLOCK_ID) || 71
