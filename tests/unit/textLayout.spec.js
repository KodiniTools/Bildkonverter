/**
 * scaleTextsToCanvas – Texte bleiben beim Ersetzen des Bildes an derselben
 * relativen Position und in passender Größe.
 */
import { describe, it, expect } from 'vitest';
import { scaleTextsToCanvas } from '@/utils/textLayout';

const from = { width: 800, height: 600 };

describe('scaleTextsToCanvas', () => {
  it('skaliert Position je Achse und Größen mit dem kleineren Faktor', () => {
    const texts = [
      { x: 400, y: 300, fontSize: 40, size: 40, strokeWidth: 4, shadowBlur: 0, shadowOffsetX: 2 },
    ];
    const changed = scaleTextsToCanvas(texts, from, { width: 400, height: 1200 });
    expect(changed).toBe(true);
    expect(texts[0]).toMatchObject({
      x: 200,
      y: 600,
      fontSize: 20,
      size: 20,
      strokeWidth: 2,
      shadowBlur: 0,
      shadowOffsetX: 1,
    });
  });

  it('vergrößert Texte bei größerem Bild proportional', () => {
    const texts = [{ x: 100, y: 50, fontSize: 32 }];
    scaleTextsToCanvas(texts, from, { width: 1600, height: 1200 });
    expect(texts[0]).toMatchObject({ x: 200, y: 100, fontSize: 64 });
    expect(texts[0].size).toBeUndefined();
  });

  it('ändert nichts bei gleicher Größe, leeren Texten oder ungültigen Maßen', () => {
    const texts = [{ x: 10, y: 20, fontSize: 32 }];
    expect(scaleTextsToCanvas(texts, from, { ...from })).toBe(false);
    expect(scaleTextsToCanvas([], from, { width: 10, height: 10 })).toBe(false);
    expect(scaleTextsToCanvas(texts, { width: 0, height: 0 }, from)).toBe(false);
    expect(scaleTextsToCanvas(null, from, from)).toBe(false);
    expect(texts[0]).toEqual({ x: 10, y: 20, fontSize: 32 });
  });
});
