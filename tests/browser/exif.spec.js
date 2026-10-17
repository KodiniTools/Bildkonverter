/**
 * EXIF: Lesen, Normalisieren und Einfügen (JPEG/PNG/WebP), Zielgröße mit
 * EXIF-Reserve, Editor-Export und Batch-Konvertierung samt ZIP.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ref } from 'vue';
import JSZip from 'jszip';
import {
  extractExif,
  insertExif,
  normalizeExif,
  readExifDate,
  readSourceExif,
  supportsExif,
  withExif,
} from '@/utils/exif';
import { encodeForExport } from '@/utils/targetSize';
import { ExportManager } from '@/utils/exportUtils';
import { useBatchConversion } from '@/composables/useBatchConversion';
import { installToastMock, t } from './helpers';

/** Kleiner TIFF-Block (Little Endian): Make, Orientation 6, Datum, Exif-IFD, IFD1 */
function buildTiff(padding = 0) {
  const out = new Uint8Array(200 + padding);
  const v = new DataView(out.buffer);
  out.set([0x49, 0x49, 0x2a, 0x00]);
  v.setUint32(4, 8, true);
  const ifd0 = 8;
  const entries = 4;
  const ifd0End = ifd0 + 2 + entries * 12 + 4;
  const makePos = ifd0End;
  const datePos = makePos + 8;
  const exifIfd = datePos + 20;
  const exifEnd = exifIfd + 2 + 12 + 4;
  const origPos = exifEnd;
  const ifd1 = origPos + 20;
  const entry = (pos, tag, type, count, value) => {
    v.setUint16(pos, tag, true);
    v.setUint16(pos + 2, type, true);
    v.setUint32(pos + 4, count, true);
    if (type === 3 && count === 1) v.setUint16(pos + 8, value, true);
    else v.setUint32(pos + 8, value, true);
  };
  const text = (pos, s) => {
    for (let i = 0; i < s.length; i++) out[pos + i] = s.charCodeAt(i);
  };
  v.setUint16(ifd0, entries, true);
  entry(ifd0 + 2, 0x010f, 2, 8, makePos);
  entry(ifd0 + 14, 0x0112, 3, 1, 6);
  entry(ifd0 + 26, 0x0132, 2, 20, datePos);
  entry(ifd0 + 38, 0x8769, 4, 1, exifIfd);
  v.setUint32(ifd0 + 50, ifd1, true);
  text(makePos, 'TestCam\0');
  text(datePos, '2020:01:01 00:00:00\0');
  v.setUint16(exifIfd, 1, true);
  entry(exifIfd + 2, 0x9003, 2, 20, origPos);
  v.setUint32(exifIfd + 14, 0, true);
  text(origPos, '2024:06:15 14:30:00\0');
  v.setUint16(ifd1, 1, true);
  entry(ifd1 + 2, 0x0103, 3, 1, 6);
  v.setUint32(ifd1 + 14, 0, true);
  return out;
}

const orientation = (tiff) => new DataView(tiff.buffer, tiff.byteOffset).getUint16(30, true);
const nextIfd = (tiff) => new DataView(tiff.buffer, tiff.byteOffset).getUint32(58, true);
const TAKEN = new Date(2024, 5, 15, 14, 30, 0);

function canvas(width, height, alpha = false) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = alpha ? 'rgba(200, 50, 50, 0.5)' : '#c83232';
  ctx.fillRect(0, 0, width, height);
  return c;
}

function noisyCanvas(width, height) {
  const c = canvas(width, height);
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, width, height);
  let seed = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    img.data[i + 1] = seed & 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const encode = (c, mime, quality = 0.9) =>
  new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), mime, quality)
  );
const bytes = async (blob) => new Uint8Array(await blob.arrayBuffer());

async function jpegWithExif(width = 120, height = 80) {
  const raw = await bytes(await encode(canvas(width, height), 'image/jpeg'));
  return new File([insertExif(raw, 'image/jpeg', buildTiff())], 'foto.jpg', {
    type: 'image/jpeg',
  });
}

afterEach(() => vi.restoreAllMocks());

describe('EXIF lesen und normalisieren', () => {
  it('liest den TIFF-Block aus JPEG und setzt Ausrichtung und IFD1 zurück', async () => {
    const tiff = extractExif(await bytes(await jpegWithExif()));
    expect(tiff).toEqual(buildTiff());
    const normalized = normalizeExif(tiff);
    expect(orientation(normalized)).toBe(1);
    expect(nextIfd(normalized)).toBe(0);
    expect(orientation(tiff)).toBe(6); // Original unverändert
    expect(readExifDate(normalized)).toEqual(TAKEN);
  });

  it('liefert null für Dateien ohne EXIF und kaputte Daten', async () => {
    expect(extractExif(await bytes(await encode(canvas(10, 10), 'image/png')))).toBeNull();
    expect(extractExif(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00]))).toBeNull();
    expect(normalizeExif(new Uint8Array([0x49, 0x49, 0x2a, 0x00, 0xff, 0xff, 0, 0]))).toBeNull();
    expect(
      await readSourceExif(new File([await encode(canvas(4, 4), 'image/jpeg')], 'x.jpg'))
    ).toBeNull();
  });

  it('kennt die Formate mit EXIF', () => {
    expect(['png', 'jpg', 'jpeg', 'webp', 'JPG'].every(supportsExif)).toBe(true);
    expect(['bmp', 'gif', 'pdf', 'svg', 'tiff'].some(supportsExif)).toBe(false);
  });
});

describe('EXIF einfügen', () => {
  it.each([
    ['JPEG', 'image/jpeg', false],
    ['PNG', 'image/png', true],
    ['WebP verlustbehaftet', 'image/webp', false],
    ['WebP mit Alpha', 'image/webp', true],
  ])('%s: Daten sind wieder lesbar und das Bild bleibt dekodierbar', async (_, mime, alpha) => {
    const tiff = normalizeExif(buildTiff());
    const blob = await withExif(await encode(canvas(97, 61, alpha), mime), tiff);
    expect(blob.type).toBe(mime);
    expect(extractExif(await bytes(blob))).toEqual(tiff);
    const bitmap = await createImageBitmap(blob);
    expect([bitmap.width, bitmap.height]).toEqual([97, 61]);
  });

  it('WebP verlustfrei (VP8L) bekommt einen VP8X-Kopf', async () => {
    const tiff = normalizeExif(buildTiff());
    const blob = await withExif(await encode(canvas(33, 21), 'image/webp', 1), tiff);
    const data = await bytes(blob);
    expect(String.fromCharCode(...data.subarray(12, 16))).toBe('VP8X');
    expect(extractExif(data)).toEqual(tiff);
    const bitmap = await createImageBitmap(blob);
    expect([bitmap.width, bitmap.height]).toEqual([33, 21]);
  });

  it('überspringt zu große Blöcke und fremde Formate, ohne EXIF bleibt der Blob gleich', async () => {
    const jpeg = await encode(canvas(10, 10), 'image/jpeg');
    const raw = await bytes(jpeg);
    expect(insertExif(raw, 'image/jpeg', buildTiff(70000))).toBeNull();
    expect(insertExif(raw, 'image/gif', buildTiff())).toBeNull();
    expect(await withExif(jpeg, null)).toBe(jpeg);
  });

  it('Zielgröße berücksichtigt die EXIF-Bytes', async () => {
    const tiff = normalizeExif(buildTiff(3000));
    const c = noisyCanvas(400, 300);
    const plain = await encodeForExport(c, 'jpeg', 0.92, null);
    // Ohne Reserve würde die Datei mit EXIF das Limit sprengen
    const maxBytes = plain.blob.size + 1000;
    const result = await encodeForExport(
      c,
      'jpeg',
      0.92,
      { maxBytes, allowDownscale: false },
      undefined,
      tiff
    );
    expect(result.reached).toBe(true);
    expect(result.blob.size).toBeLessThanOrEqual(maxBytes);
    expect(extractExif(await bytes(result.blob))).toEqual(tiff);
  });
});

describe('Editor-Export mit EXIF', () => {
  it.each([
    ['png', 'image/png'],
    ['jpeg', 'image/jpeg'],
    ['webp', 'image/webp'],
  ])('%s: übernimmt EXIF nur, wenn es übergeben wird', async (format, mime) => {
    const manager = new ExportManager();
    const download = vi.spyOn(manager, 'downloadBlob').mockImplementation(() => {});
    const tiff = await readSourceExif(await jpegWithExif());
    await manager.exportImage(canvas(40, 30), format, 'bild', { quality: 0.8 });
    await manager.exportImage(canvas(40, 30), format, 'bild', { quality: 0.8, exif: tiff });
    const [plain, withMeta] = download.mock.calls.map((c) => c[0]);
    expect([plain.type, withMeta.type]).toEqual([mime, mime]);
    expect(extractExif(await bytes(plain))).toBeNull();
    expect(readExifDate(extractExif(await bytes(withMeta)))).toEqual(TAKEN);
  });

  it('Zielgröße im Editor-Export fügt EXIF ein', async () => {
    const manager = new ExportManager();
    const download = vi.spyOn(manager, 'downloadBlob').mockImplementation(() => {});
    const tiff = await readSourceExif(await jpegWithExif());
    const result = await manager.exportImage(noisyCanvas(200, 150), 'jpeg', 'bild', {
      quality: 0.9,
      targetSize: { maxBytes: 20 * 1024, allowDownscale: true },
      exif: tiff,
    });
    expect(result.targetReached).toBe(true);
    const blob = download.mock.calls[0][0];
    expect(blob.size).toBeLessThanOrEqual(20 * 1024);
    expect(orientation(extractExif(await bytes(blob)))).toBe(1);
  });
});

describe('Batch-Konvertierung und ZIP mit EXIF', () => {
  async function convert(format, keepExif) {
    installToastMock();
    const settings = ref({
      format,
      quality: 90,
      width: null,
      height: null,
      maintainAspect: true,
      prefix: '',
      pdfMode: 'single',
      keepExif,
    });
    const batch = useBatchConversion({ settings, t, confirm: async () => true });
    await batch.addFiles([await jpegWithExif()]);
    await batch.startProcessing();
    return batch;
  }

  it('entfernt EXIF standardmäßig', async () => {
    const batch = await convert('jpg', false);
    expect(extractExif(await bytes(batch.files.value[0].processedBlob))).toBeNull();
  });

  it.each(['jpg', 'png', 'webp'])('%s: übernimmt EXIF auf Wunsch, auch im ZIP', async (format) => {
    const batch = await convert(format, true);
    const tiff = extractExif(await bytes(batch.files.value[0].processedBlob));
    expect(orientation(tiff)).toBe(1);
    expect(readExifDate(tiff)).toEqual(TAKEN);

    let zipBlob = null;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      zipBlob = blob;
      return 'blob:zip';
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await batch.downloadAsZip();
    const zip = await JSZip.loadAsync(zipBlob);
    const entry = Object.values(zip.files).find((f) => !f.dir);
    expect(entry.name).toBe(`foto.${format}`);
    expect(readExifDate(extractExif(await entry.async('uint8array')))).toEqual(TAKEN);
  });
});
