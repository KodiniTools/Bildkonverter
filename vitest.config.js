import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Chromium für den Browser-Modus finden.
 * Normalfall: `npx playwright install chromium` – Playwright findet den Browser selbst.
 * Fallback: ein bereits vorhandenes Chromium unter PLAYWRIGHT_BROWSERS_PATH (z.B. in CI-Images),
 * dessen Build-Nummer nicht zur Playwright-Version passt. Explizit per VITEST_CHROMIUM setzbar.
 */
function findChromium() {
  if (process.env.VITEST_CHROMIUM) return process.env.VITEST_CHROMIUM;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root || !fs.existsSync(root)) return undefined;
  const dir = fs
    .readdirSync(root)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort()
    .at(-1);
  const candidate = dir && path.join(root, dir, 'chrome-linux', 'chrome');
  return candidate && fs.existsSync(candidate) ? candidate : undefined;
}

const shared = {
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: { scss: { api: 'modern-compiler', quietDeps: true } },
  },
};

export default defineConfig({
  ...shared,
  test: {
    projects: [
      {
        // Reine Logik und Komponenten ohne Canvas: schnell, in happy-dom
        ...shared,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['tests/unit/**/*.spec.js'],
        },
      },
      {
        // Alles, was einen echten 2D-Canvas braucht (Renderer, Konvertierung)
        ...shared,
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.spec.js'],
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            screenshotFailures: false,
            instances: [
              {
                browser: 'chromium',
                launch: { executablePath: findChromium(), args: ['--no-sandbox'] },
              },
            ],
          },
        },
      },
    ],
  },
});
