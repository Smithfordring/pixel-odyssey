import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [vue()],
  server: {
    // Bind IPv4 explicitly. The default localhost listener on this machine was IPv6-only.
    host: '127.0.0.1',
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    proxy: apiProxy,
  },
})
