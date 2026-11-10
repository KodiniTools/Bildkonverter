/**
 * Wächter für die abgeschlossene Umstellung auf TypeScript (Plan: Typisierung Bildkonverter).
 *
 * - In src/, tests/, e2e/ und im Projektwurzelordner gibt es kein JavaScript mehr.
 * - Jede .vue-Datei mit <script> nutzt lang="ts".
 * - Typprüfungen werden nicht per @ts-ignore / @ts-nocheck abgeschaltet.
 *
 * Bewusst ausgenommen: backend-deploy/ (eigener Node-Dienst), public/, src-tauri/,
 * Build-Ausgaben und node_modules.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const JS_EXTENSIONS = ['.js', '.mjs', '.cjs'];
const CHECKED_DIRS = ['src', 'tests', 'e2e'];

const toPosix = (path: string): string => path.split(sep).join('/');

function collectFiles(
  dir: string,
  accept: (name: string) => boolean,
  out: string[] = []
): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, accept, out);
    } else if (accept(entry)) {
      out.push(toPosix(relative(ROOT, full)));
    }
  }
  return out;
}

const isJs = (name: string): boolean => JS_EXTENSIONS.some((ext) => name.endsWith(ext));

function currentJsFiles(): string[] {
  const nested = CHECKED_DIRS.flatMap((dir) => collectFiles(join(ROOT, dir), isJs));
  const rootFiles = readdirSync(ROOT).filter(
    (name) => isJs(name) && statSync(join(ROOT, name)).isFile()
  );
  return [...nested, ...rootFiles].sort();
}

function currentJsVueFiles(): string[] {
  return collectFiles(join(ROOT, 'src'), (name) => name.endsWith('.vue'))
    .filter((path) => {
      const source = readFileSync(join(ROOT, path), 'utf8');
      const scripts = source.match(/<script\b[^>]*>/g) ?? [];
      return scripts.some((tag) => !/\blang=["']ts["']/.test(tag));
    })
    .sort();
}

function filesWithTypeCheckBypass(): string[] {
  // Nur echte Direktiven: Kommentar, der mit @ts-ignore bzw. @ts-nocheck beginnt
  const bypass = /^\s*(\/\/|\/\*+)\s*@ts-(ignore|nocheck)\b/m;
  const isSource = (name: string): boolean => /\.(ts|vue)$/.test(name);
  return CHECKED_DIRS.flatMap((dir) => collectFiles(join(ROOT, dir), isSource))
    .filter((path) => bypass.test(readFileSync(join(ROOT, path), 'utf8')))
    .sort();
}

describe('TypeScript-Umstellung (Wächter)', () => {
  it('keine JavaScript-Dateien', () => {
    expect(currentJsFiles(), 'Dateien bitte in TypeScript anlegen').toEqual([]);
  });

  it('alle .vue-Dateien nutzen <script lang="ts">', () => {
    expect(currentJsVueFiles(), 'Bitte <script setup lang="ts"> verwenden').toEqual([]);
  });

  it('kein @ts-ignore oder @ts-nocheck', () => {
    expect(filesWithTypeCheckBypass(), 'Typfehler beheben statt unterdrücken').toEqual([]);
  });
});
