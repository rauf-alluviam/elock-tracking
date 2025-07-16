import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    proxy: {
      '/api': {
        // target: 'http://localhost:5004',
        target: "http://15.207.11.214:5004/api",
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
