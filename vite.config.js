import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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
    outDir: 'dist',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react'
          }
          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'router'
          }
          // Redux
          if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/redux') || id.includes('node_modules/react-redux') || id.includes('node_modules/immer')) {
            return 'redux'
          }
          // Swiper (тяжёлая библиотека слайдера)
          if (id.includes('node_modules/swiper')) {
            return 'swiper'
          }
          // Axios + DOMPurify + утилиты
          if (id.includes('node_modules/axios') || id.includes('node_modules/dompurify') || id.includes('node_modules/react-helmet-async') || id.includes('node_modules/helmet')) {
            return 'vendor'
          }
          // Страницы личного кабинета (уже lazy)
          if (id.includes('/src/pages/Personal/')) {
            return 'personal'
          }
          // Страницы корзины/чекаута
          if (id.includes('/src/pages/Cart/')) {
            return 'cart'
          }
          // Страницы каталога
          if (id.includes('/src/pages/Catalog/') || id.includes('/src/pages/Category/') || id.includes('/src/pages/Product/') || id.includes('/src/pages/Brands/')) {
            return 'catalog'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/mobile': {
        target: 'https://topdisc.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mobile/, '/mobile'),
      },
    },
  },
})
