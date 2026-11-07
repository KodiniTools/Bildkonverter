import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// Desktop-Build (Windows-App, src-tauri/): `vite build --mode desktop`.
// Die App liegt dort im Wurzelpfad von http://tauri.localhost und wird nach
// dist-desktop/ gebaut, damit dist/ (Web-Deploy) unberührt bleibt.

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],

  // Base-Pfad für den Server
  base: mode === 'desktop' ? '/' : '/bildkonverter/',

  // Build-Optionen
  build: {
    outDir: mode === 'desktop' ? 'dist-desktop' : 'dist',
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
          vendor: ['vue'],
        },
        // Asset-Namen mit Hash für Cache-Busting
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },

  // Server-Konfiguration für lokale Entwicklung
  server: {
    port: 5173,
    host: true,
  },

  // CSS / Sass Optionen
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        // Unterdrückt Deprecation-Warnings für @import in externen Abhängigkeiten
        quietDeps: true,
      },
    },
  },

  // Resolve-Optionen
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
