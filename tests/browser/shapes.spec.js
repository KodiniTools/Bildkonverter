/**
 * Formen auf einem echten Canvas: Zeichnen (Füllung, Drehung, Deckkraft,
 * Linien), Einbindung in Vorschau/Export des Renderers und Auswahl-Overlay.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { ref } from 'vue';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';
import { useTransform } from '@/composables/useTransform';
import { DEFAULT_FILTERS, DEFAULT_BACKGROUND } from '@/composables/useFilterManagement';
import { createShape, drawShape } from '@/utils/shapes';
import { makeImage, pixelAt, diffPixels, snapshot } from './helpers';

function blankCanvas(w = 200, h = 200) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function shape(overrides = {}) {
  return {
    ...createShape('rect', 200, 200),
    x: 100,
    y: 100,
    width: 100,
    height: 40,
    fillColor: '#ff0000',
    strokeWidth: 0,
    ...overrides,
  };
}

describe('drawShape', () => {
  it('füllt die Form in der Füllfarbe, außerhalb bleibt der Canvas leer', () => {
    const c = blankCanvas();
    drawShape(c.getContext('2d'), shape());
    expect(pixelAt(c, 100, 100)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(c, 100, 140)[3]).toBe(0);
  });

  it('Drehung um 90° stellt die Form hoch', () => {
    const c = blankCanvas();
    drawShape(c.getContext('2d'), shape({ rotation: 90 }));
    expect(pixelAt(c, 100, 140)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(c, 140, 100)[3]).toBe(0);
  });

  it('Deckkraft wirkt auf den Alphakanal', () => {
    const c = blankCanvas();
    drawShape(c.getContext('2d'), shape({ opacity: 50 }));
    const alpha = pixelAt(c, 100, 100)[3];
    expect(alpha).toBeGreaterThan(110);
    expect(alpha).toBeLessThan(145);
  });

  it('ohne Füllung zeichnet nur die Umrandung', () => {
    const c = blankCanvas();
    drawShape(c.getContext('2d'), shape({ filled: false, strokeWidth: 6, strokeColor: '#0000ff' }));
    expect(pixelAt(c, 100, 100)[3]).toBe(0);
    expect(pixelAt(c, 50, 100)).toEqual([0, 0, 255, 255]);
  });

  it('Linienformen werden gestrichen (Pfeil)', () => {
    const c = blankCanvas();
    const arrow = { ...createShape('arrow', 200, 200), x: 100, y: 100, strokeColor: '#00ff00' };
    drawShape(c.getContext('2d'), arrow);
    expect(pixelAt(c, 100, 100)).toEqual([0, 255, 0, 255]);
  });
});

describe('useCanvasRenderer – Formen', () => {
  let img;
  beforeAll(async () => {
    img = await makeImage(200, 200);
  });

  function setup(store) {
    const canvasEl = blankCanvas();
    const renderer = useCanvasRenderer({
      canvas: ref(canvasEl),
      currentImage: ref(img),
      isCollageMode: ref(false),
      imageStore: { texts: [], imageLayers: [], hasImageLayers: false, ...store },
      transform: useTransform(),
      filters: ref({ ...DEFAULT_FILTERS }),
      background: ref({ ...DEFAULT_BACKGROUND }),
      selectedTextId: ref(null),
    });
    return { canvasEl, renderer };
  }

  it('Formen sind im Export enthalten', () => {
    const { canvasEl, renderer } = setup({ shapes: [shape()], selectedShapeId: null });
    renderer.renderImageForExport();
    expect(pixelAt(canvasEl, 100, 100)).toEqual([255, 0, 0, 255]);
  });

  it('includeTexts=false lässt auch Formen weg (Ablösen vom Hintergrund)', () => {
    const { canvasEl, renderer } = setup({ shapes: [shape()], selectedShapeId: null });
    renderer.renderImageForExport(false, false);
    expect(pixelAt(canvasEl, 100, 100)).not.toEqual([255, 0, 0, 255]);
  });

  it('Auswahlrahmen und Griffe nur in der Vorschau', () => {
    const s = shape();
    const { canvasEl, renderer } = setup({ shapes: [s], selectedShapeId: s.id });
    renderer.renderImage();
    const preview = snapshot(canvasEl);
    renderer.renderImageForExport();
    expect(diffPixels(preview, canvasEl)).toBeGreaterThan(0);

    const { canvasEl: plain, renderer: r2 } = setup({ shapes: [s], selectedShapeId: null });
    r2.renderImage();
    r2.renderImageForExport();
    expect(diffPixels(plain, canvasEl)).toBe(0);
  });
});
