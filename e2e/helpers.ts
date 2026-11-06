import { crc32, deflateSync } from 'node:zlib';
import type { Page } from '@playwright/test';

export type Locale = 'de' | 'en';
export type Theme = 'dark' | 'light';

/** Setzt Sprache und Theme vor dem ersten Skript der Seite (wie die SSI-Navigation). */
export async function prepare(page: Page, locale: Locale, theme: Theme = 'light'): Promise<void> {
  await page.addInitScript(
    ([l, t]) => {
      localStorage.setItem('locale', l);
      localStorage.setItem('theme', t);
    },
    [locale, theme] as const
  );
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * Gültige RGB-PNG-Datei mit Farbmuster. Das Muster hält die Datei über 1 KB,
 * der Mindestgröße des Uploads (src/utils/validationUtils.js).
 */
export function png(width: number, height: number, range?: [number, number]): Buffer {
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      const rgb = [(x * 7 + y * 13) % 256, (x * x + y * 3) % 256, (x * y) % 256];
      // optional in einen engeren Tonwertbereich stauchen (flaues Bild)
      row.set(
        range ? rgb.map((v) => Math.round(range[0] + (v * (range[1] - range[0])) / 255)) : rgb,
        1 + x * 3
      );
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // Bittiefe
  header[9] = 2; // Farbtyp RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function imageFile(name: string, width = 120, height = 80, range?: [number, number]) {
  return { name, mimeType: 'image/png', buffer: png(width, height, range) };
}

/** Einfarbiges PNG (z. B. eine Fläche mit Farbstich für den Weißabgleich). */
export function solidImageFile(name: string, width: number, height: number, rgb: number[]) {
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) row.set(rgb, 1 + x * 3);
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const buffer = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return { name, mimeType: 'image/png', buffer };
}

/** PNG mit zwei Hälften: links `left`, rechts `right` (RGB). */
export function splitImageFile(
  name: string,
  width: number,
  height: number,
  left: number[],
  right: number[]
) {
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) row.set(x < width / 2 ? left : right, 1 + x * 3);
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const buffer = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return { name, mimeType: 'image/png', buffer };
}

/** Lädt Bilder über das (versteckte) Datei-Input der Seite hoch. */
export async function uploadImages(page: Page, files: ReturnType<typeof imageFile>[]) {
  await page.locator('input[type="file"]').first().setInputFiles(files);
}

/** Sammelt unbehandelte Seitenfehler (Exceptions) für eine abschließende Prüfung. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}
