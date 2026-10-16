/**
 * Ziel-Dateigröße beim Export: Binärsuche über die Qualität, optionales
 * Verkleinern und der Export-Pfad für JPEG/WebP (echter Canvas-Encoder).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
  MIN_QUALITY,
  encodeForExport,
  encodeToTargetSize,
  kbToBytes,
  supportsTargetSize,
  withWhiteBackground,
} from '@/utils/targetSize';
import { ExportManager } from '@/utils/exportUtils';
import { makeImage } from './helpers';

/** Detailreiches Testbild, damit JPEG-Größen deutlich von der Qualität abhängen */
function noisyCanvas(width = 800, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const data = ctx.createImageData(width, height);
  let seed = 7;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    data.data[i] = seed & 255;
    data.data[i + 1] = (seed >> 8) & 255;
    data.data[i + 2] = (seed >> 16) & 255;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

let gradient;
beforeAll(async () => {
  const img = await makeImage(800, 600);
  gradient = document.createElement('canvas');
  gradient.width = 800;
  gradient.height = 600;
  gradient.getContext('2d').drawImage(img, 0, 0);
});

describe('supportsTargetSize', () => {
  it('nur JPEG und WebP', () => {
    expect(['jpeg', 'jpg', 'webp', 'JPEG'].map(supportsTargetSize)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(['png', 'tiff', 'heif', 'pdf', 'svg', 'gif'].some(supportsTargetSize)).toBe(false);
  });
});

describe('encodeToTargetSize', () => {
  it('behält die gewählte Qualität, wenn die Datei schon passt', async () => {
    const result = await encodeToTargetSize(gradient, 'image/jpeg', 0.92, {
      maxBytes: kbToBytes(5000),
      allowDownscale: false,
    });
    expect(result).toMatchObject({ quality: 0.92, scale: 1, reached: true });
  });

  it('senkt die Qualität bis die Obergrenze eingehalten wird', async () => {
    const canvas = noisyCanvas();
    const full = await encodeForExport(canvas, 'jpeg', 0.92, null);
    const maxBytes = Math.round(full.blob.size * 0.5);

    const result = await encodeToTargetSize(canvas, 'image/jpeg', 0.92, {
      maxBytes,
      allowDownscale: false,
    });
    expect(result.reached).toBe(true);
    expect(result.blob.size).toBeLessThanOrEqual(maxBytes);
    expect(result.quality).toBeLessThan(0.92);
    expect(result.quality).toBeGreaterThanOrEqual(MIN_QUALITY);
    expect([result.width, result.height]).toEqual([800, 600]);
  });

  it('verkleinert nur, wenn erlaubt, und meldet sonst reached: false', async () => {
    const canvas = noisyCanvas();
    const target = { maxBytes: kbToBytes(10) };

    const missed = await encodeToTargetSize(canvas, 'image/jpeg', 0.92, {
      ...target,
      allowDownscale: false,
    });
    expect(missed.reached).toBe(false);
    expect(missed.scale).toBe(1);

    const scaled = await encodeToTargetSize(canvas, 'image/jpeg', 0.92, {
      ...target,
      allowDownscale: true,
    });
    expect(scaled.reached).toBe(true);
    expect(scaled.scale).toBeLessThan(1);
    expect(scaled.blob.size).toBeLessThanOrEqual(target.maxBytes);
    expect(scaled.width).toBeLessThan(800);
  });

  it('nutzt die übergebene Kodierfunktion (Binärsuche ohne echten Encoder)', async () => {
    // Größe wächst linear mit der Qualität: 1000 Bytes bei q = 1
    const encode = vi.fn(async (_c, _type, q) => new Blob([new Uint8Array(Math.round(q * 1000))]));
    const result = await encodeToTargetSize(
      gradient,
      'image/webp',
      0.9,
      { maxBytes: 500, allowDownscale: false },
      encode
    );
    expect(result.reached).toBe(true);
    expect(result.blob.size).toBeLessThanOrEqual(500);
    expect(result.quality).toBeGreaterThan(0.45);
    expect(encode).toHaveBeenCalledTimes(9); // oben, unten, 7 Suchschritte
  });
});

describe('ExportManager mit Zielgröße', () => {
  it('JPEG-Export liefert eine Datei unter der Obergrenze und meldet die Qualität', async () => {
    const manager = new ExportManager();
    const download = vi.spyOn(manager, 'downloadBlob').mockImplementation(() => {});
    const canvas = noisyCanvas();
    const maxBytes = kbToBytes(60);

    const result = await manager.exportImage(canvas, 'jpeg', 'bild', {
      quality: 0.92,
      targetSize: { maxBytes, allowDownscale: false },
    });

    expect(download).toHaveBeenCalledTimes(1);
    const [blob, filename] = download.mock.calls[0];
    expect(filename).toBe('bild.jpg');
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).toBeLessThanOrEqual(maxBytes);
    expect(result.targetReached).toBe(true);
    expect(result.quality).toBeLessThan(92);
  });

  it('ohne Zielgröße bleibt der bisherige Export unverändert', async () => {
    const manager = new ExportManager();
    const blobDownload = vi.spyOn(manager, 'downloadBlob').mockImplementation(() => {});
    const urlDownload = vi.spyOn(manager, 'downloadDataURL').mockImplementation(() => {});
    const result = await manager.exportImage(gradient, 'webp', 'bild', { quality: 0.8 });
    expect(urlDownload).toHaveBeenCalledTimes(1);
    expect(blobDownload).not.toHaveBeenCalled();
    expect(result.targetReached).toBeUndefined();
  });
});

describe('withWhiteBackground', () => {
  it('füllt Transparenz weiß wie der JPEG-Export', () => {
    const transparent = document.createElement('canvas');
    transparent.width = 4;
    transparent.height = 4;
    const copy = withWhiteBackground(transparent);
    expect([...copy.getContext('2d').getImageData(1, 1, 1, 1).data]).toEqual([255, 255, 255, 255]);
  });
});
