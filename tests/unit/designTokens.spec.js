/**
 * Regressionsschutz für das Design-System v2 (src/design-system/README.md).
 *
 * Die Oberfläche läuft auf den gemeinsamen KodiniTools-Tokens (--ds-*), pixelgleich
 * zum Collage Maker. Diese Tests verhindern die Rückkehr fester Farbwerte,
 * Font-Awesome-Icons, Dark-Overrides, Gradients, Hover-Bewegung und `transition: all`
 * und stellen sicher, dass Tokens, Aliase, Schrift und Leinwand-Overlays stimmen.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import tokens from '@/design-system/tokens-v2.json';
import { themeColorsV2 } from '@/design-system/tokens-v2.js';

const SRC_DIR = join(__dirname, '..', '..', 'src');
const read = (path) => readFileSync(join(SRC_DIR, path), 'utf8');

function collectFiles(dir, extensions, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, extensions, out);
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

/** Nur der Style-Anteil: <style>-Blöcke in .vue, ganze .scss-Dateien. */
function styleSource(file) {
  const text = readFileSync(file, 'utf8');
  if (!file.endsWith('.vue')) return text;
  return (text.match(/<style[^>]*>[\s\S]*?<\/style>/g) ?? []).join('\n');
}

/** Datei:Zeile aller Treffer im Style-Anteil der Komponenten und Views. */
function findInStyles(pattern) {
  const hits = [];
  const files = collectFiles(SRC_DIR, ['.vue', '.scss']).filter(
    (file) => !file.includes(`${join('src', 'styles')}`) || file.endsWith('global.scss')
  );
  for (const file of files) {
    styleSource(file)
      .split('\n')
      .forEach((line, index) => {
        if (pattern.test(line))
          hits.push(`${relative(SRC_DIR, file)}:${index + 1}: ${line.trim()}`);
      });
  }
  return hits;
}

function findInTemplates(pattern) {
  const hits = [];
  for (const file of collectFiles(SRC_DIR, ['.vue'])) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        if (pattern.test(line))
          hits.push(`${relative(SRC_DIR, file)}:${index + 1}: ${line.trim()}`);
      });
  }
  return hits;
}

describe('Tokens', () => {
  const css = read('design-system/tokens-v2.css');

  function block(selector) {
    const start = css.indexOf(`${selector} {`);
    expect(start, `Block ${selector} fehlt`).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf('}', start));
  }

  it.each(['dark', 'light'])('tokens-v2.css und tokens-v2.json stimmen für %s überein', (theme) => {
    const source = theme === 'dark' ? block(':root') : block(":root[data-theme='light']");
    for (const token of Object.values(tokens.color[theme])) {
      const cssVar = token.$extensions.css;
      expect(source, `${cssVar} (${theme})`).toContain(`${cssVar}: ${token.$value};`);
    }
  });

  it('themeColorsV2 liefert die Werte aus tokens-v2.json', () => {
    expect(themeColorsV2('light').accent).toBe(tokens.color.light.accent.$value);
    expect(themeColorsV2('dark').danger).toBe(tokens.color.dark.danger.$value);
  });

  it('Legacy-Aliase in theme.scss verweisen nur auf --ds-* (keine festen Farben)', () => {
    const theme = read('styles/theme.scss');
    expect(theme.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).toEqual([]);
    expect(theme).toContain('--color-primary: var(--ds-accent);');
  });

  it('SCSS-Farbvariablen verweisen auf --ds-*', () => {
    const variables = read('styles/variables.scss');
    const colorLines = variables
      .split('\n')
      .filter((line) => /^\$(color|dark)-/.test(line) && !line.startsWith('$color-black'));
    expect(colorLines.length).toBeGreaterThan(0);
    for (const line of colorLines) expect(line).toMatch(/var\(--ds-/);
  });
});

describe('Styles der Komponenten und Views', () => {
  // Erlaubt: Weiß (Schalter-Knopf, Griffe, Häkchen), Schwarz in Backdrop/Schachbrett.
  const allowedHex = /#(?:fff|ffffff|000|000000)\b/i;

  it('enthalten keine festen Farbwerte außer Weiß/Schwarz', () => {
    const hits = findInStyles(/#[0-9a-fA-F]{3,8}\b/).filter((hit) => {
      const values = hit.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      return values.some((value) => !allowedHex.test(value));
    });
    expect(hits).toEqual([]);
  });

  it('nutzen rgba() nur für Backdrop und Schachbrett (Schwarz/Weiß)', () => {
    const hits = findInStyles(/rgba?\(/).filter(
      (hit) => !/rgba?\(\s*(?:0,\s*0,\s*0|255,\s*255,\s*255)\b/.test(hit)
    );
    expect(hits).toEqual([]);
  });

  it('haben keine Dark-Overrides (die Tokens wechseln mit dem Theme)', () => {
    expect(findInStyles(/data-theme=['"]?dark/)).toEqual([]);
  });

  it('animieren nicht `all`', () => {
    expect(findInStyles(/transition:\s*all\b/)).toEqual([]);
  });

  it('nutzen Outlines nur in Token-Farben (Auswahlring), Fokus über den Fokus-Ring', () => {
    expect(findInStyles(/outline:\s*\d+px\s+solid\s+(?!var\(--ds-|transparent)/)).toEqual([]);
  });

  it('nutzen keinen Blur', () => {
    expect(findInStyles(/backdrop-filter|filter:\s*blur/)).toEqual([]);
  });
});

describe('Icons', () => {
  it('kommen aus AppIcon (Lucide), nicht aus Font Awesome', () => {
    expect(findInTemplates(/<i\s[^>]*class="[^"]*\bfa[srb]?\b/)).toEqual([]);
    expect(findInTemplates(/<i\s[^>]*:class="[^"]*\bfa/)).toEqual([]);
  });
});

describe('UI-Schrift Supreme', () => {
  const global = read('styles/global.scss');
  const faces = (global.match(/@font-face\s*{[^}]*}/g) ?? []).filter((face) =>
    /font-family:\s*'Supreme'/.test(face)
  );

  it.each([400, 500, 700])('deklariert @font-face für Gewicht %i', (weight) => {
    const face = faces.find((f) => new RegExp(`font-weight:\\s*${weight}\\b`).test(f));
    expect(face, `Kein @font-face für Supreme ${weight}`).toBeDefined();
    expect(face).toMatch(/@\/assets\/fonts\/Supreme-(Regular|Medium|Bold)\.woff2/);
  });

  it('setzt die Grundgröße des Body auf --ds-text-lg', () => {
    expect(global).toMatch(/body \{[^}]*font-size: var\(--ds-text-lg\)/);
  });
});

describe('Leinwand-Overlays', () => {
  it.each(['composables/useCanvasRenderer.js', 'utils/textUtils.js'])(
    '%s zeichnet Auswahl und Griffe mit Token-Farben',
    (file) => {
      const src = read(file);
      expect(src).toMatch(/currentThemeColorsV2\(\)/);
      expect(src).not.toMatch(/#(?:014f99|0066ff|007bff|EF4444)\b/i);
    }
  );
});
