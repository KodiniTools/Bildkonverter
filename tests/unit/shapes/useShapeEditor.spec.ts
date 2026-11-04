import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { useImageStore } from '@/stores/imageStore';
import {
  fallbackStrokeWidth,
  provideShapeEditor,
  useShapeEditor,
  useShapeEditorContext,
  type ShapeEditor,
} from '@/composables/shapes/useShapeEditor';

function setup(opts: { width?: number; height?: number; disabled?: boolean } = {}) {
  let editor!: ShapeEditor;
  const Host = defineComponent({
    setup() {
      editor = useShapeEditor({
        canvasWidth: () => opts.width ?? 800,
        canvasHeight: () => opts.height ?? 600,
        disabled: () => opts.disabled ?? false,
        t: (key) => `T:${key}`,
      });
      return () => h('div');
    },
  });
  const wrapper = mount(Host);
  return { editor, wrapper };
}

describe('useShapeEditor', () => {
  let store: ReturnType<typeof useImageStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useImageStore();
    store.saveState = vi.fn();
  });

  it('fügt eine Form hinzu, wählt sie aus und schreibt einen Historien-Eintrag', () => {
    const { editor } = setup();
    editor.addShape('ellipse');
    expect(editor.shapes.value).toHaveLength(1);
    expect(editor.selectedShape.value?.type).toBe('ellipse');
    expect(editor.isFillKind.value).toBe(true);
    expect(store.saveState).toHaveBeenCalledTimes(1);
  });

  it('übersetzt Sticker-Texte beim Einfügen', () => {
    const { editor } = setup();
    editor.addShape('badgeNew');
    expect(editor.selectedShape.value?.text).toBe('T:shapes.stickerText.new');
  });

  it('fügt gesperrt nichts hinzu', () => {
    const { editor } = setup({ disabled: true });
    editor.addShape('ellipse');
    editor.onTileClick({ id: 'pen', tool: 'pen', category: 'draw' });
    expect(editor.shapes.value).toHaveLength(0);
    expect(editor.drawTool.value).toBeNull();
  });

  it('Füllung aus: ohne Kontur wird eine sichtbare Linie gesetzt', () => {
    const { editor } = setup();
    editor.addShape('ellipse');
    editor.update({ strokeWidth: 0, width: 200, height: 100 });
    editor.toggleFill(false);
    expect(editor.selectedShape.value?.filled).toBe(false);
    expect(editor.selectedShape.value?.strokeWidth).toBe(5);
    expect(fallbackStrokeWidth({ width: 10, height: 10 })).toBe(2);
  });

  it('Seitenverhältnis sperren skaliert die andere Seite mit', () => {
    const { editor } = setup();
    editor.addShape('ellipse');
    editor.update({ width: 200, height: 100 });
    editor.setWidth(300);
    expect(editor.selectedShape.value?.height).toBe(100);
    editor.lockRatio.value = true;
    editor.setWidth(400);
    expect(editor.selectedShape.value?.height).toBe(Math.round(400 * (100 / 300)));
    editor.setHeight(200);
    expect(editor.selectedShape.value?.width).toBe(Math.round(200 * (400 / 133)));
  });

  it('Reglerbereiche folgen Canvas und Form', () => {
    const { editor } = setup();
    editor.addShape('ellipse');
    editor.update({ x: -50, y: 900 });
    expect(editor.rangeX.value).toEqual({ min: -50, max: 800 });
    expect(editor.rangeY.value).toEqual({ min: 0, max: 900 });
    expect(editor.sizeMax(10)).toBe(1600);
    expect(editor.sizeMax(5000)).toBe(5000);
  });

  it('Verlauf tauschen vertauscht beide Farben', () => {
    const { editor } = setup();
    editor.addShape('ellipse');
    editor.update({ fillColor: '#111111', fillColor2: '#222222', fillType: 'linear' });
    expect(editor.isGradient.value).toBe(true);
    editor.swapGradient();
    expect(editor.selectedShape.value?.fillColor).toBe('#222222');
    expect(editor.selectedShape.value?.fillColor2).toBe('#111111');
  });

  it('ignoriert ungültige Hex-Eingaben', () => {
    const { editor } = setup();
    editor.addShape('ellipse');
    editor.updateColor('shadowColor', '#12');
    expect(editor.selectedShape.value?.shadowColor).not.toBe('#12');
    editor.updateColor('shadowColor', '#abcdef');
    expect(editor.selectedShape.value?.shadowColor).toBe('#abcdef');
  });

  it('Zeichenwerkzeug: Reiter folgt dem Werkzeug, Reiterwechsel und Unmount beenden es', async () => {
    const { editor, wrapper } = setup();
    editor.onTileClick({ id: 'highlighter', tool: 'highlighter', category: 'draw' });
    await nextTick();
    expect(editor.drawTool.value).toBe('highlighter');
    expect(editor.activeCategory.value).toBe('draw');

    editor.activeCategory.value = 'basic';
    await nextTick();
    expect(editor.drawTool.value).toBeNull();

    editor.setDrawTool('pen');
    await nextTick();
    wrapper.unmount();
    expect(store.drawTool).toBeNull();
  });
});

describe('useShapeEditorContext', () => {
  it('wirft ohne umgebendes ShapesPanel', () => {
    const Orphan = defineComponent({
      setup() {
        useShapeEditorContext();
        return () => h('div');
      },
    });
    expect(() => mount(Orphan)).toThrow(/ShapesPanel/);
  });

  it('reicht den Zustand per provide an Kinder weiter', () => {
    setActivePinia(createPinia());
    let seen: ShapeEditor | null = null;
    const Child = defineComponent({
      setup() {
        seen = useShapeEditorContext();
        return () => h('span');
      },
    });
    let provided!: ShapeEditor;
    const Parent = defineComponent({
      setup() {
        provided = useShapeEditor({
          canvasWidth: () => 0,
          canvasHeight: () => 0,
          disabled: () => false,
          t: (k) => k,
        });
        provideShapeEditor(provided);
        return () => h(Child);
      },
    });
    mount(Parent);
    expect(seen).toBe(provided);
  });
});
