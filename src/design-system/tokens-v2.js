/**
 * Tokens v2: Zugriff auf tokens-v2.json aus JavaScript.
 * JS-Fassung von tokens-v2.ts aus KodiniTools/Collage-Maker. Für alles, was nicht
 * über CSS-Variablen läuft – vor allem Canvas-Zeichnung (Auswahl, Griffe, Löschen).
 */
import tokens from './tokens-v2.json';

/** Die kompletten v2-Tokens, Struktur siehe tokens-v2.json. */
export const designTokensV2 = tokens;

/**
 * Farbwert eines v2-Tokens, z. B. colorTokenV2('dark', 'accent') → '#d4a257'.
 * @param {'dark'|'light'} theme
 * @param {string} name
 */
export function colorTokenV2(theme, name) {
  return tokens.color[theme][name].$value;
}

/**
 * Flache Farbkarte eines Themes, z. B. für Canvas-Zeichnung.
 * @param {'dark'|'light'} theme
 * @returns {Readonly<Record<string, string>>}
 */
export function themeColorsV2(theme) {
  const source = tokens.color[theme === 'dark' ? 'dark' : 'light'];
  const result = {};
  for (const key of Object.keys(source)) {
    result[key] = source[key].$value;
  }
  return Object.freeze(result);
}

/**
 * Aktives Theme laut `html[data-theme]` (Settings-Store und index.html setzen es;
 * 'auto' ist dort bereits aufgelöst). Ohne DOM: Light.
 * @returns {'dark'|'light'}
 */
export function activeTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Farbkarte des gerade aktiven Themes. */
export function currentThemeColorsV2() {
  return themeColorsV2(activeTheme());
}
