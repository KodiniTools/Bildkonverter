/**
 * Sidebar-Panels des Editors: melden Änderungen als Ereignisse und
 * verändern ihre Props nicht (vue/no-mutating-props).
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AdjustmentsPanel from '@/components/editor/sidebar/AdjustmentsPanel.vue';
import LightColorPanel from '@/components/editor/sidebar/LightColorPanel.vue';
import EffectsPanel from '@/components/editor/sidebar/EffectsPanel.vue';
import BackgroundPanel from '@/components/editor/sidebar/BackgroundPanel.vue';
import FilterSlider from '@/components/editor/sidebar/FilterSlider.vue';
import ResizePanel from '@/components/editor/sidebar/ResizePanel.vue';
import ExportPanel from '@/components/editor/sidebar/ExportPanel.vue';
import { FORMAT_INFO } from '@/utils/formatInfo';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import { defaultResizeSpec } from '@/utils/resizeModes';
import { DEFAULT_FILTERS, DEFAULT_BACKGROUND } from '@/composables/useFilterManagement';

const $t = (key, fallback) => fallback || key;
const mountPanel = (component, props) => mount(component, { props, global: { mocks: { $t } } });

const filterPanels = [
  ['AdjustmentsPanel', AdjustmentsPanel, 'adjustments', 'brightness'],
  ['LightColorPanel', LightColorPanel, 'lightColor', 'highlights'],
  ['EffectsPanel', EffectsPanel, 'effects', 'blur'],
];

describe.each(filterPanels)('%s', (_, component, section, firstFilter) => {
  function setup() {
    const filters = Object.freeze({ ...DEFAULT_FILTERS });
    const sectionsOpen = Object.freeze({ adjustments: true, lightColor: true, effects: true });
    const wrapper = mountPanel(component, { filters, sectionsOpen, disabled: false });
    return { wrapper, filters, sectionsOpen };
  }

  it('meldet Slider-Änderungen als update-filter und render, ohne die Props zu verändern', async () => {
    const { wrapper, filters } = setup();
    const slider = wrapper.findAllComponents(FilterSlider)[0];
    expect(slider.props('modelValue')).toBe(DEFAULT_FILTERS[firstFilter]);

    const range = slider.find('input[type="range"]');
    range.element.value = '5';
    await range.trigger('input');

    expect(wrapper.emitted('update-filter')).toEqual([[firstFilter, 5]]);
    expect(wrapper.emitted('render')).toHaveLength(1);
    expect(filters[firstFilter]).toBe(DEFAULT_FILTERS[firstFilter]); // eingefroren, unverändert

    await range.trigger('change');
    expect(wrapper.emitted('save-history')).toHaveLength(1);
  });

  it('deaktiviert den Reset, solange der Slider auf dem Standardwert steht', () => {
    const { wrapper } = setup();
    const slider = wrapper.findAllComponents(FilterSlider)[0];
    expect(slider.find('button.slider-field__reset').attributes('disabled')).toBeDefined();
  });

  it('meldet den Reset eines Sliders mit dem Standardwert', async () => {
    const filters = { ...DEFAULT_FILTERS, [firstFilter]: DEFAULT_FILTERS[firstFilter] + 5 };
    const sectionsOpen = { adjustments: true, lightColor: true, effects: true };
    const wrapper = mountPanel(component, { filters, sectionsOpen, disabled: false });
    const slider = wrapper.findAllComponents(FilterSlider)[0];
    await slider.find('button.slider-field__reset').trigger('click');
    expect(wrapper.emitted('update-filter').at(-1)).toEqual([
      firstFilter,
      slider.props('defaultValue'),
    ]);
    expect(wrapper.emitted('save-history')).toHaveLength(1);
  });

  it('meldet den Klick auf die Überschrift als toggle-section', async () => {
    const { wrapper, sectionsOpen } = setup();
    await wrapper.find('h3.section-header').trigger('click');
    expect(wrapper.emitted('toggle-section')).toEqual([[section]]);
    expect(sectionsOpen[section]).toBe(true);
  });

  it('blendet den Inhalt nach dem Zustand aus den Props ein oder aus', () => {
    const closed = mountPanel(component, {
      filters: { ...DEFAULT_FILTERS },
      sectionsOpen: { adjustments: false, lightColor: false, effects: false },
    });
    // v-show setzt display:none
    expect(closed.find('.section-content').element.style.display).toBe('none');
    expect(closed.classes()).toContain('collapsed');
  });
});

describe('BackgroundPanel', () => {
  function setup() {
    const background = Object.freeze({ ...DEFAULT_BACKGROUND });
    const wrapper = mountPanel(BackgroundPanel, { background, disabled: false });
    return { wrapper, background };
  }

  it('meldet Farbänderungen aus beiden Eingaben als update-background', async () => {
    const { wrapper, background } = setup();
    const color = wrapper.find('input[type="color"]');
    color.element.value = '#112233';
    await color.trigger('input');
    const text = wrapper.find('input[type="text"]');
    text.element.value = '#445566';
    await text.trigger('input');
    await text.trigger('change');

    expect(wrapper.emitted('update-background')).toEqual([
      ['color', '#112233'],
      ['color', '#445566'],
    ]);
    expect(wrapper.emitted('render')).toHaveLength(2);
    expect(wrapper.emitted('save-history')).toHaveLength(1);
    expect(background.color).toBe(DEFAULT_BACKGROUND.color);
  });

  it('meldet die Deckkraft über den Slider', async () => {
    const { wrapper } = setup();
    const range = wrapper.findComponent(FilterSlider).find('input[type="range"]');
    range.element.value = '35';
    await range.trigger('input');
    expect(wrapper.emitted('update-background')).toEqual([['opacity', 35]]);
  });

  it('zeigt die Werte aus den Props an', () => {
    const wrapper = mountPanel(BackgroundPanel, { background: { color: '#abcdef', opacity: 60 } });
    expect(wrapper.find('input[type="text"]').element.value).toBe('#abcdef');
    expect(wrapper.findComponent(FilterSlider).props('modelValue')).toBe(60);
  });
});

describe('ResizePanel – Modi', () => {
  const base = { resizeWidth: 800, resizeHeight: 400, baseWidth: 800, baseHeight: 400 };

  it('zeigt im Modus "Exakt" Breite/Höhe wie bisher', () => {
    const wrapper = mountPanel(ResizePanel, { ...base, resizeSpec: { ...defaultResizeSpec } });
    expect(wrapper.find('#resize-percent').exists()).toBe(false);
    expect(wrapper.findAll('.resize-input input[type="number"]')).toHaveLength(2);
  });

  it('meldet Moduswechsel und Eingaben als update:resizeSpec, ohne die Props zu verändern', async () => {
    const resizeSpec = Object.freeze({ ...defaultResizeSpec });
    const wrapper = mountPanel(ResizePanel, { ...base, resizeSpec });
    await wrapper.find('#resize-mode-select').setValue('percent');
    expect(wrapper.emitted('update:resizeSpec')[0][0]).toEqual({
      ...defaultResizeSpec,
      mode: 'percent',
    });

    await wrapper.setProps({ resizeSpec: { ...defaultResizeSpec, mode: 'percent' } });
    const percent = wrapper.find('#resize-percent');
    percent.element.value = '25';
    await percent.trigger('input');
    expect(wrapper.emitted('update:resizeSpec')[1][0].percent).toBe(25);
    expect(resizeSpec.mode).toBe('exact');
  });

  it('zeigt das Ergebnis der relativen Modi', () => {
    const wrapper = mountPanel(ResizePanel, {
      ...base,
      resizeWidth: 400,
      resizeHeight: 200,
      resizeSpec: { ...defaultResizeSpec, mode: 'percent' },
    });
    expect(wrapper.find('.resize-result').exists()).toBe(true);
    expect(wrapper.find('.resize-result').text()).toContain('400 × 200');
  });
});

describe('ExportPanel – Ziel-Dateigröße', () => {
  const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
  const mountExport = (props) =>
    mount(ExportPanel, {
      props: {
        formats: ['png', 'jpeg', 'webp'],
        formatInfo: FORMAT_INFO,
        currentFormatInfo: FORMAT_INFO[props.outputFormat],
        ...props,
      },
      global: { plugins: [i18n] },
    });

  it('bietet die Option nur bei JPEG/WebP an', () => {
    expect(mountExport({ outputFormat: 'png' }).find('.target-size').exists()).toBe(false);
    expect(
      mountExport({ outputFormat: 'jpeg', targetSizeAvailable: true }).find('.target-size').exists()
    ).toBe(true);
  });

  it('meldet Aktivieren, KB-Wert (begrenzt) und Verkleinern als Ereignisse', async () => {
    const wrapper = mountExport({ outputFormat: 'jpeg', targetSizeAvailable: true });
    await wrapper.find('[data-testid="target-size-enable"]').setValue(true);
    expect(wrapper.emitted('update:targetSizeEnabled')).toEqual([[true]]);

    await wrapper.setProps({ targetSizeEnabled: true });
    const kb = wrapper.find('#target-size-kb');
    kb.element.value = '300';
    await kb.trigger('input');
    kb.element.value = '3';
    await kb.trigger('change');
    expect(wrapper.emitted('update:targetSizeKb')).toEqual([[300], [10]]);
  });

  it('zeigt die Schätzung mit Qualität, Verkleinerung oder Warnung', async () => {
    const wrapper = mountExport({
      outputFormat: 'jpeg',
      targetSizeAvailable: true,
      sizeEstimate: { bytes: 480 * 1024, quality: 71, width: 800, height: 600, reached: true },
    });
    const text = () => wrapper.find('[data-testid="size-estimate"]').text();
    expect(text()).toContain('ca. 480 KB bei Qualität 71 %');

    await wrapper.setProps({
      sizeEstimate: {
        bytes: 400 * 1024,
        quality: 60,
        width: 640,
        height: 480,
        reached: true,
        scaled: true,
      },
    });
    expect(text()).toContain('verkleinert auf 640 × 480 px');

    await wrapper.setProps({ sizeEstimate: { bytes: 900 * 1024, quality: 5, reached: false } });
    expect(text()).toContain('Ziel nicht erreichbar');
    expect(wrapper.find('.size-estimate--warn').exists()).toBe(true);
  });

  it('PNG zeigt nur die geschätzte Größe', () => {
    const wrapper = mountExport({
      outputFormat: 'png',
      sizeEstimate: { bytes: 2048, width: 10, height: 10, reached: true },
    });
    expect(wrapper.find('[data-testid="size-estimate"]').text()).toContain('ca. 2 KB');
  });
});

describe('ExportPanel – EXIF', () => {
  const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
  const mountExport = (props) =>
    mount(ExportPanel, {
      props: {
        formats: ['png', 'jpeg', 'webp'],
        formatInfo: FORMAT_INFO,
        currentFormatInfo: FORMAT_INFO.jpeg,
        outputFormat: 'jpeg',
        ...props,
      },
      global: { plugins: [i18n] },
    });

  it('zeigt die Option nur mit Originaldatei, standardmäßig aus', () => {
    expect(mountExport({}).find('[data-testid="keep-exif"]').exists()).toBe(false);
    const box = mountExport({ exifAvailable: true }).find('[data-testid="keep-exif"]');
    expect(box.exists()).toBe(true);
    expect(box.element.checked).toBe(false);
  });

  it('meldet das Umschalten als update:keepExif', async () => {
    const wrapper = mountExport({ exifAvailable: true });
    await wrapper.find('[data-testid="keep-exif"]').setValue(true);
    expect(wrapper.emitted('update:keepExif')).toEqual([[true]]);
  });
});
