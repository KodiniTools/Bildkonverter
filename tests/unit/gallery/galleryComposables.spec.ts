import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useGalleryRename } from '@/composables/gallery/useGalleryRename';
import {
  MAX_GALLERY_FILE_SIZE,
  useGalleryUpload,
  type GalleryUploadOptions,
} from '@/composables/gallery/useGalleryUpload';
import type { GalleryImage } from '@/composables/gallery/types';
import { formatDateTime } from '@/utils/formatDate';

const image = { id: 7, name: 'alt.png' } as GalleryImage;

describe('useGalleryRename', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('startet mit dem aktuellen Namen und fokussiert das Eingabefeld', async () => {
    const input = document.createElement('input');
    input.dataset.renameId = '7';
    document.body.appendChild(input);
    const select = vi.spyOn(input, 'select');

    const r = useGalleryRename(vi.fn());
    await r.startRename(image);
    expect(r.editingImageId.value).toBe(7);
    expect(r.editingName.value).toBe('alt.png');
    expect(document.activeElement).toBe(input);
    expect(select).toHaveBeenCalled();
  });

  it('übernimmt nur geänderte, nicht leere Namen (getrimmt)', async () => {
    const rename = vi.fn();
    const r = useGalleryRename(rename);
    for (const value of ['  ', 'alt.png', '  neu.png ']) {
      await r.startRename(image);
      r.editingName.value = value;
      r.confirmRename(image);
      expect(r.editingImageId.value).toBeNull();
      expect(r.editingName.value).toBe('');
    }
    expect(rename).toHaveBeenCalledTimes(1);
    expect(rename).toHaveBeenCalledWith(7, 'neu.png');
  });

  it('Abbrechen verwirft die Eingabe', async () => {
    const rename = vi.fn();
    const r = useGalleryRename(rename);
    await r.startRename(image);
    r.editingName.value = 'x';
    r.cancelRename();
    expect(r.editingImageId.value).toBeNull();
    expect(rename).not.toHaveBeenCalled();
  });
});

function withUpload(options: Partial<GalleryUploadOptions> = {}) {
  let api!: ReturnType<typeof useGalleryUpload>;
  const addImage = vi.fn();
  const Host = defineComponent({
    setup() {
      api = useGalleryUpload({ addImage, t: (key) => key, ...options });
      return () => h('div');
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { api, addImage, wrapper };
}

function pasteEvent(items: Array<{ type: string; file: File | null }>) {
  const event = new Event('paste', { cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: { items: items.map((i) => ({ type: i.type, getAsFile: () => i.file })) },
  });
  return event;
}

describe('useGalleryUpload', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    delete window.$toast;
  });

  it('lehnt Nicht-Bilder und zu große Dateien ab', async () => {
    const { api, addImage, wrapper } = withUpload();
    await expect(
      api.addImageToGallery(new File(['x'], 'a.txt', { type: 'text/plain' }))
    ).rejects.toThrow('kein Bild');
    const big = new File(['x'], 'b.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: MAX_GALLERY_FILE_SIZE + 1 });
    await expect(api.addImageToGallery(big)).rejects.toThrow('zu groß');
    expect(addImage).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('Dateiauswahl meldet Fehler per Toast und leert das Input', async () => {
    const error = vi.fn();
    window.$toast = { error } as unknown as typeof window.$toast;
    const { api, wrapper } = withUpload();
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: [new File(['x'], 'a.txt', { type: 'text/plain' })],
    });
    const clear = vi.spyOn(input, 'value', 'set');
    await api.handleFileSelect({ target: input } as unknown as Event);
    expect(error).toHaveBeenCalledWith('gallery.uploadError: Datei ist kein Bild');
    expect(clear).toHaveBeenCalledWith('');
    wrapper.unmount();
  });

  it('Ordnerauswahl überspringt Nicht-Bilder still', async () => {
    const { api, addImage, wrapper } = withUpload();
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['x'], 'a.txt', { type: 'text/plain' })],
    });
    await api.handleFolderSelect({ target: input } as unknown as Event);
    expect(addImage).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('Einfügen: lauscht nur solange montiert, ignoriert Eingabefelder und Nicht-Bilder', () => {
    const { wrapper } = withUpload();
    const file = new File(['x'], 'p.png', { type: 'image/png' });

    const text = pasteEvent([{ type: 'text/plain', file: null }]);
    window.dispatchEvent(text);
    expect(text.defaultPrevented).toBe(false);

    const field = document.createElement('input');
    document.body.appendChild(field);
    field.focus();
    const inField = pasteEvent([{ type: 'image/png', file }]);
    window.dispatchEvent(inField);
    expect(inField.defaultPrevented).toBe(false);
    field.blur();

    const img = pasteEvent([{ type: 'image/png', file }]);
    window.dispatchEvent(img);
    expect(img.defaultPrevented).toBe(true);

    wrapper.unmount();
    const after = pasteEvent([{ type: 'image/png', file }]);
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});

describe('formatDateTime', () => {
  it('formatiert deutsch mit Uhrzeit', () => {
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4))).toBe('02.01.2026, 03:04');
  });
});
