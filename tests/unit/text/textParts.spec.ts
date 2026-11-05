/** Aus TextPanel ausgelagert: Stil-Umschalter, Umrandung, Schatten, Composables */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import TextPanel from '@/components/features/transform/TextPanel.vue';
import TextStyleToggles from '@/components/features/transform/TextStyleToggles.vue';
import TextStrokeControl from '@/components/features/transform/TextStrokeControl.vue';
import TextShadowControl from '@/components/features/transform/TextShadowControl.vue';
import { useTextFontStyle } from '@/composables/text/useTextFontStyle';
import { useTextPosition } from '@/composables/text/useTextPosition';
import type { EditorText } from '@/composables/text/types';

const $t = (key: string, fallback?: string) => fallback || key;
const global = { mocks: { $t } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wrapper: VueWrapper<any> | null = null;
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe('useTextPosition', () => {
  it('rundet, erweitert den Bereich und merkt die Startposition je Text', async () => {
    const selectedText = ref<EditorText | null>({ id: 1, x: 10.4, y: -5 });
    const p = useTextPosition({ selectedText, canvasWidth: ref(100), canvasHeight: ref(0) });
    expect(p.posX.value).toBe(10);
    expect(p.rangeY.value).toEqual({ min: -5, max: 1 });
    expect(p.startPos.value).toEqual({ x: 10, y: -5 });

    selectedText.value = { id: 1, x: 60, y: 0 };
    await nextTick();
    expect(p.startPos.value).toEqual({ x: 10, y: -5 });

    selectedText.value = { id: 2, x: 60, y: 0 };
    await nextTick();
    expect(p.startPos.value).toEqual({ x: 60, y: 0 });
  });
});

describe('useTextFontStyle', () => {
  it('unterscheidet Schriftstil und manuell gesetzten Stil', () => {
    const text = ref<EditorText>({ fontFamily: 'Arial', bold: true });
    const s = useTextFontStyle(text);
    expect(s.fontIsBold.value).toBe(false);
    expect(s.isBoldActive.value).toBe(true);
    expect(s.isItalicActive.value).toBe(false);
  });
});

describe('TextStyleToggles', () => {
  it('schaltet Fett um und legt einen History-Eintrag an', async () => {
    wrapper = mount(TextStyleToggles, {
      props: { selectedText: { fontFamily: 'Arial', bold: false } },
      global,
    });
    const [bold, italic] = wrapper.findAll('.style-toggle');
    await bold!.trigger('click');
    expect(wrapper.emitted('update:text-bold')).toEqual([[true]]);
    expect(wrapper.emitted('save-text-history')).toHaveLength(1);
    expect(italic!.classes()).not.toContain('active');
  });
});

describe('TextStrokeControl', () => {
  it('zeigt die Farbe erst ab einer Umrandung', async () => {
    wrapper = mount(TextStrokeControl, { props: { selectedText: {} }, global });
    expect(wrapper.find('.color-picker-row').exists()).toBe(false);
    await wrapper.setProps({ selectedText: { strokeWidth: 3, strokeColor: '#112233' } });
    const text = wrapper.get('input.color-text');
    expect((text.element as HTMLInputElement).value).toBe('#112233');
    await text.setValue('#445566');
    expect(wrapper.emitted('update:text-stroke-color')!.at(-1)).toEqual(['#445566']);
  });
});

describe('TextShadowControl', () => {
  it('zeigt Versatz und Farbe erst ab Weichzeichnung', async () => {
    wrapper = mount(TextShadowControl, { props: { selectedText: {} }, global });
    expect(wrapper.find('.shadow-controls').exists()).toBe(false);
    await wrapper.setProps({ selectedText: { shadowBlur: 4 } });
    expect(wrapper.findAll('.mini-control')).toHaveLength(2);
  });
});

describe('TextPanel', () => {
  it('reicht Ereignisse der Bausteine unverändert nach außen', async () => {
    wrapper = mount(TextPanel, {
      props: { selectedText: { id: 1, fontFamily: 'Arial', strokeWidth: 2 } },
      global,
    });
    await wrapper.findAll('.style-toggle')[1]!.trigger('click');
    wrapper.getComponent(TextShadowControl).vm.$emit('update:text-shadow-blur', 5);
    expect(wrapper.emitted('update:text-italic')).toEqual([[true]]);
    expect(wrapper.emitted('update:text-shadow-blur')).toEqual([[5]]);
    expect(wrapper.emitted('save-text-history')).toHaveLength(1);
  });

  it('zeigt ohne Auswahl den Hinweis', () => {
    wrapper = mount(TextPanel, { props: { hasTexts: true }, global });
    expect(wrapper.find('.text-hint').exists()).toBe(true);
  });
});
