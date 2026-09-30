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
  computeBakeLayout,
  UNIT_QUAD,
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

describe('computeBakeLayout – Verzerrung übernehmen', () => {
  const close = (p, q) => {
    expect(p.x).toBeCloseTo(q.x, 9);
    expect(p.y).toBeCloseTo(q.y, 9);
  };

  it('ohne Versätze bleibt alles beim Einheitsquadrat', () => {
    const l = computeBakeLayout(emptyOffsets());
    expect([l.minU, l.minV, l.spanU, l.spanV]).toEqual([0, 0, 1, 1]);
    for (const c of ['nw', 'ne', 'se', 'sw']) close(l.shapeQuad[c], UNIT_QUAD[c]);
  });

  it('nach innen gezogene Ecke: Box bleibt, Umriss folgt der Ecke', () => {
    const l = computeBakeLayout({ ...emptyOffsets(), nw: { x: 0.2, y: 0.3 } });
    expect(l.spanU).toBeCloseTo(1);
    expect(l.spanV).toBeCloseTo(1);
    close(l.shapeQuad.nw, { x: 0.2, y: 0.3 });
    close(l.shapeQuad.se, { x: 1, y: 1 });
  });

  it('nach außen gezogene Ecke vergrößert die Box, Umriss bleibt in 0..1', () => {
    const l = computeBakeLayout({ ...emptyOffsets(), ne: { x: 0.5, y: -0.5 } });
    expect(l.spanU).toBeCloseTo(1.5);
    expect(l.spanV).toBeCloseTo(1.5);
    close(l.shapeQuad.ne, { x: 1, y: 0 });
    close(l.shapeQuad.nw, { x: 0, y: 0.5 / 1.5 });
    close(l.shapeQuad.sw, { x: 0, y: 1 });
  });

  it('eine bestehende Umrissform wird mitverzerrt', () => {
    const shape = { ...UNIT_QUAD, nw: { x: 0.5, y: 0 } };
    // Nur die Breite halbieren (rechte Ecken nach links)
    const l = computeBakeLayout({
      ...emptyOffsets(),
      ne: { x: -0.5, y: 0 },
      se: { x: -0.5, y: 0 },
    });
    expect(l.spanU).toBeCloseTo(0.5);
    const l2 = computeBakeLayout(
      { ...emptyOffsets(), ne: { x: -0.5, y: 0 }, se: { x: -0.5, y: 0 } },
      shape
    );
    close(l2.shapeQuad.nw, { x: 0.5, y: 0 });
    close(l2.shapeQuad.se, l.shapeQuad.se);
  });
});

describe('useTransform – Verzerrung übernehmen', () => {
  it('commitDistortion merkt die Form und beendet den Modus', () => {
    const t = useTransform();
    t.setDistortEnabled(true);
    t.setCornerOffset('nw', { x: 0.1, y: 0.1 });
    const shape = { ...UNIT_QUAD, nw: { x: 0.1, y: 0.1 } };
    t.commitDistortion(shape);
    expect(t.transforms.value.shapeQuad).toEqual(shape);
    expect(t.transforms.value.cornerOffsets).toBeNull();
    expect(t.transforms.value.distortEnabled).toBe(false);
    expect(t.hasDistortion.value).toBe(false);
    t.clearShape();
    expect(t.transforms.value.shapeQuad).toBeNull();
  });

  it('resetTransforms verwirft die Form', () => {
    const t = useTransform();
    t.commitDistortion({ ...UNIT_QUAD });
    t.resetTransforms();
    expect(t.transforms.value.shapeQuad).toBeNull();
  });
});
