import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useCropOverlay, type CropBoxStyle } from '@/composables/editor/useCropOverlay';

/** Canvas 1000×500 px, per CSS auf 500×250 bei (20|10) im Container skaliert */
function fakeCanvas() {
  const parent = document.createElement('div');
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 500;
  parent.appendChild(canvas);
  const rect = (x: number, y: number, w: number, h: number) =>
    ({ left: x, top: y, width: w, height: h }) as DOMRect;
  canvas.getBoundingClientRect = () => rect(120, 60, 500, 250);
  parent.getBoundingClientRect = () => rect(100, 50, 600, 300);
  return canvas;
}

function setup(box: CropBoxStyle | null, cropping = true) {
  const canvas = ref<HTMLCanvasElement | null>(fakeCanvas());
  const style = ref<CropBoxStyle | null>(box);
  const result = useCropOverlay({
    canvas,
    cropOverlayStyle: style,
    cropping: ref(cropping),
    cropDimensions: ref({ width: 400, height: 200 }),
  });
  return { ...result, canvas, style };
}

describe('useCropOverlay', () => {
  it('skaliert die Box in Anzeige-Koordinaten inkl. Canvas-Versatz', () => {
    const { scaledCropOverlayStyle } = setup({
      left: '100px',
      top: '200px',
      width: '400px',
      height: '200px',
    });
    expect(scaledCropOverlayStyle.value).toEqual({
      left: '70px',
      top: '110px',
      width: '200px',
      height: '100px',
    });
  });

  it('klappt das Label nach innen, wenn oben kein Platz ist', () => {
    const { cropLabelInside, style } = setup({
      left: '0px',
      top: '0px',
      width: '10px',
      height: '10px',
    });
    expect(cropLabelInside.value).toBe(true); // top = 10
    style.value = { left: '0px', top: '48px', width: '10px', height: '10px' }; // top = 34
    expect(cropLabelInside.value).toBe(false);
  });

  it('liefert null ohne Box oder Canvas und behandelt ungültige Werte als 0', () => {
    const empty = setup(null);
    expect(empty.scaledCropOverlayStyle.value).toBeNull();
    expect(empty.cropLabelInside.value).toBe(false);

    const noCanvas = setup({ left: '1px', top: '1px', width: '1px', height: '1px' });
    noCanvas.canvas.value = null;
    expect(noCanvas.scaledCropOverlayStyle.value).toBeNull();

    const bad = setup({ left: 'x', top: '', width: 'auto', height: '4px' });
    expect(bad.scaledCropOverlayStyle.value).toEqual({
      left: '20px',
      top: '10px',
      width: '0px',
      height: '2px',
    });
  });

  it('Panel-Abmessungen nur während einer Auswahl', () => {
    expect(setup(null, true).panelCropDimensions.value).toEqual({ width: 400, height: 200 });
    expect(setup(null, false).panelCropDimensions.value).toEqual({ width: 0, height: 0 });
  });
});
