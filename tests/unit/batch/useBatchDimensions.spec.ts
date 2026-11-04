import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useBatchDimensions } from '@/composables/batch/useBatchDimensions';
import { defaultBatchSettings } from '@/composables/batch/types';

function setup(ratio: number | null = 2) {
  const settings = ref(defaultBatchSettings());
  const scope = effectScope();
  const api = scope.run(() => useBatchDimensions(settings, ref(ratio)))!;
  return { settings, ...api, scope };
}

describe('useBatchDimensions', () => {
  it('leitet die andere Seite aus dem Seitenverhältnis ab (mind. 1)', () => {
    const { settings, onWidthInput, onHeightInput } = setup(2);
    settings.value.width = 301;
    onWidthInput();
    expect(settings.value.height).toBe(151);
    settings.value.height = 10;
    onHeightInput();
    expect(settings.value.width).toBe(20);
    settings.value.width = 1;
    onWidthInput();
    expect(settings.value.height).toBe(1);
  });

  it('tut nichts ohne Verhältnis, ohne Wert oder ohne „beibehalten“', () => {
    const none = setup(null);
    none.settings.value.width = 100;
    none.onWidthInput();
    expect(none.settings.value.height).toBeNull();

    const off = setup(2);
    off.settings.value.maintainAspect = false;
    off.settings.value.width = 100;
    off.onWidthInput();
    expect(off.settings.value.height).toBeNull();
    off.settings.value.height = 0;
    off.onHeightInput();
    expect(off.settings.value.width).toBe(100);
  });

  it('Einschalten von „beibehalten“ berechnet die Höhe aus der Breite', async () => {
    const { settings } = setup(4);
    settings.value.maintainAspect = false;
    await nextTick();
    settings.value.width = 400;
    settings.value.height = 7;
    settings.value.maintainAspect = true;
    await nextTick();
    expect(settings.value.height).toBe(100);
  });
});
