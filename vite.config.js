import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ isSsrBuild, mode }) => {
  // Бэкенд для dev-прокси — тот же VITE_BACKEND_ORIGIN, что и в
  // src/config/backend.js (`npm run dev:newback` → .env.newback).
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const backend = (env.VITE_BACKEND_ORIGIN || 'https://back.topdisc.ru').replace(/\/+$/, '')
  const toBackend = (from, to) => ({
    target: backend,
    changeOrigin: true,
    secure: false,
    cookieDomainRewrite: '',
    rewrite: (path) => path.replace(from, to),
  })

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    target: 'es2015',
    rollupOptions: {
      output: {
        // SSR-бандл — единый файл, клиентский — чанки
        manualChunks: isSsrBuild ? undefined : function (id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'router'
          }
          if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/redux') || id.includes('node_modules/react-redux') || id.includes('node_modules/immer')) {
            return 'redux'
          }
          if (id.includes('node_modules/swiper')) {
            return 'swiper'
          }
          if (id.includes('node_modules/axios') || id.includes('node_modules/dompurify') || id.includes('node_modules/react-helmet-async') || id.includes('node_modules/helmet')) {
            return 'vendor'
          }
          if (id.includes('/src/pages/Personal/')) {
            return 'personal'
          }
          if (id.includes('/src/pages/Cart/')) {
            return 'cart'
          }
          if (id.includes('/src/pages/Catalog/') || id.includes('/src/pages/Category/') || id.includes('/src/pages/Product/') || id.includes('/src/pages/Brands/')) {
            return 'catalog'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react-router-dom'],
  },
  server: {
    proxy: {
      '/api/mobile': toBackend(/^\/api\/mobile/, '/mobile'),
      '/api/rest': toBackend(/^\/api\/rest/, '/rest'),
    },
  },
  ssr: {
    noExternal: true, // Включаем ВСЕ зависимости в SSR бандл
    target: 'node',
    format: 'esm',
  },
  }
})
