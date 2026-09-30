/**
 * Freies Verzerren (Distort) im Einzelbild-Modus: Rendering auf einem echten
 * Canvas und Ziehen der Eckpunkte über useCanvasInteraction.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { ref } from 'vue';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';
import { useCanvasInteraction } from '@/composables/editor/useCanvasInteraction';
import { useTransform } from '@/composables/useTransform';
import { drawWarpedImage, bakeDistortion } from '@/utils/warpImage';
import { useEditorDistort } from '@/composables/editor/useEditorDistort';
import { installToastMock, t } from './helpers';
import { DEFAULT_FILTERS, DEFAULT_BACKGROUND } from '@/composables/useFilterManagement';
import { makeImage, pixelAt, diffPixels, snapshot } from './helpers';

let img;
beforeAll(async () => {
  img = await makeImage(400, 300);
});

const mounted = [];
afterEach(() => {
  mounted.splice(0).forEach((el) => el.remove());
});

function setup(transforms = {}, { attach = false } = {}) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 400;
  canvasEl.height = 300;
  if (attach) {
    // Anzeige 1:1 → Canvas- und Bildschirm-Pixel stimmen überein
    canvasEl.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:300px';
    document.body.appendChild(canvasEl);
    mounted.push(canvasEl);
  }
  const transform = useTransform();
  Object.assign(transform.transforms.value, transforms);
  const canvas = ref(canvasEl);
  const selectedTextId = ref(null);
  const imageStore = { texts: [], imageLayers: [], hasImageLayers: false };
  const renderer = useCanvasRenderer({
    canvas,
    currentImage: ref(img),
    isCollageMode: ref(false),
    imageStore,
    transform,
    filters: ref({ ...DEFAULT_FILTERS }),
    background: ref({ ...DEFAULT_BACKGROUND }),
    selectedTextId,
  });
  return { canvasEl, canvas, renderer, transform, imageStore, selectedTextId };
}

const offsets = (patch) => ({
  nw: { x: 0, y: 0 },
  ne: { x: 0, y: 0 },
  se: { x: 0, y: 0 },
  sw: { x: 0, y: 0 },
  ...patch,
});

describe('Verzerren – Rendering', () => {
  it('aktiver Modus ohne Versatz ändert den Export nicht', () => {
    const plain = setup();
    plain.renderer.renderImageForExport(true);
    const reference = snapshot(plain.canvasEl);

    const { canvasEl, renderer } = setup({ distortEnabled: true });
    renderer.renderImageForExport(true);
    expect(diffPixels(reference, canvasEl)).toBe(0);
  });

  it('nur die Vorschau zeichnet die Verzerr-Griffe', () => {
    const { canvasEl, renderer } = setup({ distortEnabled: true });
    renderer.renderImage();
    const preview = snapshot(canvasEl);
    renderer.renderImageForExport();
    expect(diffPixels(preview, canvasEl)).toBeGreaterThan(0);
  });

  it('eine nach innen gezogene Ecke legt die Fläche dahinter frei', () => {
    const { canvasEl, renderer } = setup({
      distortEnabled: true,
      cornerOffsets: offsets({ nw: { x: 0.3, y: 0.3 } }),
    });
    renderer.renderImageForExport(true);
    expect(pixelAt(canvasEl, 5, 5)[3]).toBe(0);
    expect(pixelAt(canvasEl, 395, 5)[3]).toBe(255);
    expect(pixelAt(canvasEl, 200, 150)[3]).toBe(255);
  });

  it('Versätze wirken nicht, solange der Modus aus ist', () => {
    const { canvasEl, renderer } = setup({
      distortEnabled: false,
      cornerOffsets: offsets({ nw: { x: 0.3, y: 0.3 } }),
    });
    renderer.renderImageForExport(true);
    expect(pixelAt(canvasEl, 5, 5)[3]).toBe(255);
  });

  it('Griffpunkte folgen Zoom und Versatz', () => {
    const { renderer } = setup({
      distortEnabled: true,
      scale: 50,
      cornerOffsets: offsets({ se: { x: -0.5, y: 0 } }),
    });
    renderer.renderImage();
    const pts = renderer.getDistortHandlePoints();
    expect(pts.nw.x).toBeCloseTo(100);
    expect(pts.nw.y).toBeCloseTo(75);
    // se: lokal (200, 300) → Canvas 200 + (200-200)*0.5 … = (200, 225)
    expect(pts.se.x).toBeCloseTo(200);
    expect(pts.se.y).toBeCloseTo(225);
  });
});

describe('drawWarpedImage – Nähte', () => {
  it.each([0.5, 1, 2])('keine halbtransparenten Nähte im Inneren bei Zoom %s', (scale) => {
    const src = document.createElement('canvas');
    src.width = 400;
    src.height = 300;
    const sctx = src.getContext('2d');
    sctx.fillStyle = '#f00';
    sctx.fillRect(0, 0, 400, 300);

    const c = document.createElement('canvas');
    c.width = 400;
    c.height = 300;
    const ctx = c.getContext('2d');
    ctx.translate(200, 150);
    ctx.scale(scale, scale);
    ctx.translate(-200, -150);
    const quad = {
      nw: { x: 60, y: 40 },
      ne: { x: 400, y: 0 },
      se: { x: 400, y: 300 },
      sw: { x: 0, y: 300 },
    };
    drawWarpedImage(ctx, src, 400, 300, quad, 16);

    const r = 60 * scale;
    const x0 = Math.floor(200 - r);
    const y0 = Math.floor(150 - r);
    const size = Math.floor(2 * r);
    const data = ctx.getImageData(x0, y0, size, size).data;
    let translucent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) translucent++;
    expect(translucent).toBe(0);
  });
});

describe('Verzerren – Eckpunkte ziehen', () => {
  function interaction(ctx) {
    const saveHistory = vi.fn();
    const crop = {
      cropMode: ref(false),
      isDragging: ref(false),
      isResizing: ref(false),
      isCreating: ref(false),
      handleMouseDown: () => false,
      handleMouseMove: () => false,
      handleMouseUp: () => false,
      getCursorForPosition: () => 'default',
      cancelDragResize: () => {},
    };
    const api = useCanvasInteraction({
      canvas: ctx.canvas,
      isSpacePressed: ref(false),
      isPanning: ref(false),
      panStart: ref({ x: 0, y: 0 }),
      isCollageMode: ref(false),
      selectedTextId: ctx.selectedTextId,
      isDraggingText: ref(false),
      dragOffset: ref({ x: 0, y: 0 }),
      transform: ctx.transform,
      crop,
      layerInteraction: {},
      imageStore: ctx.imageStore,
      textModal: {},
      renderImage: ctx.renderer.renderImage,
      handleFinishCrop: () => {},
      saveHistory,
      getDistortHandlePoints: ctx.renderer.getDistortHandlePoints,
      getDistortGeometry: ctx.renderer.getDistortGeometry,
    });
    return { api, saveHistory, crop };
  }

  const at = (x, y) => ({ clientX: x, clientY: y, button: 0, preventDefault() {} });

  it('zieht eine Ecke und schreibt beim Loslassen die Historie', () => {
    const ctx = setup({ distortEnabled: true }, { attach: true });
    ctx.renderer.renderImage();
    const { api, saveHistory } = interaction(ctx);

    api.onCanvasMouseDown(at(400, 300)); // se-Ecke
    api.onCanvasMouseMove(at(360, 270));
    expect(saveHistory).not.toHaveBeenCalled();
    api.onCanvasMouseUp();

    const o = ctx.transform.transforms.value.cornerOffsets;
    expect(o.se.x).toBeCloseTo(-0.1);
    expect(o.se.y).toBeCloseTo(-0.1);
    expect(o.nw).toEqual({ x: 0, y: 0 });
    expect(saveHistory).toHaveBeenCalledTimes(1);
  });

  it('klemmt Positionen außerhalb des Canvas auf den Rand', () => {
    const ctx = setup({ distortEnabled: true }, { attach: true });
    ctx.renderer.renderImage();
    const { api } = interaction(ctx);

    api.onCanvasMouseDown(at(0, 0));
    api.handleGlobalMouseMove(at(-500, -500));
    api.handleGlobalMouseUp();
    expect(ctx.transform.transforms.value.cornerOffsets).toBeNull();
  });

  it('ohne aktiven Modus oder im Zuschnitt werden keine Ecken gezogen', () => {
    const off = setup({ distortEnabled: false }, { attach: true });
    off.renderer.renderImage();
    const a = interaction(off);
    a.api.onCanvasMouseDown(at(0, 0));
    a.api.onCanvasMouseMove(at(50, 50));
    a.api.onCanvasMouseUp();
    expect(off.transform.transforms.value.cornerOffsets).toBeNull();
    expect(a.saveHistory).not.toHaveBeenCalled();

    const cropping = setup({ distortEnabled: true }, { attach: true });
    cropping.renderer.renderImage();
    const b = interaction(cropping);
    b.crop.cropMode.value = true;
    b.api.onCanvasMouseDown(at(0, 0));
    b.api.onCanvasMouseMove(at(50, 50));
    expect(cropping.transform.transforms.value.cornerOffsets).toBeNull();
  });
});

describe('Verzerrung übernehmen', () => {
  it('bakeDistortion: Bounding-Box-Größe und transparente Fläche außerhalb', () => {
    const out = bakeDistortion(img, offsets({ ne: { x: 0.5, y: 0 }, nw: { x: 0.25, y: 0.25 } }));
    expect(out.canvas.width).toBe(600); // 400 × 1.5
    expect(out.canvas.height).toBe(300);
    expect(pixelAt(out.canvas, 5, 5)[3]).toBe(0);
    expect(pixelAt(out.canvas, 300, 200)[3]).toBe(255);
  });

  it('Rahmen folgt nach dem Übernehmen der verzerrten Umrissform', () => {
    const shapeQuad = {
      nw: { x: 0.3, y: 0.3 },
      ne: { x: 1, y: 0 },
      se: { x: 1, y: 1 },
      sw: { x: 0, y: 1 },
    };
    const { canvasEl, renderer } = setup({ shapeQuad, borderWidth: 10, borderColor: '#00ff00' });
    renderer.renderImageForExport(true);
    // Außerhalb des Umrisses (alte Rechteck-Ecke): weder Bild noch Rahmen
    expect(pixelAt(canvasEl, 3, 3)[3]).toBe(0);
    // Schräge Kante (120,90)→(400,0) liegt bei x=260 auf y=45; Rahmen innen 5 px breit
    const [r, g, b] = pixelAt(canvasEl, 260, 47);
    expect([r, g, b]).toEqual([0, 255, 0]);
  });

  it('Schatten folgt der Umrissform statt dem Rechteck', () => {
    const shapeQuad = {
      nw: { x: 0.5, y: 0.5 },
      ne: { x: 1, y: 0 },
      se: { x: 1, y: 1 },
      sw: { x: 0, y: 1 },
    };
    const { canvasEl, renderer } = setup({
      shapeQuad,
      shadowEnabled: true,
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    });
    renderer.renderImageForExport(true);
    // Ecke oben links liegt außerhalb des Umrisses → komplett transparent
    expect(pixelAt(canvasEl, 30, 30)[3]).toBe(0);
  });

  it('useEditorDistort backt das Bild, passt den Canvas an und schreibt die Historie', async () => {
    const toasts = installToastMock();
    const ctx = setup({ distortEnabled: true, cornerOffsets: offsets({ ne: { x: 0.5, y: 0 } }) });
    const saveHistory = vi.fn();
    const initFromDimensions = vi.fn();
    const currentImage = ref(img);
    const { applyDistortion, isApplyingDistort } = useEditorDistort({
      canvas: ctx.canvas,
      currentImage,
      transform: ctx.transform,
      resizeManager: { initFromDimensions },
      renderImage: ctx.renderer.renderImage,
      saveHistory,
      t,
    });

    await expect(applyDistortion()).resolves.toBe(true);
    expect(isApplyingDistort.value).toBe(false);
    expect(currentImage.value).not.toBe(img);
    expect(currentImage.value.naturalWidth).toBe(600);
    expect(ctx.canvasEl.width).toBe(600);
    expect(ctx.canvasEl.height).toBe(300);
    expect(initFromDimensions).toHaveBeenCalledWith(600, 300);
    const tf = ctx.transform.transforms.value;
    expect(tf.distortEnabled).toBe(false);
    expect(tf.cornerOffsets).toBeNull();
    expect(tf.shapeQuad.ne).toEqual({ x: 1, y: 0 });
    expect(saveHistory).toHaveBeenCalledTimes(1);
    expect(toasts).toContain('success:toast.transform.distortApplied');

    // Ohne aktive Verzerrung passiert nichts
    await expect(applyDistortion()).resolves.toBe(false);
    expect(saveHistory).toHaveBeenCalledTimes(1);
  });
});
