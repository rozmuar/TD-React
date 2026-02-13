# Развертывание и Production

## Подготовка к развертыванию

### 1. Проверка окружения

Убедитесь, что все переменные окружения настроены правильно:

**.env для production:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_USE_MOCK_DATA=false
```

### 2. Сборка проекта

```bash
npm run build
```

Это создаст оптимизированную сборку в папке `dist/`.

### 3. Проверка сборки локально

```bash
npm run preview
```

Откроется preview сборки на `http://localhost:4173`.

## Варианты развертывания

### Vercel (Рекомендуется)

**Преимущества:**
- Автоматическое развертывание из Git
- Бесплатный SSL
- CDN по всему миру
- Автоматическая оптимизация

**Шаги:**

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в аккаунт:
```bash
vercel login
```

3. Разверните проект:
```bash
vercel
```

4. Для production развертывания:
```bash
vercel --prod
```

**Конфигурация (vercel.json):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlify

**Преимущества:**
- Простое развертывание
- Бесплатный SSL
- Continuous Deployment

**Шаги:**

1. Создайте файл `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Подключите репозиторий GitHub к Netlify
3. Настройте переменные окружения в панели Netlify

### GitHub Pages

**Преимущества:**
- Бесплатный хостинг
- Интеграция с GitHub

**Шаги:**

1. Установите пакет:
```bash
npm install --save-dev gh-pages
```

2. Добавьте в `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/repository-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Обновите `vite.config.js`:
```javascript
export default defineConfig({
  base: '/repository-name/',
  // ... остальная конфигурация
})
```

4. Разверните:
```bash
npm run deploy
```

### Docker

**Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api-server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://api-server:3001/api
    depends_on:
      - api-server

  api-server:
    image: your-api-image
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
```

**Команды:**
```bash
# Сборка
docker build -t topdisk-shop .

# Запуск
docker run -p 80:80 topdisk-shop

# С docker-compose
docker-compose up -d
```

## Оптимизация Production

### 1. Анализ размера бандла

```bash
npm run build -- --mode analyze
```

Или установите плагин:
```bash
npm install --save-dev rollup-plugin-visualizer
```

Обновите `vite.config.js`:
```javascript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ]
})
```

### 2. Code Splitting

Vite автоматически разделяет код, но вы можете улучшить это:

```javascript
// Lazy loading страниц
const Home = lazy(() => import('./pages/Home/Home'))
const Catalog = lazy(() => import('./pages/Catalog/Catalog'))

function App() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
      </Routes>
    </Suspense>
  )
}
```

### 3. Image Optimization

Используйте WebP формат и lazy loading:

```jsx
<img
  src="/img/product/image.webp"
  alt="Product"
  loading="lazy"
  decoding="async"
/>
```

Или используйте плагин:
```bash
npm install --save-dev vite-plugin-imagemin
```

### 4. Кэширование

Настройте правильные заголовки кэширования в nginx:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 5. Gzip/Brotli сжатие

Установите плагин:
```bash
npm install --save-dev vite-plugin-compression
```

```javascript
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ]
})
```

## Мониторинг и аналитика

### Google Analytics

```javascript
// src/utils/analytics.js
export const initGA = () => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('js', new Date())
    window.gtag('config', 'GA_MEASUREMENT_ID')
  }
}

export const logPageView = (url) => {
  window.gtag('config', 'GA_MEASUREMENT_ID', {
    page_path: url
  })
}
```

В App.jsx:
```jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logPageView } from './utils/analytics'

function App() {
  const location = useLocation()

  useEffect(() => {
    logPageView(location.pathname + location.search)
  }, [location])

  return <Routes>...</Routes>
}
```

### Sentry для отслеживания ошибок

```bash
npm install --save @sentry/react @sentry/tracing
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react"
import { BrowserTracing } from "@sentry/tracing"

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
})
```

## Performance чеклист

- [ ] Минификация JS/CSS
- [ ] Tree shaking неиспользуемого кода
- [ ] Code splitting и lazy loading
- [ ] Оптимизация изображений
- [ ] Использование CDN
- [ ] Кэширование статических ресурсов
- [ ] Gzip/Brotli сжатие
- [ ] Удаление console.log в production
- [ ] Source maps только для debugging
- [ ] Настройка CSP заголовков
- [ ] HTTPS с правильными сертификатами

## SEO оптимизация

### 1. React Helmet для meta тегов

```bash
npm install react-helmet-async
```

```jsx
import { Helmet } from 'react-helmet-async'

function Product({ product }) {
  return (
    <>
      <Helmet>
        <title>{product.name} - TopDisk</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:image" content={product.image} />
      </Helmet>
      {/* ... */}
    </>
  )
}
```

### 2. Sitemap

Создайте `public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/catalog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### 3. robots.txt

Создайте `public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml
```

## Безопасность

### 1. Переменные окружения

Никогда не храните секретные ключи в .env файлах для frontend.
Используйте их только для публичных настроек.

### 2. Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

### 3. HTTPS

Всегда используйте HTTPS в production.

## Чеклист перед развертыванием

- [ ] Все переменные окружения настроены
- [ ] Исправлены все ESLint warnings
- [ ] Проверена работа на разных браузерах
- [ ] Протестирована адаптивность
- [ ] Оптимизированы изображения
- [ ] Настроен мониторинг ошибок
- [ ] Добавлена аналитика
- [ ] Настроено кэширование
- [ ] Проверена производительность (Lighthouse)
- [ ] Настроены meta теги для SEO
- [ ] Созданы sitemap.xml и robots.txt
- [ ] Проверена безопасность

## Полезные команды

```bash
# Анализ производительности
npm run build && npm run preview

# Проверка типов (если используете TypeScript)
npm run type-check

# Линтинг
npm run lint

# Очистка кэша
rm -rf node_modules dist .vite
npm install
```

## Troubleshooting

### Проблема: Роуты не работают после деплоя

**Решение:** Настройте fallback на index.html на вашем сервере/хостинге.

### Проблема: API запросы не работают

**Решение:** Проверьте CORS настройки на backend и правильность VITE_API_BASE_URL.

### Проблема: Медленная загрузка

**Решение:** 
1. Проверьте размер бандла
2. Включите code splitting
3. Оптимизируйте изображения
4. Используйте CDN

## Контакты и поддержка

Для вопросов и поддержки:
- Email: support@topdisk.ru
- GitHub Issues: [ссылка на репозиторий]
