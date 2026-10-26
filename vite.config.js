import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devApiTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      // Keep local development same-origin so cookie auth and CSRF work even
      // when Django intentionally allows only the production storefronts.
      proxy: {
        '/backend': {
          target: devApiTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/backend/, ''),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
