/** Aus LayersTab ausgelagerte Abschnitte, mit einem Ersatz-Kontext für LAYER_PANEL_KEY */
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive, ref, type Component } from 'vue';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import { LAYER_PANEL_KEY } from '@/composables/useLayerPanel';
import { useLayerPanelContext, type ImageLayer } from '@/composables/layers/useLayerPanelContext';
import LayersTab from '@/components/features/layer-control/LayersTab.vue';
import LayerListSection from '@/components/features/layer-control/LayerListSection.vue';
import LayerBackgroundSection from '@/components/features/layer-control/LayerBackgroundSection.vue';
import LayerTransformSection from '@/components/features/layer-control/LayerTransformSection.vue';
import LayerShadowSection from '@/components/features/layer-control/LayerShadowSection.vue';

const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } });

const layer = (id: string, patch: Partial<ImageLayer> = {}): ImageLayer => ({
  id,
  url: 'data:image/png;base64,AAAA',
  name: `${id}.png`,
  x: 10.4,
  y: 20,
  width: 120.6,
  height: 80,
  rotation: 0,
  opacity: 100,
  visible: true,
  flipX: false,
  flipY: false,
  filters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0 },
  ...patch,
});

function context(selectedId: string | null = 'b') {
  const layers = ref([layer('a'), layer('b')]);
  const imageStore = reactive({
    imageLayerCount: computed(() => layers.value.length),
    selectedLayerId: selectedId,
    canvasBackgroundColor: '#ffffff',
  });
  return {
    imageStore,
    activeTab: ref('layers'),
    maintainAspectRatio: ref(true),
    openSections: reactive({
      canvas: true,
      transform: true,
      filters: true,
      border: true,
      shadow: true,
    }),
    quickColors: [
      { value: '#ffffff', label: 'Weiß' },
      { value: 'transparent', label: 'Transparent' },
    ],
    selectedLayer: computed(() => layers.value.find((l) => l.id === selectedId) ?? null),
    reversedLayers: computed(() => [...layers.value].reverse()),
    layerBorder: computed(() => ({ width: 0, color: '#000000', radius: 0 })),
    layerShadow: reactive({
      enabled: false,
      offsetX: 5,
      offsetY: 5,
      blur: 10,
      color: '#000000',
      opacity: 50,
    }),
    toggleSection: vi.fn(),
    updateBackgroundColor: vi.fn(),
    selectLayer: vi.fn(),
    toggleVisibility: vi.fn(),
    deleteLayer: vi.fn(),
    moveLayer: vi.fn(),
    duplicateLayer: vi.fn(),
    updateLayerProperty: vi.fn(),
    updateSize: vi.fn(),
    rotateBy: vi.fn(),
    toggleFlip: vi.fn(),
    updateFilter: vi.fn(),
    updateBorder: vi.fn(),
    updateShadow: vi.fn(),
    resetLayerFilters: vi.fn(),
  };
}

let wrapper: VueWrapper | null = null;
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

function mountWith(component: Component, ctx = context()) {
  wrapper = mount(component, {
    global: { plugins: [i18n], provide: { [LAYER_PANEL_KEY as symbol]: ctx } },
  });
  return { w: wrapper, ctx };
}

describe('useLayerPanelContext', () => {
  it('meldet einen fehlenden LayerControlPanel', () => {
    expect(() =>
      mount({
        setup() {
          useLayerPanelContext();
          return () => null;
        },
      })
    ).toThrow('LayerControlPanel fehlt');
  });
});

describe('LayerListSection', () => {
  it('listet die Ebenen von oben nach unten und zeigt Reihenfolge nur bei der Auswahl', async () => {
    const { w, ctx } = mountWith(LayerListSection);
    const items = w.findAll('.layer-item');
    expect(items.map((i) => i.get('.layer-num').text())).toEqual(['L1', 'L2']);
    expect(items[0]!.classes()).toContain('selected');
    expect(items[0]!.get('.layer-size').text()).toBe('121×80');
    expect(items[0]!.find('.layer-order-inline').exists()).toBe(true);
    expect(items[1]!.find('.layer-order-inline').exists()).toBe(false);

    await items[1]!.trigger('click');
    expect(ctx.selectLayer).toHaveBeenCalledWith('a');
    await items[0]!.findAll('.icon-btn')[1]!.trigger('click');
    expect(ctx.deleteLayer).toHaveBeenCalledWith('b');
    expect(ctx.selectLayer).toHaveBeenCalledTimes(1);
  });
});

describe('LayerBackgroundSection', () => {
  it('setzt Hintergrundfarbe aus Schnellfarbe und Textfeld', async () => {
    const { w, ctx } = mountWith(LayerBackgroundSection);
    await w.findAll('.color-swatch')[1]!.trigger('click');
    expect(ctx.updateBackgroundColor).toHaveBeenCalledWith('transparent');
    await w.get('input.color-text-input').setValue('#123456');
    expect(ctx.updateBackgroundColor).toHaveBeenCalledWith('#123456');
    await w.get('.section-header').trigger('click');
    expect(ctx.toggleSection).toHaveBeenCalledWith('canvas');
  });
});

describe('LayerTransformSection', () => {
  it('rundet Position/Größe und meldet Eingaben', async () => {
    const { w, ctx } = mountWith(LayerTransformSection);
    const inputs = w.findAll('input[type="number"]');
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('10');
    await inputs[2]!.setValue('300');
    expect(ctx.updateSize).toHaveBeenCalledWith('width', 300);
    await w.findAll('.quick-rotate .btn')[2]!.trigger('click');
    expect(ctx.rotateBy).toHaveBeenCalledWith(90);
  });

  it('bleibt ohne ausgewählte Ebene leer', () => {
    const { w } = mountWith(LayerTransformSection, context(null));
    expect(w.find('.panel-section').exists()).toBe(false);
  });
});

describe('LayerShadowSection', () => {
  it('zeigt die Regler erst bei aktivem Schatten', async () => {
    const ctx = context();
    const { w } = mountWith(LayerShadowSection, ctx);
    expect(w.find('.color-picker-row').exists()).toBe(false);
    ctx.layerShadow.enabled = true;
    await w.vm.$nextTick();
    expect(w.find('.color-picker-row').exists()).toBe(true);
  });
});

describe('LayersTab', () => {
  it('zeigt ohne Auswahl nur Liste, Hintergrund und Hinweis', () => {
    const { w } = mountWith(LayersTab, context(null));
    expect(w.findAll('.panel-section')).toHaveLength(3);
    expect(w.find('.hint-text').exists()).toBe(true);
  });

  it('zeigt mit Auswahl alle sechs Abschnitte', () => {
    const { w } = mountWith(LayersTab);
    expect(w.findAll('.panel-section')).toHaveLength(6);
    expect(w.find('.hint-text').exists()).toBe(false);
  });
});
