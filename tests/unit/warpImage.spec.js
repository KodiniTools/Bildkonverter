/**
 * Freies Verzerren: reine Geometrie (warpImage) und Zustand (useTransform).
 */
import { describe, it, expect } from 'vitest';
import {
  computeTriangleAffine,
  computeQuadCorners,
  offsetForLocalPoint,
  findCornerAt,
  hasDistortion,
  emptyOffsets,
  MAX_OFFSET,
  MIN_OFFSET,
} from '@/utils/warpImage';
import { useTransform } from '@/composables/useTransform';

const apply = ([a, b, c, d, e, f], p) => ({ x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f });

describe('warpImage – Geometrie', () => {
  it('computeTriangleAffine bildet die Quell- exakt auf die Zieleckpunkte ab', () => {
    const s = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
    ];
    const d = [
      { x: 10, y: 5 },
      { x: 90, y: 20 },
      { x: 120, y: 80 },
    ];
    const m = computeTriangleAffine(...s, ...d);
    s.forEach((p, i) => {
      const q = apply(m, p);
      expect(q.x).toBeCloseTo(d[i].x, 9);
      expect(q.y).toBeCloseTo(d[i].y, 9);
    });
  });

  it('computeQuadCorners ohne Versätze liefert das Rechteck', () => {
    const c = computeQuadCorners({ x: 10, y: 20, width: 200, height: 100 }, null);
    expect(c).toEqual({
      nw: { x: 10, y: 20 },
      ne: { x: 210, y: 20 },
      se: { x: 210, y: 120 },
      sw: { x: 10, y: 120 },
    });
  });

  it('Versätze sind normiert auf Breite/Höhe', () => {
    const offsets = { ...emptyOffsets(), se: { x: -0.25, y: 0.5 } };
    const c = computeQuadCorners({ x: 0, y: 0, width: 200, height: 100 }, offsets);
    expect(c.se).toEqual({ x: 150, y: 150 });
    expect(c.nw).toEqual({ x: 0, y: 0 });
  });

  it('offsetForLocalPoint ist die Umkehrung von computeQuadCorners und wird geklemmt', () => {
    const rect = { x: 5, y: 5, width: 100, height: 80 };
    const o = offsetForLocalPoint(rect, 'ne', { x: 95, y: 25 });
    expect(o.x).toBeCloseTo(-0.1);
    expect(o.y).toBeCloseTo(0.25);
    const far = offsetForLocalPoint(rect, 'nw', { x: 10000, y: -10000 });
    expect(far).toEqual({ x: MAX_OFFSET, y: MIN_OFFSET });
    // Degeneriertes Rechteck → kein NaN
    expect(offsetForLocalPoint({ x: 0, y: 0, width: 0, height: 0 }, 'se', { x: 3, y: 3 })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('findCornerAt findet die nächste Ecke im Radius, sonst null', () => {
    const pts = computeQuadCorners({ x: 0, y: 0, width: 100, height: 100 }, null);
    expect(findCornerAt({ x: 97, y: 4 }, pts, 8)).toBe('ne');
    expect(findCornerAt({ x: 50, y: 50 }, pts, 8)).toBeNull();
  });

  it('hasDistortion erkennt jede versetzte Ecke', () => {
    expect(hasDistortion(null)).toBe(false);
    expect(hasDistortion(emptyOffsets())).toBe(false);
    expect(hasDistortion({ ...emptyOffsets(), sw: { x: 0, y: 0.01 } })).toBe(true);
  });
});

describe('useTransform – Verzerren', () => {
  it('ist standardmäßig aus und lässt sich umschalten', () => {
    const t = useTransform();
    expect(t.transforms.value.distortEnabled).toBe(false);
    expect(t.transforms.value.cornerOffsets).toBeNull();
    t.toggleDistort();
    expect(t.transforms.value.distortEnabled).toBe(true);
  });

  it('setCornerOffset ersetzt das Objekt (flache Historien-Kopie bleibt unverändert)', () => {
    const t = useTransform();
    t.setDistortEnabled(true);
    t.setCornerOffset('nw', { x: 0.1, y: 0.2 });
    const snapshot = { ...t.transforms.value };
    t.setCornerOffset('se', { x: -0.1, y: -0.1 });
    expect(snapshot.cornerOffsets.se).toEqual({ x: 0, y: 0 });
    expect(t.transforms.value.cornerOffsets.nw).toEqual({ x: 0.1, y: 0.2 });
    expect(t.transforms.value.cornerOffsets.se).toEqual({ x: -0.1, y: -0.1 });
    expect(t.hasDistortion.value).toBe(true);
    expect(t.hasTransforms.value).toBe(true);
  });

  it('ignoriert ungültige Ecken und normalisiert "alles 0" zu null', () => {
    const t = useTransform();
    t.setCornerOffset('xx', { x: 1, y: 1 });
    expect(t.transforms.value.cornerOffsets).toBeNull();
    t.setCornerOffset('ne', { x: 0.3, y: 0 });
    t.setCornerOffset('ne', { x: 0, y: 0 });
    expect(t.transforms.value.cornerOffsets).toBeNull();
  });

  it('Versätze wirken nur bei aktivem Modus; Reset behält den Modus', () => {
    const t = useTransform();
    t.setCornerOffset('sw', { x: 0.2, y: 0 });
    expect(t.hasDistortion.value).toBe(false);
    t.setDistortEnabled(true);
    expect(t.hasDistortion.value).toBe(true);
    t.resetDistort();
    expect(t.transforms.value.cornerOffsets).toBeNull();
    expect(t.transforms.value.distortEnabled).toBe(true);
    t.resetTransforms();
    expect(t.transforms.value.distortEnabled).toBe(false);
  });
});
