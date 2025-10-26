import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Base-Pfad: nur für Produktion '/bildkonverter/', für Dev '/'
  const base = command === 'build' ? '/bildkonverter/' : '/'

  return {
    plugins: [vue()],

    // Base-Pfad für den Server
    base,

    // Build-Optionen
    build: {
      outDir: 'dist',
      assetsDir: 'assets',

      // Minifizierung ohne Terser (verwendet esbuild)
      minify: 'esbuild',

      // Source Maps für Debugging (optional, kann auf false gesetzt werden)
      sourcemap: false,

      // Chunk-Größen-Warnung
      chunkSizeWarningLimit: 1000,

      // Rollup-Optionen
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue'],
          },
          // Asset-Namen mit Hash für Cache-Busting
          assetFileNames: 'assets/[name].[hash].[ext]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
        }
      }
    },

    // Server-Konfiguration für lokale Entwicklung
    server: {
      port: 5173,
      host: true,
      // Automatisches Öffnen im Browser
      open: true,
      // Force reload bei bestimmten Änderungen
      watch: {
        usePolling: true  // Hilft bei Windows-Problemen
      }
    },

    // Resolve-Optionen
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
