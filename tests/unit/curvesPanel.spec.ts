import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import CurvesPanel from '@/components/editor/sidebar/CurvesPanel.vue';
import { DEFAULT_FILTERS } from '@/composables/useFilterManagement';
import { CURVE_PRESETS } from '@/utils/toneCurve';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
const sectionsOpen = { adjustments: true, lightColor: true, curves: true, effects: true };

function setup(filters: Record<string, unknown> = { ...DEFAULT_FILTERS }) {
  return mount(CurvesPanel, {
    props: { filters: Object.freeze({ ...filters }), sectionsOpen },
    global: { plugins: [i18n] },
  });
}

describe('CurvesPanel', () => {
  it('zeigt die lineare Kurve mit zwei Punkten und meldet Pfeiltasten als update-filter', async () => {
    const wrapper = setup();
    const points = wrapper.findAll('circle[role="slider"]');
    expect(points).toHaveLength(2);
    await points[1].trigger('keydown', { key: 'ArrowDown', shiftKey: true });
    expect(wrapper.emitted('update-filter')).toEqual([['curveRgb', '0,0 255,245']]);
    expect(wrapper.emitted('render')).toHaveLength(1);
    await points[1].trigger('keyup', { key: 'ArrowDown' });
    expect(wrapper.emitted('save-history')).toHaveLength(1);
  });

  it('bearbeitet nach dem Kanalwechsel die Kanalkurve', async () => {
    const wrapper = setup({ ...DEFAULT_FILTERS, curveB: CURVE_PRESETS.lighten });
    await wrapper.find('[data-testid="curve-channel-b"]').trigger('click');
    expect(wrapper.find('[data-testid="curve-channel-b"]').attributes('aria-pressed')).toBe('true');
    const points = wrapper.findAll('circle[role="slider"]');
    expect(points).toHaveLength(3);
    expect(points[1].attributes('aria-valuenow')).toBe('160');
    await points[1].trigger('keydown', { key: 'Delete' });
    expect(wrapper.emitted('update-filter')).toEqual([['curveB', '']]);
  });

  it('setzt ein Preset und alle Kurven zurück', async () => {
    const wrapper = setup({ ...DEFAULT_FILTERS, curveR: CURVE_PRESETS.darken });
    expect(wrapper.find('select').element.value).toBe('linear');
    await wrapper.find('select').setValue('contrast');
    expect(wrapper.emitted('update-filter')).toEqual([['curveRgb', CURVE_PRESETS.contrast]]);
    await wrapper.find('[data-testid="curve-reset"]').trigger('click');
    expect(wrapper.emitted('update-filter')!.at(-1)).toEqual(['curveR', '']);
    expect(wrapper.emitted('save-history')).toHaveLength(2);
  });

  it('meldet den Klick auf die Überschrift als toggle-section', async () => {
    const wrapper = setup();
    await wrapper.find('h3.section-header').trigger('click');
    expect(wrapper.emitted('toggle-section')).toEqual([['curves']]);
  });
});
