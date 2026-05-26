import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 3000

async function createServer() {
  const app = express()

  let vite

  if (!isProduction) {
    // Dev: Vite как middleware — hot reload, трансформации
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)
  } else {
    // Prod: статика из dist/client (CSS, JS, картинки и т.д.)
    app.use(
      express.static(path.join(__dirname, 'dist/client'), { index: false })
    )
  }

  // Все запросы обрабатываем SSR
  app.use(async (req, res) => {
    const url = req.originalUrl

    try {
      let template, render

      if (!isProduction) {
        template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
      } else {
        template = fs.readFileSync(
          path.join(__dirname, 'dist/client/index.html'),
          'utf-8'
        )
        // Динамический импорт собранного SSR-бандла
        const serverEntry = await import(
          path.join(__dirname, 'dist/server/entry-server.js')
        )
        render = serverEntry.render
      }

      const { html: appHtml, helmet } = render(url)

      // Вставляем отрендеренный HTML
      let finalHtml = template.replace('<!--ssr-outlet-->', appHtml)

      // Обновляем <title> и мета из react-helmet-async
      if (helmet) {
        const titleStr = helmet.title?.toString() || ''
        if (titleStr) {
          finalHtml = finalHtml.replace(/<title>[^<]*<\/title>/, titleStr)
        }
        const metaStr = helmet.meta?.toString() || ''
        const linkStr = helmet.link?.toString() || ''
        if (metaStr || linkStr) {
          finalHtml = finalHtml.replace(
            '</head>',
            `${metaStr}${linkStr}</head>`
          )
        }
      }

      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(finalHtml)
    } catch (e) {
      if (!isProduction && vite) vite.ssrFixStacktrace(e)
      console.error(e.stack)
      res.status(500).end(e.message)
    }
  })

  app.listen(PORT, () => {
    console.log(`SSR server: http://localhost:${PORT}`)
  })
}

createServer()
