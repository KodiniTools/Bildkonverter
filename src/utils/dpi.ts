/**
 * Schreibt die Auflösung (DPI) in fertig kodierte Bilddateien.
 * Die Pixel bleiben unverändert; geändert wird nur die Angabe, mit der
 * Druck- und Layoutprogramme die Druckgröße berechnen.
 *
 * - JPEG: JFIF-APP0 (Einheit Zoll), wird bei Bedarf eingefügt
 * - PNG: pHYs-Chunk (Pixel pro Meter) vor dem ersten IDAT
 * - TIFF: XResolution/YResolution/ResolutionUnit im ersten IFD (auch für EXIF-Blöcke)
 */

/** Auswählbare Werte im Export */
export const DPI_OPTIONS = [72, 96, 150, 300, 600] as const;

const DPI_FORMATS: readonly string[] = ['png', 'jpg', 'jpeg', 'tiff', 'tif'];

/** Kann das Exportformat eine DPI-Angabe aufnehmen? (PNG, JPEG, TIFF) */
export function supportsDpi(format: unknown): boolean {
  return DPI_FORMATS.includes(String(format).toLowerCase());
}

function isValidDpi(dpi: number): boolean {
  return Number.isInteger(dpi) && dpi >= 1 && dpi <= 65535;
}

function concat(parts: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const part of parts) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** JPEG: vorhandenes JFIF-APP0 anpassen oder ein neues direkt nach SOI einfügen. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array<ArrayBuffer> | null {
  if (!isValidDpi(dpi) || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const isJfif =
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes.length > 17 &&
    String.fromCharCode(...bytes.subarray(6, 11)) === 'JFIF\0';
  if (isJfif) {
    const out = new Uint8Array(bytes);
    out[13] = 1; // Einheit: Pixel pro Zoll
    out[14] = dpi >> 8;
    out[15] = dpi & 0xff;
    out[16] = dpi >> 8;
    out[17] = dpi & 0xff;
    return out;
  }
  const app0 = new Uint8Array([
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x01,
    dpi >> 8,
    dpi & 0xff,
    dpi >> 8,
    dpi & 0xff,
    0x00,
    0x00,
  ]);
  return concat([bytes.subarray(0, 2), app0, bytes.subarray(2)]);
}

/** PNG: vorhandene pHYs-Chunks entfernen, neuen pHYs vor dem ersten IDAT einfügen. */
export function setPngDpi(bytes: Uint8Array, dpi: number): Uint8Array<ArrayBuffer> | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!isValidDpi(dpi) || !signature.every((b, i) => bytes[i] === b)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ppm = Math.round(dpi / 0.0254);
  const typeAndData = new Uint8Array(13);
  typeAndData.set([0x70, 0x48, 0x59, 0x73]); // "pHYs"
  const dv = new DataView(typeAndData.buffer);
  dv.setUint32(4, ppm);
  dv.setUint32(8, ppm);
  typeAndData[12] = 1; // Einheit: Meter
  const chunk = new Uint8Array(21);
  const cv = new DataView(chunk.buffer);
  cv.setUint32(0, 9);
  chunk.set(typeAndData, 4);
  cv.setUint32(17, crc32(typeAndData));

  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let pos = 8;
  let inserted = false;
  while (pos + 12 <= bytes.length) {
    const length = view.getUint32(pos);
    const end = pos + 12 + length;
    if (end > bytes.length) return null;
    const type = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
    if (type === 'IDAT' && !inserted) {
      parts.push(chunk);
      inserted = true;
    }
    if (type !== 'pHYs') parts.push(bytes.subarray(pos, end));
    pos = end;
  }
  return inserted ? concat(parts) : null;
}

/**
 * TIFF oder EXIF-Block (TIFF-Struktur): Auflösungs-Tags im ersten IFD
 * überschreiben. Liefert null, wenn XResolution/YResolution fehlen.
 */
export function setTiffDpi(bytes: Uint8Array, dpi: number): Uint8Array<ArrayBuffer> | null {
  if (!isValidDpi(dpi) || bytes.length < 8) return null;
  const order = String.fromCharCode(bytes[0], bytes[1]);
  if (order !== 'II' && order !== 'MM') return null;
  const little = order === 'II';
  const out = new Uint8Array(bytes);
  const view = new DataView(out.buffer);
  if (view.getUint16(2, little) !== 42) return null;
  const ifd = view.getUint32(4, little);
  if (ifd + 2 > out.length) return null;
  const count = view.getUint16(ifd, little);
  let found = 0;
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > out.length) return null;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    if ((tag === 282 || tag === 283) && type === 5) {
      const offset = view.getUint32(entry + 8, little);
      if (offset + 8 > out.length) return null;
      view.setUint32(offset, dpi, little);
      view.setUint32(offset + 4, 1, little);
      found++;
    } else if (tag === 296 && type === 3) {
      view.setUint16(entry + 8, 2, little); // Einheit: Zoll
    }
  }
  return found === 2 ? out : null;
}

/**
 * Schreibt die DPI in den Blob (PNG, JPEG, TIFF; erkannt am Dateiinhalt).
 * Andere Formate bleiben unverändert. Scheitert das Schreiben bei einem
 * unterstützten Format, wird ein Fehler geworfen, damit keine Datei mit
 * falscher Angabe entsteht.
 */
export async function withDpi(blob: Blob, dpi?: number | null): Promise<Blob> {
  if (!dpi) return blob;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let out: Uint8Array<ArrayBuffer> | null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) out = setJpegDpi(bytes, dpi);
  else if (bytes[0] === 0x89 && bytes[1] === 0x50) out = setPngDpi(bytes, dpi);
  else if ((bytes[0] === 0x49 && bytes[1] === 0x49) || (bytes[0] === 0x4d && bytes[1] === 0x4d))
    out = setTiffDpi(bytes, dpi);
  else return blob;
  if (!out) throw new Error('DPI konnte nicht in die Datei geschrieben werden');
  return new Blob([out], { type: blob.type });
}
