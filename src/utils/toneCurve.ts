/**
 * Bearbeitung von Gradationskurven für den Kurven-Editor: Punkte setzen,
 * verschieben, entfernen und als Zeichenkette speichern. Die Berechnung der
 * Pixel liegt in curveKernel.ts (auch im Worker).
 */
import { CURVE_KEYS, buildCurveLUT, isIdentityPoints, parseCurve } from './curveKernel';

export type CurveChannel = keyof typeof CURVE_KEYS;
export type CurvePoint = [number, number];

export const CURVE_CHANNELS: readonly CurveChannel[] = ['rgb', 'r', 'g', 'b'];

/** Lineare Kurve (Startzustand im Editor). */
export const LINEAR_POINTS: readonly CurvePoint[] = Object.freeze([
  [0, 0],
  [255, 255],
]) as readonly CurvePoint[];

/** Mindestabstand zweier Punkte auf der x-Achse. */
export const MIN_GAP = 4;

/** Kurven-Presets (wirken auf die gewählte Kurve). */
export const CURVE_PRESETS = Object.freeze({
  linear: '',
  contrast: '0,0 64,52 192,204 255,255',
  strongContrast: '0,0 64,40 192,216 255,255',
  lighten: '0,0 128,160 255,255',
  darken: '0,0 128,98 255,255',
  fade: '0,28 64,72 192,200 255,240',
  invert: '0,255 255,0',
});
export type CurvePresetId = keyof typeof CURVE_PRESETS;

export { CURVE_KEYS };

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Punkte einer gespeicherten Kurve; leer oder ungültig ergibt die lineare Kurve. */
export function curvePoints(str: string | undefined | null): CurvePoint[] {
  const points = parseCurve(str) as CurvePoint[] | null;
  return points ? points.map(([x, y]) => [x, y] as CurvePoint) : LINEAR_POINTS.map((p) => [...p]);
}

/** Zeichenkette zum Speichern; die lineare Kurve wird zu '' (Standardwert). */
export function serializeCurve(points: readonly CurvePoint[]): string {
  if (isIdentityPoints(points)) return '';
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

/** Ausgabewerte 0..255 für alle Eingaben (zum Zeichnen der Kurve). */
export function curveValues(points: readonly CurvePoint[]): Uint8Array {
  return buildCurveLUT(points as CurvePoint[]);
}

/** Erlaubter x-Bereich eines Punkts: zwischen den Nachbarn mit MIN_GAP Abstand. */
function xRange(points: readonly CurvePoint[], index: number): [number, number] {
  const lo = index > 0 ? points[index - 1][0] + MIN_GAP : 0;
  const hi = index < points.length - 1 ? points[index + 1][0] - MIN_GAP : 255;
  return [lo, hi];
}

/**
 * Verschiebt einen Punkt; x bleibt zwischen den Nachbarn, damit die Reihenfolge
 * erhalten bleibt.
 */
export function movePoint(
  points: readonly CurvePoint[],
  index: number,
  x: number,
  y: number
): CurvePoint[] {
  if (index < 0 || index >= points.length) return points.map((p) => [...p] as CurvePoint);
  const [lo, hi] = xRange(points, index);
  const next = points.map((p) => [...p] as CurvePoint);
  next[index] = [Math.max(lo, Math.min(hi, clampByte(x))), clampByte(y)];
  return next;
}

/**
 * Fügt einen Punkt ein. Liegt schon ein Punkt näher als MIN_GAP, wird keiner
 * eingefügt.
 * @returns neue Punkte und Index des eingefügten Punkts (−1 = keiner)
 */
export function addPoint(
  points: readonly CurvePoint[],
  x: number,
  y: number
): { points: CurvePoint[]; index: number } {
  const px = clampByte(x);
  const copy = points.map((p) => [...p] as CurvePoint);
  if (points.some(([qx]) => Math.abs(qx - px) < MIN_GAP)) return { points: copy, index: -1 };
  // Außerhalb von erstem/letztem Punkt nichts einfügen: dort gelten Schwarz-/Weißpunkt
  if (px < points[0][0] || px > points[points.length - 1][0]) return { points: copy, index: -1 };
  const index = copy.findIndex(([qx]) => qx > px);
  copy.splice(index, 0, [px, clampByte(y)]);
  return { points: copy, index };
}

/** Entfernt einen inneren Punkt; der erste und letzte bleiben immer. */
export function removePoint(points: readonly CurvePoint[], index: number): CurvePoint[] {
  const copy = points.map((p) => [...p] as CurvePoint);
  if (index <= 0 || index >= points.length - 1) return copy;
  copy.splice(index, 1);
  return copy;
}

/** Index des Punkts in Reichweite (Kurvenkoordinaten) oder −1. */
export function hitPoint(
  points: readonly CurvePoint[],
  x: number,
  y: number,
  radius: number
): number {
  let best = -1;
  let bestDist = radius * radius;
  points.forEach(([px, py], i) => {
    const d = (px - x) ** 2 + (py - y) ** 2;
    if (d <= bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}
