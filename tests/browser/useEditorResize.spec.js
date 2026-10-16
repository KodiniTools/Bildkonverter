/**
 * useEditorResize: Live-Vorschau beim Tippen, Größen-Presets und "Anwenden".
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ref, nextTick } from 'vue';
import { useEditorResize, MAX_RESIZE_DIMENSION } from '@/composables/editor/useEditorResize';
import { useResizeManager } from '@/composables/useResizeManager';
import { makeImage, installToastMock, t } from './helpers';

let image;
beforeAll(async () => {
  image = await makeImage(800, 400);
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function setup() {
  const toasts = installToastMock();
  const canvasEl = document.createElement('canvas');
  canvasEl.width = 800;
  canvasEl.height = 400;
  const resizeManager = useResizeManager({});
  resizeManager.initFromDimensions(800, 400);
  const renderImage = vi.fn();
  const updateImageSize = vi.fn();
  const saveHistory = vi.fn();
  const resize = useEditorResize({
    canvas: ref(canvasEl),
    currentImage: ref(image),
    resizeManager,
    renderImage,
    updateImageSize,
    saveHistory,
    t,
  });
  return { toasts, canvasEl, resizeManager, renderImage, updateImageSize, saveHistory, resize };
}

describe('useEditorResize – Live-Vorschau', () => {
  it('zeichnet den Canvas nach kurzer Entprellung in der getippten Größe', async () => {
    const { canvasEl, resizeManager, renderImage } = setup();
    resizeManager.resizeWidth.value = 600;
    resizeManager.resizeHeight.value = 300;
    await nextTick();
    expect(canvasEl.width).toBe(800); // noch nicht (Entprellung)
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([600, 300]);
    expect(renderImage).toHaveBeenCalledTimes(1);
  });

  it('wendet bei schnellem Tippen nur den letzten Wert an', async () => {
    const { canvasEl, resizeManager, renderImage } = setup();
    for (const w of [6, 60, 600]) {
      resizeManager.resizeWidth.value = w;
      resizeManager.resizeHeight.value = Math.round(w / 2);
      await nextTick();
    }
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([600, 300]);
    expect(renderImage).toHaveBeenCalledTimes(1);
  });

  it('eine ausstehende Vorschau wird verworfen, wenn die Felder zur aktuellen Größe zurückkehren', async () => {
    const { canvasEl, resizeManager, renderImage } = setup();
    resizeManager.resizeWidth.value = 500;
    resizeManager.resizeHeight.value = 250;
    await nextTick();
    resizeManager.resetToOriginal(); // Felder wieder 800x400 = Canvas
    await nextTick();
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([800, 400]);
    expect(renderImage).not.toHaveBeenCalled();
  });

  it('eine ausstehende Vorschau wird verworfen, wenn danach ein ungültiger Wert folgt', async () => {
    const { canvasEl, resizeManager, renderImage } = setup();
    resizeManager.resizeWidth.value = 500;
    await nextTick();
    resizeManager.resizeWidth.value = null; // Feld geleert
    await nextTick();
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([800, 400]);
    expect(renderImage).not.toHaveBeenCalled();
  });

  it('ignoriert leere, zu kleine und zu große Eingaben sowie die aktuelle Größe', async () => {
    const { canvasEl, resizeManager, renderImage } = setup();
    for (const [w, h] of [
      [0, 300],
      [null, 300],
      [MAX_RESIZE_DIMENSION + 1, 300],
      [800, 400],
    ]) {
      resizeManager.resizeWidth.value = w;
      resizeManager.resizeHeight.value = h;
      await nextTick();
    }
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([800, 400]);
    expect(renderImage).not.toHaveBeenCalled();
  });
});

describe('useEditorResize – Presets', () => {
  it('übernimmt ein Preset sofort, schreibt History und behält die Originalgröße als Ziel', () => {
    const { canvasEl, resizeManager, resize, saveHistory, updateImageSize, toasts } = setup();
    resize.applySocialPreset('facebook');
    expect([canvasEl.width, canvasEl.height]).toEqual([1200, 630]);
    expect(resize.selectedPreset.value).toBe('facebook');
    expect(resizeManager.originalWidth.value).toBe(1200);
    expect(resizeManager.naturalWidth.value).toBe(800); // Originalgröße bleibt erhalten
    expect(saveHistory).toHaveBeenCalledTimes(1);
    expect(updateImageSize).toHaveBeenCalledTimes(1);
    expect(toasts).toEqual(['success:toast.editor.resizeSuccess{"width":1200,"height":630}']);
  });

  it('setzt das Dropdown zurück, sobald die Maße nicht mehr zum Preset passen', async () => {
    const { resizeManager, resize } = setup();
    resize.applySocialPreset('facebook');
    resizeManager.resizeWidth.value = 1000;
    await nextTick();
    expect(resize.selectedPreset.value).toBe('');
  });

  it('der Platzhalter ändert nichts, ein unbekanntes Preset auch nicht', () => {
    const { canvasEl, resize, saveHistory } = setup();
    resize.applySocialPreset('');
    resize.applySocialPreset('gibt-es-nicht');
    expect([canvasEl.width, canvasEl.height]).toEqual([800, 400]);
    expect(saveHistory).not.toHaveBeenCalled();
  });

  it('"Ohne Preset" führt zur Originalgröße zurück', () => {
    const { canvasEl, resize, saveHistory } = setup();
    resize.applySocialPreset('facebook');
    resize.applySocialPreset('none');
    expect([canvasEl.width, canvasEl.height]).toEqual([800, 400]);
    expect(resize.selectedPreset.value).toBe('');
    expect(saveHistory).toHaveBeenCalledTimes(2);
  });

  it('"Ohne Preset" bei bereits übernommener Originalgröße gleicht nur die Felder an', async () => {
    const { canvasEl, resizeManager, resize, saveHistory, renderImage } = setup();
    resizeManager.resizeWidth.value = 500;
    await nextTick(); // Live-Vorschau für 500 ist eingeplant
    resize.applySocialPreset('none');
    expect(resizeManager.resizeWidth.value).toBe(800);
    expect(saveHistory).not.toHaveBeenCalled();
    // Die veraltete Vorschau darf den Canvas nicht mehr verändern
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([800, 400]);
    expect(renderImage).not.toHaveBeenCalled();
  });
});

describe('useEditorResize – Anwenden', () => {
  it('weist ungültige Größen mit Fehler-Toast ab', () => {
    const { canvasEl, resizeManager, resize, toasts, saveHistory } = setup();
    resizeManager.resizeWidth.value = 0;
    resize.applyResize();
    resizeManager.resizeWidth.value = MAX_RESIZE_DIMENSION + 1;
    resize.applyResize();
    expect([canvasEl.width, canvasEl.height]).toEqual([800, 400]);
    expect(saveHistory).not.toHaveBeenCalled();
    expect(toasts).toEqual([
      `error:toast.editor.resizeInvalid{"max":${MAX_RESIZE_DIMENSION}}`,
      `error:toast.editor.resizeInvalid{"max":${MAX_RESIZE_DIMENSION}}`,
    ]);
  });

  it('schreibt keinen doppelten History-Eintrag für die bereits übernommene Größe', () => {
    const { resize, saveHistory } = setup();
    resize.applyResize();
    expect(saveHistory).not.toHaveBeenCalled();
  });

  it('übernimmt eine gültige Größe und rundet Dezimalwerte', () => {
    const { canvasEl, resizeManager, resize, saveHistory } = setup();
    resizeManager.resizeWidth.value = 400.4;
    resizeManager.resizeHeight.value = 200.6;
    resize.applyResize();
    expect([canvasEl.width, canvasEl.height]).toEqual([400, 201]);
    expect(saveHistory).toHaveBeenCalledTimes(1);
  });

  it('onResizeChange leitet die Höhe aus der Breite ab', () => {
    const { resizeManager, resize } = setup();
    resizeManager.resizeWidth.value = 400;
    resize.onResizeChange('width');
    expect(resizeManager.resizeHeight.value).toBe(200);
    resizeManager.maintainAspectRatio.value = false;
    resizeManager.resizeWidth.value = 100;
    resize.onResizeChange('width');
    expect(resizeManager.resizeHeight.value).toBe(200);
  });
});

describe('useEditorResize – Resize-Modi', () => {
  it('Prozent berechnet die Felder, zeigt sie live und springt nach dem Anwenden auf 100 %', async () => {
    const { canvasEl, resizeManager, resize, saveHistory } = setup();
    resize.resizeSpec.value = { ...resize.resizeSpec.value, mode: 'percent', percent: 50 };
    await nextTick();
    expect([resizeManager.resizeWidth.value, resizeManager.resizeHeight.value]).toEqual([400, 200]);
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([400, 200]);

    resize.applyResize();
    await nextTick();
    expect(saveHistory).toHaveBeenCalledTimes(1);
    expect(resize.resizeSpec.value.percent).toBe(100);
    // Felder entsprechen der neuen Größe → kein zweites Skalieren
    expect([resizeManager.resizeWidth.value, resizeManager.resizeHeight.value]).toEqual([400, 200]);
  });

  it('lange Kante und einpassen respektieren "nicht vergrößern"', async () => {
    const { resizeManager, resize } = setup();
    resize.resizeSpec.value = { ...resize.resizeSpec.value, mode: 'longEdge', longEdge: 1600 };
    await nextTick();
    expect([resizeManager.resizeWidth.value, resizeManager.resizeHeight.value]).toEqual([800, 400]);

    resize.resizeSpec.value = { ...resize.resizeSpec.value, noUpscale: false };
    await nextTick();
    expect([resizeManager.resizeWidth.value, resizeManager.resizeHeight.value]).toEqual([
      1600, 800,
    ]);

    resize.resizeSpec.value = {
      ...resize.resizeSpec.value,
      mode: 'fit',
      fitWidth: 300,
      fitHeight: 300,
    };
    await nextTick();
    expect([resizeManager.resizeWidth.value, resizeManager.resizeHeight.value]).toEqual([300, 150]);
  });

  it('ein Größen-Preset wechselt zurück in den Modus "Exakt"', async () => {
    const { canvasEl, resize } = setup();
    resize.resizeSpec.value = { ...resize.resizeSpec.value, mode: 'percent', percent: 25 };
    await nextTick();
    resize.applySocialPreset('instagram');
    await nextTick();
    expect(resize.resizeSpec.value.mode).toBe('exact');
    expect([canvasEl.width, canvasEl.height]).toEqual([1080, 1080]);
  });

  it('Undo/Zuschnitt (initFromDimensions) lösen im relativen Modus keine Vorschau aus', async () => {
    const { canvasEl, resizeManager, resize, renderImage } = setup();
    resize.resizeSpec.value = { ...resize.resizeSpec.value, mode: 'longEdge', longEdge: 400 };
    await nextTick();
    canvasEl.width = 1000;
    canvasEl.height = 500;
    resizeManager.initFromDimensions(1000, 500);
    await nextTick();
    await wait(150);
    expect([canvasEl.width, canvasEl.height]).toEqual([1000, 500]);
    expect(renderImage).not.toHaveBeenCalled();
  });
});
