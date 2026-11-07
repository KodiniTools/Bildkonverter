import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('@/utils/fileUtils', async (orig) => ({
  ...(await orig<typeof import('@/utils/fileUtils')>()),
  readFileAsDataURL: vi.fn(async () => 'data:image/png;base64,AAAA'),
  loadImage: vi.fn(async () => ({ width: 40, height: 30 })),
}));
vi.mock('@/utils/conversionUtils', () => ({
  drawImageToCanvas: vi.fn(() => ({})),
  convertCanvasToFormat: vi.fn(async () => new Blob(['xyz'], { type: 'image/webp' })),
}));
vi.mock('@/api/api', () => ({
  ApiClient: { convertImage: vi.fn(async () => new Blob(['png'])) },
}));

import {
  outputFilenameFor,
  outputFormatFor,
  qualityFor,
  useFormatConverter,
} from '@/composables/conversion/useFormatConverter';
import { convertCanvasToFormat, drawImageToCanvas } from '@/utils/conversionUtils';
import { ApiClient } from '@/api/api';
import { useSavePrompt } from '@/composables/useSavePrompt';

const t = (key: string) => key;

describe('Hilfsfunktionen', () => {
  it('bildet Formatnamen auf Export-Schlüssel ab, Unbekanntes wird png', () => {
    expect(outputFormatFor('WebP')).toBe('webp');
    expect(outputFormatFor('JPG')).toBe('jpg');
    expect(outputFormatFor('PDF')).toBe('pdf');
    expect(outputFormatFor('')).toBe('png');
  });

  it('ersetzt die Endung und behält den Basisnamen', () => {
    expect(outputFilenameFor('urlaub.foto.png', 'webp')).toBe('urlaub.foto.webp');
    expect(outputFilenameFor('ohne-endung', 'jpg')).toMatch(/^ohne-endung\.jpe?g$/);
    expect(outputFilenameFor('a.heic', 'svg')).toBe('a.svg');
  });

  it('nutzt für WebP 0.85, sonst 0.92', () => {
    expect(qualityFor('webp')).toBe(0.85);
    expect(qualityFor('jpg')).toBe(0.92);
  });
});

describe('useFormatConverter', () => {
  const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() };

  beforeEach(() => {
    window.$toast = toast;
    URL.createObjectURL = vi.fn(() => 'blob:ergebnis');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.clearAllMocks();
    delete window.$toast;
  });

  it('konvertiert eine Datei und setzt Ergebnis, Größe und Dateiname', async () => {
    const c = useFormatConverter({ conversion: ref({ from: 'PNG', to: 'WebP' }), t });
    await c.startConversion(new File(['abc'], 'bild.png', { type: 'image/png' }));

    expect(drawImageToCanvas).toHaveBeenCalledWith(
      expect.anything(),
      { width: 40, height: 30 },
      'webp'
    );
    expect(convertCanvasToFormat).toHaveBeenCalledWith(expect.anything(), 'webp', 'bild.png', {
      quality: 0.85,
    });
    expect(c.isConverting.value).toBe(false);
    expect(c.convertedUrl.value).toBe('blob:ergebnis');
    expect(c.convertedSize.value).toBe(3);
    expect(c.sourcePreview.value).toBe('data:image/png;base64,AAAA');
    expect(c.outputFilename.value).toBe('bild.webp');
    expect(toast.success).toHaveBeenCalledWith('toast.conversion.success');
  });

  it('holt die Vorschau für TIFF/HEIC über das Backend', async () => {
    const c = useFormatConverter({ conversion: ref({ from: 'HEIC', to: 'JPG' }), t });
    await c.startConversion(new File(['abc'], 'foto.heic'));
    expect(ApiClient.convertImage).toHaveBeenCalledWith(expect.any(File), 'png', 'foto.heic', {});
    expect(c.sourcePreview.value).toBe('blob:ergebnis');
  });

  it('zeigt Fehler an und beendet die Verarbeitung', async () => {
    vi.mocked(convertCanvasToFormat).mockRejectedValueOnce(new Error('kaputt'));
    const c = useFormatConverter({ conversion: ref({ from: 'PNG', to: 'JPG' }), t });
    await c.startConversion(new File(['abc'], 'bild.png', { type: 'image/png' }));
    expect(c.conversionError.value).toBe('kaputt');
    expect(c.isConverting.value).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it('setzt alles zurück und gibt die Blob-URL frei', async () => {
    const c = useFormatConverter({ conversion: ref({ from: 'PNG', to: 'WebP' }), t });
    await c.startConversion(new File(['abc'], 'bild.png', { type: 'image/png' }));
    c.resetConverter();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:ergebnis');
    expect(c.sourceFile.value).toBeNull();
    expect(c.convertedUrl.value).toBeNull();
    expect(c.convertedSize.value).toBe(0);
    expect(c.outputFilename.value).toBe('');
  });

  it('fragt ohne Speichern-Dialog den Dateinamen ab und lädt dann über einen Link herunter', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const prompt = useSavePrompt();
    const c = useFormatConverter({ conversion: ref({ from: 'PNG', to: 'WebP' }), t });
    await c.downloadResult();
    expect(click).not.toHaveBeenCalled();
    expect(prompt.state.value.visible).toBe(false);

    await c.startConversion(new File(['abc'], 'bild.png', { type: 'image/png' }));
    const done = c.downloadResult();
    expect(prompt.state.value.visible).toBe(true);
    expect(prompt.state.value.filename).toBe('bild.webp');
    prompt.respond('urlaub.webp');
    await done;

    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.contexts[0]).toMatchObject({ download: 'urlaub.webp' });
    expect(document.querySelector('a[download]')).toBeNull();
    expect(toast.success).toHaveBeenLastCalledWith('toast.conversion.downloadStarted');
    click.mockRestore();
  });

  it('Abbrechen der Dateinamen-Abfrage lädt nichts herunter', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const prompt = useSavePrompt();
    const c = useFormatConverter({ conversion: ref({ from: 'PNG', to: 'WebP' }), t });
    await c.startConversion(new File(['abc'], 'bild.png', { type: 'image/png' }));
    toast.success.mockClear();

    const done = c.downloadResult();
    prompt.respond(null);
    await done;

    expect(click).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    click.mockRestore();
  });

  it('speichert mit Systemdialog direkt in die gewählte Datei', async () => {
    const write = vi.fn(async () => {});
    const close = vi.fn(async () => {});
    const picker = vi.fn(async () => ({
      name: 'gewählt.webp',
      createWritable: async () => ({ write, close, abort: vi.fn(async () => {}) }),
    }));
    vi.stubGlobal('showSaveFilePicker', picker);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const c = useFormatConverter({ conversion: ref({ from: 'PNG', to: 'WebP' }), t });
    await c.startConversion(new File(['abc'], 'bild.png', { type: 'image/png' }));

    await c.downloadResult();

    expect(picker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: 'bild.webp' }));
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ type: 'image/webp' }));
    expect(close).toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenLastCalledWith('save.saved');
    click.mockRestore();
    vi.unstubAllGlobals();
  });
});
