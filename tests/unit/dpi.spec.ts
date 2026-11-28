import { describe, expect, it } from 'vitest';
import { setJpegDpi, setPngDpi, setTiffDpi, supportsDpi, withDpi } from '@/utils/dpi';

const jfif = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

function pngWith(chunks: [string, number[]][]): Uint8Array {
  const parts = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const [type, data] of chunks) {
    parts.push(0, 0, 0, data.length, ...[...type].map((c) => c.charCodeAt(0)), ...data, 0, 0, 0, 0);
  }
  return new Uint8Array(parts);
}

function chunkTypes(png: Uint8Array): string[] {
  const view = new DataView(png.buffer);
  const types: string[] = [];
  for (let pos = 8; pos + 12 <= png.length; pos += 12 + view.getUint32(pos)) {
    types.push(String.fromCharCode(...png.subarray(pos + 4, pos + 8)));
  }
  return types;
}

/** Minimales TIFF mit XResolution, YResolution und ResolutionUnit. */
function tiff(little: boolean, withRes = true): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(64);
  const v = new DataView(buf);
  const b = new Uint8Array(buf);
  b.set(little ? [0x49, 0x49] : [0x4d, 0x4d]);
  v.setUint16(2, 42, little);
  v.setUint32(4, 8, little);
  const entries: [number, number, number, number][] = withRes
    ? [
        [282, 5, 1, 48],
        [283, 5, 1, 56],
        [296, 3, 1, 3],
      ]
    : [[256, 3, 1, 10]];
  v.setUint16(8, entries.length, little);
  entries.forEach(([tag, type, count, value], i) => {
    const e = 10 + i * 12;
    v.setUint16(e, tag, little);
    v.setUint16(e + 2, type, little);
    v.setUint32(e + 4, count, little);
    if (type === 3) v.setUint16(e + 8, value, little);
    else v.setUint32(e + 8, value, little);
  });
  v.setUint32(48, 72, little);
  v.setUint32(52, 1, little);
  v.setUint32(56, 72, little);
  v.setUint32(60, 1, little);
  return b;
}

describe('DPI in Dateien schreiben', () => {
  it('kennt die Formate mit DPI-Angabe', () => {
    expect(['png', 'jpg', 'jpeg', 'tiff'].every(supportsDpi)).toBe(true);
    expect(['webp', 'gif', 'pdf', 'heif'].some(supportsDpi)).toBe(false);
  });

  it('setzt Einheit Zoll und 300 DPI im JFIF-Block', () => {
    const out = setJpegDpi(jfif, 300)!;
    expect(out.length).toBe(jfif.length);
    expect([...out.subarray(13, 18)]).toEqual([1, 0x01, 0x2c, 0x01, 0x2c]);
  });

  it('fügt einen JFIF-Block ein, wenn keiner da ist', () => {
    const bare = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
    const out = setJpegDpi(bare, 150)!;
    expect([...out.subarray(0, 4)]).toEqual([0xff, 0xd8, 0xff, 0xe0]);
    expect(String.fromCharCode(...out.subarray(6, 11))).toBe('JFIF\0');
    expect([...out.subarray(13, 18)]).toEqual([1, 0, 150, 0, 150]);
    expect([...out.subarray(20)]).toEqual([...bare.subarray(2)]);
  });

  it('schreibt pHYs vor IDAT und ersetzt einen alten pHYs', () => {
    const png = pngWith([
      ['IHDR', new Array(13).fill(0)],
      ['pHYs', [0, 0, 0, 1, 0, 0, 0, 1, 0]],
      ['IDAT', [1, 2, 3]],
      ['IEND', []],
    ]);
    const out = setPngDpi(png, 300)!;
    expect(chunkTypes(out)).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND']);
    const pos = 8 + 25 + 8;
    const view = new DataView(out.buffer);
    expect(view.getUint32(pos)).toBe(11811);
    expect(view.getUint32(pos + 4)).toBe(11811);
    expect(out[pos + 8]).toBe(1);
  });

  it.each([true, false])('setzt TIFF-Auflösung (little endian: %s)', (little) => {
    const out = setTiffDpi(tiff(little), 300)!;
    const v = new DataView(out.buffer);
    expect(v.getUint32(48, little)).toBe(300);
    expect(v.getUint32(52, little)).toBe(1);
    expect(v.getUint32(56, little)).toBe(300);
    expect(v.getUint16(10 + 2 * 12 + 8, little)).toBe(2);
  });

  it('meldet TIFF ohne Auflösungs-Tags als nicht beschreibbar', () => {
    expect(setTiffDpi(tiff(true, false), 300)).toBeNull();
  });

  it('lehnt ungültige Werte ab', () => {
    expect(setJpegDpi(jfif, 0)).toBeNull();
    expect(setJpegDpi(jfif, 70000)).toBeNull();
  });

  it('lässt WebP unverändert und wirft, wenn ein TIFF nicht beschreibbar ist', async () => {
    const webp = new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46])], { type: 'image/webp' });
    expect(await withDpi(webp, 300)).toBe(webp);
    const bad = new Blob([tiff(true, false)], { type: 'image/tiff' });
    await expect(withDpi(bad, 300)).rejects.toThrow();
  });
});
