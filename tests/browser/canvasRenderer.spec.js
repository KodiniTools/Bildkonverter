/**
 * useCanvasRenderer: Vorschau- und Export-Rendering auf einem echten Canvas.
 * Ersetzt den Pixelvergleich aus dem Refactoring durch Eigenschaften, die
 * dauerhaft gelten müssen.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { ref } from 'vue';
import { useCanvasRenderer, drawLayerSelection } from '@/composables/useCanvasRenderer';
import { useTransform } from '@/composables/useTransform';
import { DEFAULT_FILTERS, DEFAULT_BACKGROUND } from '@/composables/useFilterManagement';
import { makeImage, pixelAt, diffPixels, snapshot } from './helpers';

let imgA, imgB;
beforeAll(async () => {
  imgA = await makeImage(320, 240, 0);
  imgB = await makeImage(160, 200, 1);
});

const TEXT = {
  id: 1,
  content: 'Hallo Welt',
  x: 40,
  y: 30,
  fontSize: 48,
  fontFamily: 'Arial',
  color: '#ff0000',
  rotation: 0,
  opacity: 100,
};

function setup(state = {}) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 400;
  canvasEl.height = 300;
  const transform = useTransform();
  Object.assign(transform.transforms.value, state.transforms || {});
  const imageStore = {
    texts: state.texts || [],
    imageLayers: state.layers || [],
    hasImageLayers: (state.layers || []).length > 0,
    selectedLayerId: state.selectedLayerId ?? null,
    canvasBackgroundColor: state.canvasBackgroundColor ?? '#ffffff',
  };
  const renderer = useCanvasRenderer({
    canvas: ref(canvasEl),
    currentImage: ref('image' in state ? state.image : imgA),
    isCollageMode: ref(!!state.collage),
    imageStore,
    transform,
    filters: ref({ ...DEFAULT_FILTERS, ...(state.filters || {}) }),
    background: ref({ ...DEFAULT_BACKGROUND, ...(state.background || {}) }),
    selectedTextId: ref(state.selectedTextId ?? null),
  });
  return { canvasEl, renderer, transform, imageStore };
}

describe('useCanvasRenderer – Einzelbild', () => {
  it('Vorschau und Export sind ohne Auswahl pixelidentisch', () => {
    const { canvasEl, renderer } = setup({
      texts: [TEXT],
      transforms: { rotation: 15, borderRadius: 20, borderWidth: 4, shadowEnabled: true, skewX: 5 },
      filters: { sepia: 30, brightness: 110, vignette: 40 },
    });
    renderer.renderImage();
    const preview = snapshot(canvasEl);
    renderer.renderImageForExport();
    expect(diffPixels(preview, canvasEl)).toBe(0);
  });

  it('nur die Vorschau zeichnet den Text-Auswahlrahmen', () => {
    const { canvasEl, renderer } = setup({ texts: [TEXT], selectedTextId: 1 });
    renderer.renderImage();
    const preview = snapshot(canvasEl);
    renderer.renderImageForExport();
    expect(diffPixels(preview, canvasEl)).toBeGreaterThan(0);
  });

  it('die Vignette ist in Vorschau und Export vorhanden', () => {
    const { canvasEl, renderer } = setup({
      image: imgA,
      filters: { vignette: 100 },
      background: { color: '#ffffff', opacity: 100 },
    });
    renderer.renderImage();
    const cornerPreview = pixelAt(canvasEl, 2, 2);
    renderer.renderImageForExport();
    const cornerExport = pixelAt(canvasEl, 2, 2);
    // Ecke deutlich abgedunkelt (weißer Hintergrund → dunkel), in beiden Pfaden gleich
    expect(cornerPreview[0]).toBeLessThan(120);
    expect(cornerExport).toEqual(cornerPreview);
  });

  it('forceTransparent lässt den Hintergrund weg', () => {
    const { canvasEl, renderer } = setup({
      transforms: { scale: 50 },
      background: { color: '#ff00ff', opacity: 100 },
    });
    renderer.renderImageForExport(false);
    expect(pixelAt(canvasEl, 2, 2)).toEqual([255, 0, 255, 255]);
    renderer.renderImageForExport(true);
    expect(pixelAt(canvasEl, 2, 2)[3]).toBe(0);
  });

  it('includeTexts=false lässt die Texte weg', () => {
    const { canvasEl, renderer } = setup({ texts: [TEXT] });
    renderer.renderImageForExport(false, true);
    const withText = snapshot(canvasEl);
    renderer.renderImageForExport(false, false);
    expect(diffPixels(withText, canvasEl)).toBeGreaterThan(0);
    const { canvasEl: plain, renderer: plainRenderer } = setup({ texts: [] });
    plainRenderer.renderImageForExport(false, true);
    expect(diffPixels(plain, canvasEl)).toBe(0);
  });

  it('zeichnet nichts ohne Bild', () => {
    const { canvasEl, renderer } = setup({ image: null });
    canvasEl.getContext('2d').fillStyle = '#123456';
    canvasEl.getContext('2d').fillRect(0, 0, 10, 10);
    renderer.renderImage();
    expect(pixelAt(canvasEl, 1, 1)).toEqual([0x12, 0x34, 0x56, 255]);
  });
});

describe('useCanvasRenderer – Collage', () => {
  const layers = () => [
    {
      id: 'L1',
      name: 'A',
      visible: true,
      image: imgA,
      x: 20,
      y: 30,
      width: 200,
      height: 150,
      opacity: 100,
      rotation: 15,
      flipX: false,
      flipY: false,
      filters: {
        brightness: 110,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
        hue: 0,
      },
      border: { width: 4, color: '#ff00ff', radius: 25 },
      shadow: { enabled: true, offsetX: 6, offsetY: 6, blur: 12, color: '#000000', opacity: 60 },
    },
    {
      id: 'L2',
      name: 'B',
      visible: true,
      image: imgB,
      x: 180,
      y: 80,
      width: 120,
      height: 150,
      opacity: 70,
      rotation: 0,
      flipX: true,
      flipY: false,
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 50,
        sepia: 0,
        blur: 0,
        hue: 0,
      },
      border: { width: 0, color: '#000000', radius: 0 },
      shadow: { enabled: false },
    },
    {
      id: 'hidden',
      name: 'H',
      visible: false,
      image: imgB,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      opacity: 100,
      rotation: 0,
      filters: {},
      border: { width: 0, radius: 0 },
      shadow: { enabled: false },
    },
  ];

  it('Export entspricht der Vorschau ohne Auswahlrahmen', () => {
    const { canvasEl, renderer } = setup({
      collage: true,
      layers: layers(),
      texts: [TEXT],
      canvasBackgroundColor: '#eeeeee',
    });
    renderer.renderImage();
    const preview = snapshot(canvasEl);
    renderer.renderImageForExport();
    expect(diffPixels(preview, canvasEl)).toBe(0);
  });

  it('die Vorschau markiert die selektierte Ebene', () => {
    const { canvasEl, renderer } = setup({
      collage: true,
      layers: layers(),
      selectedLayerId: 'L1',
    });
    renderer.renderImage();
    const preview = snapshot(canvasEl);
    renderer.renderImageForExport();
    expect(diffPixels(preview, canvasEl)).toBeGreaterThan(0);
  });

  it('transparenter Hintergrund bleibt im Export transparent', () => {
    const { canvasEl, renderer } = setup({
      collage: true,
      layers: layers(),
      canvasBackgroundColor: 'transparent',
    });
    renderer.renderImageForExport();
    expect(pixelAt(canvasEl, 2, 2)[3]).toBe(0);
    const { canvasEl: withBg, renderer: r2 } = setup({
      collage: true,
      layers: layers(),
      canvasBackgroundColor: '#eeeeee',
    });
    r2.renderImageForExport(true);
    expect(pixelAt(withBg, 2, 2)[3]).toBe(0);
  });

  it('ohne Ebenen fällt der Collage-Modus auf das Einzelbild zurück', () => {
    const { canvasEl, renderer } = setup({ collage: true, layers: [] });
    renderer.renderImage();
    const collage = snapshot(canvasEl);
    const { canvasEl: single, renderer: r2 } = setup({ collage: false });
    r2.renderImage();
    expect(diffPixels(collage, single)).toBe(0);
  });

  it('drawLayerSelection zeichnet Rahmen und acht Griffe', () => {
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 200;
    drawLayerSelection(c.getContext('2d'), { x: 50, y: 50, width: 100, height: 80, rotation: 0 });
    // Griff oben links liegt bei (50-4 .. 50+4)
    expect(pixelAt(c, 50, 50)).toEqual([1, 79, 153, 255]);
    // Mitte des Rahmens bleibt leer
    expect(pixelAt(c, 100, 90)[3]).toBe(0);
  });
});
