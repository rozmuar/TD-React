import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ isSsrBuild }) => ({
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
  server: {
    proxy: {
      '/api/mobile': {
        target: 'https://topdisc.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mobile/, '/mobile'),
      },
    },
  },
}))
