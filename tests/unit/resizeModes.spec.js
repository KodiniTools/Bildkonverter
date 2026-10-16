/**
 * Resize-Modi: Zielgrößen für Prozent, lange Kante und einpassen.
 */
import { describe, it, expect } from 'vitest';
import {
  computeResizeTarget,
  defaultResizeSpec,
  isResizeSpecValid,
  RESIZE_PX_MAX,
} from '@/utils/resizeModes';

const landscape = { width: 4000, height: 3000 };
const portrait = { width: 3000, height: 4000 };
const small = { width: 800, height: 600 };

const spec = (patch) => ({ ...defaultResizeSpec, ...patch });

describe('computeResizeTarget', () => {
  it('exakt lässt die Größe unverändert (rechnet der ResizeManager)', () => {
    expect(computeResizeTarget(landscape, spec({ mode: 'exact' }))).toEqual(landscape);
  });

  it('Prozent skaliert beide Seiten, auch über 100 %', () => {
    expect(computeResizeTarget(landscape, spec({ mode: 'percent', percent: 25 }))).toEqual({
      width: 1000,
      height: 750,
    });
    expect(computeResizeTarget(small, spec({ mode: 'percent', percent: 200 }))).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it('lange Kante gilt für Hoch- und Querformat', () => {
    const s = spec({ mode: 'longEdge', longEdge: 2000 });
    expect(computeResizeTarget(landscape, s)).toEqual({ width: 2000, height: 1500 });
    expect(computeResizeTarget(portrait, s)).toEqual({ width: 1500, height: 2000 });
  });

  it('einpassen hält das Seitenverhältnis', () => {
    const s = spec({ mode: 'fit', fitWidth: 1000, fitHeight: 1000 });
    expect(computeResizeTarget(landscape, s)).toEqual({ width: 1000, height: 750 });
    expect(computeResizeTarget(portrait, s)).toEqual({ width: 750, height: 1000 });
  });

  it('nicht vergrößern lässt kleinere Bilder unverändert', () => {
    expect(computeResizeTarget(small, spec({ mode: 'longEdge', longEdge: 2000 }))).toEqual(small);
    expect(
      computeResizeTarget(small, spec({ mode: 'fit', fitWidth: 1920, fitHeight: 1080 }))
    ).toEqual(small);
    expect(
      computeResizeTarget(small, spec({ mode: 'longEdge', longEdge: 1600, noUpscale: false }))
    ).toEqual({ width: 1600, height: 1200 });
  });

  it('begrenzt auf die maximale Kantenlänge', () => {
    expect(computeResizeTarget(landscape, spec({ mode: 'percent', percent: 1000 }))).toEqual({
      width: RESIZE_PX_MAX,
      height: RESIZE_PX_MAX,
    });
  });

  it('ungültige Eingaben oder Bildgrößen ändern nichts', () => {
    expect(computeResizeTarget(small, spec({ mode: 'percent', percent: 0 }))).toEqual(small);
    expect(computeResizeTarget(small, spec({ mode: 'longEdge', longEdge: NaN }))).toEqual(small);
    expect(computeResizeTarget({ width: 0, height: 0 }, spec({ mode: 'percent' }))).toEqual({
      width: 0,
      height: 0,
    });
  });
});

describe('isResizeSpecValid', () => {
  it('prüft die Eingaben des jeweiligen Modus', () => {
    expect(isResizeSpecValid(spec({ mode: 'percent', percent: 1001 }))).toBe(false);
    expect(isResizeSpecValid(spec({ mode: 'fit', fitHeight: 0 }))).toBe(false);
    expect(isResizeSpecValid(spec({ mode: 'longEdge', longEdge: 1 }))).toBe(true);
    expect(isResizeSpecValid(spec({ mode: 'exact', percent: 0 }))).toBe(true);
  });
});
