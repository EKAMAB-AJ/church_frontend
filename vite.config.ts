import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_API_URL points the app at the API, e.g. https://api.yourchurch.org/api/v1
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // in development, /api is forwarded to the local API so no CORS setup is needed
    proxy: { '/api': 'http://localhost:5000' },
  },
})
