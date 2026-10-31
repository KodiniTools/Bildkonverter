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

describe('Marker und Verpixeln', () => {
  /** Canvas mit kleinem Schachbrett (scharfe Kanten) */
  function checkerCanvas() {
    const c = blankCanvas();
    const x = c.getContext('2d');
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        x.fillStyle = (i + j) % 2 ? '#000000' : '#ffffff';
        x.fillRect(i * 10, j * 10, 10, 10);
      }
    }
    return c;
  }

  it('Marker zeigt die Nummer in der Zahlenfarbe auf der Füllfarbe', () => {
    const c = blankCanvas();
    const m = {
      ...createShape('marker', 200, 200),
      x: 100,
      y: 100,
      width: 120,
      height: 120,
      fillColor: '#ff0000',
      textColor: '#0000ff',
      number: 1,
    };
    drawShape(c.getContext('2d'), m);
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(70, 70, 60, 60).data;
    let blue = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 2] > 200 && data[i] < 60) blue++;
    expect(blue).toBeGreaterThan(30);
    expect(pixelAt(c, 50, 100)).toEqual([255, 0, 0, 255]); // Füllung links der Zahl
    expect(pixelAt(c, 2, 2)[3]).toBe(0);
  });

  it.each(['pixelate', 'blur'])('%s verändert nur den Bereich', (effect) => {
    const c = checkerCanvas();
    const before = snapshot(c);
    const shape = {
      ...createShape('pixelate', 200, 200),
      effect,
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      intensity: 80,
    };
    drawShape(c.getContext('2d'), shape);
    // außerhalb identisch
    expect(pixelAt(c, 5, 5)).toEqual(
      Array.from(before.getContext('2d').getImageData(5, 5, 1, 1).data)
    );
    // innen: deutlich weniger harte Wechsel als vorher
    const changes = (canvas) => {
      const d = canvas.getContext('2d').getImageData(70, 100, 60, 1).data;
      let n = 0;
      for (let i = 4; i < d.length; i += 4) if (Math.abs(d[i] - d[i - 4]) > 128) n++;
      return n;
    };
    expect(changes(before)).toBeGreaterThan(4);
    expect(changes(c)).toBeLessThan(changes(before));
  });
});

describe('Text in Formen und Freihand (Canvas)', () => {
  function inkInRegion(c, x0, y0, x1, y1, test) {
    const data = c.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let n = 0;
    for (let i = 0; i < data.length; i += 4)
      if (test(data[i], data[i + 1], data[i + 2], data[i + 3])) n++;
    return n;
  }
  const isDark = (r, g, b, a) => a > 200 && r < 90 && g < 90 && b < 90;

  it('Text liegt mittig in der Form und bleibt beim Spiegeln lesbar', () => {
    const base = shape({ fillColor: '#ffffff', text: 'HH', textColor: '#000000', textScale: 0.5 });
    const a = blankCanvas();
    drawShape(a.getContext('2d'), base);
    expect(inkInRegion(a, 60, 85, 140, 115, isDark)).toBeGreaterThan(20);
    // außerhalb des Textbereichs bleibt die Füllung weiß
    expect(pixelAt(a, 55, 100)).toEqual([255, 255, 255, 255]);

    const b = blankCanvas();
    drawShape(b.getContext('2d'), { ...base, flipX: true });
    // Gespiegelt wird nur der Umriss: Text identisch
    expect(diffPixels(snapshot(a), snapshot(b))).toBe(0);
  });

  it('Text skaliert mit der Form', () => {
    const count = (w, h) => {
      const c = blankCanvas(400, 400);
      drawShape(
        c.getContext('2d'),
        shape({
          x: 200,
          y: 200,
          width: w,
          height: h,
          fillColor: '#ffffff',
          text: 'Hallo',
          textColor: '#000000',
        })
      );
      return inkInRegion(c, 0, 0, 400, 400, isDark);
    };
    expect(count(240, 120)).toBeGreaterThan(count(120, 60) * 2.5);
  });

  it('Textmarker multipliziert: dunkle Bildteile bleiben dunkel, Weiß wird gelb', () => {
    const c = blankCanvas();
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 100, 200);
    const stroke = {
      ...createShape('highlighter', 200, 200),
      ...{
        x: 100,
        y: 100,
        width: 180,
        height: 1,
        points: [
          [-0.5, 0],
          [0.5, 0],
        ],
      },
      tool: 'highlighter',
      strokeColor: '#ffff00',
      strokeWidth: 20,
      opacity: 100,
    };
    drawShape(ctx, stroke);
    expect(pixelAt(c, 150, 100)).toEqual([255, 255, 0, 255]);
    expect(pixelAt(c, 50, 100)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(c, 150, 130)).toEqual([255, 255, 255, 255]);
  });
});

describe('Farbverlauf und Emojis (Canvas)', () => {
  it('linearer Verlauf: links Start-, rechts Endfarbe', () => {
    const c = blankCanvas();
    drawShape(
      c.getContext('2d'),
      shape({ fillType: 'linear', fillColor: '#ff0000', fillColor2: '#0000ff', gradientAngle: 0 })
    );
    const [lr, , lb] = pixelAt(c, 52, 100);
    const [rr, , rb] = pixelAt(c, 148, 100);
    expect(lr).toBeGreaterThan(230);
    expect(lb).toBeLessThan(25);
    expect(rb).toBeGreaterThan(230);
    expect(rr).toBeLessThan(25);
  });

  it('radialer Verlauf: Mitte Start-, Rand Endfarbe', () => {
    const c = blankCanvas();
    drawShape(
      c.getContext('2d'),
      shape({ height: 100, fillType: 'radial', fillColor: '#ff0000', fillColor2: '#0000ff' })
    );
    expect(pixelAt(c, 100, 100)[0]).toBeGreaterThan(240);
    expect(pixelAt(c, 148, 100)[2]).toBeGreaterThan(200);
  });

  it('Emoji wird farbig im Rahmen gezeichnet, außerhalb bleibt der Canvas leer', () => {
    const c = blankCanvas();
    const emoji = { ...createShape('emojiHeart', 200, 200), x: 100, y: 100, width: 80, height: 80 };
    drawShape(c.getContext('2d'), emoji);
    const data = c.getContext('2d').getImageData(0, 0, 200, 200).data;
    let inside = 0;
    let outside = 0;
    for (let y = 0; y < 200; y++) {
      for (let x = 0; x < 200; x++) {
        const a = data[(y * 200 + x) * 4 + 3];
        if (!a) continue;
        if (Math.abs(x - 100) <= 42 && Math.abs(y - 100) <= 42) inside++;
        else outside++;
      }
    }
    expect(inside).toBeGreaterThan(1500);
    expect(outside).toBe(0);
  });
});
