/**
 * Hintergrund entfernen im echten Browser: Worker, ONNX Runtime (WASM) und
 * Maskenanwendung. Statt des großen Modells läuft ein Mini-Modell, das als
 * Maske den Mittelwert der Farbkanäle liefert (hell = behalten, dunkel = weg).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import {
  applyMask,
  disposeBackgroundRemoval,
  removeBackground,
  resetBackgroundRemovalForTests,
  segment,
} from '@/lib/backgroundRemoval';
import { MODEL_SIZE } from '@/lib/backgroundRemoval/segmentation';
import maskModelUrl from '../fixtures/mask-mean.onnx?url';

/** Links weiß, rechts schwarz */
function halfImage(width, height) {
  return new Promise((resolve) => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width / 2, height);
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = c.toDataURL();
  });
}

const alphaAt = (canvas, x, y) => canvas.getContext('2d').getImageData(x, y, 1, 1).data[3];

afterAll(() => disposeBackgroundRemoval());

describe('Hintergrund entfernen', () => {
  it('applyMask skaliert die Maske auf die Originalgröße und setzt Alpha', async () => {
    const img = await halfImage(300, 200);
    const mask = new Uint8ClampedArray(MODEL_SIZE * MODEL_SIZE);
    for (let y = 0; y < MODEL_SIZE; y++)
      mask.fill(255, y * MODEL_SIZE, y * MODEL_SIZE + MODEL_SIZE / 2);
    const out = applyMask(img, mask);
    expect(out.width).toBe(300);
    expect(out.height).toBe(200);
    expect(alphaAt(out, 40, 100)).toBe(255);
    expect(alphaAt(out, 260, 100)).toBe(0);
  });

  it('Worker mit ONNX Runtime liefert Maske und Fortschritt', async () => {
    const img = await halfImage(320, 160);
    const phases = new Set();
    const out = await removeBackground(img, (p) => phases.add(p.phase), maskModelUrl);
    expect(out.width).toBe(320);
    expect(alphaAt(out, 40, 80)).toBe(255);
    expect(alphaAt(out, 280, 80)).toBe(0);
    expect(phases.has('run')).toBe(true);
  }, 60000);

  it('stürzt der Worker ab, wird einmal ohne WebGPU neu gerechnet', async () => {
    resetBackgroundRemovalForTests();
    const runs = [];
    class FakeWorker extends EventTarget {
      postMessage(msg) {
        runs.push(msg.wasmOnly);
        setTimeout(() => {
          if (!msg.wasmOnly) {
            this.dispatchEvent(new ErrorEvent('error', { message: '' }));
          } else {
            const mask = new Uint8ClampedArray(MODEL_SIZE * MODEL_SIZE).fill(255);
            const reply = { type: 'result', id: msg.id, mask: mask.buffer, backend: 'wasm' };
            this.dispatchEvent(new MessageEvent('message', { data: reply }));
          }
        });
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FakeWorker);
    try {
      const img = await halfImage(64, 64);
      const { backend, mask } = await segment(img, undefined, maskModelUrl);
      expect(runs).toEqual([false, true]);
      expect(backend).toBe('wasm');
      expect(mask[0]).toBe(255);
    } finally {
      vi.unstubAllGlobals();
      resetBackgroundRemovalForTests();
    }
  });

  it('meldet einen zweiten Absturz mit lesbarer Ursache', async () => {
    resetBackgroundRemovalForTests();
    class CrashWorker extends EventTarget {
      postMessage() {
        setTimeout(() =>
          this.dispatchEvent(
            new ErrorEvent('error', { message: 'Out of memory', filename: 'w.js', lineno: 3 })
          )
        );
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', CrashWorker);
    try {
      const img = await halfImage(64, 64);
      await expect(segment(img, undefined, maskModelUrl)).rejects.toThrow(
        'Worker abgestürzt: Out of memory (w.js:3)'
      );
    } finally {
      vi.unstubAllGlobals();
      resetBackgroundRemovalForTests();
    }
  });
});
