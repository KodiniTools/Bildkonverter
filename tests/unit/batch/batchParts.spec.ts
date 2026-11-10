/** Aus BatchView ausgelagerte Bausteine: Ablage, Einstellungen, Liste, Karte, Vergleich */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import BatchUploadZone from '@/components/batch/BatchUploadZone.vue';
import BatchSettingsPanel from '@/components/batch/BatchSettingsPanel.vue';
import BatchFileList from '@/components/batch/BatchFileList.vue';
import BatchFileCard from '@/components/batch/BatchFileCard.vue';
import BatchPreviewDialog from '@/components/batch/BatchPreviewDialog.vue';
import { defaultBatchSettings, type BatchFile } from '@/composables/batch/types';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
const global = { plugins: [i18n] };

let wrapper: VueWrapper | null = null;
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

function batchFile(patch: Partial<BatchFile> = {}): BatchFile {
  return {
    id: 'f1',
    file: new File(['x'], 'a.png'),
    name: 'a.png',
    size: 2048,
    preview: 'data:image/png;base64,AAAA',
    width: 120,
    height: 80,
    status: 'pending',
    progress: 0,
    processedPreview: null,
    processedBlob: null,
    processedSize: 0,
    error: null,
    ...patch,
  };
}

describe('BatchUploadZone', () => {
  it('meldet abgelegte Dateien und markiert das Ziehen', async () => {
    wrapper = mount(BatchUploadZone, { global });
    const zone = wrapper.get('.upload-zone');
    await zone.trigger('dragover');
    expect(zone.classes()).toContain('drag-over');
    const file = new File(['x'], 'b.png', { type: 'image/png' });
    await zone.trigger('drop', { dataTransfer: { files: [file] } });
    expect(zone.classes()).not.toContain('drag-over');
    expect(wrapper.emitted('files')).toEqual([[[file]]]);
  });

  it('meldet ausgewählte Dateien aus dem Datei-Input', async () => {
    wrapper = mount(BatchUploadZone, { global });
    const input = wrapper.get('input[type="file"]');
    const file = new File(['x'], 'c.png', { type: 'image/png' });
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    expect(wrapper.emitted('files')).toEqual([[[file]]]);
  });
});

describe('BatchSettingsPanel', () => {
  const props = {
    referenceAspectRatio: 1.5,
    isProcessing: false,
    hasConvertableFiles: true,
    hasCompletedFiles: false,
    hasProcessedFiles: false,
    downloadReady: false,
  };
  const mountPanel = (extra = {}) => {
    const settings = ref(defaultBatchSettings());
    wrapper = mount(BatchSettingsPanel, {
      props: {
        ...props,
        ...extra,
        settings: settings.value,
        'onUpdate:settings': (v: typeof settings.value) => (settings.value = v),
      },
      global,
    });
    return settings;
  };

  it('Breite setzt die Höhe nach dem Seitenverhältnis', async () => {
    const settings = mountPanel();
    const [width] = wrapper!.findAll('.resize-options input[type="number"]');
    await width.setValue('300');
    expect(settings.value.width).toBe(300);
    expect(settings.value.height).toBe(200);
  });

  it('PDF-Optionen nur bei PDF, EXIF-Schalter nur bei EXIF-Formaten', async () => {
    const settings = mountPanel();
    expect(wrapper!.find('.pdf-mode-options').exists()).toBe(false);
    expect(wrapper!.find('[data-testid="batch-keep-exif"]').exists()).toBe(true);
    settings.value.format = 'pdf';
    await nextTick();
    expect(wrapper!.find('.pdf-mode-options').exists()).toBe(true);
    await wrapper!.findAll('.radio-label input')[1].setValue();
    expect(settings.value.pdfMode).toBe('merged');
  });

  it('Aktionen: Starten, Downloads erst nach der Konvertierung, Zurücksetzen nur danach', async () => {
    mountPanel();
    const btn = (cls: string) => wrapper!.get(`.action-buttons .${cls}`);
    expect(btn('btn-primary').text()).toContain(de.batch.start);
    expect(btn('btn-download').attributes('disabled')).toBeDefined();
    expect(btn('btn-zip').attributes('disabled')).toBeDefined();
    expect(wrapper!.find('.action-buttons .btn-secondary').exists()).toBe(false);

    await wrapper!.setProps({
      hasCompletedFiles: true,
      hasProcessedFiles: true,
      downloadReady: true,
    });
    expect(btn('btn-primary').text()).toContain(de.batch.reconvert);
    expect(btn('btn-download').classes()).toContain('btn-download-ready');
    for (const cls of ['btn-primary', 'btn-download', 'btn-zip', 'btn-danger', 'btn-secondary']) {
      await btn(cls).trigger('click');
    }
    for (const name of ['start', 'download-all', 'download-zip', 'clear', 'reset']) {
      expect(wrapper!.emitted(name), name).toHaveLength(1);
    }

    await wrapper!.setProps({ isProcessing: true });
    expect(btn('btn-primary').text()).toContain(de.batch.processing);
    expect(btn('btn-danger').attributes('disabled')).toBeDefined();
  });
});

describe('BatchFileCard', () => {
  it('Status-Klassen, Ergebnisgröße und Aktionen', async () => {
    wrapper = mount(BatchFileCard, {
      props: { file: batchFile({ status: 'completed', processedSize: 1024 }), format: 'webp' },
      global,
    });
    expect(wrapper.classes()).toContain('completed');
    expect(wrapper.get('.file-meta').text()).toContain('→ 1 KB (WEBP)');
    const [download, preview] = wrapper.findAll('.file-actions .btn-icon');
    await download.trigger('click');
    await preview.trigger('click');
    await wrapper.get('.remove-btn').trigger('click');
    expect(wrapper.emitted('download')).toHaveLength(1);
    expect(wrapper.emitted('preview')).toHaveLength(1);
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });

  it('Verarbeitung sperrt Entfernen, Fehler zeigt die Meldung', async () => {
    wrapper = mount(BatchFileCard, {
      props: { file: batchFile({ status: 'processing', progress: 40 }), format: 'jpg' },
      global,
    });
    expect(wrapper.find('.spinner').exists()).toBe(true);
    expect(wrapper.get('.progress-info').text()).toBe('40%');
    expect(wrapper.get('.remove-btn').attributes('disabled')).toBeDefined();

    await wrapper.setProps({ file: batchFile({ status: 'error', error: 'kaputt' }) });
    expect(wrapper.classes()).toContain('error');
    expect(wrapper.get('.error-message').text()).toBe('kaputt');
    expect(wrapper.find('.file-actions').exists()).toBe(false);
  });
});

describe('BatchFileList', () => {
  it('reicht Kartenereignisse mit Datei bzw. id weiter und zeigt den Fortschritt', async () => {
    const files = [batchFile({ status: 'completed' }), batchFile({ id: 'f2', name: 'b.png' })];
    wrapper = mount(BatchFileList, {
      props: { files, format: 'jpg', isProcessing: true, overallProgress: 50, processedCount: 1 },
      global,
    });
    expect(wrapper.get('.file-count').text()).toBe('2');
    expect(wrapper.get('.progress-fill').attributes('style')).toContain('width: 50%');
    expect(wrapper.get('.progress-summary span').text()).toBe('1 / 2');

    await wrapper.findAll('.file-actions .btn-icon')[1].trigger('click');
    await wrapper.findAll('.remove-btn')[1].trigger('click');
    expect(wrapper.emitted('preview')).toEqual([[files[0]]]);
    expect(wrapper.emitted('remove')).toEqual([['f2']]);
  });
});

describe('BatchPreviewDialog', () => {
  it('zeigt Original und Ergebnis im #overlay-root und schließt', async () => {
    const overlay = () => document.getElementById('overlay-root')!;
    wrapper = mount(BatchPreviewDialog, { props: { file: null }, global });
    expect(overlay().querySelector('.modal-content')).toBeNull();
    await wrapper.setProps({ file: batchFile({ processedPreview: 'blob:x' }) });
    const imgs = overlay().querySelectorAll('.comparison-item img');
    expect(imgs[1].getAttribute('src')).toBe('blob:x');
    overlay().querySelector<HTMLElement>('.modal-content')!.click();
    overlay().querySelector<HTMLButtonElement>('.close-btn')!.click();
    overlay().querySelector<HTMLElement>('.preview-modal')!.click();
    expect(wrapper.emitted('close')).toHaveLength(2);
  });
});
