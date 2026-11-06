import { describe, it, expect } from 'vitest';
import {
  buildCurveLUT,
  curveLUTs,
  hasCurveAdjustments,
  isActiveCurve,
  parseCurve,
} from '@/utils/curveKernel';
import {
  CURVE_PRESETS,
  addPoint,
  curvePoints,
  hitPoint,
  movePoint,
  removePoint,
  serializeCurve,
  type CurvePoint,
} from '@/utils/toneCurve';
import { applyTonalAdjustments } from '@/utils/tonalKernel';
import { hasTonalAdjustments } from '@/utils/imageAdjustments';
import { DEFAULT_FILTERS } from '@/composables/useFilterManagement';

function render(rgb: [number, number, number], f: object) {
  const data = new Uint8ClampedArray([...rgb, 200]);
  applyTonalAdjustments(data, { ...DEFAULT_FILTERS, ...f });
  return Array.from(data);
}

describe('parseCurve', () => {
  it('liest, sortiert und begrenzt Punkte; leer oder ungültig ergibt null', () => {
    expect(parseCurve('255,255 0,0 128,300')).toEqual([
      [0, 0],
      [128, 255],
      [255, 255],
    ]);
    expect(parseCurve('')).toBeNull();
    expect(parseCurve(undefined)).toBeNull();
    expect(parseCurve('10,10')).toBeNull();
    expect(parseCurve('a,b 0,0 255,255')).toEqual([
      [0, 0],
      [255, 255],
    ]);
  });

  it('erkennt lineare Kurven als inaktiv', () => {
    expect(isActiveCurve('')).toBe(false);
    expect(isActiveCurve('0,0 128,128 255,255')).toBe(false);
    expect(isActiveCurve('0,0 128,140 255,255')).toBe(true);
    expect(isActiveCurve('0,20 255,255')).toBe(true);
    expect(hasCurveAdjustments(DEFAULT_FILTERS)).toBe(false);
    expect(hasCurveAdjustments({ curveB: CURVE_PRESETS.lighten })).toBe(true);
  });
});

describe('buildCurveLUT', () => {
  it('trifft die Punkte, ist monoton ohne Überschwinger und hält Schwarz-/Weißpunkt', () => {
    const lut = buildCurveLUT(parseCurve('32,10 64,52 192,204 224,250')!);
    expect(lut[64]).toBe(52);
    expect(lut[192]).toBe(204);
    expect(lut[0]).toBe(10); // links vom ersten Punkt
    expect(lut[255]).toBe(250); // rechts vom letzten Punkt
    for (let i = 1; i < 256; i++) expect(lut[i]).toBeGreaterThanOrEqual(lut[i - 1]);
  });

  it('kehrt mit der Umkehr-Kurve um', () => {
    const lut = buildCurveLUT(parseCurve(CURVE_PRESETS.invert)!);
    expect(lut[0]).toBe(255);
    expect(lut[255]).toBe(0);
    expect(lut[100]).toBe(155);
  });
});

describe('Kurven im Tonwert-Kernel', () => {
  it('Standardwerte ändern nichts, Kurven zählen als Tonwert-Anpassung', () => {
    expect(render([10, 120, 240], {})).toEqual([10, 120, 240, 200]);
    expect(hasTonalAdjustments(DEFAULT_FILTERS)).toBe(false);
    expect(hasTonalAdjustments({ ...DEFAULT_FILTERS, curveRgb: CURVE_PRESETS.darken })).toBe(true);
  });

  it('Gesamtkurve wirkt auf alle Kanäle, Kanalkurve nur auf ihren Kanal; Alpha bleibt', () => {
    const master = render([128, 128, 128], { curveRgb: CURVE_PRESETS.lighten });
    expect(master[0]).toBe(160);
    expect(master[1]).toBe(160);
    expect(master[2]).toBe(160);
    expect(master[3]).toBe(200);

    const red = render([128, 128, 128], { curveR: CURVE_PRESETS.lighten });
    expect(red).toEqual([160, 128, 128, 200]);
  });

  it('erst Gesamtkurve, dann Kanalkurve', () => {
    const luts = curveLUTs({ curveRgb: '0,0 128,160 255,255', curveG: '0,0 160,100 255,255' })!;
    expect(luts.g[128]).toBe(100);
    expect(luts.r[128]).toBe(160);
  });
});

describe('Kurven bearbeiten', () => {
  const linear = (): CurvePoint[] => curvePoints('');

  it('fügt Punkte sortiert ein, nicht zu nah an bestehenden', () => {
    const { points, index } = addPoint(linear(), 100, 140);
    expect(index).toBe(1);
    expect(points).toEqual([
      [0, 0],
      [100, 140],
      [255, 255],
    ]);
    expect(addPoint(points, 102, 10).index).toBe(-1);
  });

  it('verschiebt Punkte nur zwischen die Nachbarn und hält 0..255 ein', () => {
    const pts = addPoint(linear(), 100, 140).points;
    expect(movePoint(pts, 1, 300, -20)[1]).toEqual([251, 0]);
    expect(movePoint(pts, 0, 200, 30)[0]).toEqual([96, 30]);
  });

  it('entfernt nur innere Punkte', () => {
    const pts = addPoint(linear(), 100, 140).points;
    expect(removePoint(pts, 1)).toHaveLength(2);
    expect(removePoint(pts, 0)).toHaveLength(3);
    expect(removePoint(pts, 2)).toHaveLength(3);
  });

  it('speichert lineare Kurven als leere Zeichenkette', () => {
    expect(serializeCurve(linear())).toBe('');
    expect(serializeCurve(addPoint(linear(), 64, 64).points)).toBe('');
    expect(serializeCurve(addPoint(linear(), 64, 40).points)).toBe('0,0 64,40 255,255');
    expect(curvePoints(CURVE_PRESETS.contrast)).toHaveLength(4);
  });

  it('findet den nächsten Punkt im Fangradius', () => {
    const pts = addPoint(linear(), 100, 140).points;
    expect(hitPoint(pts, 104, 136, 10)).toBe(1);
    expect(hitPoint(pts, 50, 200, 10)).toBe(-1);
  });
});
