import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Ref } from 'vue';
import { AUTO_ENHANCE_NEUTRAL, computeAutoEnhance, isNeutralEnhance } from '@/utils/autoEnhance';
import { applyTonalAdjustments } from '@/utils/tonalKernel';
import { useFilterManagement, DEFAULT_FILTERS } from '@/composables/useFilterManagement';
import AdjustmentsPanel from '@/components/editor/sidebar/AdjustmentsPanel.vue';

/** RGBA-Daten aus einer Liste von Grauwerten (0..255) bzw. RGB-Tripeln. */
function pixels(values: Array<number | [number, number, number]>, alpha = 255) {
  const data = new Uint8ClampedArray(values.length * 4);
  values.forEach((v, i) => {
    const [r, g, b] = typeof v === 'number' ? [v, v, v] : v;
    data.set([r, g, b, alpha], i * 4);
  });
  return data;
}

/** Gleichmäßiger Grauverlauf von `from` bis `to` (je 1 Pixel pro Stufe, mehrfach). */
function ramp(from: number, to: number, repeat = 4) {
  const out: number[] = [];
  for (let k = 0; k < repeat; k++) for (let v = from; v <= to; v++) out.push(v);
  return out;
}

function lumRange(data: Uint8ClampedArray) {
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    min = Math.min(min, data[i]);
    max = Math.max(max, data[i]);
  }
  return { min, max };
}

describe('computeAutoEnhance', () => {
  it('lässt ein ausgewogenes Bild unverändert', () => {
    const v = computeAutoEnhance(pixels(ramp(0, 255)));
    expect(v).toEqual(AUTO_ENHANCE_NEUTRAL);
    expect(isNeutralEnhance(v)).toBe(true);
  });

  it('leere, transparente und einfarbige Daten ergeben neutrale Werte', () => {
    expect(computeAutoEnhance(new Uint8ClampedArray())).toEqual(AUTO_ENHANCE_NEUTRAL);
    expect(computeAutoEnhance(pixels(ramp(0, 255), 0))).toEqual(AUTO_ENHANCE_NEUTRAL);
    expect(computeAutoEnhance(pixels(Array(500).fill(128)))).toEqual(AUTO_ENHANCE_NEUTRAL);
  });

  it('spreizt ein flaues Bild (Kontrast hoch) und vergrößert den Tonwertumfang', () => {
    const data = pixels(ramp(90, 170));
    const v = computeAutoEnhance(data);
    expect(v.contrast).toBeGreaterThan(100);
    expect(v.contrast).toBeLessThanOrEqual(140);

    const before = lumRange(data);
    const after = data.slice();
    applyTonalAdjustments(after, { ...DEFAULT_FILTERS, ...v });
    const range = lumRange(after);
    expect(range.max - range.min).toBeGreaterThan(before.max - before.min);
  });

  it('hellt ein unterbelichtetes Bild auf, dunkelt ein überbelichtetes ab', () => {
    expect(computeAutoEnhance(pixels(ramp(0, 90))).exposure).toBeGreaterThan(0);
    expect(computeAutoEnhance(pixels(ramp(170, 255))).exposure).toBeLessThan(0);
  });

  it('hebt viele dunkle Pixel über Schatten an, dämpft viele helle über Lichter', () => {
    const dark = computeAutoEnhance(pixels([...ramp(0, 30, 20), ...ramp(0, 255)]));
    expect(dark.shadows).toBeGreaterThan(0);
    expect(dark.shadows).toBeLessThanOrEqual(30);

    const bright = computeAutoEnhance(pixels([...ramp(235, 255, 20), ...ramp(0, 255)]));
    expect(bright.highlights).toBeLessThan(0);
    expect(bright.highlights).toBeGreaterThanOrEqual(-30);
  });

  it('Sättigung: flaue Farben leicht anheben, Graustufen nicht anfassen', () => {
    const muted: Array<[number, number, number]> = ramp(0, 230).map((v) => [v + 15, v, v + 5]);
    expect(computeAutoEnhance(pixels(muted)).saturation).toBeGreaterThan(100);
    expect(computeAutoEnhance(pixels(ramp(0, 255))).saturation).toBe(100);
  });

  it('bleibt in den Reglergrenzen', () => {
    const v = computeAutoEnhance(pixels(ramp(0, 8)));
    expect(v.exposure).toBeGreaterThanOrEqual(-25);
    expect(v.exposure).toBeLessThanOrEqual(25);
    expect(v.brightness).toBeGreaterThanOrEqual(80);
    expect(v.brightness).toBeLessThanOrEqual(130);
    expect(v.contrast).toBeGreaterThanOrEqual(100);
    expect(v.contrast).toBeLessThanOrEqual(140);
  });
});

describe('useFilterManagement.applyAdjustments', () => {
  it('setzt nur bekannte Filter, behält die übrigen und hebt das Preset auf', () => {
    const onFilterChange = vi.fn();
    // JS-Composable (JSDoc @returns {Object}): Rückgabe für den Test typisieren
    const fm = useFilterManagement({ onFilterChange }) as unknown as {
      filters: Ref<Record<string, number>>;
      currentPreset: Ref<string | null>;
      applyAdjustments: (values: Record<string, number>) => void;
    };
    fm.filters.value.sepia = 40;
    fm.currentPreset.value = 'vintage';

    fm.applyAdjustments({ contrast: 120, exposure: 10, unbekannt: 5 });

    expect(fm.filters.value).toMatchObject({ contrast: 120, exposure: 10, sepia: 40 });
    expect(fm.filters.value).not.toHaveProperty('unbekannt');
    expect(fm.currentPreset.value).toBeNull();
    expect(onFilterChange).toHaveBeenCalledTimes(1);
  });
});

describe('AdjustmentsPanel', () => {
  const global = { mocks: { $t: (k: string) => k } };
  const props = { filters: { ...DEFAULT_FILTERS }, sectionsOpen: { adjustments: true } };

  it('meldet auto-enhance per Button', async () => {
    const w = mount(AdjustmentsPanel, { props, global });
    await w.get('[data-testid="auto-enhance"]').trigger('click');
    expect(w.emitted('auto-enhance')).toHaveLength(1);
  });

  it('Button ist ohne Bild deaktiviert', () => {
    const w = mount(AdjustmentsPanel, { props: { ...props, disabled: true }, global });
    expect(w.get('[data-testid="auto-enhance"]').attributes('disabled')).toBeDefined();
  });
});
