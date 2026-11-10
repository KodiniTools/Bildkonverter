/** Aus ImageTransformPanel ausgelagerte Abschnitte */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import ImageTransformPanel from '@/components/features/transform/ImageTransformPanel.vue';
import TransformQuickActions from '@/components/features/transform/TransformQuickActions.vue';
import TransformDistortSection from '@/components/features/transform/TransformDistortSection.vue';
import TransformPanInfo from '@/components/features/transform/TransformPanInfo.vue';
import TransformShadowSection from '@/components/features/transform/TransformShadowSection.vue';
import TransformSkewSection from '@/components/features/transform/TransformSkewSection.vue';
import type { ImageTransforms } from '@/composables/transform/types';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
const global = { plugins: [i18n] };

const transforms = (patch: Partial<ImageTransforms> = {}): ImageTransforms => ({
  opacity: 100,
  rotation: 0,
  scale: 100,
  flipHorizontal: false,
  flipVertical: false,
  borderRadius: 0,
  borderWidth: 0,
  borderColor: '#000000',
  shadowEnabled: false,
  shadowOffsetX: 10,
  shadowOffsetY: 10,
  shadowBlur: 20,
  shadowColor: '#000000',
  shadowOpacity: 50,
  skewX: 0,
  skewY: 0,
  distortEnabled: false,
  ...patch,
});

let wrapper: VueWrapper | null = null;
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe('TransformQuickActions', () => {
  it('meldet Drehen und Spiegeln und markiert aktives Spiegeln', async () => {
    wrapper = mount(TransformQuickActions, {
      props: { flipHorizontal: true, flipVertical: false },
      global,
    });
    const buttons = wrapper.findAll('.quick-btn');
    expect(buttons).toHaveLength(5);
    expect(buttons[3]!.classes()).toContain('active');
    expect(buttons[4]!.classes()).not.toContain('active');
    for (const b of buttons) await b.trigger('click');
    expect(Object.keys(wrapper.emitted())).toEqual(
      expect.arrayContaining([
        'rotate-90-counter',
        'rotate-180',
        'rotate-90',
        'flip-horizontal',
        'flip-vertical',
      ])
    );
  });
});

describe('TransformDistortSection', () => {
  it('zeigt die Aktionen nur im Modus und sperrt sie ohne Verzerrung', async () => {
    wrapper = mount(TransformDistortSection, {
      props: { enabled: false, hasDistortion: false, isApplyingDistort: false },
      global,
    });
    expect(wrapper.find('.distort-actions').exists()).toBe(false);
    await wrapper.setProps({ enabled: true });
    const [reset, apply] = wrapper.findAll('.distort-btn');
    expect(reset!.attributes('disabled')).toBeDefined();
    await wrapper.setProps({ hasDistortion: true });
    await apply!.trigger('click');
    await reset!.trigger('click');
    expect(wrapper.emitted('apply-distort')).toHaveLength(1);
    expect(wrapper.emitted('reset-distort')).toHaveLength(1);
    await wrapper.get('[role="switch"]').trigger('click');
    expect(wrapper.emitted('toggle-distort')).toHaveLength(1);
  });
});

describe('TransformPanInfo', () => {
  it('zeigt den Zentrieren-Knopf nur bei verschobener Ansicht', async () => {
    wrapper = mount(TransformPanInfo, { props: { hasPan: false }, global });
    expect(wrapper.find('.pan-reset-btn').exists()).toBe(false);
    await wrapper.setProps({ hasPan: true });
    await wrapper.get('.pan-reset-btn').trigger('click');
    expect(wrapper.emitted('reset-pan')).toHaveLength(1);
  });
});

describe('TransformShadowSection', () => {
  it('blendet die Regler mit dem Schalter ein und meldet Farbtext', async () => {
    wrapper = mount(TransformShadowSection, { props: { transforms: transforms() }, global });
    expect(wrapper.find('.shadow-controls-panel').exists()).toBe(false);
    await wrapper.get('[role="switch"]').trigger('click');
    expect(wrapper.emitted('update:shadow-enabled')![0]).toEqual([true]);

    await wrapper.setProps({ transforms: transforms({ shadowEnabled: true }) });
    const text = wrapper.get('input.color-text');
    // setValue löst input und change aus
    await text.setValue('#ff0000');
    expect(wrapper.emitted('update:shadow-color')!.at(-1)).toEqual(['#ff0000']);
    expect(wrapper.emitted('commit-transform')).toHaveLength(1);
  });
});

describe('TransformSkewSection', () => {
  it('enthält zwei Neigungsregler', () => {
    wrapper = mount(TransformSkewSection, { props: { transforms: transforms() }, global });
    expect(wrapper.findAll('.skew-control-row')).toHaveLength(2);
  });
});

describe('ImageTransformPanel', () => {
  it('reicht Ereignisse der Abschnitte unverändert nach außen', async () => {
    wrapper = mount(ImageTransformPanel, {
      props: { transforms: transforms({ distortEnabled: true }), canPan: true, hasPan: true },
      global,
    });
    await wrapper.findAll('.quick-btn')[1]!.trigger('click');
    await wrapper.get('.pan-reset-btn').trigger('click');
    wrapper.getComponent(TransformSkewSection).vm.$emit('update:skew-x', 12);
    wrapper.getComponent(TransformShadowSection).vm.$emit('commit-transform');
    expect(wrapper.emitted('rotate-180')).toHaveLength(1);
    expect(wrapper.emitted('reset-pan')).toHaveLength(1);
    expect(wrapper.emitted('update:skew-x')![0]).toEqual([12]);
    expect(wrapper.emitted('commit-transform')).toHaveLength(1);
    expect(wrapper.find('.distort-actions').exists()).toBe(true);
  });

  it('blendet den Pan-Hinweis ohne Zoom aus', () => {
    wrapper = mount(ImageTransformPanel, { props: { transforms: transforms() }, global });
    expect(wrapper.find('.pan-info').exists()).toBe(false);
  });
});
