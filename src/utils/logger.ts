/* eslint-disable no-console */
/**
 * logger - zentrale Konsolenausgabe
 *
 * log/info/debug erscheinen nur im Entwicklungsmodus (import.meta.env.DEV),
 * warn/error immer. Damit bleibt die Produktions-Konsole frei von
 * Statusmeldungen, ohne dass Aufrufstellen Bedingungen brauchen.
 */
const isDev = import.meta.env.DEV;

type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs): void => {
    if (isDev) console.debug(...args);
  },
  log: (...args: LogArgs): void => {
    if (isDev) console.log(...args);
  },
  info: (...args: LogArgs): void => {
    if (isDev) console.info(...args);
  },
  warn: (...args: LogArgs): void => console.warn(...args),
  error: (...args: LogArgs): void => console.error(...args),
};

export default logger;
