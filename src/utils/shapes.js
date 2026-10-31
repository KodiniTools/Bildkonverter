/**
 * Formen & Symbole
 *
 * Reine Logik der Formen-Ebenen im Editor: Galerie-Katalog, Erzeugen neuer
 * Formen, Pfad-Geometrie, Zeichnen, Hit-Testing, Griffe und das Anpassen an
 * Zuschnitt/neue Canvas-Größe.
 *
 * Jede Form wird in einem lokalen Koordinatensystem beschrieben, dessen
 * Ursprung der Mittelpunkt der Form ist (Breite × Höhe = Begrenzungsrahmen).
 * Die Pfade sind SVG-Pfaddaten: dieselbe Geometrie zeichnet der Canvas
 * (Path2D) und die Vorschaubilder der Galerie (<path d>).
 *
 * Form-Objekt (reaktiver Eintrag in imageStore.shapes):
 * {
 *   id, type,            // Pfad-Typ aus SHAPE_PATHS
 *   x, y,                // Mittelpunkt in Canvas-Pixeln
 *   width, height,       // Begrenzungsrahmen in Canvas-Pixeln
 *   rotation,            // Grad, im Uhrzeigersinn
 *   opacity,             // 0–100
 *   flipX, flipY,        // Spiegelung
 *   filled, fillColor,   // Füllung (nur Flächenformen)
 *   strokeColor, strokeWidth, dash,  // Kontur bzw. Linie ('solid'|'dashed'|'dotted')
 *   shadowBlur, shadowColor,
 *   number, textColor, markerStyle,   // nur Marker ('circle'|'square')
 *   effect, region, intensity,        // nur Verpixeln/Weichzeichnen
 * }
 */

/**
 * Zeichenart: Flächenformen werden gefüllt (+ optionale Kontur), Linienformen
 * nur gestrichen, Marker zeigen zusätzlich eine Nummer, Effekte (Verpixeln,
 * Weichzeichnen) verändern den Bildinhalt unter sich.
 */
export const SHAPE_KIND = Object.freeze({
  FILL: 'fill',
  STROKE: 'stroke',
  MARKER: 'marker',
  EFFECT: 'effect',
});

export const SHAPE_CATEGORIES = Object.freeze(['basic', 'arrows', 'lines', 'symbols', 'annotate']);

/** Effekte der Zensur-Form und ihre Umrissformen */
export const CENSOR_EFFECTS = Object.freeze(['pixelate', 'blur']);
export const CENSOR_REGIONS = Object.freeze(['rect', 'ellipse']);
export const MARKER_STYLES = Object.freeze(['circle', 'square']);
export const MARKER_MAX = 999;

export const DASH_STYLES = Object.freeze(['solid', 'dashed', 'dotted']);

export const SHAPE_LIMITS = Object.freeze({
  minSize: 4,
  maxStroke: 100,
  maxShadow: 50,
});

const DEFAULT_COLOR = '#e53935';

// ===== GEOMETRIE-HELFER =====

const r2 = (n) => Math.round(n * 100) / 100;

/** Punktliste → geschlossener SVG-Pfad */
function polygonPath(points) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${r2(x)} ${r2(y)}`).join(' ') + ' Z';
}

/** Skaliert normierte Punkte so, dass ihr Begrenzungsrahmen exakt w × h füllt. */
function fitPoints(points, w, h) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = w / (maxX - minX || 1);
  const sy = h / (maxY - minY || 1);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return points.map(([x, y]) => [(x - cx) * sx, (y - cy) * sy]);
}

/** Regelmäßiges n-Eck (Spitze oben), auf den Rahmen gestreckt */
function regularPolygon(n, w, h) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  return polygonPath(fitPoints(pts, w, h));
}

/** Stern mit `spikes` Zacken und Innenradius-Verhältnis `inner` */
function starPath(spikes, inner, w, h) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    const r = i % 2 === 0 ? 1 : inner;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return polygonPath(fitPoints(pts, w, h));
}

/** Ellipse als zwei Bögen (Mittelpunkt cx/cy) */
function ellipsePath(cx, cy, rx, ry) {
  return (
    `M ${r2(cx - rx)} ${r2(cy)} ` +
    `A ${r2(rx)} ${r2(ry)} 0 1 0 ${r2(cx + rx)} ${r2(cy)} ` +
    `A ${r2(rx)} ${r2(ry)} 0 1 0 ${r2(cx - rx)} ${r2(cy)} Z`
  );
}

/** Abgerundetes Rechteck (Mittelpunkt im Ursprung) */
function roundedRectPath(w, h, radius) {
  const a = w / 2;
  const b = h / 2;
  const r = Math.max(0, Math.min(radius, a, b));
  if (r === 0)
    return polygonPath([
      [-a, -b],
      [a, -b],
      [a, b],
      [-a, b],
    ]);
  return [
    `M ${r2(-a + r)} ${r2(-b)}`,
    `H ${r2(a - r)}`,
    `A ${r2(r)} ${r2(r)} 0 0 1 ${r2(a)} ${r2(-b + r)}`,
    `V ${r2(b - r)}`,
    `A ${r2(r)} ${r2(r)} 0 0 1 ${r2(a - r)} ${r2(b)}`,
    `H ${r2(-a + r)}`,
    `A ${r2(r)} ${r2(r)} 0 0 1 ${r2(-a)} ${r2(b - r)}`,
    `V ${r2(-b + r)}`,
    `A ${r2(r)} ${r2(r)} 0 0 1 ${r2(-a + r)} ${r2(-b)}`,
    'Z',
  ].join(' ');
}

/** Offene Pfeilspitze an `tip`, die entgegen `dir` (Einheitsvektor) zeigt */
function arrowHead(tip, dir, length, spread) {
  const back = { x: tip.x - dir.x * length, y: tip.y - dir.y * length };
  const nx = -dir.y * spread;
  const ny = dir.x * spread;
  return (
    `M ${r2(back.x + nx)} ${r2(back.y + ny)} ` +
    `L ${r2(tip.x)} ${r2(tip.y)} ` +
    `L ${r2(back.x - nx)} ${r2(back.y - ny)}`
  );
}

// ===== PFADE =====

/**
 * Pfad-Generatoren je Form-Typ: (w, h) → SVG-Pfaddaten im lokalen System.
 * `kind` legt fest, ob gefüllt oder nur gestrichen wird; `fillRule` für Formen
 * mit Loch.
 */
export const SHAPE_PATHS = Object.freeze({
  rect: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => roundedRectPath(w, h, 0),
  },
  roundedRect: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => roundedRectPath(w, h, Math.min(w, h) * 0.2),
  },
  ellipse: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => ellipsePath(0, 0, w / 2, h / 2),
  },
  triangle: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) =>
      polygonPath([
        [0, -h / 2],
        [w / 2, h / 2],
        [-w / 2, h / 2],
      ]),
  },
  rightTriangle: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) =>
      polygonPath([
        [-w / 2, -h / 2],
        [w / 2, h / 2],
        [-w / 2, h / 2],
      ]),
  },
  diamond: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) =>
      polygonPath([
        [0, -h / 2],
        [w / 2, 0],
        [0, h / 2],
        [-w / 2, 0],
      ]),
  },
  pentagon: { kind: SHAPE_KIND.FILL, path: (w, h) => regularPolygon(5, w, h) },
  hexagon: { kind: SHAPE_KIND.FILL, path: (w, h) => regularPolygon(6, w, h) },
  ring: {
    kind: SHAPE_KIND.FILL,
    fillRule: 'evenodd',
    path: (w, h) => `${ellipsePath(0, 0, w / 2, h / 2)} ${ellipsePath(0, 0, w * 0.3, h * 0.3)}`,
  },

  line: {
    kind: SHAPE_KIND.STROKE,
    path: (w) => `M ${r2(-w / 2)} 0 L ${r2(w / 2)} 0`,
  },
  arrow: {
    kind: SHAPE_KIND.STROKE,
    path: (w, h) => {
      const head = Math.min(h * 0.9, w * 0.45);
      return `M ${r2(-w / 2)} 0 L ${r2(w / 2)} 0 ${arrowHead({ x: w / 2, y: 0 }, { x: 1, y: 0 }, head, h / 2)}`;
    },
  },
  doubleArrow: {
    kind: SHAPE_KIND.STROKE,
    path: (w, h) => {
      const head = Math.min(h * 0.9, w * 0.3);
      return (
        `M ${r2(-w / 2)} 0 L ${r2(w / 2)} 0 ` +
        `${arrowHead({ x: w / 2, y: 0 }, { x: 1, y: 0 }, head, h / 2)} ` +
        arrowHead({ x: -w / 2, y: 0 }, { x: -1, y: 0 }, head, h / 2)
      );
    },
  },
  curvedArrow: {
    kind: SHAPE_KIND.STROKE,
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      const start = { x: -a, y: b };
      const ctrl = { x: -a * 0.1, y: -b * 1.1 };
      const end = { x: a, y: -b * 0.15 };
      const tx = end.x - ctrl.x;
      const ty = end.y - ctrl.y;
      const len = Math.hypot(tx, ty) || 1;
      const head = Math.min(w, h) * 0.35;
      return (
        `M ${r2(start.x)} ${r2(start.y)} Q ${r2(ctrl.x)} ${r2(ctrl.y)} ${r2(end.x)} ${r2(end.y)} ` +
        arrowHead(end, { x: tx / len, y: ty / len }, head, head * 0.7)
      );
    },
  },
  blockArrow: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      const s = b * 0.45;
      const head = Math.min(w * 0.45, h * 0.9);
      return polygonPath([
        [-a, -s],
        [a - head, -s],
        [a - head, -b],
        [a, 0],
        [a - head, b],
        [a - head, s],
        [-a, s],
      ]);
    },
  },
  doubleBlockArrow: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      const s = b * 0.45;
      const head = Math.min(w * 0.3, h * 0.9);
      return polygonPath([
        [-a, 0],
        [-a + head, -b],
        [-a + head, -s],
        [a - head, -s],
        [a - head, -b],
        [a, 0],
        [a - head, b],
        [a - head, s],
        [-a + head, s],
        [-a + head, b],
      ]);
    },
  },
  chevron: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      const t = Math.min(w * 0.5, h * 0.5);
      return polygonPath([
        [-a, -b],
        [a - t, -b],
        [a, 0],
        [a - t, b],
        [-a, b],
        [-a + t, 0],
      ]);
    },
  },

  star: { kind: SHAPE_KIND.FILL, path: (w, h) => starPath(5, 0.45, w, h) },
  heart: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      const p = (x, y) => `${r2(x * a)} ${r2(y * b)}`;
      return (
        `M ${p(0, -0.45)} ` +
        `C ${p(0, -0.95)} ${p(-1, -1.05)} ${p(-1, -0.35)} ` +
        `C ${p(-1, 0.15)} ${p(-0.45, 0.55)} ${p(0, 1)} ` +
        `C ${p(0.45, 0.55)} ${p(1, 0.15)} ${p(1, -0.35)} ` +
        `C ${p(1, -1.05)} ${p(0, -0.95)} ${p(0, -0.45)} Z`
      );
    },
  },
  check: {
    kind: SHAPE_KIND.STROKE,
    path: (w, h) =>
      `M ${r2(-w * 0.45)} ${r2(h * 0.02)} L ${r2(-w * 0.12)} ${r2(h * 0.4)} L ${r2(w * 0.45)} ${r2(-h * 0.4)}`,
  },
  cross: {
    kind: SHAPE_KIND.STROKE,
    path: (w, h) => {
      const a = w * 0.42;
      const b = h * 0.42;
      return `M ${r2(-a)} ${r2(-b)} L ${r2(a)} ${r2(b)} M ${r2(a)} ${r2(-b)} L ${r2(-a)} ${r2(b)}`;
    },
  },
  plus: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      const tx = w * 0.17;
      const ty = h * 0.17;
      return polygonPath([
        [-tx, -b],
        [tx, -b],
        [tx, -ty],
        [a, -ty],
        [a, ty],
        [tx, ty],
        [tx, b],
        [-tx, b],
        [-tx, ty],
        [-a, ty],
        [-a, -ty],
        [-tx, -ty],
      ]);
    },
  },
  lightning: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) =>
      polygonPath(
        fitPoints(
          [
            [0.2, -1],
            [-0.65, 0.15],
            [-0.05, 0.15],
            [-0.25, 1],
            [0.65, -0.2],
            [0.05, -0.2],
          ],
          w,
          h
        )
      ),
  },
  speechBubble: {
    kind: SHAPE_KIND.FILL,
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      const bodyBottom = b * 0.5;
      const r = Math.min(w, h) * 0.15;
      return [
        `M ${r2(-a + r)} ${r2(-b)}`,
        `H ${r2(a - r)}`,
        `Q ${r2(a)} ${r2(-b)} ${r2(a)} ${r2(-b + r)}`,
        `V ${r2(bodyBottom - r)}`,
        `Q ${r2(a)} ${r2(bodyBottom)} ${r2(a - r)} ${r2(bodyBottom)}`,
        `H ${r2(-a * 0.15)}`,
        `L ${r2(-a * 0.55)} ${r2(b)}`,
        `L ${r2(-a * 0.5)} ${r2(bodyBottom)}`,
        `H ${r2(-a + r)}`,
        `Q ${r2(-a)} ${r2(bodyBottom)} ${r2(-a)} ${r2(bodyBottom - r)}`,
        `V ${r2(-b + r)}`,
        `Q ${r2(-a)} ${r2(-b)} ${r2(-a + r)} ${r2(-b)}`,
        'Z',
      ].join(' ');
    },
  },
  pin: {
    kind: SHAPE_KIND.FILL,
    fillRule: 'evenodd',
    path: (w, h) => {
      const a = w / 2;
      const b = h / 2;
      // Kopf: Ellipse oben, Spitze unten in der Mitte
      const rx = a;
      const ry = Math.min(b * 0.62, b);
      const cy = -b + ry;
      const sx = rx * 0.87;
      const sy = cy + ry * 0.5;
      return (
        `M 0 ${r2(b)} L ${r2(-sx)} ${r2(sy)} ` +
        `A ${r2(rx)} ${r2(ry)} 0 1 1 ${r2(sx)} ${r2(sy)} Z ` +
        ellipsePath(0, cy, rx * 0.38, ry * 0.38)
      );
    },
  },

  // Nummerierter Marker: Kreis oder abgerundetes Quadrat (Nummer zeichnet drawShape)
  marker: {
    kind: SHAPE_KIND.MARKER,
    path: (w, h, shape) =>
      shape?.markerStyle === 'square'
        ? roundedRectPath(w, h, Math.min(w, h) * 0.22)
        : ellipsePath(0, 0, w / 2, h / 2),
  },
  // Verpixeln / Weichzeichnen: Pfad ist nur der Umriss des Bereichs
  censor: {
    kind: SHAPE_KIND.EFFECT,
    path: (w, h, shape) =>
      shape?.region === 'ellipse' ? ellipsePath(0, 0, w / 2, h / 2) : roundedRectPath(w, h, 0),
  },
});

// ===== GALERIE =====

/**
 * Einträge der Galerie. `type` wählt den Pfad, `preset` überschreibt
 * Standardwerte (z. B. gestrichelte Linie, Rahmen ohne Füllung), `aspect` ist
 * das Start-Seitenverhältnis (Breite / Höhe).
 */
export const SHAPE_GALLERY = Object.freeze([
  { id: 'rect', type: 'rect', category: 'basic', aspect: 1.4 },
  { id: 'roundedRect', type: 'roundedRect', category: 'basic', aspect: 1.4 },
  { id: 'ellipse', type: 'ellipse', category: 'basic', aspect: 1 },
  { id: 'triangle', type: 'triangle', category: 'basic', aspect: 1.1 },
  { id: 'rightTriangle', type: 'rightTriangle', category: 'basic', aspect: 1 },
  { id: 'diamond', type: 'diamond', category: 'basic', aspect: 1 },
  { id: 'pentagon', type: 'pentagon', category: 'basic', aspect: 1 },
  { id: 'hexagon', type: 'hexagon', category: 'basic', aspect: 1.1 },
  { id: 'ring', type: 'ring', category: 'basic', aspect: 1 },
  {
    id: 'frame',
    type: 'rect',
    category: 'basic',
    aspect: 1.4,
    preset: { filled: false, strokeRatio: 0.04 },
  },
  {
    id: 'circleOutline',
    type: 'ellipse',
    category: 'basic',
    aspect: 1,
    preset: { filled: false, strokeRatio: 0.04 },
  },

  { id: 'arrow', type: 'arrow', category: 'arrows', aspect: 4 },
  { id: 'doubleArrow', type: 'doubleArrow', category: 'arrows', aspect: 4 },
  { id: 'curvedArrow', type: 'curvedArrow', category: 'arrows', aspect: 1.6 },
  { id: 'blockArrow', type: 'blockArrow', category: 'arrows', aspect: 1.8 },
  { id: 'doubleBlockArrow', type: 'doubleBlockArrow', category: 'arrows', aspect: 2.2 },
  { id: 'chevron', type: 'chevron', category: 'arrows', aspect: 1.2 },

  { id: 'line', type: 'line', category: 'lines', aspect: 6 },
  { id: 'dashedLine', type: 'line', category: 'lines', aspect: 6, preset: { dash: 'dashed' } },
  { id: 'dottedLine', type: 'line', category: 'lines', aspect: 6, preset: { dash: 'dotted' } },
  {
    id: 'dashedArrow',
    type: 'arrow',
    category: 'lines',
    aspect: 4,
    preset: { dash: 'dashed' },
  },
  {
    id: 'dashedFrame',
    type: 'rect',
    category: 'lines',
    aspect: 1.4,
    preset: { filled: false, dash: 'dashed', strokeRatio: 0.03 },
  },

  { id: 'star', type: 'star', category: 'symbols', aspect: 1, preset: { fillColor: '#f5b301' } },
  { id: 'heart', type: 'heart', category: 'symbols', aspect: 1.1 },
  { id: 'check', type: 'check', category: 'symbols', aspect: 1.2, preset: { color: '#16a34a' } },
  { id: 'cross', type: 'cross', category: 'symbols', aspect: 1 },
  { id: 'plus', type: 'plus', category: 'symbols', aspect: 1 },
  {
    id: 'lightning',
    type: 'lightning',
    category: 'symbols',
    aspect: 0.7,
    preset: { fillColor: '#f5b301' },
  },
  {
    id: 'speechBubble',
    type: 'speechBubble',
    category: 'symbols',
    aspect: 1.3,
    preset: { fillColor: '#ffffff', strokeColor: '#1f2937', strokeRatio: 0.025 },
  },
  { id: 'pin', type: 'pin', category: 'symbols', aspect: 0.75 },

  { id: 'marker', type: 'marker', category: 'annotate', aspect: 1 },
  {
    id: 'markerSquare',
    type: 'marker',
    category: 'annotate',
    aspect: 1,
    preset: { markerStyle: 'square' },
  },
  { id: 'pixelate', type: 'censor', category: 'annotate', aspect: 1.3 },
  {
    id: 'pixelateEllipse',
    type: 'censor',
    category: 'annotate',
    aspect: 0.8,
    preset: { region: 'ellipse' },
  },
  { id: 'blur', type: 'censor', category: 'annotate', aspect: 1.3, preset: { effect: 'blur' } },
  {
    id: 'blurEllipse',
    type: 'censor',
    category: 'annotate',
    aspect: 0.8,
    preset: { effect: 'blur', region: 'ellipse' },
  },
]);

export function getShapeKind(type) {
  return SHAPE_PATHS[type]?.kind ?? SHAPE_KIND.FILL;
}

/** true, wenn die Höhe der Form keine sichtbare Wirkung hat (gerade Linie) */
export function isHeightless(type) {
  return type === 'line';
}

/**
 * SVG-Pfaddaten der Form im lokalen System (leer bei unbekanntem Typ).
 * `options` liefert formabhängige Varianten (markerStyle, region).
 */
export function getShapePathData(type, width, height, options = null) {
  const def = SHAPE_PATHS[type];
  if (!def) return '';
  return def.path(Math.max(width, 0.01), Math.max(height, 0.01), options);
}

/** Nächste freie Marker-Nummer (höchste vorhandene + 1) */
export function nextMarkerNumber(shapes) {
  if (!Array.isArray(shapes)) return 1;
  const max = shapes.reduce(
    (m, s) => (s?.type === 'marker' ? Math.max(m, Number(s.number) || 0) : m),
    0
  );
  return Math.min(MARKER_MAX, max + 1);
}

/** Pixelgröße der Verpixelung bzw. Radius der Unschärfe in Canvas-px */
export function getCensorStrength(shape) {
  const minSide = Math.max(1, Math.min(shape.width, shape.height));
  const intensity = Math.max(1, Math.min(100, Number(shape.intensity) || 50));
  return shape.effect === 'blur'
    ? Math.max(1, (minSide * intensity) / 400)
    : Math.max(2, Math.round((minSide * intensity) / 250));
}

/**
 * Vorschau einer Galerie-Form für eine Kachel: Pfad zentriert in einer
 * `size` × `size`-viewBox.
 */
export function getGalleryPreview(item, size = 40, padding = 6) {
  const box = size - padding * 2;
  const aspect = item.aspect || 1;
  const width = aspect >= 1 ? box : box * aspect;
  const height = isHeightless(item.type) ? box / 4 : aspect >= 1 ? box / aspect : box;
  const kind = getShapeKind(item.type);
  const preview = {
    d: getShapePathData(item.type, width, height, item.preset),
    viewBox: `${-size / 2} ${-size / 2} ${size} ${size}`,
    kind,
    fillRule: SHAPE_PATHS[item.type]?.fillRule ?? 'nonzero',
    filled: item.preset?.filled ?? true,
    dash: item.preset?.dash ?? 'solid',
    label: kind === SHAPE_KIND.MARKER ? '1' : null,
    effect: kind === SHAPE_KIND.EFFECT ? (item.preset?.effect ?? 'pixelate') : null,
    pattern: '',
  };
  if (preview.effect === 'pixelate') {
    // Schachbrett im inneren Bereich als Symbol für Verpixeln
    const cells = 4;
    const inner = Math.min(width, height) * (item.preset?.region === 'ellipse' ? 0.62 : 0.8);
    const cell = inner / cells;
    const squares = [];
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if ((r + c) % 2) continue;
        const x = -inner / 2 + c * cell;
        const y = -inner / 2 + r * cell;
        squares.push(
          polygonPath([
            [x, y],
            [x + cell, y],
            [x + cell, y + cell],
            [x, y + cell],
          ])
        );
      }
    }
    preview.pattern = squares.join(' ');
  }
  return preview;
}

let idCounter = 0;
function nextShapeId() {
  idCounter = (idCounter + 1) % 1e6;
  return `shape-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Erzeugt eine neue Form aus einem Galerie-Eintrag, mittig im Canvas und in
 * einer zur Canvas-Größe passenden Startgröße.
 *
 * @param {string} galleryId  id aus SHAPE_GALLERY (oder direkt ein Pfad-Typ)
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {object|null} null bei unbekanntem Eintrag
 */
export function createShape(galleryId, canvasWidth, canvasHeight) {
  const item =
    SHAPE_GALLERY.find((g) => g.id === galleryId) ??
    (SHAPE_PATHS[galleryId] ? { id: galleryId, type: galleryId, aspect: 1 } : null);
  if (!item) return null;

  const W = Math.max(1, Number(canvasWidth) || 800);
  const H = Math.max(1, Number(canvasHeight) || 600);
  const base = Math.max(24, Math.round(Math.min(W, H) * 0.22));
  const aspect = item.aspect || 1;
  const kind = getShapeKind(item.type);
  const preset = item.preset || {};

  let width = aspect >= 1 ? base * Math.min(aspect, 1.8) : base * aspect;
  let height = aspect >= 1 ? width / aspect : base;
  if (isHeightless(item.type)) height = Math.max(8, Math.round(base * 0.12));
  width = Math.round(width);
  height = Math.round(height);

  if (kind === SHAPE_KIND.MARKER) {
    const size = Math.max(24, Math.round(Math.min(W, H) * 0.09));
    width = size;
    height = size;
  }

  const lineStroke = Math.max(2, Math.round(base * 0.05));
  const strokeRatio = preset.strokeRatio;
  const strokeWidth =
    kind === SHAPE_KIND.STROKE
      ? lineStroke
      : strokeRatio
        ? Math.max(1, Math.round(base * strokeRatio))
        : 0;
  const color = preset.color ?? DEFAULT_COLOR;

  return {
    id: nextShapeId(),
    type: item.type,
    galleryId: item.id,
    x: Math.round(W / 2),
    y: Math.round(H / 2),
    width,
    height,
    rotation: 0,
    opacity: 100,
    flipX: false,
    flipY: false,
    filled: preset.filled ?? true,
    fillColor: preset.fillColor ?? color,
    strokeColor: preset.strokeColor ?? color,
    strokeWidth,
    dash: preset.dash ?? 'solid',
    shadowBlur: 0,
    shadowColor: '#000000',
    ...(kind === SHAPE_KIND.MARKER
      ? {
          number: 1,
          textColor: preset.textColor ?? '#ffffff',
          markerStyle: preset.markerStyle ?? 'circle',
          strokeColor: '#ffffff',
          strokeWidth: Math.max(2, Math.round(width * 0.07)),
        }
      : {}),
    ...(kind === SHAPE_KIND.EFFECT
      ? {
          effect: preset.effect ?? 'pixelate',
          region: preset.region ?? 'rect',
          intensity: 50,
          strokeWidth: 0,
        }
      : {}),
  };
}

/** Linienmuster in Canvas-Pixeln (abhängig von der Linienstärke) */
export function getDashPattern(dash, strokeWidth) {
  const sw = Math.max(1, Number(strokeWidth) || 1);
  if (dash === 'dashed') return [sw * 3, sw * 2];
  if (dash === 'dotted') return [0.001, sw * 2];
  return [];
}

/**
 * Zeichnet eine Form auf den Kontext (Deckkraft, Rotation, Spiegelung,
 * Schatten, Füllung, Kontur). Der Kontextzustand wird wiederhergestellt.
 */
export function drawShape(ctx, shape) {
  const def = SHAPE_PATHS[shape?.type];
  if (!def) return;
  const width = Math.max(shape.width, 0.01);
  const height = Math.max(shape.height, 0.01);
  const path = new Path2D(def.path(width, height, shape));
  const kind = def.kind;
  if (kind === SHAPE_KIND.EFFECT) {
    drawCensor(ctx, shape, path);
    return;
  }
  const isMarker = kind === SHAPE_KIND.MARKER;
  const strokeWidth = Math.max(0, Number(shape.strokeWidth) || 0);
  const hasFill = (kind === SHAPE_KIND.FILL || isMarker) && shape.filled !== false;
  const hasStroke = strokeWidth > 0;
  if (!hasFill && !hasStroke && !isMarker) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(100, shape.opacity ?? 100)) / 100;
  ctx.translate(shape.x, shape.y);
  if (shape.rotation) ctx.rotate((shape.rotation * Math.PI) / 180);
  // Marker nicht spiegeln (die Nummer bliebe sonst spiegelverkehrt)
  if (!isMarker && (shape.flipX || shape.flipY)) {
    ctx.scale(shape.flipX ? -1 : 1, shape.flipY ? -1 : 1);
  }

  if (shape.shadowBlur > 0) {
    ctx.shadowColor = shape.shadowColor || '#000000';
    ctx.shadowBlur = shape.shadowBlur;
    const offset = Math.max(2, shape.shadowBlur / 3);
    ctx.shadowOffsetX = offset;
    ctx.shadowOffsetY = offset;
  }

  if (hasFill) {
    ctx.fillStyle = shape.fillColor || DEFAULT_COLOR;
    ctx.fill(path, def.fillRule || 'nonzero');
    // Schatten nur einmal (sonst doppelt unter der Kontur)
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  if (hasStroke) {
    ctx.strokeStyle = shape.strokeColor || DEFAULT_COLOR;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(getDashPattern(isMarker ? 'solid' : shape.dash, strokeWidth));
    ctx.stroke(path);
  }

  if (isMarker) drawMarkerNumber(ctx, shape, width, height);

  ctx.restore();
}

/** Nummer mittig in den (bereits transformierten) Marker schreiben */
function drawMarkerNumber(ctx, shape, width, height) {
  const label = String(Math.max(0, Math.round(Number(shape.number) || 0)));
  const factor = label.length >= 3 ? 0.4 : label.length === 2 ? 0.5 : 0.6;
  const fontSize = Math.max(6, Math.min(width, height) * factor);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
  ctx.fillStyle = shape.textColor || '#ffffff';
  ctx.font = `${fontSize}px "Satoshi Bold", "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Ziffern sitzen optisch etwas hoch → leicht nach unten versetzen
  ctx.fillText(label, 0, fontSize * 0.05);
}

/** true, wenn der Kontext CSS-Filter unterstützt (Safari: nein) */
function supportsCanvasFilter(ctx) {
  return typeof ctx.filter === 'string';
}

/**
 * Verpixeln/Weichzeichnen: kopiert den bereits gezeichneten Canvas-Inhalt unter
 * dem Bereich, verarbeitet ihn und zeichnet ihn – auf den (gedrehten) Umriss
 * beschnitten – zurück. Wirkt daher auf Bild und darunterliegende Ebenen.
 * Erwartet, dass der Kontext im Canvas-Pixelsystem steht (Overlay-Pass).
 */
function drawCensor(ctx, shape, path) {
  const source = ctx.canvas;
  if (!source || !source.width || !source.height || typeof document === 'undefined') return;

  const strength = getCensorStrength(shape);
  const isBlur = shape.effect === 'blur';
  const pad = isBlur ? Math.ceil(strength * 2) : 0;

  // Achsenparalleler Rahmen des gedrehten Bereichs, auf den Canvas begrenzt
  const corners = [
    toCanvas(shape, -shape.width / 2, -shape.height / 2),
    toCanvas(shape, shape.width / 2, -shape.height / 2),
    toCanvas(shape, shape.width / 2, shape.height / 2),
    toCanvas(shape, -shape.width / 2, shape.height / 2),
  ];
  const x0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.x)) - pad));
  const y0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.y)) - pad));
  const x1 = Math.min(source.width, Math.ceil(Math.max(...corners.map((p) => p.x)) + pad));
  const y1 = Math.min(source.height, Math.ceil(Math.max(...corners.map((p) => p.y)) + pad));
  const sw = x1 - x0;
  const sh = y1 - y0;
  if (sw <= 0 || sh <= 0) return;

  const out = document.createElement('canvas');
  out.width = sw;
  out.height = sh;
  const octx = out.getContext('2d');

  if (isBlur && supportsCanvasFilter(octx)) {
    octx.filter = `blur(${strength}px)`;
    octx.drawImage(source, x0, y0, sw, sh, 0, 0, sw, sh);
  } else {
    // Verpixeln – und Ersatz-Unschärfe ohne ctx.filter: verkleinern, wieder vergrößern
    const step = isBlur ? Math.max(2, strength / 2) : strength;
    const smallW = Math.max(1, Math.ceil(sw / step));
    const smallH = Math.max(1, Math.ceil(sh / step));
    const small = document.createElement('canvas');
    small.width = smallW;
    small.height = smallH;
    const sctx = small.getContext('2d');
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(source, x0, y0, sw, sh, 0, 0, smallW, smallH);
    octx.imageSmoothingEnabled = isBlur;
    octx.drawImage(small, 0, 0, smallW, smallH, 0, 0, smallW * step, smallH * step);
  }

  ctx.save();
  const base = ctx.getTransform();
  ctx.globalAlpha = Math.max(0, Math.min(100, shape.opacity ?? 100)) / 100;
  ctx.translate(shape.x, shape.y);
  if (shape.rotation) ctx.rotate((shape.rotation * Math.PI) / 180);
  ctx.clip(path);
  ctx.setTransform(base);
  ctx.drawImage(out, x0, y0);
  ctx.restore();
}

// ===== HIT-TESTING & GRIFFE =====

/** Rechnet einen Canvas-Punkt in das (unrotierte) lokale System der Form um. */
export function toLocal(shape, x, y) {
  const dx = x - shape.x;
  const dy = y - shape.y;
  const rad = (-(shape.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

/** Rechnet einen lokalen Punkt der Form zurück in Canvas-Koordinaten. */
export function toCanvas(shape, lx, ly) {
  const rad = ((shape.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: shape.x + lx * cos - ly * sin, y: shape.y + lx * sin + ly * cos };
}

/**
 * true, wenn (x, y) im (gedrehten) Begrenzungsrahmen der Form liegt.
 * `padding` erweitert den Rahmen (dünne Linien bleiben greifbar).
 */
export function hitTestShape(shape, x, y, padding = 0) {
  const p = toLocal(shape, x, y);
  const pad = padding + (Number(shape.strokeWidth) || 0) / 2;
  return Math.abs(p.x) <= shape.width / 2 + pad && Math.abs(p.y) <= shape.height / 2 + pad;
}

/** Oberste Form an der Position (spätere Formen liegen oben) */
export function findShapeAt(shapes, x, y, padding = 0) {
  if (!Array.isArray(shapes)) return null;
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (hitTestShape(shapes[i], x, y, padding)) return shapes[i];
  }
  return null;
}

export const SHAPE_CORNERS = Object.freeze(['nw', 'ne', 'se', 'sw']);
const CORNER_SIGNS = { nw: [-1, -1], ne: [1, -1], se: [1, 1], sw: [-1, 1] };

/**
 * Lage der Griffe in Canvas-Koordinaten.
 * @param {object} shape
 * @param {number} pad        Abstand des Auswahlrahmens zur Form (Canvas-px)
 * @param {number} rotateGap  Abstand des Drehgriffs über dem Rahmen (Canvas-px)
 */
export function getShapeHandles(shape, pad = 0, rotateGap = 24) {
  const a = shape.width / 2 + pad;
  const b = shape.height / 2 + pad;
  const corners = {};
  for (const c of SHAPE_CORNERS) {
    const [sx, sy] = CORNER_SIGNS[c];
    corners[c] = toCanvas(shape, sx * a, sy * b);
  }
  return {
    corners,
    topCenter: toCanvas(shape, 0, -b),
    rotate: toCanvas(shape, 0, -b - rotateGap),
    halfWidth: a,
    halfHeight: b,
  };
}

/**
 * Griff unter der Position: { mode: 'rotate' } | { mode: 'resize', corner } | null
 * @param {number} radius  Trefferradius in Canvas-px
 */
export function findShapeHandleAt(shape, x, y, { pad = 0, rotateGap = 24, radius = 8 } = {}) {
  const h = getShapeHandles(shape, pad, rotateGap);
  if (Math.hypot(x - h.rotate.x, y - h.rotate.y) <= radius) return { mode: 'rotate' };
  for (const c of SHAPE_CORNERS) {
    const p = h.corners[c];
    if (Math.hypot(x - p.x, y - p.y) <= radius) return { mode: 'resize', corner: c };
  }
  return null;
}

/**
 * Neue Größe/Lage beim Ziehen einer Ecke; die gegenüberliegende Ecke bleibt fest.
 * @param {object} start   Form beim Start des Ziehens (x, y, width, height, rotation)
 * @param {string} corner  'nw' | 'ne' | 'se' | 'sw'
 * @param {{x:number,y:number}} pointer Canvas-Position
 * @param {boolean} keepRatio Seitenverhältnis beibehalten
 * @returns {{x:number,y:number,width:number,height:number}}
 */
export function resizeFromCorner(start, corner, pointer, keepRatio = false) {
  const [sx, sy] = CORNER_SIGNS[corner] ?? CORNER_SIGNS.se;
  const min = SHAPE_LIMITS.minSize;
  const anchor = { x: -sx * (start.width / 2), y: -sy * (start.height / 2) };
  const local = toLocal(start, pointer.x, pointer.y);

  let width = Math.max(min, (local.x - anchor.x) * sx);
  let height = Math.max(min, (local.y - anchor.y) * sy);
  if (keepRatio && start.width > 0 && start.height > 0) {
    const ratio = start.width / start.height;
    if (width / height > ratio) height = width / ratio;
    else width = height * ratio;
  }

  const center = toCanvas(start, anchor.x + (sx * width) / 2, anchor.y + (sy * height) / 2);
  return { x: center.x, y: center.y, width, height };
}

/** Drehwinkel (Grad, -180…180), wenn der Drehgriff zur Position gezogen wird */
export function rotationFromPointer(shape, pointer, snap = 0) {
  const deg = (Math.atan2(pointer.y - shape.y, pointer.x - shape.x) * 180) / Math.PI + 90;
  let angle = ((((deg + 180) % 360) + 360) % 360) - 180;
  if (snap > 0) angle = Math.round(angle / snap) * snap;
  if (angle <= -180) angle += 360;
  return Math.round(angle * 10) / 10;
}

// ===== LAYOUT-ANPASSUNGEN =====

/**
 * Skaliert Formen proportional auf eine neue Canvas-Größe (Bild ersetzen).
 * Mutiert die Form-Objekte. @returns {boolean} true, wenn skaliert wurde
 */
export function scaleShapesToCanvas(shapes, from, to) {
  if (!Array.isArray(shapes) || shapes.length === 0) return false;
  if (!from?.width || !from?.height || !to?.width || !to?.height) return false;
  const sx = to.width / from.width;
  const sy = to.height / from.height;
  if (sx === 1 && sy === 1) return false;
  const s = Math.min(sx, sy);
  for (const shape of shapes) {
    shape.x = Math.round(shape.x * sx);
    shape.y = Math.round(shape.y * sy);
    shape.width = Math.max(SHAPE_LIMITS.minSize, Math.round(shape.width * s));
    shape.height = Math.max(SHAPE_LIMITS.minSize, Math.round(shape.height * s));
    if (shape.strokeWidth) shape.strokeWidth = Math.round(shape.strokeWidth * s * 10) / 10;
    if (shape.shadowBlur) shape.shadowBlur = Math.round(shape.shadowBlur * s * 10) / 10;
  }
  return true;
}

/**
 * Passt Formen an einen Zuschnitt an: verschiebt sie um den Ausschnitt-Ursprung
 * und entfernt Formen, deren Mittelpunkt außerhalb liegt (wie bei Texten).
 * Mutiert das Array. @returns {number} Anzahl entfernter Formen
 */
export function cropShapes(shapes, { x, y, width, height }) {
  if (!Array.isArray(shapes)) return 0;
  let removed = 0;
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.x < x || s.x > x + width || s.y < y || s.y > y + height) {
      shapes.splice(i, 1);
      removed++;
    } else {
      s.x -= x;
      s.y -= y;
    }
  }
  return removed;
}
