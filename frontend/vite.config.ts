import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-leaflet') || id.includes('leaflet')) {
            return 'maps'
          }
          if (id.includes('recharts')) {
            return 'charts'
          }
          if (id.includes('@tremor') || id.includes('@tanstack')) {
            return 'dashboard-vendor'
          }
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor'
          }
          if (id.includes('axios') || id.includes('date-fns') || id.includes('lucide-react')) {
            return 'ui-vendor'
          }
          return undefined
        },
      },
    },
  },
})
