/**
 * ToggleSwitch: gemeinsamer Schiebeschalter aller An/Aus-Optionen.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';

describe('ToggleSwitch', () => {
  it('meldet den umgekehrten Wert und spiegelt den Zustand per ARIA', async () => {
    const w = mount(ToggleSwitch, { props: { modelValue: false, label: 'Schatten' } });
    expect(w.attributes('role')).toBe('switch');
    expect(w.attributes('aria-checked')).toBe('false');
    expect(w.attributes('aria-label')).toBe('Schatten');
    await w.trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([[true]]);

    await w.setProps({ modelValue: true });
    expect(w.classes()).toContain('active');
    expect(w.attributes('aria-checked')).toBe('true');
    await w.trigger('click');
    expect(w.emitted('update:modelValue')[1]).toEqual([false]);
  });

  it('ist deaktiviert nicht bedienbar', async () => {
    const w = mount(ToggleSwitch, { props: { modelValue: false, disabled: true } });
    expect(w.attributes('disabled')).toBeDefined();
    await w.trigger('click');
    expect(w.emitted('update:modelValue')).toBeUndefined();
  });

  it('reicht Attribute wie id an den Button durch (für <label for>)', () => {
    const w = mount(ToggleSwitch, { attrs: { id: 'x' } });
    expect(w.attributes('id')).toBe('x');
  });
});
