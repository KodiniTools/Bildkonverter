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
  getCensorStrength,
  getGalleryPreview,
  nextMarkerNumber,
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
  createFreehandShape,
  fitFreehandPoints,
  getDefaultDrawWidth,
  getShapeFontSize,
  getShapeTextBox,
  layoutShapeText,
  supportsShapeText,
  wrapShapeText,
  EMOJI_SET,
  FILL_TYPES,
  getFillStyle,
} from '@/utils/shapes';
import {
  RECENT_COLORS_KEY,
  RECENT_COLORS_MAX,
  addRecentColor,
  clearRecentColors,
  reloadRecentColors,
  useRecentColors,
} from '@/composables/useRecentColors';
import ColorField from '@/components/features/shapes/ColorField.vue';
import { useShapeInteraction } from '@/composables/editor/useShapeInteraction';
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
      expect(SHAPE_GALLERY.filter((g) => g.category === c).length).toBeGreaterThanOrEqual(2);
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

describe('Marker und Verpixeln', () => {
  it('Marker: quadratisch, Nummer, Zahlenfarbe, weiße Kontur', () => {
    const m = createShape('marker', 1000, 800);
    expect(m.width).toBe(m.height);
    expect(m).toMatchObject({
      type: 'marker',
      number: 1,
      textColor: '#ffffff',
      markerStyle: 'circle',
    });
    expect(m.strokeWidth).toBeGreaterThan(0);
    expect(createShape('markerSquare', 100, 100).markerStyle).toBe('square');
  });

  it('nextMarkerNumber zählt nur Marker', () => {
    expect(nextMarkerNumber([])).toBe(1);
    expect(
      nextMarkerNumber([
        { type: 'marker', number: 2 },
        { type: 'rect', number: 9 },
        { type: 'marker', number: 5 },
      ])
    ).toBe(6);
  });

  it('Zensur-Form: Effekt, Umriss und Stärke', () => {
    const p = createShape('pixelate', 1000, 800);
    expect(p).toMatchObject({ type: 'censor', effect: 'pixelate', region: 'rect', intensity: 50 });
    const b = createShape('blurEllipse', 1000, 800);
    expect(b).toMatchObject({ effect: 'blur', region: 'ellipse' });
    expect(getShapePathData('censor', 100, 50, { region: 'ellipse' })).toMatch(/A /);
    expect(getShapePathData('censor', 100, 50, { region: 'rect' })).not.toMatch(/A /);
    const strong = getCensorStrength({ ...p, width: 200, height: 200, intensity: 100 });
    const weak = getCensorStrength({ ...p, width: 200, height: 200, intensity: 10 });
    expect(strong).toBeGreaterThan(weak);
    expect(weak).toBeGreaterThanOrEqual(2);
  });

  it('Galerie-Vorschau: Marker mit Nummer, Verpixeln mit Raster', () => {
    const marker = SHAPE_GALLERY.find((g) => g.id === 'marker');
    expect(getGalleryPreview(marker).label).toBe('1');
    const pix = SHAPE_GALLERY.find((g) => g.id === 'pixelate');
    expect(getGalleryPreview(pix).pattern).toMatch(/^M /);
    const blur = SHAPE_GALLERY.find((g) => g.id === 'blur');
    expect(getGalleryPreview(blur).effect).toBe('blur');
  });

  it('Store nummeriert Marker fortlaufend, auch beim Duplizieren', () => {
    setActivePinia(createPinia());
    const store = useImageStore();
    store.addShape('marker', 400, 300);
    store.addShape('rect', 400, 300);
    const second = store.addShape('markerSquare', 400, 300);
    expect(second.number).toBe(2);
    expect(store.duplicateShape(second.id).number).toBe(3);
  });

  it('Panel: Marker-Nummer und Effekt umschalten', async () => {
    setActivePinia(createPinia());
    const store = useImageStore();
    store.saveState = vi.fn();
    const $t = (key) => key;
    store.addShape('marker', 800, 600);
    const w = mount(ShapesPanel, {
      props: { canvasWidth: 800, canvasHeight: 600 },
      global: { mocks: { $t } },
    });
    const field = (id) => w.findAllComponents(SliderField).find((f) => f.props('inputId') === id);
    expect(field('shape-marker-number')).toBeTruthy();
    expect(field('shape-height')).toBeUndefined();
    field('shape-marker-number').vm.$emit('update:modelValue', 7);
    expect(store.shapes[0].number).toBe(7);
    field('shape-size').vm.$emit('update:modelValue', 120);
    expect(store.shapes[0]).toMatchObject({ width: 120, height: 120 });

    store.addShape('pixelate', 800, 600);
    await w.vm.$nextTick();
    expect(field('shape-intensity')).toBeTruthy();
    expect(field('shape-shadow')).toBeUndefined();
    const blurBtn = w.findAll('.segmented__option').find((b) => b.text() === 'shapes.effects.blur');
    await blurBtn.trigger('click');
    expect(store.shapes[1].effect).toBe('blur');
  });
});

// Messkontext ohne Canvas: jedes Zeichen ist 0,5 × Schriftgröße breit
function fakeCtx() {
  return {
    font: '10px x',
    measureText(text) {
      const size = parseFloat(this.font) || 10;
      return { width: String(text).length * size * 0.5 };
    },
  };
}

describe('Text in Formen', () => {
  it('Textformen der Galerie haben Text, Schrift und relative Größe', () => {
    for (const id of ['textBox', 'speechBubbleText', 'label']) {
      const shape = createShape(id, 1000, 800);
      expect(supportsShapeText(shape.type), id).toBe(true);
      expect(shape).toMatchObject({ text: 'Text', textAlign: 'center' });
      expect(shape.textScale).toBeGreaterThan(0);
      expect(getShapePathData(shape.type, shape.width, shape.height, shape)).not.toBe('');
    }
    // Rechteck/Kreis bekommen ein (leeres) Textfeld, Pfeile nicht
    expect(createShape('rect', 800, 600).text).toBe('');
    expect(supportsShapeText('arrow')).toBe(false);
    expect(createShape('arrow', 800, 600).text).toBeUndefined();
  });

  it('Textbereich liegt in der Form; bei der Sprechblase über dem Zipfel', () => {
    for (const type of ['rect', 'roundedRect', 'ellipse', 'diamond', 'speechBubble', 'label']) {
      const box = getShapeTextBox({ type, width: 200, height: 100 });
      expect(Math.abs(box.x) + box.width / 2, type).toBeLessThanOrEqual(100);
      expect(Math.abs(box.y) + box.height / 2, type).toBeLessThanOrEqual(50);
    }
    const bubble = getShapeTextBox({ type: 'speechBubble', width: 200, height: 100 });
    // Körper endet bei y = +25 (h/2 · 0,5)
    expect(bubble.y + bubble.height / 2).toBeLessThanOrEqual(25);
  });

  it('Schriftgröße wandert mit der Form', () => {
    const shape = createShape('textBox', 1000, 800);
    const before = getShapeFontSize(shape);
    shape.width *= 2;
    shape.height *= 2;
    expect(getShapeFontSize(shape)).toBeCloseTo(before * 2, 5);
  });

  it('bricht Text um und verkleinert ihn, bis er passt', () => {
    const ctx = fakeCtx();
    ctx.font = '10px x';
    expect(wrapShapeText(ctx, 'eins zwei drei', 40)).toEqual(['eins', 'zwei', 'drei']);
    expect(wrapShapeText(ctx, 'a\n\nb', 100)).toEqual(['a', '', 'b']);

    const shape = { type: 'rect', width: 200, height: 100, text: 'Hallo', textScale: 0.3 };
    const fits = layoutShapeText(ctx, shape);
    expect(fits.fontSize).toBeCloseTo(30, 5);
    expect(fits.lines).toEqual(['Hallo']);

    const long = { ...shape, text: 'Ein ziemlich langer Satz für eine kleine Form' };
    const layout = layoutShapeText(ctx, long);
    expect(layout.fontSize).toBeLessThan(30);
    expect(layout.lines.length * layout.fontSize * 1.2).toBeLessThanOrEqual(layout.box.height);
  });

  it('Panel: Text, Schriftgröße und Ausrichtung bearbeiten', async () => {
    setActivePinia(createPinia());
    const store = useImageStore();
    store.saveState = vi.fn();
    store.addShape('textBox', 800, 600);
    const w = mount(ShapesPanel, {
      props: { canvasWidth: 800, canvasHeight: 600 },
      global: { mocks: { $t: (k) => k } },
    });
    const input = w.find('#shape-text-input');
    expect(input.exists()).toBe(true);
    await input.setValue('Hallo Welt');
    expect(store.shapes[0].text).toBe('Hallo Welt');

    const field = (id) => w.findAllComponents(SliderField).find((f) => f.props('inputId') === id);
    const minSide = Math.min(store.shapes[0].width, store.shapes[0].height);
    field('shape-font-size').vm.$emit('update:modelValue', Math.round(minSide * 0.5));
    expect(store.shapes[0].textScale).toBeCloseTo(Math.round(minSide * 0.5) / minSide, 3);

    const right = w.findAll('.segmented__option').find((b) => b.text() === 'shapes.align.right');
    await right.trigger('click');
    expect(store.shapes[0].textAlign).toBe('right');
  });
});

describe('Freihand: Stift und Textmarker', () => {
  it('normiert Punkte auf den Begrenzungsrahmen', () => {
    const fit = fitFreehandPoints([
      { x: 100, y: 200 },
      { x: 300, y: 300 },
      { x: 200, y: 400 },
    ]);
    expect(fit).toMatchObject({ x: 200, y: 300, width: 200, height: 200 });
    expect(fit.points).toEqual([
      [-0.5, -0.5],
      [0.5, 0],
      [0, 0.5],
    ]);
    // Gerader Strich: Höhe mindestens 1 px
    expect(
      fitFreehandPoints([
        { x: 0, y: 5 },
        { x: 10, y: 5 },
      ]).height
    ).toBe(1);
    expect(fitFreehandPoints([])).toBeNull();
  });

  it('Textmarker ist halbtransparent, Stift deckend', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 50, y: 20 },
    ];
    const hl = createFreehandShape(pts, { tool: 'highlighter', width: 20 });
    const pen = createFreehandShape(pts, { tool: 'pen', color: '#123456', width: 3 });
    expect(hl).toMatchObject({ type: 'freehand', tool: 'highlighter', strokeWidth: 20 });
    expect(hl.opacity).toBeLessThan(100);
    expect(pen).toMatchObject({ tool: 'pen', strokeColor: '#123456', opacity: 100 });
    expect(getShapePathData('freehand', pen.width, pen.height, pen)).toMatch(/^M /);
    expect(getDefaultDrawWidth('highlighter', 1000, 1000)).toBeGreaterThan(
      getDefaultDrawWidth('pen', 1000, 1000)
    );
  });

  it('zeichnet einen Strich als Form (Historie, ohne Auswahl)', () => {
    setActivePinia(createPinia());
    const store = useImageStore();
    const saveHistory = vi.fn();
    const renderImage = vi.fn();
    const canvas = {
      value: { width: 800, height: 600, style: {}, getBoundingClientRect: () => ({ width: 800 }) },
    };
    const it2 = useShapeInteraction({ canvas, imageStore: store, renderImage, saveHistory });

    expect(it2.startDraw({ x: 10, y: 10 })).toBe(false);
    store.setDrawTool('pen');
    expect(it2.cursorAt({ x: 0, y: 0 })).toBe('crosshair');
    expect(it2.startDraw({ x: 10, y: 10 })).toBe(true);
    it2.moveDrag({ x: 10.5, y: 10 }); // zu nah → ignoriert
    it2.moveDrag({ x: 60, y: 40 });
    it2.moveDrag({ x: 110, y: 10 });
    it2.endDrag();

    expect(store.shapes).toHaveLength(1);
    const stroke = store.shapes[0];
    expect(stroke).toMatchObject({ type: 'freehand', tool: 'pen', galleryId: 'pen' });
    expect(stroke.points).toHaveLength(3);
    expect(stroke).toMatchObject({ x: 60, y: 25, width: 100, height: 30 });
    expect(store.selectedShapeId).toBeNull();
    expect(saveHistory).toHaveBeenCalledTimes(1);
    expect(store.drawSettings.pen.width).toBeGreaterThan(0);
  });

  it('Panel: Werkzeug-Kachel schaltet den Zeichenmodus, Reiterwechsel beendet ihn', async () => {
    setActivePinia(createPinia());
    const store = useImageStore();
    store.saveState = vi.fn();
    const w = mount(ShapesPanel, {
      props: { canvasWidth: 800, canvasHeight: 600 },
      global: { mocks: { $t: (k) => k } },
    });
    const tabs = () => w.findAll('[role="tab"]');
    await tabs()[SHAPE_CATEGORIES.indexOf('draw')].trigger('click');
    await w.find('[data-shape="highlighter"]').trigger('click');
    expect(store.drawTool).toBe('highlighter');
    expect(store.shapes).toHaveLength(0);
    expect(w.find('[data-shape="highlighter"]').classes()).toContain('active');

    await tabs()[0].trigger('click');
    expect(store.drawTool).toBeNull();
  });
});

describe('Sticker und Emojis', () => {
  it('Sticker-Kategorie enthält Daumen hoch, !, ?, Neu, Sale und alle Emojis', () => {
    const ids = SHAPE_GALLERY.filter((g) => g.category === 'stickers').map((g) => g.id);
    expect(ids).toEqual(
      expect.arrayContaining(['thumbsUp', 'exclamation', 'question', 'badgeNew', 'badgeSale'])
    );
    for (const id of Object.keys(EMOJI_SET)) expect(ids).toContain(id);
    // 32 Emojis, jedes Zeichen nur einmal
    const glyphs = Object.values(EMOJI_SET);
    expect(glyphs).toHaveLength(32);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it('Badges und Zeichen sind Textformen; Emojis haben ihr Zeichen und keine Kontur', () => {
    expect(createShape('exclamation', 800, 600)).toMatchObject({ text: '!', textColor: '#ffffff' });
    expect(createShape('badgeSale', 800, 600)).toMatchObject({ type: 'burst', text: 'SALE' });
    const emoji = createShape('emojiFire', 800, 600);
    expect(emoji).toMatchObject({ type: 'emoji', emoji: EMOJI_SET.emojiFire, strokeWidth: 0 });
    expect(emoji.width).toBe(emoji.height);
    expect(getGalleryPreview(SHAPE_GALLERY.find((g) => g.id === 'emojiFire')).emoji).toBe('🔥');
  });

  it('Panel: „Neu“-Badge erhält den übersetzten Text; Emoji lässt sich tauschen', async () => {
    setActivePinia(createPinia());
    const store = useImageStore();
    store.saveState = vi.fn();
    const w = mount(ShapesPanel, {
      props: { canvasWidth: 800, canvasHeight: 600 },
      global: { mocks: { $t: (k) => (k === 'shapes.stickerText.new' ? 'NEU' : k) } },
    });
    await w.findAll('[role="tab"]')[SHAPE_CATEGORIES.indexOf('stickers')].trigger('click');
    await w.find('[data-shape="badgeNew"]').trigger('click');
    expect(store.shapes[0].text).toBe('NEU');
    expect(store.saveState).toHaveBeenCalledTimes(1);

    await w.find('[data-shape="emojiSmile"]').trigger('click');
    expect(w.find('#shape-stroke-width').exists()).toBe(false);
    const options = w.findAll('.emoji-option');
    expect(options).toHaveLength(Object.keys(EMOJI_SET).length);
    await options.find((o) => o.text() === EMOJI_SET.emojiParty).trigger('click');
    expect(store.shapes[1]).toMatchObject({ emoji: EMOJI_SET.emojiParty, galleryId: 'emojiParty' });
  });
});

describe('Farbverlauf', () => {
  function gradientCtx() {
    const calls = [];
    const gradient = { stops: [], addColorStop: (o, c) => gradient.stops.push([o, c]) };
    return {
      calls,
      gradient,
      createLinearGradient: (...a) => (calls.push(['linear', ...a]), gradient),
      createRadialGradient: (...a) => (calls.push(['radial', ...a]), gradient),
    };
  }

  it('einfarbig liefert die Farbe, linear/radial einen Verlauf über den Rahmen', () => {
    const base = { fillColor: '#ff0000', fillColor2: '#0000ff', gradientAngle: 0 };
    expect(getFillStyle(gradientCtx(), { ...base, fillType: 'solid' }, 100, 50)).toBe('#ff0000');

    const lin = gradientCtx();
    getFillStyle(lin, { ...base, fillType: 'linear' }, 100, 50);
    expect(lin.calls[0]).toEqual(['linear', -50, -0, 50, 0]);
    expect(lin.gradient.stops).toEqual([
      [0, '#ff0000'],
      [1, '#0000ff'],
    ]);

    const down = gradientCtx();
    getFillStyle(down, { ...base, fillType: 'linear', gradientAngle: 90 }, 100, 50);
    const [, x0, y0, x1, y1] = down.calls[0];
    close(x0, 0, 1e-9);
    close(x1, 0, 1e-9);
    close(y0, -25);
    close(y1, 25);

    const rad = gradientCtx();
    getFillStyle(rad, { ...base, fillType: 'radial' }, 100, 50);
    expect(rad.calls[0]).toEqual(['radial', 0, 0, 0, 0, 0, 50]);
  });

  it('neue Flächenformen starten einfarbig; Panel schaltet auf Verlauf und tauscht Farben', async () => {
    expect(FILL_TYPES).toEqual(['solid', 'linear', 'radial']);
    setActivePinia(createPinia());
    const store = useImageStore();
    store.saveState = vi.fn();
    store.addShape('rect', 800, 600);
    expect(store.shapes[0]).toMatchObject({ fillType: 'solid', gradientAngle: 90 });
    const w = mount(ShapesPanel, {
      props: { canvasWidth: 800, canvasHeight: 600 },
      global: { mocks: { $t: (k) => k } },
    });
    await w.find('[data-fill-type="linear"]').trigger('click');
    expect(store.shapes[0].fillType).toBe('linear');
    const field = (id) => w.findAllComponents(SliderField).find((f) => f.props('inputId') === id);
    field('shape-gradient-angle').vm.$emit('update:modelValue', 45);
    expect(store.shapes[0].gradientAngle).toBe(45);
    const { fillColor, fillColor2 } = store.shapes[0];
    await w.find('.swap-btn').trigger('click');
    expect(store.shapes[0]).toMatchObject({ fillColor: fillColor2, fillColor2: fillColor });
  });
});

describe('Zuletzt verwendete Farben', () => {
  beforeEach(() => {
    localStorage.clear();
    clearRecentColors();
  });

  it('neueste zuerst, ohne Duplikate, begrenzt und gespeichert', () => {
    const { recentColors } = useRecentColors();
    expect(addRecentColor('#FF0000')).toBe(true);
    addRecentColor('#00ff00');
    addRecentColor('#ff0000');
    expect(addRecentColor('rot')).toBe(false);
    expect(recentColors.value).toEqual(['#ff0000', '#00ff00']);
    for (let i = 0; i < 12; i++) addRecentColor(`#0000${String(i).padStart(2, '0')}`);
    expect(recentColors.value).toHaveLength(RECENT_COLORS_MAX);
    expect(JSON.parse(localStorage.getItem(RECENT_COLORS_KEY))).toEqual(recentColors.value);

    localStorage.setItem(RECENT_COLORS_KEY, '["#123456","kaputt"]');
    reloadRecentColors();
    expect(recentColors.value).toEqual(['#123456']);
    localStorage.setItem(RECENT_COLORS_KEY, '{kein json');
    reloadRecentColors();
    expect(recentColors.value).toEqual([]);
  });

  it('ColorField merkt sich die Farbe beim Abschließen; Klick auf ein Feld übernimmt sie', async () => {
    const w = mount(ColorField, { props: { modelValue: '#000000', label: 'Farbe' } });
    expect(w.findAll('.recent-color')).toHaveLength(0);
    await w.find('input[type="color"]').setValue('#abcdef');
    expect(w.emitted('update:modelValue').at(-1)).toEqual(['#abcdef']);
    expect(w.emitted('commit').at(-1)).toEqual(['#abcdef']);
    addRecentColor('#112233');
    await w.vm.$nextTick();
    const swatches = w.findAll('.recent-color');
    expect(swatches.map((b) => b.attributes('data-color'))).toEqual(['#112233', '#abcdef']);
    await swatches[0].trigger('click');
    expect(w.emitted('update:modelValue').at(-1)).toEqual(['#112233']);
    expect(w.emitted('commit').at(-1)).toEqual(['#112233']);
  });
});
