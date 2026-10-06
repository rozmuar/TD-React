import express from 'express'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 3000

console.log('🚀 Starting server...')
console.log('📦 NODE_ENV:', process.env.NODE_ENV)
console.log('🏭 isProduction:', isProduction)
console.log('📁 __dirname:', __dirname)

async function createServer() {
  const app = express()

  let vite

  if (!isProduction) {
    console.log('🔧 Starting in DEVELOPMENT mode with Vite')
    // Dev: Vite как middleware — hot reload, трансформации
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)
  } else {
    console.log('⚡ Starting in PRODUCTION mode with built files')
    const distServerPath = path.join(__dirname, 'dist/server')
    const distClientPath = path.join(__dirname, 'dist/client')
    console.log('📂 Server dist path:', distServerPath)
    console.log('📂 Client dist path:', distClientPath)
    console.log('📄 Server entry exists:', fs.existsSync(path.join(distServerPath, 'entry-server.js')))
    console.log('📄 Client index exists:', fs.existsSync(path.join(distClientPath, 'index.html')))
    // Prod: статика из dist/client (CSS, JS, картинки и т.д.)
    app.use(
      express.static(distClientPath, { index: false })
    )
  }

  // Страницы, которые зависят от авторизации — SSR не делаем,
  // отдаём чистый HTML-шелл, клиент рендерит сам (нет hydration mismatch)
  const CLIENT_ONLY_RE = /^\/(?:cart|personal|compare|favorites)\//

  // Карточка товара — канонический URL без слеша на конце (как на topdisc.ru),
  // категории/инфостраницы, наоборот, со слешем — их не трогаем.
  // /catalog/<section>/<code>/ → 301 → /catalog/<section>/<code>
  const PRODUCT_TRAILING_SLASH_RE = /^\/(catalog|catalog_oth)\/([^/]+)\/([^/]+)\/$/

  // Старая ссылка с back.topdisc.ru (QR-коды/ценники в магазине, ?code=<артикул>,
  // напр. ?code=20258761&utm_source=shop_tag) — back.topdisc.ru больше не отдаёт
  // публичный HTML вообще (только API), поэтому редирект на страницу товара
  // теперь делает сам фронтенд: резолвим артикул через REST (app_mobile.
  // findProductByArticle.json, см. api_metods.php) и 301-редиректим на
  // /catalog/:categoryCode/:productCode, сохраняя остальные query-параметры
  // (utm_source и т.п.) — как и раньше делал сам PHP-скрипт.
  const BITRIX_REST_URL =
    process.env.VITE_BITRIX_REST_URL || 'https://back.topdisc.ru/rest/28531/ky7kc0zinte6jb7e'

  // Т-Банк шлёт подтверждение оплаты (и редиректит браузер клиента) на
  // старый путь topdisc.ru/personal/order/success.php — Notification URL
  // в личном кабинете Т-Банка указывает именно на topdisc.ru (не на
  // back.topdisc.ru, где реально живёт Bitrix и проверяет подпись банка),
  // поменять это в кабинете банка нельзя/неудобно. Поэтому ретранслируем
  // запрос как есть на реальный обработчик Bitrix — мы тут ничего не
  // парсим и не доверяем содержимому, просто пересылаем сырые данные,
  // подпись проверяет сам Bitrix на back.topdisc.ru.
  const TBANK_CALLBACK_PATH = '/personal/order/success.php'
  const TBANK_NOTIFICATION_PATHS = [TBANK_CALLBACK_PATH, '/personal/order/notification.php']
  const BITRIX_NOTIFICATION_URL = 'https://back.topdisc.ru/personal/order/notification.php'

  async function resolveFindByCode(req, res) {
    const params = new URLSearchParams(req.query)
    const code = params.get('code')
    params.delete('code')
    const restQs = params.toString()

    if (!code) {
      return res.redirect(301, '/catalog/')
    }

    try {
      const apiRes = await axios.get(`${BITRIX_REST_URL}/app_mobile.findProductByArticle.json`, {
        params: { code },
        timeout: 6000,
      })
      const result = apiRes.data?.result

      if (result?.error === 0 && result.section_code && result.product_code) {
        const target = `/catalog/${result.section_code}/${result.product_code}${restQs ? `?${restQs}` : ''}`
        return res.redirect(301, target)
      }
    } catch (e) {
      console.error('[find_by_code] resolve error:', e.message)
    }

    return res.redirect(301, '/catalog/')
  }

  // ВРЕМЕННЫЙ логгер всех POST-запросов (диагностика: куда и что шлёт Т-Банк).
  // Пишет в logs/post-requests.log (одна JSON-строка на запрос). Удалить после
  // диагностики.
  const POST_LOG_DIR = path.join(__dirname, 'logs')
  const POST_LOG_FILE = path.join(POST_LOG_DIR, 'post-requests.log')
  const SKIP_LOG_HEADERS = new Set(['cookie', 'authorization'])

  app.use((req, res, next) => {
    if (req.method !== 'POST') return next()
    express.raw({ type: '*/*', limit: '2mb' })(req, res, (err) => {
      if (err) return next(err)
      const bodyText = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : ''
      const headers = {}
      for (const [k, v] of Object.entries(req.headers)) {
        if (!SKIP_LOG_HEADERS.has(k)) headers[k] = v
      }
      const entry = {
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        headers,
        bodyBytes: bodyText.length,
        body: bodyText.slice(0, 5000),
      }
      fs.mkdir(POST_LOG_DIR, { recursive: true }, () => {
        fs.appendFile(POST_LOG_FILE, JSON.stringify(entry) + '\n', () => {})
      })
      console.log('[POST]', entry.time, entry.url, `(${bodyText.length} bytes)`)
      next()
    })
  })

  // POST — настоящее серверное уведомление от Т-Банка (сервер-сервер,
  // никакого браузера), ретранслируем целиком и отдаём банку ровно то,
  // что ответил Bitrix (он сам решает, что должен увидеть банк).
  app.post(TBANK_NOTIFICATION_PATHS, async (req, res) => {
    const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''
    try {
      const backendRes = await axios.post(BITRIX_NOTIFICATION_URL, req.body, {
        headers: { 'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded' },
        responseType: 'arraybuffer',
        validateStatus: () => true,
        timeout: 15000,
      })
      const backendBody = Buffer.from(backendRes.data)
      const notifiedOrder = ((Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '').match(/"OrderId"\s*:\s*"(\d+)/) || [])[1] || '?'
      console.log('[TBANK relay] POST', req.originalUrl.split('?')[0], 'order', notifiedOrder, '→ bitrix', backendRes.status, JSON.stringify(backendBody.toString('utf8').slice(0, 300)))
      res.status(backendRes.status)
      if (backendRes.headers['content-type']) res.set('Content-Type', backendRes.headers['content-type'])
      res.end(backendBody)
    } catch (e) {
      console.error('[TBANK webhook relay] POST error:', e.message)
      res.status(502).end('Bad Gateway')
    }
  })

  // GET — визит браузера клиента после оплаты (и, возможно, тот же колбэк,
  // если в кабинете банка настроен один общий URL без различия методов).
  // Ретранслируем в фоне (не блокируя страницу надолго), затем в любом
  // случае показываем клиенту обычную SPA-страницу результата оплаты —
  // next() передаёт запрос дальше, в общий SSR-обработчик ниже.
  app.get(TBANK_CALLBACK_PATH, async (req, res) => {
    const orderId = String(req.query.OrderId || '').split('/')[0]
    if (!/^\d+$/.test(orderId)) {
      return res.redirect(302, '/personal/orders/')
    }
    return res.redirect(302, `/cart/payment-result/${orderId}/`)
  })

  // Все запросы обрабатываем SSR
  app.use(async (req, res) => {
    const url = req.originalUrl
    const urlPath = url.split('?')[0]

    if (urlPath === '/catalog/find_by_code.php') {
      return resolveFindByCode(req, res)
    }

    const productSlashMatch = urlPath.match(PRODUCT_TRAILING_SLASH_RE)
    if (productSlashMatch) {
      const [, prefix, section, code] = productSlashMatch
      const qs = url.includes('?') ? url.slice(url.indexOf('?')) : ''
      return res.redirect(301, `/${prefix}/${section}/${code}${qs}`)
    }

    try {
      let template, render

      if (!isProduction) {
        console.log('🔧 DEV: Loading entry-server via vite.ssrLoadModule')
        template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        // Для авторизованных страниц — отдаём шелл без SSR
        if (CLIENT_ONLY_RE.test(urlPath)) {
          const shell = template.replace('<!--ssr-outlet-->', '')
          return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(shell)
        }
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
      } else {
        console.log('⚡ PROD: Loading entry-server from dist/server')
        const serverEntryPath = path.join(__dirname, 'dist/server/entry-server.js')
        console.log('📄 Importing from:', serverEntryPath)
        template = fs.readFileSync(
          path.join(__dirname, 'dist/client/index.html'),
          'utf-8'
        )
        // Для авторизованных страниц — отдаём шелл без SSR
        if (CLIENT_ONLY_RE.test(urlPath)) {
          const shell = template.replace('<!--ssr-outlet-->', '')
          return res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(shell)
        }
        // Динамический импорт собранного SSR-бандла
        // pathToFileURL: dynamic import() needs a valid file:// URL on Windows
        // (a raw "D:\..." path throws ERR_UNSUPPORTED_ESM_URL_SCHEME there)
        const serverEntry = await import(pathToFileURL(serverEntryPath).href)
        render = serverEntry.render
      }

      const { html: appHtml, helmet, ssrData } = await render(url)

      // Вставляем отрендеренный HTML
      let finalHtml = template.replace('<!--ssr-outlet-->', appHtml)

      // Обновляем <title>, мета, ссылки и JSON-LD из react-helmet-async
      if (helmet) {
        const titleStr = helmet.title?.toString() || ''
        if (titleStr) {
          finalHtml = finalHtml.replace(/<title>[^<]*<\/title>/, titleStr)
        }
        const metaStr = helmet.meta?.toString() || ''
        const linkStr = helmet.link?.toString() || ''
        const scriptStr = helmet.script?.toString() || ''

        // Если страница сама задаёт description/keywords/OG/Twitter-теги —
        // убираем дефолтные из index.html, иначе поисковик/соцсеть берёт
        // первый (статический, общий) тег и игнорирует наш, специфичный
        // для страницы.
        const OVERRIDABLE_META = [
          'name="description"',
          'name="keywords"',
          'property="og:type"',
          'property="og:title"',
          'property="og:description"',
          'property="og:image"',
          'property="twitter:card"',
          'property="twitter:title"',
          'property="twitter:description"',
          'property="twitter:image"',
        ]
        for (const attr of OVERRIDABLE_META) {
          if (metaStr.includes(attr)) {
            finalHtml = finalHtml.replace(new RegExp(`<meta ${attr}[^>]*>\\s*`), '')
          }
        }

        // JSON-LD (schema.org) рендерится через <script> внутри Helmet
        // (см. JsonLd.jsx) — без scriptStr вся структурированная разметка
        // (Product/CollectionPage/BreadcrumbList) молча терялась при SSR.
        if (metaStr || linkStr || scriptStr) {
          finalHtml = finalHtml.replace(
            '</head>',
            `${metaStr}${linkStr}${scriptStr}</head>`
          )
        }
      }

      // Инжектируем предзагруженные данные для гидратации без мигания
      if (ssrData) {
        const dataScript = `<script>window.__SSR_DATA__=${JSON.stringify(ssrData)}</script>`
        finalHtml = finalHtml.replace('</head>', `${dataScript}</head>`)
      }

      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(finalHtml)
    } catch (e) {
      if (!isProduction && vite) {
        try {
          vite.ssrFixStacktrace(e)
        } catch (stackErr) {
          // Игнорируем ошибки в обработке stack trace
        }
      }
      console.error(e.stack)
      res.status(500).end(e.message)
    }
  })

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`SSR server: http://localhost:${PORT}`)
  })
}

createServer()
