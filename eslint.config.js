import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import {
  configureVueProject,
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript';

// Schrittweise Migration nach TypeScript: .vue-Dateien dürfen noch JS-Skripte haben.
configureVueProject({ scriptLangs: ['ts', 'js'] });

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,cjs,mjs,ts,mts,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-desktop/**',
      'src-tauri/**',
      '**/node_modules/**',
      'public/**',
      '**/*.min.js',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  {
    name: 'app/globals',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  prettierRecommended,
  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off',
      // caughtErrors: 'none' wie bisher unter ESLint 8 (catch (e) ohne Nutzung bleibt erlaubt)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // App-Code nutzt den Logger (src/utils/logger.ts), keine direkte Konsole
      'no-console': 'error',
      // Neu mit ESLint 10 / typescript-eslint. Bestehende Treffer sind Altlasten und
      // werden gemeldet, nicht im Tooling-Schritt geändert; deshalb vorerst Warnung.
      'no-useless-assignment': 'warn',
      'preserve-caught-error': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    // Node-Skripte, Konfiguration und Tests dürfen direkt auf die Konsole schreiben
    name: 'app/node-scripts-and-tests',
    files: ['*.{js,cjs,mjs,ts}', 'backend-deploy/**/*.js', 'tests/**/*.js', 'e2e/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // Tests dürfen kleine Host-Komponenten inline definieren (z. B. ColorField.spec)
    name: 'app/tests-inline-components',
    files: ['tests/**/*.{js,ts}'],
    rules: { 'vue/one-component-per-file': 'off' },
  },
  {
    // UI-Bausteine (Kopie aus dem Collage Maker): optionale Props sind per
    // TypeScript optional, ein explizites `undefined`-Default bringt nichts.
    name: 'app/ui-components',
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/require-default-prop': 'off',
    },
  },
  {
    // CommonJS-Node-Skript (wird direkt mit node ausgeführt)
    name: 'app/commonjs-scripts',
    files: ['deploy-check.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  }
);
