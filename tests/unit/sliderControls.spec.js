/**
 * Regler-Bausteine im Visualizer-Muster: SliderField (Regler + Spinner +
 * Reset), NumberSpinner (Halten: langsam → schnell, genau ein Commit) und
 * HistoryActions (Rückgängig / Wiederholen / Zurücksetzen).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SliderField from '@/components/ui/SliderField.vue';
import NumberSpinner from '@/components/ui/NumberSpinner.vue';
import HistoryActions from '@/components/ui/HistoryActions.vue';

const $t = (key, fallback) => fallback || key;
const global = { mocks: { $t } };

function mountField(props = {}) {
  return mount(SliderField, {
    props: { modelValue: 100, min: 0, max: 200, unit: '%', label: 'Helligkeit', ...props },
    global,
  });
}

describe('SliderField', () => {
  it('zeigt Label, Regler, Spinner und Reset in einer Zeile', () => {
    const w = mountField({ defaultValue: 100, inputId: 'x-bright' });
    expect(w.find('label').text()).toBe('Helligkeit');
    expect(w.find('label').attributes('for')).toBe('x-bright');
    expect(w.find('input[type="range"]').attributes()).toMatchObject({
      id: 'x-bright',
      min: '0',
      max: '200',
    });
    expect(w.findComponent(NumberSpinner).props()).toMatchObject({
      modelValue: 100,
      min: 0,
      max: 200,
      unit: '%',
    });
    expect(w.find('.slider-field__reset').exists()).toBe(true);
  });

  it('hat ohne Standardwert keinen Reset-Button', () => {
    expect(mountField().find('.slider-field__reset').exists()).toBe(false);
  });

  it('meldet Reglerwerte als Zahl und das Loslassen als commit', async () => {
    const w = mountField();
    const range = w.find('input[type="range"]');
    range.element.value = '140';
    await range.trigger('input');
    await range.trigger('change');
    expect(w.emitted('update:modelValue')).toEqual([[140]]);
    expect(w.emitted('commit')).toHaveLength(1);
  });

  it('reicht Spinner-Werte und dessen commit durch', async () => {
    const w = mountField();
    const spinner = w.findComponent(NumberSpinner);
    await spinner.vm.$emit('update:modelValue', 7);
    await spinner.vm.$emit('commit');
    expect(w.emitted('update:modelValue')).toEqual([[7]]);
    expect(w.emitted('commit')).toHaveLength(1);
  });

  it('deaktiviert den Reset am Standardwert und nennt ihn im Tooltip', () => {
    const reset = mountField({ defaultValue: 100 }).find('.slider-field__reset');
    expect(reset.attributes('disabled')).toBeDefined();
    expect(reset.attributes('title')).toBe('common.reset (100%)');
  });

  it('setzt auf den Standardwert zurück: Wert, reset, dann genau ein commit', async () => {
    const w = mountField({ modelValue: 150, defaultValue: 100 });
    await w.find('.slider-field__reset').trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([[100]]);
    expect(w.emitted('reset')).toHaveLength(1);
    expect(w.emitted('commit')).toHaveLength(1);
  });

  it('zeigt bei Bereichen um null die mittige Spur, sonst die gewählte Variante', () => {
    const range = (props) => mountField(props).find('input[type="range"]').classes();
    expect(range({ min: -180, max: 180, modelValue: 0 })).toContain('slider-field__range--center');
    expect(range({})).not.toContain('slider-field__range--center');
    expect(range({ variant: 'hue' })).toContain('slider-field__range--hue');
  });

  it('deaktiviert im disabled-Zustand alle Teile', () => {
    const w = mountField({ modelValue: 150, defaultValue: 100, disabled: true });
    expect(w.find('input[type="range"]').attributes('disabled')).toBeDefined();
    expect(w.find('.slider-field__reset').attributes('disabled')).toBeDefined();
    expect(w.findComponent(NumberSpinner).props('disabled')).toBe(true);
  });
});

describe('NumberSpinner – Halten', () => {
  afterEach(() => vi.useRealTimers());

  /** Spinner, dessen v-model der Test selbst zurückspielt (wie ein Elternteil). */
  function mountSpinner(props = {}) {
    const w = mount(NumberSpinner, {
      props: {
        modelValue: 0,
        min: 0,
        max: 1000,
        ...props,
        'onUpdate:modelValue': (v) => w.setProps({ modelValue: v }),
      },
      global,
    });
    return w;
  }

  const up = (w) => w.findAll('.spinner-btn')[0];

  it('macht beim Drücken sofort einen Schritt', async () => {
    vi.useFakeTimers();
    const w = mountSpinner();
    await up(w).trigger('pointerdown', { button: 0 });
    expect(w.props('modelValue')).toBe(1);
    window.dispatchEvent(new Event('pointerup'));
    expect(w.emitted('commit')).toHaveLength(1);
  });

  it('beschleunigt beim Halten: erst langsam, später in Fünferschritten', async () => {
    vi.useFakeTimers();
    const w = mountSpinner();
    await up(w).trigger('pointerdown', { button: 0 });
    await vi.advanceTimersByTimeAsync(400); // Verzögerung → erster Wiederholschritt
    expect(w.props('modelValue')).toBe(2);
    // Das Intervall eines Ticks bestimmt den Abstand zum nächsten Tick.
    await vi.advanceTimersByTimeAsync(140 * 5); // Ticks 2–6 im 140-ms-Takt
    expect(w.props('modelValue')).toBe(7);
    await vi.advanceTimersByTimeAsync(70 * 10); // Ticks 7–16 im 70-ms-Takt
    expect(w.props('modelValue')).toBe(17);
    await vi.advanceTimersByTimeAsync(40 * 14); // Ticks 17–30 im 40-ms-Takt
    expect(w.props('modelValue')).toBe(31);
    await vi.advanceTimersByTimeAsync(40); // ab Tick 31: ×5
    expect(w.props('modelValue')).toBe(36);
    window.dispatchEvent(new Event('pointerup'));
    expect(w.emitted('commit')).toHaveLength(1);
  });

  it('hält an der Grenze an und committet einmal', async () => {
    vi.useFakeTimers();
    const w = mountSpinner({ modelValue: 98, max: 100 });
    await up(w).trigger('pointerdown', { button: 0 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(w.props('modelValue')).toBe(100);
    expect(w.emitted('commit')).toHaveLength(1);
  });
});

describe('HistoryActions', () => {
  it('meldet Rückgängig/Wiederholen und deaktiviert nach Zustand', async () => {
    const w = mount(HistoryActions, { props: { canUndo: true, canRedo: false }, global });
    const [undo, redo] = w.findAll('button');
    expect(undo.attributes('disabled')).toBeUndefined();
    expect(redo.attributes('disabled')).toBeDefined();
    await undo.trigger('click');
    expect(w.emitted('undo')).toHaveLength(1);
    expect(w.find('.btn-reset').exists()).toBe(false);
  });

  it('zeigt Zurücksetzen nur mit Beschriftung', async () => {
    const w = mount(HistoryActions, { props: { resetLabel: 'Zurücksetzen' }, global });
    const reset = w.find('.btn-reset');
    expect(reset.text()).toBe('Zurücksetzen');
    await reset.trigger('click');
    expect(w.emitted('reset')).toHaveLength(1);
  });

  it('nutzt den Tooltip mit Tastenkürzel, wenn angegeben', () => {
    const w = mount(HistoryActions, { props: { undoTitle: 'Rückgängig (Strg+Z)' }, global });
    expect(w.find('.btn-undo').attributes('title')).toBe('Rückgängig (Strg+Z)');
    expect(w.find('.btn-redo').attributes('title')).toBe('common.redo');
  });
});
