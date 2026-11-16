import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import { prerenderPages } from './src/seo/prerender';

// Desktop-Build (Windows-App, src-tauri/): `vite build --mode desktop`.
// Die App liegt dort im Wurzelpfad von http://tauri.localhost und wird nach
// dist-desktop/ gebaut, damit dist/ (Web-Deploy) unberührt bleibt.

/**
 * Schreibt nach dem Web-Build pro Seite und Sprache ein HTML mit fertigem Head
 * nach dist/_seo/<lang>/<seite>.html (Titel, Description, Canonical, hreflang, lang).
 * nginx liefert diese Dateien für /bildkonverter/<seite>[?lang=en] aus (DEPLOYMENT.md).
 */
function seoPrerender(): Plugin {
  let outDir = 'dist';
  let logger: ResolvedConfig['logger'] | undefined;
  return {
    name: 'bildkonverter:seo-prerender',
    apply: (_config, { command, mode }) => command === 'build' && mode !== 'desktop',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      logger = config.logger;
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      const files = prerenderPages(template);
      for (const { file, html } of files) {
        const target = path.join(outDir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, html);
      }
      logger?.info(`SEO-Prerender: ${files.length} HTML-Dateien in _seo/ geschrieben`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), seoPrerender()],

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
