/**
 * Freies Verzerren (Distort / Eckpunkt-Pinning) für Canvas 2D.
 * Portiert aus dem Collage-Maker (src/lib/warpImage.ts).
 *
 * Canvas 2D kennt keine echte Perspektive. Ein Bild wird daher in ein beliebiges
 * Viereck gewarpt, indem die Quell-Rechteckfläche in ein N×N-Gitter aus Dreiecken
 * zerlegt wird; jedes Quell-Dreieck wird per Affin-Transformation auf das passende
 * Ziel-Dreieck abgebildet (bilineare Interpolation der 4 Zielecken).
 *
 * Unterschied zum Collage-Maker: Die Eck-Versätze sind hier NORMIERT (Anteil der
 * Bildbreite/-höhe), weil sich das Zeichen-Rechteck des Einzelbildes durch
 * Schatten-, Neigungs- und Rotations-Padding sowie Größenänderungen verschiebt.
 *
 * @typedef {{ x: number, y: number }} Point
 * @typedef {'nw' | 'ne' | 'se' | 'sw'} Corner
 * @typedef {{ nw: Point, ne: Point, se: Point, sw: Point }} CornerOffsets
 * @typedef {{ nw: Point, ne: Point, se: Point, sw: Point }} QuadCorners
 * @typedef {{ x: number, y: number, width: number, height: number }} Rect
 */

/** Reihenfolge der Ecken (im Uhrzeigersinn ab oben links). */
export const CORNERS = ['nw', 'ne', 'se', 'sw'];

/** Grenzen für normierte Versätze (verhindert degenerierte Extremwerte). */
export const MIN_OFFSET = -1;
export const MAX_OFFSET = 1;

/** Unverzerrte Eck-Versätze (alle 0). */
export function emptyOffsets() {
  return {
    nw: { x: 0, y: 0 },
    ne: { x: 0, y: 0 },
    se: { x: 0, y: 0 },
    sw: { x: 0, y: 0 },
  };
}

/** True, wenn mindestens eine Ecke einen Versatz ≠ 0 hat. */
export function hasDistortion(offsets) {
  if (!offsets) return false;
  return CORNERS.some((c) => (offsets[c]?.x ?? 0) !== 0 || (offsets[c]?.y ?? 0) !== 0);
}

/** Unverzerrte Eckposition des Rechtecks. */
export function baseCorner(rect, corner) {
  switch (corner) {
    case 'nw':
      return { x: rect.x, y: rect.y };
    case 'ne':
      return { x: rect.x + rect.width, y: rect.y };
    case 'se':
      return { x: rect.x + rect.width, y: rect.y + rect.height };
    case 'sw':
      return { x: rect.x, y: rect.y + rect.height };
    default:
      throw new Error(`Unbekannte Ecke: ${corner}`);
  }
}

/**
 * Zielecken des Vierecks aus Zeichen-Rechteck und normierten Versätzen.
 * Ohne Versätze ergibt sich das unverzerrte Rechteck.
 * @param {Rect} rect
 * @param {CornerOffsets | null | undefined} offsets
 * @returns {QuadCorners}
 */
export function computeQuadCorners(rect, offsets) {
  const out = {};
  for (const c of CORNERS) {
    const b = baseCorner(rect, c);
    out[c] = {
      x: b.x + (offsets?.[c]?.x ?? 0) * rect.width,
      y: b.y + (offsets?.[c]?.y ?? 0) * rect.height,
    };
  }
  return out;
}

/**
 * Normierter Versatz einer Ecke, wenn sie auf den lokalen Punkt `local`
 * (Koordinatensystem des Zeichen-Rechtecks) gezogen wird. Geklemmt auf
 * [MIN_OFFSET, MAX_OFFSET].
 * @param {Rect} rect
 * @param {Corner} corner
 * @param {Point} local
 * @returns {Point}
 */
export function offsetForLocalPoint(rect, corner, local) {
  const b = baseCorner(rect, corner);
  const clamp = (v) => Math.max(MIN_OFFSET, Math.min(MAX_OFFSET, v));
  return {
    x: rect.width > 0 ? clamp((local.x - b.x) / rect.width) : 0,
    y: rect.height > 0 ? clamp((local.y - b.y) / rect.height) : 0,
  };
}

/**
 * Welche Ecke liegt innerhalb von `radius` um `pos`? (nächstgelegene gewinnt)
 * @param {Point} pos
 * @param {QuadCorners} points
 * @param {number} radius
 * @returns {Corner | null}
 */
export function findCornerAt(pos, points, radius) {
  let best = null;
  let bestDist = Infinity;
  for (const c of CORNERS) {
    const p = points[c];
    const d = Math.hypot(pos.x - p.x, pos.y - p.y);
    if (d <= radius && d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Affin-Matrix [a, b, c, d, e, f] (Canvas-Reihenfolge), die das Quell-Dreieck
 * s0/s1/s2 exakt auf das Ziel-Dreieck d0/d1/d2 abbildet:
 *   dx = a*sx + c*sy + e
 *   dy = b*sx + d*sy + f
 *
 * Die Determinante hängt nur von den Quellpunkten ab (im Gitter immer ein
 * gültiges Dreieck) → nie eine Division durch 0, egal wie stark die Zielecken
 * verzerrt sind.
 */
export function computeTriangleAffine(s0, s1, s2, d0, d1, d2) {
  const m00 = s0.x,
    m01 = s0.y;
  const m10 = s1.x,
    m11 = s1.y;
  const m20 = s2.x,
    m21 = s2.y;

  const det = m00 * (m11 - m21) - m01 * (m10 - m20) + (m10 * m21 - m20 * m11);

  // Kofaktoren der Inverse (dritte Spalte der Quellmatrix ist [1,1,1])
  const inv00 = (m11 - m21) / det;
  const inv01 = (m21 - m01) / det;
  const inv02 = (m01 - m11) / det;
  const inv10 = (m20 - m10) / det;
  const inv11 = (m00 - m20) / det;
  const inv12 = (m10 - m00) / det;
  const inv20 = (m10 * m21 - m20 * m11) / det;
  const inv21 = (m20 * m01 - m00 * m21) / det;
  const inv22 = (m00 * m11 - m10 * m01) / det;

  const a = inv00 * d0.x + inv01 * d1.x + inv02 * d2.x;
  const c = inv10 * d0.x + inv11 * d1.x + inv12 * d2.x;
  const e = inv20 * d0.x + inv21 * d1.x + inv22 * d2.x;

  const b = inv00 * d0.y + inv01 * d1.y + inv02 * d2.y;
  const d = inv10 * d0.y + inv11 * d1.y + inv12 * d2.y;
  const f = inv20 * d0.y + inv21 * d1.y + inv22 * d2.y;

  return [a, b, c, d, e, f];
}

/** Bilineare Interpolation der 4 Zielecken bei (u,v) ∈ [0,1]². */
export function bilerp(corners, u, v) {
  const topX = corners.nw.x + (corners.ne.x - corners.nw.x) * u;
  const topY = corners.nw.y + (corners.ne.y - corners.nw.y) * u;
  const botX = corners.sw.x + (corners.se.x - corners.sw.x) * u;
  const botY = corners.sw.y + (corners.se.y - corners.sw.y) * u;
  return { x: topX + (botX - topX) * v, y: topY + (botY - topY) * v };
}

/** Dreieck geringfügig vom Schwerpunkt weg aufblähen (kaschiert Nähte). */
function expandTriangle(d0, d1, d2, px) {
  const cx = (d0.x + d1.x + d2.x) / 3;
  const cy = (d0.y + d1.y + d2.y) / 3;
  const push = (p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / len) * px, y: p.y + (dy / len) * px };
  };
  return [push(d0), push(d1), push(d2)];
}

function drawTexturedTriangle(ctx, source, sw, sh, s0, s1, s2, d0, d1, d2, expandPx) {
  const [e0, e1, e2] = expandTriangle(d0, d1, d2, expandPx);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(e0.x, e0.y);
  ctx.lineTo(e1.x, e1.y);
  ctx.lineTo(e2.x, e2.y);
  ctx.closePath();
  ctx.clip();
  const [a, b, c, d, e, f] = computeTriangleAffine(s0, s1, s2, d0, d1, d2);
  ctx.transform(a, b, c, d, e, f);
  // Quelle im Vor-Transform-Raum auf sw×sh legen; die Affine bildet dann exakt
  // auf das Ziel-Dreieck im aktuellen (lokalen) Koordinatensystem ab.
  ctx.drawImage(source, 0, 0, sw, sh);
  ctx.restore();
}

// Aufblähung der Dreiecke in Geräte-Pixeln (siehe drawWarpedImage)
export const SEAM_EXPAND_DEVICE_PX = 1.5;

/** Mittlere lineare Skalierung der aktuellen ctx-Matrix (≥ 1e-6). */
function currentDeviceScale(ctx) {
  const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  if (!m) return 1;
  const s = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
  return Number.isFinite(s) && s > 1e-6 ? s : 1;
}

/**
 * Zeichnet `source` verzerrt in das durch `corners` (Koordinaten des aktuellen
 * ctx) definierte Viereck. Der ctx darf bereits transformiert sein
 * (translate/rotate/scale/skew) – die Ecken werden in genau diesem System
 * interpretiert.
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} source
 * @param {number} sw Breite der Quelle
 * @param {number} sh Höhe der Quelle
 * @param {QuadCorners} corners
 * @param {number} [subdivisions=10]
 * @param {number} [seamPx=SEAM_EXPAND_DEVICE_PX] Aufblähung der Dreiecke in Geräte-Pixeln
 */
export function drawWarpedImage(
  ctx,
  source,
  sw,
  sh,
  corners,
  subdivisions = 10,
  seamPx = SEAM_EXPAND_DEVICE_PX
) {
  const n = Math.max(1, Math.floor(subdivisions));
  // Nähte kaschieren: Dreiecke um ca. 1,5 GERÄTE-Pixel aufblähen. Ein fester
  // Wert in lokalen Einheiten wäre bei Zoom < 100 % zu klein (sichtbare,
  // halbtransparente Linien im transparenten Export).
  const expandPx = seamPx / currentDeviceScale(ctx);

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u0 = i / n;
      const u1 = (i + 1) / n;
      const v0 = j / n;
      const v1 = (j + 1) / n;

      const s00 = { x: u0 * sw, y: v0 * sh };
      const s10 = { x: u1 * sw, y: v0 * sh };
      const s11 = { x: u1 * sw, y: v1 * sh };
      const s01 = { x: u0 * sw, y: v1 * sh };

      const d00 = bilerp(corners, u0, v0);
      const d10 = bilerp(corners, u1, v0);
      const d11 = bilerp(corners, u1, v1);
      const d01 = bilerp(corners, u0, v1);

      drawTexturedTriangle(ctx, source, sw, sh, s00, s10, s11, d00, d10, d11, expandPx);
      drawTexturedTriangle(ctx, source, sw, sh, s00, s11, s01, d00, d11, d01, expandPx);
    }
  }
}

/** Umriss des unverzerrten Bildes in normierten Koordinaten (0..1). */
export const UNIT_QUAD = Object.freeze({
  nw: Object.freeze({ x: 0, y: 0 }),
  ne: Object.freeze({ x: 1, y: 0 }),
  se: Object.freeze({ x: 1, y: 1 }),
  sw: Object.freeze({ x: 0, y: 1 }),
});

/**
 * Layout für das Anwenden ("Backen") einer Verzerrung.
 *
 * @param {CornerOffsets} offsets   normierte Eck-Versätze
 * @param {QuadCorners|null} [shapeQuad] bisherige Umrissform (normiert, 0..1) aus
 *   einer früher angewendeten Verzerrung; null = volles Rechteck
 * @returns {{ minU: number, minV: number, spanU: number, spanV: number,
 *   corners: QuadCorners, shapeQuad: QuadCorners }}
 *   min/span: Bounding-Box des verzerrten Bildes relativ zum alten Bild (1 = alte
 *   Breite/Höhe); corners: Zielecken im alten Einheitsquadrat; shapeQuad: neue
 *   Umrissform normiert auf die Bounding-Box.
 */
export function computeBakeLayout(offsets, shapeQuad = null) {
  const corners = computeQuadCorners({ x: 0, y: 0, width: 1, height: 1 }, offsets);
  const xs = CORNERS.map((c) => corners[c].x);
  const ys = CORNERS.map((c) => corners[c].y);
  const minU = Math.min(...xs);
  const minV = Math.min(...ys);
  const spanU = Math.max(1e-6, Math.max(...xs) - minU);
  const spanV = Math.max(1e-6, Math.max(...ys) - minV);

  // Bisherige Form mitverzerren (mehrfaches Anwenden bleibt formtreu)
  const base = shapeQuad ?? UNIT_QUAD;
  const out = {};
  for (const c of CORNERS) {
    const p = bilerp(corners, base[c].x, base[c].y);
    out[c] = { x: (p.x - minU) / spanU, y: (p.y - minV) / spanV };
  }
  return { minU, minV, spanU, spanV, corners, shapeQuad: out };
}

// Obergrenzen für das gebackene Bild (Browser-Canvas-Limits)
export const BAKE_MAX_SIDE = 8192;
export const BAKE_MAX_AREA = 40_000_000;

/**
 * Zeichnet `image` verzerrt in ein neues, transparentes Canvas, das exakt die
 * Bounding-Box des verzerrten Bildes umfasst. Filter werden NICHT eingebacken
 * (sie bleiben live editierbar).
 *
 * @param {HTMLImageElement|HTMLCanvasElement} image
 * @param {CornerOffsets} offsets
 * @param {QuadCorners|null} [shapeQuad]
 * @returns {{ canvas: HTMLCanvasElement, spanU: number, spanV: number, shapeQuad: QuadCorners }}
 */
export function bakeDistortion(image, offsets, shapeQuad = null) {
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  if (!w || !h) throw new Error('Bild hat keine Abmessungen');

  const layout = computeBakeLayout(offsets, shapeQuad);
  const rawW = w * layout.spanU;
  const rawH = h * layout.spanV;
  const k = Math.min(
    1,
    BAKE_MAX_SIDE / Math.max(rawW, rawH),
    Math.sqrt(BAKE_MAX_AREA / (rawW * rawH))
  );

  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(rawW * k));
  out.height = Math.max(1, Math.round(rawH * k));
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(k, k);
  const corners = computeQuadCorners(
    { x: -layout.minU * w, y: -layout.minV * h, width: w, height: h },
    offsets
  );
  drawWarpedImage(ctx, image, w, h, corners, 24);

  return { canvas: out, spanU: layout.spanU, spanV: layout.spanV, shapeQuad: layout.shapeQuad };
}

/**
 * Pfad eines Polygons mit abgerundeten Ecken. Der Radius wird je Ecke auf die
 * halbe Länge der kürzeren angrenzenden Kante begrenzt.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Point[]} pts
 * @param {number} radius
 */
export function traceRoundedPolygon(ctx, pts, radius) {
  const n = pts.length;
  ctx.beginPath();
  if (n < 3) return;
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start.x, start.y);
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const maxR =
      Math.min(
        Math.hypot(cur.x - prev.x, cur.y - prev.y),
        Math.hypot(next.x - cur.x, next.y - cur.y)
      ) / 2;
    const r = Math.max(0, Math.min(radius, maxR));
    if (r > 0) ctx.arcTo(cur.x, cur.y, next.x, next.y, r);
    else ctx.lineTo(cur.x, cur.y);
  }
  ctx.closePath();
}
