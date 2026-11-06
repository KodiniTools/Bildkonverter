import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';

vi.mock('@/utils/fileUtils', () => ({
  loadImage: vi.fn(async (src: string) => ({ src, naturalWidth: 4, naturalHeight: 3 })),
}));

import { useBackgroundRemoval } from '@/composables/editor/useBackgroundRemoval';

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

type Remove = (
  img: unknown,
  onProgress: (p: { phase: string; fraction?: number }) => void
) => Promise<unknown>;

function setup(remove: Remove) {
  const deps = {
    currentImage: ref<unknown>({ naturalWidth: 4, naturalHeight: 3 }),
    isCollageMode: ref(false),
    background: ref({ color: '#ffffff', opacity: 100 }),
    outputFormat: ref('jpeg'),
    exportTransparent: ref(false),
    renderImage: vi.fn(),
    updateImageSize: vi.fn(),
    saveHistory: vi.fn(),
    t: (key: string) => key,
    remove,
  };
  // remove ist im Composable als removeBackground typisiert; hier genügt ein Ersatz
  return {
    deps,
    api: useBackgroundRemoval(deps as unknown as Parameters<typeof useBackgroundRemoval>[0]),
  };
}

const resultCanvas = { toDataURL: () => 'data:image/png;base64,AAA' };

beforeEach(() => {
  (window as unknown as { $toast: typeof toast }).$toast = toast;
  Object.values(toast).forEach((f) => f.mockClear());
});
afterEach(() => {
  delete (window as unknown as { $toast?: typeof toast }).$toast;
});

describe('useBackgroundRemoval', () => {
  it('ersetzt das Bild, blendet die Hintergrundfarbe aus und stellt PNG mit Transparenz ein', async () => {
    const { deps, api } = setup(async () => resultCanvas);
    expect(await api.removeImageBackground()).toBe(true);
    expect((deps.currentImage.value as { src: string }).src).toBe('data:image/png;base64,AAA');
    expect(deps.background.value).toEqual({ color: '#ffffff', opacity: 0 });
    expect(deps.outputFormat.value).toBe('png');
    expect(deps.exportTransparent.value).toBe(true);
    expect(deps.saveHistory).toHaveBeenCalledTimes(1);
    expect(deps.renderImage).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('toast.editor.backgroundRemoved');
    expect(api.bgRemovalState.value.busy).toBe(false);
  });

  it('behält WebP (unterstützt Transparenz)', async () => {
    const { deps, api } = setup(async () => resultCanvas);
    deps.outputFormat.value = 'webp';
    await api.removeImageBackground();
    expect(deps.outputFormat.value).toBe('webp');
    expect(deps.exportTransparent.value).toBe(false);
  });

  it('zeigt den Fortschritt und ist währenddessen gesperrt', async () => {
    let finish: (v: unknown) => void = () => {};
    const { api } = setup(
      (_img, onProgress) =>
        new Promise((resolve) => {
          onProgress({ phase: 'download', fraction: 0.4 });
          finish = resolve;
        })
    );
    const running = api.removeImageBackground();
    expect(api.bgRemovalState.value).toMatchObject({
      busy: true,
      phase: 'download',
      fraction: 0.4,
    });
    expect(await api.removeImageBackground()).toBe(false); // zweiter Klick: ignoriert
    finish(resultCanvas);
    expect(await running).toBe(true);
    expect(api.bgRemovalState.value).toMatchObject({ busy: false, phase: null, fraction: null });
  });

  it('meldet Fehler, ohne Bild oder Einstellungen zu ändern', async () => {
    const { deps, api } = setup(async () => {
      throw new Error('kaputt');
    });
    const before = deps.currentImage.value;
    expect(await api.removeImageBackground()).toBe(false);
    expect(deps.currentImage.value).toBe(before);
    expect(deps.background.value.opacity).toBe(100);
    expect(deps.saveHistory).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('toast.editor.backgroundRemoveFailed');
  });

  it('tut nichts ohne Bild und weist in der Collage darauf hin', async () => {
    const remove = vi.fn() as unknown as Remove;
    const { deps, api } = setup(remove);
    deps.isCollageMode.value = true;
    expect(await api.removeImageBackground()).toBe(false);
    expect(toast.info).toHaveBeenCalledWith('toast.editor.backgroundCollage');
    deps.isCollageMode.value = false;
    deps.currentImage.value = null;
    expect(await api.removeImageBackground()).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });
});
