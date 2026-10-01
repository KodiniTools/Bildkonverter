/**
 * TextPanel – Positionierung des ausgewählten Textes über X/Y-Regler
 * (Slider + Spinner + Rückgängig auf die Position beim Auswählen).
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TextPanel from '@/components/features/transform/TextPanel.vue';
import SliderField from '@/components/ui/SliderField.vue';

const $t = (key, fallback) => fallback || key;
const global = { mocks: { $t } };

function mountPanel(text, props = {}) {
  return mount(TextPanel, {
    props: { selectedText: text, canvasWidth: 832, canvasHeight: 1248, ...props },
    global,
  });
}

function positionFields(w) {
  const fields = w.findAllComponents(SliderField);
  return {
    x: fields.find((f) => f.props('inputId') === 'text-position-x'),
    y: fields.find((f) => f.props('inputId') === 'text-position-y'),
  };
}

describe('TextPanel Position', () => {
  it('zeigt gerundete X/Y-Werte mit Canvas-Größe als Bereich', () => {
    const { x, y } = positionFields(mountPanel({ id: 1, x: 120.6, y: 80.2 }));
    expect(x.props()).toMatchObject({ modelValue: 121, min: 0, max: 832, defaultValue: 121 });
    expect(y.props()).toMatchObject({ modelValue: 80, min: 0, max: 1248, defaultValue: 80 });
  });

  it('erweitert den Bereich, wenn der Text außerhalb des Canvas liegt', () => {
    const { x, y } = positionFields(mountPanel({ id: 1, x: -40, y: 1400 }));
    expect(x.props()).toMatchObject({ min: -40, max: 832 });
    expect(y.props()).toMatchObject({ min: 0, max: 1400 });
  });

  it('meldet Änderungen und commit als History-Eintrag', async () => {
    const w = mountPanel({ id: 1, x: 10, y: 20 });
    const { x, y } = positionFields(w);
    await x.vm.$emit('update:modelValue', 300);
    await y.vm.$emit('update:modelValue', 400);
    await x.vm.$emit('commit');
    expect(w.emitted('update:text-position-x')).toEqual([[300]]);
    expect(w.emitted('update:text-position-y')).toEqual([[400]]);
    expect(w.emitted('save-text-history')).toHaveLength(1);
  });

  it('Rückgängig-Ziel ist die Position beim Auswählen, nicht der Live-Wert', async () => {
    const w = mountPanel({ id: 1, x: 10, y: 20 });
    await w.setProps({ selectedText: { id: 1, x: 200, y: 20 } });
    let { x } = positionFields(w);
    expect(x.props()).toMatchObject({ modelValue: 200, defaultValue: 10 });
    await x.find('.slider-field__reset').trigger('click');
    expect(w.emitted('update:text-position-x')).toEqual([[10]]);

    // Anderer Text ausgewählt → neue Ausgangsposition
    await w.setProps({ selectedText: { id: 2, x: 50, y: 60 } });
    ({ x } = positionFields(w));
    expect(x.props('defaultValue')).toBe(50);
  });
});
