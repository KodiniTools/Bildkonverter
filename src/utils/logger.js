/* eslint-disable no-console */
/**
 * logger - zentrale Konsolenausgabe
 *
 * log/info/debug erscheinen nur im Entwicklungsmodus (import.meta.env.DEV),
 * warn/error immer. Damit bleibt die Produktions-Konsole frei von
 * Statusmeldungen, ohne dass Aufrufstellen Bedingungen brauchen.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default logger;
