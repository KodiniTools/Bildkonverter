/**
 * useBatchConversion: kompletter Ablauf ohne Backend – Client-Formate, PDF
 * (einzeln und gesamt), SVG-Fallback, Fehlerpfad, Verwaltung.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useBatchConversion } from '@/composables/useBatchConversion';
import { loadImage } from '@/utils/fileUtils';
import { makePngFile, installToastMock, t } from './helpers';

let settings, batch, toasts;

beforeEach(async () => {
  toasts = installToastMock();
  settings = ref({
    format: 'jpg',
    quality: 80,
    width: null,
    height: null,
    maintainAspect: true,
    prefix: 'x_',
    pdfMode: 'single',
  });
  batch = useBatchConversion({ settings, t, confirm: async () => true });
  await batch.addFiles([
    await makePngFile('a.png', 400, 300),
    await makePngFile('b.png', 200, 500, '#cc4444'),
    new File(['x'], 'notes.txt', { type: 'text/plain' }),
  ]);
});

async function run(format, extra = {}) {
  Object.assign(settings.value, { format, width: null, height: null, pdfMode: 'single' }, extra);
  await batch.startProcessing();
  return batch.files.value.map((f) => ({
    status: f.status,
    type: f.processedBlob?.type,
    size: f.processedSize,
  }));
}

describe('useBatchConversion', () => {
  it('nimmt nur Bilddateien auf und merkt sich das Seitenverhältnis des ersten Bildes', () => {
    expect(batch.files.value.map((f) => [f.name, f.width, f.height])).toEqual([
      ['a.png', 400, 300],
      ['b.png', 200, 500],
    ]);
    expect(batch.referenceAspectRatio.value).toBeCloseTo(4 / 3);
    expect(batch.hasConvertableFiles.value).toBe(true);
    expect(batch.hasCompletedFiles.value).toBe(false);
  });

  it.each([
    ['jpg', 'image/jpeg'],
    ['webp', 'image/webp'],
    ['png', 'image/png'],
  ])('konvertiert client-seitig nach %s', async (format, mime) => {
    const result = await run(format);
    expect(result.every((r) => r.status === 'completed' && r.type === mime && r.size > 0)).toBe(
      true
    );
    expect(batch.processedFiles.value.map(batch.getOutputFilename)).toEqual([
      `x_a.${format}`,
      `x_b.${format}`,
    ]);
    expect(batch.downloadReady.value).toBe(true);
    expect(batch.overallProgress.value).toBe(100);
    expect(batch.processedCount.value).toBe(2);
  });

  it('skaliert auf die Zielbreite und erhält das Seitenverhältnis', async () => {
    await run('jpg', { width: 100 });
    const dims = await Promise.all(
      batch.files.value.map(async (f) => {
        const img = await loadImage(URL.createObjectURL(f.processedBlob));
        return [img.width, img.height];
      })
    );
    expect(dims).toEqual([
      [100, 75],
      [100, 250],
    ]);
  });

  it('erzeugt je Bild ein PDF', async () => {
    const result = await run('pdf');
    expect(result.map((r) => r.type)).toEqual(['application/pdf', 'application/pdf']);
    expect(batch.processedFiles.value).toHaveLength(2);
    // PDF hat keine Bildvorschau → Originalvorschau bleibt
    expect(batch.files.value[0].processedPreview).toBe(batch.files.value[0].preview);
  });

  it('fasst alle Bilder in ein gemeinsames PDF zusammen', async () => {
    await run('pdf', { pdfMode: 'merged' });
    expect(batch.processedFiles.value).toHaveLength(1);
    const merged = batch.processedFiles.value[0];
    expect(merged.isMerged).toBe(true);
    expect(merged.processedSize).toBeGreaterThan(0);
    expect(batch.getOutputFilename(merged)).toBe('x_merged.pdf');
    expect(batch.files.value.every((f) => f.processedBlob === merged.processedBlob)).toBe(true);
  });

  it('fällt ohne Backend auf den SVG-Wrapper zurück', async () => {
    const result = await run('svg');
    expect(result.every((r) => r.status === 'completed' && r.type === 'image/svg+xml')).toBe(true);
    const svg = await batch.files.value[0].processedBlob.text();
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).toContain('<image');
  });

  it('meldet Backend-Formate ohne Backend als Fehler', async () => {
    const result = await run('tiff');
    expect(result.every((r) => r.status === 'error')).toBe(true);
    expect(batch.processedFiles.value).toHaveLength(0);
    expect(batch.downloadReady.value).toBe(false);
    expect(toasts.filter((m) => m.startsWith('error:toast.batch.fileError'))).toHaveLength(2);
    expect(toasts.at(-1)).toContain('warning:toast.batch.processingComplete');
  });

  it('setzt zurück, entfernt und leert', async () => {
    await run('jpg');
    batch.resetConversion();
    expect(batch.files.value.map((f) => f.status)).toEqual(['pending', 'pending']);
    expect(batch.processedFiles.value).toHaveLength(0);
    expect(batch.downloadReady.value).toBe(false);

    batch.removeFile(batch.files.value[0].id);
    expect(batch.files.value.map((f) => f.name)).toEqual(['b.png']);

    await batch.clearAll();
    expect(batch.files.value).toHaveLength(0);
    expect(batch.referenceAspectRatio.value).toBeNull();
  });
});
