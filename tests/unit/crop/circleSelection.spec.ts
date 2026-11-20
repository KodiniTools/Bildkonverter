/** Kreis-Preset im Zuschneiden: Auswahl wird rund dargestellt */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import { useCrop } from '@/composables/useCrop';

function mountCrop() {
  let crop!: ReturnType<typeof useCrop>;
  const Host = defineComponent({
    setup() {
      crop = useCrop();
      return () => null;
    },
  });
  const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });
  const wrapper = mount(Host, { global: { plugins: [i18n] } });
  return { crop, wrapper };
}

describe('useCrop.isCircleSelection', () => {
  it('ist nur beim Kreis-Preset aktiv', () => {
    const { crop, wrapper } = mountCrop();
    crop.setCanvasSize(400, 300);
    expect(crop.isCircleSelection.value).toBe(false);

    crop.setAspectRatio('circle');
    expect(crop.isCircleSelection.value).toBe(true);
    // Kreis bleibt quadratisch (Seitenverhältnis 1)
    expect(crop.cropDimensions.value.width).toBe(crop.cropDimensions.value.height);

    for (const id of ['1:1', 'free', '16:9', 'social:linkedin-post']) {
      crop.setAspectRatio(id);
      expect(crop.isCircleSelection.value).toBe(false);
    }
    wrapper.unmount();
  });
});
