/**
 * Konsistenz der Übersetzungen:
 * - de und en haben denselben Schlüsselsatz
 * - jeder im Code referenzierte Schlüssel existiert (Literale, Datenarrays, Template-Präfixe)
 * - kein Schlüssel ist verwaist
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import de from '@/i18n/de';
import en from '@/i18n/en';

// Vitest läuft aus dem Projektwurzelverzeichnis
const SRC = path.resolve(process.cwd(), 'src');

const leaves = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return p.includes('assets') || p.endsWith('i18n') ? [] : sourceFiles(p);
    return /\.(vue|js)$/.test(e.name) ? [p] : [];
  });
}

const keys = new Set(leaves(de));
const prefixes = new Set(
  [...keys].flatMap((k) => k.split('.').map((_, i, a) => a.slice(0, i + 1).join('.')))
);
const sources = sourceFiles(SRC).map((f) => [path.relative(SRC, f), fs.readFileSync(f, 'utf8')]);
const allSource = sources.map(([, s]) => s).join('\n');
// Präfixe dynamisch gebildeter Schlüssel, z.B. t(`guide.filters.${key}.title`)
const stems = [...allSource.matchAll(/\$?\bt\(\s*`([a-zA-Z.]+)\$\{/g)].map((m) => m[1]);

describe('i18n', () => {
  it('de und en haben denselben Schlüsselsatz', () => {
    expect(leaves(en).sort()).toEqual(leaves(de).sort());
  });

  it('jeder als Literal aufgerufene Schlüssel existiert', () => {
    const missing = [];
    for (const [file, s] of sources) {
      for (const m of s.matchAll(/\$?\bt\(\s*'([a-zA-Z][\w-]*(?:\.[\w-]+)+)'/g)) {
        if (!keys.has(m[1])) missing.push(`${file}: t('${m[1]}')`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('jeder in Datenarrays hinterlegte Schlüssel existiert', () => {
    const missing = [];
    for (const [file, s] of sources) {
      for (const m of s.matchAll(
        /'((?:guide|toast|nav|editor|transform|layerPanel|conversion)\.[\w-]+(?:\.[\w-]+)+)'/g
      )) {
        if (!keys.has(m[1]) && !prefixes.has(m[1])) missing.push(`${file}: '${m[1]}'`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('jeder Template-Präfix trifft mindestens einen Schlüssel', () => {
    const dead = stems.filter((stem) => ![...keys].some((k) => k.startsWith(stem)));
    expect(dead).toEqual([]);
  });

  it('kein Schlüssel ist verwaist', () => {
    const unused = [...keys].filter(
      (k) =>
        !allSource.includes(`'${k}'`) &&
        !allSource.includes(`"${k}"`) &&
        !stems.some((stem) => k.startsWith(stem))
    );
    expect(unused).toEqual([]);
  });
});
