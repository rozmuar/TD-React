import puppeteer from 'puppeteer'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BITRIX_REST_URL = process.env.VITE_BITRIX_REST_URL || 'https://topdisc.ru/rest/28531/ky7kc0zinte6jb7e'

let previewServer = null

async function getRoutes() {
  console.log('📡 Fetching categories from API...')
  
  try {
    const response = await axios.get(
      `${BITRIX_REST_URL}/app_mobile.categoryFirst.json`
    )
    
    const categories = response.data.result || []
    console.log(`✅ Found ${categories.length} categories\n`)
    
    const routes = [
      '/',
      '/catalog/',
      '/o-nas/',
      '/dostavka/',
      '/contacts/',
      '/payment/',
      '/company/news/',
    ]
   for (const category of categories.slice(0, 10)) {
      routes.push(`/category/${category.code}/`)
    }
    
    return routes
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message)
    return ['/', '/catalog/', '/o-nas/', '/dostavka/', '/contacts/']
  }
}

async function startPreviewServer() {
  return new Promise((resolve, reject) => {
    let fullOutput = ''
    
    previewServer = spawn('npm', ['run', 'preview'], {
      shell: true,
      stdio: 'pipe',
      cwd: __dirname
    })

    previewServer.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(output)
      
      // Накапливаем вывод и убираем ANSI коды
      fullOutput += output.replace(/\x1b\[[0-9;]*m/g, '')
      
      // Ищем URL в накопленном выводе
      const match = fullOutput.match(/http:\/\/localhost:(\d+)/)
      if (match) {
        const url = match[0]
        console.log(`\n✅ Server started: ${url}\n`)
        setTimeout(() => resolve(url), 2000)
      }
    })

    previewServer.stderr.on('data', (data) => {
      console.error(data.toString())
    })

    setTimeout(() => reject(new Error('Preview server timeout')), 30000)
  })
}

async function prerenderPage(browser, baseUrl, route) {
  const page = await browser.newPage()
  
  try {
    const url = baseUrl + route.substring(0, route.length - 1)
    console.log(`\n📄 Rendering: ${url}`)
    
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    // Ждём пока React отрендерит что-то в #root (не пустой div)
    try {
      await page.waitForFunction(
        () => {
          const root = document.getElementById('root')
          return root && root.children.length > 0 && root.textContent.trim().length > 50
        },
        { timeout: 10000 }
      )
      console.log('✅ Content rendered')
    } catch (e) {
      console.log('⚠️  Saving as-is (wait timeout)...')
    }

    const html = await page.content()
    
    // Сохраняем
    let filePath
    if (route === '/') {
      filePath = path.join(__dirname, 'dist', 'index.html')
    } else {
      const dir = path.join(__dirname, 'dist', route.substring(0, route.length - 1))
      fs.mkdirSync(dir, { recursive: true })
      filePath = path.join(dir, 'index.html')
    }
    
    fs.writeFileSync(filePath, html, 'utf8')
    console.log(`💾 Saved: ${filePath.replace(__dirname, '')}`)
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
  } finally {
    await page.close()
  }
}

async function main() {
  console.log('🚀 Starting prerender...\n')
  
  try {
    const routes = await getRoutes()
    console.log(`📋 Will render ${routes.length} pages\n`)
    
    console.log('📦 Starting preview server...')
    const baseUrl = await startPreviewServer()
    console.log(`✅ Server ready: ${baseUrl}\n`)
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    for (const route of routes) {
      await prerenderPage(browser, baseUrl, route)
    }
    
    await browser.close()
    console.log('\n✅ Prerendering complete!')
    
  } catch (error) {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  } finally {
    if (previewServer) {
      previewServer.kill()
      console.log('🛑 Server stopped')
    }
    process.exit(0)
  }
}

main()
