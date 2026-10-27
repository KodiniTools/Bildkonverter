/**
 * ExportManager mit `download: false`: liefert die Datei als Blob zum Teilen,
 * ohne einen Download auszulösen. Standard bleibt der Download.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ExportManager } from '@/utils/exportUtils';

function solidCanvas(width = 64, height = 48) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3366cc';
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

afterEach(() => vi.restoreAllMocks());

describe('ExportManager download-Option', () => {
  it.each([
    ['png', 'image/png', 'bild.png'],
    ['jpeg', 'image/jpeg', 'bild.jpg'],
    ['webp', 'image/webp', 'bild.webp'],
  ])('%s: download false liefert Blob ohne Download', async (format, mime, filename) => {
    const manager = new ExportManager();
    const download = vi.spyOn(manager, 'downloadBlob').mockImplementation(() => {});

    const result = await manager.exportImage(solidCanvas(), format, 'bild', {
      quality: 0.8,
      download: false,
    });

    expect(download).not.toHaveBeenCalled();
    expect(result.filename).toBe(filename);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe(mime);
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('Zielgröße: download false liefert ebenfalls nur den Blob', async () => {
    const manager = new ExportManager();
    const download = vi.spyOn(manager, 'downloadBlob').mockImplementation(() => {});

    const result = await manager.exportImage(solidCanvas(), 'jpeg', 'bild', {
      quality: 0.9,
      targetSize: { maxBytes: 50 * 1024, allowDownscale: false },
      download: false,
    });

    expect(download).not.toHaveBeenCalled();
    expect(result.blob.type).toBe('image/jpeg');
  });

  it('PDF: download false liefert einen PDF-Blob statt pdf.save', async () => {
    const manager = new ExportManager();
    const result = await manager.exportImage(solidCanvas(), 'pdf', 'bild', { download: false });
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.type).toBe('application/pdf');
  });

  it('ohne Option wird wie bisher heruntergeladen', async () => {
    const manager = new ExportManager();
    const download = vi.spyOn(manager, 'downloadBlob').mockImplementation(() => {});

    const result = await manager.exportImage(solidCanvas(), 'png', 'bild', {});

    expect(download).toHaveBeenCalledWith(result.blob, 'bild.png');
  });
});
