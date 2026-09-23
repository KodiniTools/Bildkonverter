module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier'],
  plugins: ['vue', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
    'vue/multi-word-component-names': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // App-Code nutzt den Logger (src/utils/logger.js), keine direkte Konsole
    'no-console': 'error',
  },
  overrides: [
    {
      // Node-Skripte und Tests dürfen direkt auf die Konsole schreiben
      files: ['*.js', '*.cjs', '*.mjs', 'backend-deploy/**/*.js', 'tests/**/*.js'],
      excludedFiles: ['src/**'],
      rules: { 'no-console': 'off' },
    },
  ],
};
