/**
 * Formen & Symbole: Katalog, Geometrie, Hit-Testing, Griffe, Layout-Anpassungen
 * (src/utils/shapes.js) sowie die Store-Aktionen und das Galerie-Panel.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import de from '@/i18n/de';
import en from '@/i18n/en';
import {
  SHAPE_CATEGORIES,
  SHAPE_GALLERY,
  SHAPE_KIND,
  SHAPE_PATHS,
  createShape,
  cropShapes,
  findShapeAt,
  findShapeHandleAt,
  getDashPattern,
  getShapeHandles,
  getShapePathData,
  hitTestShape,
  resizeFromCorner,
  rotationFromPointer,
  scaleShapesToCanvas,
  toCanvas,
  toLocal,
} from '@/utils/shapes';
import { useImageStore } from '@/stores/imageStore';
import ShapesPanel from '@/components/features/shapes/ShapesPanel.vue';
import SliderField from '@/components/ui/SliderField.vue';

const close = (a, b, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe('Katalog', () => {
  it('jeder Galerie-Eintrag hat einen Pfad-Typ, eine Kategorie und eine eindeutige id', () => {
    const ids = SHAPE_GALLERY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of SHAPE_GALLERY) {
      expect(SHAPE_PATHS[item.type], item.id).toBeDefined();
      expect(SHAPE_CATEGORIES).toContain(item.category);
    }
  });

  it('jede Kategorie ist befüllt', () => {
    for (const c of SHAPE_CATEGORIES) {
      expect(SHAPE_GALLERY.filter((g) => g.category === c).length).toBeGreaterThan(2);
    }
  });

  it('jeder Eintrag ist in DE und EN übersetzt', () => {
    for (const item of SHAPE_GALLERY) {
      expect(de.shapes.items[item.id], item.id).toBeTruthy();
      expect(en.shapes.items[item.id], item.id).toBeTruthy();
    }
  });

  it.each(Object.keys(SHAPE_PATHS))(
    '%s liefert gültige Pfaddaten innerhalb des Rahmens',
    (type) => {
      const d = getShapePathData(type, 200, 100);
      expect(d).toMatch(/^M /);
      expect(d).not.toMatch(/NaN|Infinity/);
      // Endpunkte (ohne Bogen-Radien) liegen im Rahmen ±1 px (Herz-Kurven leicht darüber)
      const numbers = d
        .replace(/A [^A-Z]*?(?= [A-Z]|$)/g, (arc) => arc.split(' ').slice(-2).join(' '))
        .match(/-?\d+(\.\d+)?/g)
        .map(Number);
      for (let i = 0; i + 1 < numbers.length; i += 2) {
        expect(Math.abs(numbers[i])).toBeLessThanOrEqual(110);
      }
    }
  );
});

describe('createShape', () => {
  it('legt die Form mittig mit Startgröße relativ zum Canvas an', () => {
    const s = createShape('rect', 1000, 600);
    expect(s).toMatchObject({ type: 'rect', x: 500, y: 300, rotation: 0, opacity: 100 });
    expect(s.width).toBeGreaterThan(s.height);
    expect(s.filled).toBe(true);
    expect(s.strokeWidth).toBe(0);
  });

  it('Linienformen haben eine Linienstärke, Presets greifen', () => {
    const arrow = createShape('arrow', 800, 800);
    expect(SHAPE_PATHS[arrow.type].kind).toBe(SHAPE_KIND.STROKE);
    expect(arrow.strokeWidth).toBeGreaterThan(0);
    expect(createShape('dashedLine', 800, 800).dash).toBe('dashed');
    const frame = createShape('frame', 800, 800);
    expect(frame.filled).toBe(false);
    expect(frame.strokeWidth).toBeGreaterThan(0);
  });

  it('erzeugt eindeutige ids und lehnt Unbekanntes ab', () => {
    expect(createShape('star', 100, 100).id).not.toBe(createShape('star', 100, 100).id);
    expect(createShape('unbekannt', 100, 100)).toBeNull();
  });

  it('Linienmuster skalieren mit der Linienstärke', () => {
    expect(getDashPattern('solid', 4)).toEqual([]);
    expect(getDashPattern('dashed', 4)).toEqual([12, 8]);
    expect(getDashPattern('dotted', 4)[1]).toBe(8);
  });
});

describe('Hit-Testing und Griffe', () => {
  const shape = { x: 100, y: 100, width: 80, height: 40, rotation: 90, strokeWidth: 0 };

  it('toLocal und toCanvas sind invers', () => {
    const p = toCanvas(shape, 12, -7);
    const back = toLocal(shape, p.x, p.y);
    close(back.x, 12);
    close(back.y, -7);
  });

  it('berücksichtigt die Drehung', () => {
    // 90° gedreht: Breite liegt nun vertikal
    expect(hitTestShape(shape, 100, 135)).toBe(true);
    expect(hitTestShape(shape, 135, 100)).toBe(false);
    expect(hitTestShape(shape, 135, 100, 20)).toBe(true);
  });

  it('findet die oberste Form', () => {
    const a = { ...shape, id: 'a', rotation: 0 };
    const b = { ...shape, id: 'b', rotation: 0 };
    expect(findShapeAt([a, b], 100, 100).id).toBe('b');
    expect(findShapeAt([a, b], 500, 500)).toBeNull();
  });

  it('erkennt Eck- und Drehgriff', () => {
    const s = { ...shape, rotation: 0 };
    const h = getShapeHandles(s, 0, 20);
    expect(h.corners.nw).toEqual({ x: 60, y: 80 });
    expect(h.rotate).toEqual({ x: 100, y: 60 });
    expect(findShapeHandleAt(s, 60, 80, { rotateGap: 20, radius: 5 })).toEqual({
      mode: 'resize',
      corner: 'nw',
    });
    expect(findShapeHandleAt(s, 100, 61, { rotateGap: 20, radius: 5 })).toEqual({
      mode: 'rotate',
    });
    expect(findShapeHandleAt(s, 100, 100, { rotateGap: 20, radius: 5 })).toBeNull();
  });
});

describe('resizeFromCorner / rotationFromPointer', () => {
  it('hält die gegenüberliegende Ecke fest (ungedreht)', () => {
    const start = { x: 100, y: 100, width: 80, height: 40, rotation: 0 };
    const next = resizeFromCorner(start, 'se', { x: 180, y: 160 });
    expect(next).toMatchObject({ width: 120, height: 80, x: 120, y: 120 });
  });

  it('hält die gegenüberliegende Ecke fest (gedreht)', () => {
    const start = { x: 100, y: 100, width: 80, height: 40, rotation: 30 };
    const anchorBefore = toCanvas(start, -40, -20);
    const next = resizeFromCorner(start, 'se', { x: 200, y: 190 });
    const anchorAfter = toCanvas({ ...start, ...next }, -next.width / 2, -next.height / 2);
    close(anchorAfter.x, anchorBefore.x);
    close(anchorAfter.y, anchorBefore.y);
  });

  it('Shift hält das Seitenverhältnis, Mindestgröße greift', () => {
    const start = { x: 0, y: 0, width: 100, height: 50, rotation: 0 };
    const next = resizeFromCorner(start, 'se', { x: 150, y: 30 }, true);
    expect(next.width / next.height).toBeCloseTo(2);
    const tiny = resizeFromCorner(start, 'se', { x: -500, y: -500 });
    expect(tiny.width).toBeGreaterThanOrEqual(4);
    expect(tiny.height).toBeGreaterThanOrEqual(4);
  });

  it('Winkel zum Drehgriff, optional eingerastet', () => {
    const s = { x: 0, y: 0 };
    expect(rotationFromPointer(s, { x: 0, y: -50 })).toBe(0);
    expect(rotationFromPointer(s, { x: 50, y: 0 })).toBe(90);
    expect(Math.abs(rotationFromPointer(s, { x: 0, y: 50 }))).toBe(180);
    expect(rotationFromPointer(s, { x: 50, y: -45 }, 15)).toBe(45);
  });
});

describe('Layout-Anpassungen', () => {
  it('skaliert Formen auf eine neue Canvas-Größe', () => {
    const shapes = [{ x: 100, y: 50, width: 40, height: 20, strokeWidth: 4, shadowBlur: 0 }];
    expect(
      scaleShapesToCanvas(shapes, { width: 200, height: 100 }, { width: 400, height: 300 })
    ).toBe(true);
    expect(shapes[0]).toMatchObject({ x: 200, y: 150, width: 80, height: 40, strokeWidth: 8 });
    expect(scaleShapesToCanvas([], { width: 1, height: 1 }, { width: 2, height: 2 })).toBe(false);
  });

  it('verschiebt Formen beim Zuschnitt und entfernt die außerhalb', () => {
    const shapes = [
      { id: 'in', x: 150, y: 150 },
      { id: 'out', x: 10, y: 10 },
    ];
    expect(cropShapes(shapes, { x: 100, y: 100, width: 200, height: 200 })).toBe(1);
    expect(shapes).toEqual([{ id: 'in', x: 50, y: 50 }]);
  });
});

describe('imageStore – Formen', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('addShape wählt die neue Form aus und hebt Text-/Ebenen-Auswahl auf', () => {
    const store = useImageStore();
    store.selectedTextId = 5;
    const s = store.addShape('heart', 400, 300);
    expect(store.shapes).toHaveLength(1);
    expect(store.selectedShapeId).toBe(s.id);
    expect(store.selectedShape.id).toBe(s.id);
    expect(store.selectedTextId).toBeNull();
    expect(store.addShape('gibtsnicht', 1, 1)).toBeNull();
  });

  it('duplizieren, Reihenfolge, löschen', () => {
    const store = useImageStore();
    const a = store.addShape('rect', 400, 300);
    const b = store.duplicateShape(a.id);
    expect(store.shapes.map((s) => s.id)).toEqual([a.id, b.id]);
    expect(b.x).toBeGreaterThan(a.x);
    expect(store.selectedShapeId).toBe(b.id);

    expect(store.moveShapeOrder(b.id, 'down')).toBe(true);
    expect(store.shapes[0].id).toBe(b.id);
    expect(store.moveShapeOrder(b.id, 'down')).toBe(false);

    expect(store.deleteShape(b.id)).toBe(true);
    expect(store.selectedShapeId).toBeNull();
    expect(store.shapes).toHaveLength(1);
  });

  it('Auswahl einer Bild-Ebene hebt die Formen-Auswahl auf', () => {
    const store = useImageStore();
    store.addShape('rect', 400, 300);
    store.imageLayers = [{ id: 'L1' }];
    store.selectImageLayer('L1');
    expect(store.selectedShapeId).toBeNull();
  });
});

describe('ShapesPanel', () => {
  let store;
  const $t = (key, params) => (params?.name ? `${key}:${params.name}` : key);

  function mountPanel() {
    return mount(ShapesPanel, {
      props: { canvasWidth: 800, canvasHeight: 600 },
      global: { mocks: { $t } },
    });
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useImageStore();
    store.saveState = vi.fn();
  });

  it('zeigt die Kategorien und fügt per Klick eine Form hinzu (ein Historien-Eintrag)', async () => {
    const w = mountPanel();
    expect(w.findAll('.segmented__option').length).toBe(SHAPE_CATEGORIES.length);
    await w.find('[data-shape="ellipse"]').trigger('click');
    expect(store.shapes).toHaveLength(1);
    expect(store.shapes[0]).toMatchObject({ type: 'ellipse', x: 400, y: 300 });
    expect(store.saveState).toHaveBeenCalledTimes(1);
    expect(w.find('.shape-edit-section').exists()).toBe(true);
  });

  it('wechselt die Kategorie', async () => {
    const w = mountPanel();
    expect(w.find('[data-shape="arrow"]').exists()).toBe(false);
    const arrowsTab = w.findAll('.segmented__option')[SHAPE_CATEGORIES.indexOf('arrows')];
    await arrowsTab.trigger('click');
    expect(w.find('[data-shape="arrow"]').exists()).toBe(true);
  });

  it('bearbeitet Deckkraft und Drehung der ausgewählten Form', async () => {
    store.addShape('star', 800, 600);
    const w = mountPanel();
    const field = (id) => w.findAllComponents(SliderField).find((f) => f.props('inputId') === id);
    field('shape-opacity').vm.$emit('update:modelValue', 40);
    field('shape-rotation').vm.$emit('update:modelValue', -30);
    field('shape-rotation').vm.$emit('commit');
    expect(store.shapes[0]).toMatchObject({ opacity: 40, rotation: -30 });
    expect(store.saveState).toHaveBeenCalledTimes(1);
  });

  it('ohne Füllung bleibt eine sichtbare Umrandung', async () => {
    store.addShape('rect', 800, 600);
    const w = mountPanel();
    await w.find('#shape-fill-toggle').trigger('click');
    expect(store.shapes[0].filled).toBe(false);
    expect(store.shapes[0].strokeWidth).toBeGreaterThan(0);
  });

  it('Seitenverhältnis sperren koppelt Breite und Höhe', async () => {
    store.addShape('rect', 800, 600);
    const { width, height } = store.shapes[0];
    const w = mountPanel();
    await w.find('#shape-lock-ratio').trigger('click');
    w.findAllComponents(SliderField)
      .find((f) => f.props('inputId') === 'shape-width')
      .vm.$emit('update:modelValue', width * 2);
    expect(store.shapes[0].height).toBe(Math.round(height * 2));
  });

  it('löscht die Form über die Liste', async () => {
    store.addShape('rect', 800, 600);
    const w = mountPanel();
    await w.find('.shape-item .icon-btn--danger').trigger('click');
    expect(store.shapes).toHaveLength(0);
    expect(w.find('.shape-edit-section').exists()).toBe(false);
  });
});
