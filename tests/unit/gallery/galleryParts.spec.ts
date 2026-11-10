/** Aus GalleryView ausgelagerte Bausteine: Werkzeugleiste, Leerzustand, Karte, Vorschau */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import GalleryToolbar from '@/components/gallery/GalleryToolbar.vue';
import GalleryEmptyState from '@/components/gallery/GalleryEmptyState.vue';
import GalleryCard from '@/components/gallery/GalleryCard.vue';
import GalleryPreviewDialog from '@/components/gallery/GalleryPreviewDialog.vue';
import type { GalleryImage } from '@/composables/gallery/types';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
const global = { plugins: [i18n] };

let wrapper: VueWrapper | null = null;
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

const image: GalleryImage = {
  id: 1,
  name: 'foto.png',
  url: 'data:image/png;base64,AAAA',
  thumbnail: 'data:image/jpeg;base64,AAAA',
  width: 640,
  height: 480,
  size: 2048,
  uploadedAt: new Date(2026, 10, 4, 20, 15),
  file: null,
};

describe('GalleryToolbar', () => {
  const base = {
    imageCount: 0,
    multiSelect: false,
    allSelected: false,
    selectedCount: 0,
    hasSelection: false,
  };
  const labels = (w: VueWrapper) => w.findAll('button').map((b) => b.text());

  it('zeigt ohne Bilder nur die Upload-Buttons und die Slots', () => {
    wrapper = mount(GalleryToolbar, {
      props: base,
      slots: { 'file-input': '<input class="fi" />', 'folder-input': '<input class="di" />' },
      global,
    });
    expect(labels(wrapper)).toEqual([de.gallery.buttons.upload, de.gallery.buttons.uploadFolder]);
    expect(wrapper.find('.fi').exists()).toBe(true);
    expect(wrapper.find('.di').exists()).toBe(true);
    expect(wrapper.find('.toolbar__separator').exists()).toBe(false);
  });

  it('Mehrfachauswahl: Alle auswählen/abwählen und Collage ab zwei Bildern', async () => {
    wrapper = mount(GalleryToolbar, {
      props: { ...base, imageCount: 3, multiSelect: true, selectedCount: 1 },
      global,
    });
    expect(wrapper.get('.tb-btn--active').text()).toBe(de.gallery.buttons.cancelSelection);
    expect(labels(wrapper)).toContain(de.gallery.buttons.selectAll);
    expect(wrapper.find('.tb-btn--accent').exists()).toBe(false);

    await wrapper.setProps({ selectedCount: 3, allSelected: true });
    expect(labels(wrapper)).toContain(de.gallery.buttons.deselectAll);
    expect(wrapper.get('.tb-btn--accent').text()).toContain('(3)');
  });

  it('meldet alle Aktionen', async () => {
    wrapper = mount(GalleryToolbar, {
      props: { ...base, imageCount: 2, hasSelection: true },
      global,
    });
    // Upload, Ordner, Mehrfachauswahl, Im Editor, Löschen, Alle löschen
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(6);
    for (const b of buttons) await b.trigger('click');
    for (const name of [
      'upload',
      'upload-folder',
      'toggle-multi-select',
      'open-editor',
      'delete-selected',
      'delete-all',
    ]) {
      expect(wrapper.emitted(name), name).toHaveLength(1);
    }

    await wrapper.setProps({ multiSelect: true, selectedCount: 2 });
    await wrapper.findAll('button')[3].trigger('click');
    await wrapper.get('.tb-btn--accent').trigger('click');
    expect(wrapper.emitted('toggle-select-all')).toHaveLength(1);
    expect(wrapper.emitted('create-collage')).toHaveLength(1);
    // Einzelaktionen sind in der Mehrfachauswahl ausgeblendet
    expect(wrapper.find('.tb-btn--primary').exists()).toBe(false);
  });
});

describe('GalleryEmptyState', () => {
  it('meldet Upload', async () => {
    wrapper = mount(GalleryEmptyState, { global });
    expect(wrapper.text()).toContain(de.gallery.empty.title);
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('upload')).toHaveLength(1);
  });
});

describe('GalleryCard', () => {
  const props = { image, multiSelect: false, selected: false, checked: false, editing: false };

  it('zeigt Name, Maße, Größe und Datum', () => {
    wrapper = mount(GalleryCard, { props, global });
    expect(wrapper.get('.gallery-card__name').text()).toBe('foto.png');
    expect(wrapper.get('.gallery-card__meta').text()).toContain('640 × 480');
    expect(wrapper.get('.gallery-card__meta').text()).toContain('2 KB');
    expect(wrapper.get('.gallery-card__date').text()).toBe('04.11.2026, 20:15');
  });

  it('Auswahlklassen je nach Modus', async () => {
    wrapper = mount(GalleryCard, { props: { ...props, selected: true, checked: true }, global });
    expect(wrapper.classes()).toContain('selected');
    expect(wrapper.classes()).not.toContain('multi-selected');
    expect(wrapper.find('.gallery-card__select-dot').exists()).toBe(true);

    await wrapper.setProps({ multiSelect: true });
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['multi-selected']));
    expect(wrapper.classes()).not.toContain('selected');
    await wrapper.get('.gallery-card__checkbox').trigger('click');
    expect(wrapper.emitted('toggle')).toHaveLength(1);
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('Klick wählt, Vorschau-Button öffnet ohne Auswahl', async () => {
    wrapper = mount(GalleryCard, { props, global });
    await wrapper.trigger('click');
    await wrapper.get('.gallery-card__preview-btn').trigger('click');
    expect(wrapper.emitted('select')).toHaveLength(1);
    expect(wrapper.emitted('preview')).toHaveLength(1);
  });

  it('Umbenennen: Start per Doppelklick/Button, Eingabe per v-model, Enter/Escape/Blur', async () => {
    wrapper = mount(GalleryCard, { props, global });
    await wrapper.get('.gallery-card__name').trigger('dblclick');
    await wrapper.get('.gallery-card__rename-btn').trigger('click');
    expect(wrapper.emitted('start-rename')).toHaveLength(2);

    await wrapper.setProps({ editing: true, editName: 'foto.png' });
    expect(wrapper.find('.gallery-card__rename-btn').exists()).toBe(false);
    const input = wrapper.get('input.gallery-card__name-input');
    expect(input.attributes('data-rename-id')).toBe('1');
    await input.setValue('neu.png');
    expect(wrapper.emitted('update:editName')).toEqual([['neu.png']]);
    await input.trigger('keydown', { key: 'Enter' });
    await input.trigger('keydown', { key: 'Escape' });
    await input.trigger('blur');
    await input.trigger('click');
    expect(wrapper.emitted('confirm-rename')).toHaveLength(2);
    expect(wrapper.emitted('cancel-rename')).toHaveLength(1);
    expect(wrapper.emitted('select')).toBeUndefined();
  });
});

describe('GalleryPreviewDialog', () => {
  const overlay = () => document.getElementById('overlay-root')!;

  it('rendert nur mit Bild ins #overlay-root und meldet Aktionen', async () => {
    wrapper = mount(GalleryPreviewDialog, { props: { image: null }, global });
    expect(overlay().querySelector('.preview-modal')).toBeNull();

    await wrapper.setProps({ image });
    expect(overlay().querySelector('.preview-modal__info h3')!.textContent).toBe('foto.png');
    const [editor, download] = overlay().querySelectorAll<HTMLButtonElement>(
      '.preview-modal__actions button'
    );
    editor.click();
    download.click();
    overlay().querySelector<HTMLButtonElement>('.preview-modal__close')!.click();
    overlay().querySelector<HTMLElement>('.preview-modal')!.click(); // kein Schließen
    overlay().querySelector<HTMLElement>('.preview-overlay')!.click();
    expect(wrapper.emitted('open-editor')).toHaveLength(1);
    expect(wrapper.emitted('download')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(2);
  });
});
