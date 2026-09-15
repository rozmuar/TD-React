import express from 'express'
import fs from 'fs'
import path from 'path'
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

  // Все запросы обрабатываем SSR
  app.use(async (req, res) => {
    const url = req.originalUrl
    const urlPath = url.split('?')[0]

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

        // Если страница сама задаёт description — убираем дефолтный
        // из index.html, иначе поисковик берёт первый (статический)
        // тег и игнорирует наш, специфичный для страницы.
        if (metaStr.includes('name="description"')) {
          finalHtml = finalHtml.replace(/<meta name="description"[^>]*>\s*/, '')
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

  app.listen(PORT, () => {
    console.log(`SSR server: http://localhost:${PORT}`)
  })
}

createServer()
