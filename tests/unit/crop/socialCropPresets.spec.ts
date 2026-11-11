/** Social-Media-Presets im Zuschneiden: Daten, Hilfsfunktionen, Panel */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import en from '@/i18n/en';
import CropPanel from '@/components/features/transform/CropPanel.vue';
import { ASPECT_RATIO_PRESETS, findCropPreset } from '@/composables/useCrop';
import {
  SOCIAL_CROP_PRESETS,
  SOCIAL_PLATFORMS,
  findSocialCropPreset,
  formatAspectRatio,
  getSocialDownscaleTarget,
  getSocialPresetsFor,
} from '@/utils/socialCropPresets';

describe('SOCIAL_CROP_PRESETS', () => {
  it('hat für jede Plattform Presets mit eindeutigen IDs und gültiger Größe', () => {
    for (const platform of SOCIAL_PLATFORMS) {
      expect(getSocialPresetsFor(platform).length).toBeGreaterThan(0);
    }
    const ids = SOCIAL_CROP_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of SOCIAL_CROP_PRESETS) {
      expect(p.id.startsWith('social:')).toBe(true);
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
      expect(p.ratio).toBeCloseTo(p.width / p.height, 10);
    }
  });

  it('kollidiert nicht mit den Seitenverhältnis-IDs', () => {
    const base = new Set(ASPECT_RATIO_PRESETS.map((p) => p.id));
    expect(SOCIAL_CROP_PRESETS.some((p) => base.has(p.id))).toBe(false);
  });

  it('jedes Format hat eine Übersetzung in DE und EN', () => {
    for (const p of SOCIAL_CROP_PRESETS) {
      expect(de.transform.crop.social.formats[p.format]).toBeTruthy();
      expect(en.transform.crop.social.formats[p.format]).toBeTruthy();
    }
  });
});

describe('findCropPreset', () => {
  it('liefert Seitenverhältnisse unverändert', () => {
    expect(findCropPreset('16:9')).toBe(ASPECT_RATIO_PRESETS.find((p) => p.id === '16:9'));
  });

  it('übersetzt Social-Presets in Seitenverhältnis + Zielgröße', () => {
    const preset = findCropPreset('social:instagram-postPortrait');
    expect(preset?.ratio).toBeCloseTo(1080 / 1350, 10);
    expect(preset?.target).toEqual({ width: 1080, height: 1350 });
    expect(preset?.isCircle).toBeUndefined();
  });

  it('unbekannte IDs → undefined', () => {
    expect(findCropPreset('social:unknown')).toBeUndefined();
    expect(findSocialCropPreset('1:1')).toBeUndefined();
  });
});

describe('formatAspectRatio', () => {
  it('kürzt handliche Verhältnisse', () => {
    expect(formatAspectRatio(1080, 1350)).toBe('4:5');
    expect(formatAspectRatio(1080, 1920)).toBe('9:16');
    expect(formatAspectRatio(1500, 500)).toBe('3:1');
  });

  it('rundet unhandliche Verhältnisse lokalisiert', () => {
    expect(formatAspectRatio(1080, 566, 'de')).toBe('1,91:1');
    expect(formatAspectRatio(1080, 566, 'en')).toBe('1.91:1');
  });

  it('ungültige Maße → leer', () => {
    expect(formatAspectRatio(0, 100)).toBe('');
  });
});

describe('getSocialDownscaleTarget', () => {
  const preset = { width: 1080, height: 1350 };

  it('verkleinert größere Ausschnitte auf die Zielgröße', () => {
    expect(getSocialDownscaleTarget(preset, 3000, 3750)).toEqual(preset);
  });

  it('gleicht Rundungen um 1 px an', () => {
    expect(getSocialDownscaleTarget(preset, 1080, 1349)).toEqual(preset);
  });

  it('lässt exakte und kleinere Ausschnitte unverändert', () => {
    expect(getSocialDownscaleTarget(preset, 1080, 1350)).toBeNull();
    expect(getSocialDownscaleTarget(preset, 800, 1000)).toBeNull();
    expect(getSocialDownscaleTarget(preset, 0, 0)).toBeNull();
  });
});

describe('CropPanel – Social-Media-Sektion', () => {
  let wrapper: VueWrapper | null = null;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  function mountPanel(props: Record<string, unknown> = {}) {
    const i18n = createI18n({ legacy: false, locale: 'de', messages: { de, en } });
    return mount(CropPanel, {
      props: {
        cropMode: true,
        hasCropped: false,
        aspectRatioPresets: ASPECT_RATIO_PRESETS,
        ...props,
      },
      global: { plugins: [i18n] },
    });
  }

  it('ist nur im Crop-Modus sichtbar', () => {
    wrapper = mountPanel({ cropMode: false });
    expect(wrapper.find('.social-section').exists()).toBe(false);
  });

  it('zeigt die Instagram-Presets und meldet die Auswahl', async () => {
    wrapper = mountPanel();
    const buttons = wrapper.findAll('.social-btn');
    expect(buttons).toHaveLength(getSocialPresetsFor('instagram').length);
    expect(buttons[1]!.text()).toContain('Beitrag Hochformat');
    expect(buttons[1]!.text()).toContain('1080 × 1350');
    await buttons[1]!.trigger('click');
    expect(wrapper.emitted('set-aspect-ratio')?.[0]).toEqual(['social:instagram-postPortrait']);
  });

  it('wechselt die Plattform über die Auswahl', async () => {
    wrapper = mountPanel();
    await wrapper.find('select').setValue('youtube');
    const texts = wrapper.findAll('.social-name').map((b) => b.text());
    expect(texts).toContain('Thumbnail');
    expect(texts).toContain('Kanalbanner');
  });

  it('zeigt die Endgröße, wenn der Ausschnitt verkleinert wird', () => {
    wrapper = mountPanel({
      selectedAspectRatio: 'social:linkedin-post',
      cropDimensions: { width: 2048, height: 1070 },
      cropOutputSize: { width: 1200, height: 627 },
    });
    expect(wrapper.find('.crop-output').text()).toBe('Ergebnis nach dem Bestätigen: 1200 × 627 px');
  });

  it('ohne Verkleinerung kein Ergebnis-Hinweis', () => {
    wrapper = mountPanel({ cropDimensions: { width: 800, height: 600 } });
    expect(wrapper.find('.crop-output').exists()).toBe(false);
  });

  it('markiert das aktive Preset und zeigt seine Plattform', () => {
    wrapper = mountPanel({ selectedAspectRatio: 'social:tiktok-video' });
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('tiktok');
    const active = wrapper.findAll('.social-btn.active');
    expect(active).toHaveLength(1);
    expect(active[0]!.attributes('aria-pressed')).toBe('true');
  });
});
