import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // WICHTIG: Base-Path für Subdomain
  base: '/bilderseriebearbeiten/',
  
  plugins: [
    vue(),
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  
  build: {
    // Output-Verzeichnis
    outDir: 'dist',
    
    // Keine Source-Maps in Production (optional)
    sourcemap: false,
    
    // Chunk-Splitting für besseres Caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'i18n': ['i18next'],
        }
      }
    },
    
    // Asset-Dateinamen mit Hash
    assetsDir: 'assets',
    
    // Optimierung
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Console-Logs entfernen
        drop_debugger: true,
      }
    },
    
    // Chunk-Größe Warnung
    chunkSizeWarningLimit: 1000,
  },
  
  // Server-Einstellungen für lokale Entwicklung
  server: {
    port: 5173,
    host: true,
    
    // Proxy für API-Entwicklung (falls später benötigt)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:9003',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/bilderseriebearbeiten/, '')
    //   }
    // }
  },
  
  // Preview-Server (für Build-Test)
  preview: {
    port: 4173,
    host: true,
  }
})
