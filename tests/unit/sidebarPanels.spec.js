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

  it('meldet den Reset eines Sliders mit dem Standardwert', async () => {
    const { wrapper } = setup();
    const slider = wrapper.findAllComponents(FilterSlider)[0];
    await slider.find('button.reset-btn').trigger('click');
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
