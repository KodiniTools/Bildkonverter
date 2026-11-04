/**
 * Aus EditorView ausgelagerte Bausteine: Werkzeugleiste, Crop-Rahmen,
 * Export-Dialog und Weiterleitungs-Angebot.
 */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import EditorToolbar from '@/components/editor/toolbar/EditorToolbar.vue';
import CropOverlay from '@/components/editor/canvas/CropOverlay.vue';
import ExportDialog from '@/components/editor/dialogs/ExportDialog.vue';
import ForwardOfferDialog from '@/components/editor/dialogs/ForwardOfferDialog.vue';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
const global = { plugins: [i18n] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wrapper: VueWrapper<any> | null = null;
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

const overlay = () => document.getElementById('overlay-root')!;

describe('EditorToolbar', () => {
  const base = {
    hasImage: false,
    isCollageMode: false,
    canUndo: false,
    canRedo: false,
    isExporting: false,
  };

  it('sperrt Werkzeuge und Export ohne Bild, Upload bleibt aktiv', () => {
    wrapper = mount(EditorToolbar, { props: base, global });
    const buttons = wrapper.findAll('button.tb-btn');
    const upload = buttons[0];
    expect(upload.text()).toContain(de.editor.toolbar.upload);
    expect(upload.attributes('disabled')).toBeUndefined();
    const disabled = buttons.filter((b) => b.attributes('disabled') !== undefined);
    // Text, Vorschau, Drucken, Kopieren, Zurücksetzen, Löschen, Teilen, Download
    expect(disabled).toHaveLength(8);
    expect(wrapper.text()).not.toContain(de.editor.toolbar.exitCollage);
  });

  it('meldet jede Aktion als Ereignis', async () => {
    wrapper = mount(EditorToolbar, {
      props: { ...base, hasImage: true, isCollageMode: true, canUndo: true, canRedo: true },
      global,
    });
    const order = [
      'upload',
      'undo',
      'redo',
      'exit-collage',
      'add-text',
      'preview',
      'print',
      'copy',
      'reset',
      'clear',
      'share',
      'download',
    ];
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(order.length);
    for (const b of buttons) await b.trigger('click');
    for (const name of order) expect(wrapper.emitted(name), name).toHaveLength(1);
  });

  it('zeigt beim Export den Spinner und sperrt Kopieren, Teilen, Download', () => {
    wrapper = mount(EditorToolbar, {
      props: { ...base, hasImage: true, isExporting: true },
      global,
    });
    const download = wrapper.get('button.tb-btn--success');
    expect(download.attributes('disabled')).toBeDefined();
    expect(download.text()).toContain(de.toast.editor.exporting);
    const share = wrapper.findAll('button.tb-btn--primary').at(-1)!;
    expect(share.attributes('disabled')).toBeDefined();
    const copy = wrapper.get(`button[title="${de.editor.toolbar.copy}"]`);
    expect(copy.attributes('disabled')).toBeDefined();
  });

  it('rendert den upload-Slot neben dem Upload-Button', () => {
    wrapper = mount(EditorToolbar, {
      props: { ...base, hasImage: true },
      slots: { upload: '<input type="file" class="slot-input" />' },
      global,
    });
    expect(wrapper.find('.toolbar-group .slot-input').exists()).toBe(true);
    expect(wrapper.find('button.tb-btn--primary').text()).toContain(de.editor.toolbar.replaceImage);
  });
});

describe('CropOverlay', () => {
  it('setzt Position, Zustände und Abmessungen', () => {
    wrapper = mount(CropOverlay, {
      props: {
        overlayStyle: { left: '10px', top: '20px', width: '30px', height: '40px' },
        dragging: true,
        resizing: false,
        labelInside: true,
        width: 300,
        height: 400,
      },
      global,
    });
    const root = wrapper.get('.crop-overlay');
    expect(root.classes()).toEqual(expect.arrayContaining(['dragging']));
    expect(root.classes()).not.toContain('resizing');
    expect(root.attributes('style')).toContain('left: 10px');
    expect(wrapper.findAll('.resize-handle')).toHaveLength(8);
    const label = wrapper.get('.crop-dimensions');
    expect(label.classes()).toContain('crop-dimensions--inside');
    expect(label.text()).toBe('300 × 400 px');
  });
});

describe('ExportDialog', () => {
  const props = {
    open: true,
    mode: 'download' as const,
    hasShareFile: false,
    extension: 'png',
    isExporting: false,
    filename: 'bild',
  };

  it('rendert nur geöffnet ins #overlay-root', async () => {
    wrapper = mount(ExportDialog, { props: { ...props, open: false }, global });
    expect(overlay().querySelector('.export-dialog')).toBeNull();
    await wrapper.setProps({ open: true });
    expect(overlay().querySelector('.export-dialog')).not.toBeNull();
    expect(overlay().querySelector('.export-dialog__ext')!.textContent).toBe('.png');
  });

  it('bindet den Dateinamen per v-model und meldet Enter/Escape', async () => {
    wrapper = mount(ExportDialog, {
      props: { ...props, 'onUpdate:filename': (v: string) => wrapper!.setProps({ filename: v }) },
      global,
      attachTo: document.body,
    });
    const input = overlay().querySelector<HTMLInputElement>('.export-dialog__input')!;
    expect(input.value).toBe('bild');
    input.value = 'neu';
    input.dispatchEvent(new Event('input'));
    expect(wrapper.emitted('update:filename')).toEqual([['neu']]);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('Teilen-Modus: Datenschutzhinweis und Teilen-Symbol', () => {
    wrapper = mount(ExportDialog, { props: { ...props, mode: 'share' }, global });
    expect(overlay().textContent).toContain(de.editor.share.privacy);
    expect(overlay().querySelector('.export-dialog__title')!.textContent!.trim()).toBe(
      de.editor.toolbar.share
    );
  });

  it('bereitliegende Datei: nur noch "Jetzt teilen"', async () => {
    wrapper = mount(ExportDialog, {
      props: { ...props, mode: 'share', hasShareFile: true },
      global,
    });
    expect(overlay().querySelector('.export-dialog__input')).toBeNull();
    overlay().querySelector<HTMLButtonElement>('.export-dialog__btn--confirm')!.click();
    expect(wrapper.emitted('share-now')).toHaveLength(1);
  });

  it('sperrt beim Export Eingabe und Bestätigen', () => {
    wrapper = mount(ExportDialog, { props: { ...props, isExporting: true }, global });
    expect(overlay().querySelector<HTMLInputElement>('.export-dialog__input')!.disabled).toBe(true);
    expect(
      overlay().querySelector<HTMLButtonElement>('.export-dialog__btn--confirm')!.disabled
    ).toBe(true);
  });

  it('Klick auf den Hintergrund schließt', async () => {
    wrapper = mount(ExportDialog, { props, global });
    overlay().querySelector<HTMLElement>('.export-dialog-overlay')!.click();
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});

describe('ForwardOfferDialog', () => {
  it('meldet Ziel und Ablehnen', () => {
    wrapper = mount(ForwardOfferDialog, { props: { open: true }, global });
    const options = overlay().querySelectorAll<HTMLButtonElement>('.forward-offer__option');
    expect(options).toHaveLength(2);
    options[0].click();
    options[1].click();
    overlay().querySelector<HTMLButtonElement>('.forward-offer__dismiss')!.click();
    overlay().querySelector<HTMLElement>('.forward-offer-overlay')!.click();
    expect(wrapper.emitted('forward')).toEqual([['color-extractor'], ['visualizer']]);
    expect(wrapper.emitted('dismiss')).toHaveLength(2);
  });

  it('rendert geschlossen nichts', () => {
    wrapper = mount(ForwardOfferDialog, { props: { open: false }, global });
    expect(overlay().querySelector('.forward-offer')).toBeNull();
  });
});
