/**
 * curveKernel.js
 *
 * Gradationskurven (Tonwerte/Kurven): eine Gesamtkurve und je eine Kurve für
 * Rot, Grün und Blau. Ohne Imports und DOM-Zugriff, damit die Berechnung
 * identisch im Hauptthread und im Web Worker läuft (über tonalKernel.js).
 *
 * Eine Kurve ist als Zeichenkette gespeichert: "x,y x,y …" mit Ganzzahlen
 * 0..255, nach x sortiert. Leer ('') bedeutet linear (keine Änderung). Als
 * einfacher Wert bleibt sie in Verlauf, Presets und Vergleichen unkompliziert.
 *
 * Zwischen den Punkten wird monoton kubisch interpoliert (Fritsch–Carlson):
 * keine Überschwinger, Ausgabe bleibt im Bereich der Punkte. Links vom ersten
 * und rechts vom letzten Punkt gilt dessen Ausgabewert (Schwarz-/Weißpunkt).
 */

/** Filter-Schlüssel der Kurven je Kanal. */
export const CURVE_KEYS = Object.freeze({
  rgb: 'curveRgb',
  r: 'curveR',
  g: 'curveG',
  b: 'curveB',
});

function clampByte(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Liest eine Kurve. Ungültige Einträge werden verworfen; doppelte x-Werte
 * behalten den letzten Punkt.
 * @param {string|undefined|null} str
 * @returns {Array<[number, number]>|null} sortierte Punkte (mind. 2) oder null
 */
export function parseCurve(str) {
  if (typeof str !== 'string' || str.trim() === '') return null;
  const byX = new Map();
  for (const part of str.trim().split(/\s+/)) {
    const [xs, ys] = part.split(',');
    const x = Number(xs);
    const y = Number(ys);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    byX.set(clampByte(Math.round(x)), clampByte(Math.round(y)));
  }
  if (byX.size < 2) return null;
  return [...byX.entries()].sort((a, b) => a[0] - b[0]);
}

/** true, wenn die Punkte die Identität beschreiben (alle auf der Diagonalen, volle Breite). */
export function isIdentityPoints(points) {
  if (!points) return true;
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== 0 || first[1] !== 0 || last[0] !== 255 || last[1] !== 255) return false;
  return points.every(([x, y]) => x === y);
}

/** true, wenn die Kurve das Bild verändert. */
export function isActiveCurve(str) {
  return !isIdentityPoints(parseCurve(str));
}

/** Prüft, ob mindestens eine Kurve aktiv ist. */
export function hasCurveAdjustments(f) {
  return (
    isActiveCurve(f.curveRgb) ||
    isActiveCurve(f.curveR) ||
    isActiveCurve(f.curveG) ||
    isActiveCurve(f.curveB)
  );
}

/**
 * Wertet die Kurve für alle 256 Eingabewerte aus.
 * @param {Array<[number, number]>} points sortiert, mind. 2
 * @returns {Uint8Array} Länge 256
 */
export function buildCurveLUT(points) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);

  // Sekantensteigungen und Tangenten (Fritsch–Carlson, monoton)
  const d = new Array(n - 1);
  for (let k = 0; k < n - 1; k++) d[k] = (ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]);
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) {
    m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
  }
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) {
      m[k] = 0;
      m[k + 1] = 0;
      continue;
    }
    const a = m[k] / d[k];
    const b = m[k + 1] / d[k];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[k] = t * a * d[k];
      m[k + 1] = t * b * d[k];
    }
  }

  const lut = new Uint8Array(256);
  let k = 0;
  for (let x = 0; x < 256; x++) {
    let y;
    if (x <= xs[0]) y = ys[0];
    else if (x >= xs[n - 1]) y = ys[n - 1];
    else {
      while (x > xs[k + 1]) k++;
      const h = xs[k + 1] - xs[k];
      const t = (x - xs[k]) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      y =
        (2 * t3 - 3 * t2 + 1) * ys[k] +
        (t3 - 2 * t2 + t) * h * m[k] +
        (-2 * t3 + 3 * t2) * ys[k + 1] +
        (t3 - t2) * h * m[k + 1];
    }
    lut[x] = clampByte(Math.round(y));
  }
  return lut;
}

/** LUT einer Kurven-Zeichenkette oder null, wenn sie nichts ändert. */
function lutOf(str) {
  const points = parseCurve(str);
  return isIdentityPoints(points) ? null : buildCurveLUT(points);
}

/**
 * Kombinierte Tabellen je Kanal: erst die Gesamtkurve, dann die Kanalkurve.
 * @param {Object} f Filter-Objekt
 * @returns {{ r: Uint8Array, g: Uint8Array, b: Uint8Array }|null} null ohne aktive Kurve
 */
export function curveLUTs(f) {
  const master = lutOf(f.curveRgb);
  const channels = [lutOf(f.curveR), lutOf(f.curveG), lutOf(f.curveB)];
  if (!master && channels.every((c) => !c)) return null;
  const [r, g, b] = channels.map((channel) => {
    const out = new Uint8Array(256);
    for (let v = 0; v < 256; v++) {
      const afterMaster = master ? master[v] : v;
      out[v] = channel ? channel[afterMaster] : afterMaster;
    }
    return out;
  });
  return { r, g, b };
}
