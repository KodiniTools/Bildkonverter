/**
 * SVG-Pfaddaten affin abbilden (Skalieren + Verschieben).
 *
 * Liest alle Pfadbefehle (absolut und relativ, inkl. impliziter Wiederholung,
 * H/V, S/T und Bögen mit kompakten Flags) und gibt einen absoluten Pfad aus
 * M/L/C/Q/A/Z zurück. Bögen werden achsenparallel skaliert – korrekt für
 * Bögen ohne Drehung bzw. bei gleichmäßiger Skalierung.
 */

const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i;

/** Zerlegt Pfaddaten in Befehle: [{ cmd: 'm', args: [..] }, ...] */
export function parseSvgPath(d) {
  const out = [];
  const s = String(d ?? '');
  let i = 0;
  let current = null;
  const skip = () => {
    while (i < s.length && /[\s,]/.test(s[i])) i++;
  };
  const readNumber = () => {
    skip();
    const m = NUMBER.exec(s.slice(i));
    if (!m) throw new Error(`Ungültige Zahl an Position ${i}`);
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const readFlag = () => {
    skip();
    const c = s[i];
    if (c !== '0' && c !== '1') throw new Error(`Ungültiges Bogen-Flag an Position ${i}`);
    i++;
    return c === '1' ? 1 : 0;
  };

  skip();
  while (i < s.length) {
    const c = s[i];
    if (/[a-z]/i.test(c)) {
      current = c;
      i++;
      if (ARITY[c.toUpperCase()] === undefined) throw new Error(`Unbekannter Befehl ${c}`);
      if (c === 'z' || c === 'Z') {
        out.push({ cmd: c, args: [] });
        skip();
        continue;
      }
    } else if (!current || current === 'z' || current === 'Z') {
      throw new Error(`Zahl ohne Befehl an Position ${i}`);
    }
    const upper = current.toUpperCase();
    const args =
      upper === 'A'
        ? [
            readNumber(),
            readNumber(),
            readNumber(),
            readFlag(),
            readFlag(),
            readNumber(),
            readNumber(),
          ]
        : Array.from({ length: ARITY[upper] }, readNumber);
    out.push({ cmd: current, args });
    // Implizite Wiederholung nach M ist ein L
    if (current === 'M') current = 'L';
    else if (current === 'm') current = 'l';
    skip();
  }
  return out;
}

const fmt = (n) => String(Math.round(n * 100) / 100);

/**
 * @param {string} d   Pfaddaten
 * @param {number} sx  Skalierung x
 * @param {number} sy  Skalierung y
 * @param {number} [tx] Verschiebung x (nach dem Skalieren)
 * @param {number} [ty] Verschiebung y
 * @returns {string} absoluter, transformierter Pfad
 */
export function scaleSvgPath(d, sx, sy, tx = 0, ty = 0) {
  const X = (x) => fmt(x * sx + tx);
  const Y = (y) => fmt(y * sy + ty);
  const parts = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  // letzter Kontrollpunkt für S/T (Spiegelung)
  let lastCubic = null;
  let lastQuad = null;

  for (const { cmd, args } of parseSvgPath(d)) {
    const rel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();
    const ax = (v) => (rel ? cx + v : v);
    const ay = (v) => (rel ? cy + v : v);
    let nextCubic = null;
    let nextQuad = null;

    switch (upper) {
      case 'M':
        cx = ax(args[0]);
        cy = ay(args[1]);
        startX = cx;
        startY = cy;
        parts.push(`M ${X(cx)} ${Y(cy)}`);
        break;
      case 'L':
        cx = ax(args[0]);
        cy = ay(args[1]);
        parts.push(`L ${X(cx)} ${Y(cy)}`);
        break;
      case 'H':
        cx = rel ? cx + args[0] : args[0];
        parts.push(`L ${X(cx)} ${Y(cy)}`);
        break;
      case 'V':
        cy = rel ? cy + args[0] : args[0];
        parts.push(`L ${X(cx)} ${Y(cy)}`);
        break;
      case 'C': {
        const [x1, y1, x2, y2, x, y] = [
          ax(args[0]),
          ay(args[1]),
          ax(args[2]),
          ay(args[3]),
          ax(args[4]),
          ay(args[5]),
        ];
        parts.push(`C ${X(x1)} ${Y(y1)} ${X(x2)} ${Y(y2)} ${X(x)} ${Y(y)}`);
        nextCubic = [x2, y2];
        cx = x;
        cy = y;
        break;
      }
      case 'S': {
        const x1 = lastCubic ? 2 * cx - lastCubic[0] : cx;
        const y1 = lastCubic ? 2 * cy - lastCubic[1] : cy;
        const [x2, y2, x, y] = [ax(args[0]), ay(args[1]), ax(args[2]), ay(args[3])];
        parts.push(`C ${X(x1)} ${Y(y1)} ${X(x2)} ${Y(y2)} ${X(x)} ${Y(y)}`);
        nextCubic = [x2, y2];
        cx = x;
        cy = y;
        break;
      }
      case 'Q': {
        const [x1, y1, x, y] = [ax(args[0]), ay(args[1]), ax(args[2]), ay(args[3])];
        parts.push(`Q ${X(x1)} ${Y(y1)} ${X(x)} ${Y(y)}`);
        nextQuad = [x1, y1];
        cx = x;
        cy = y;
        break;
      }
      case 'T': {
        const x1 = lastQuad ? 2 * cx - lastQuad[0] : cx;
        const y1 = lastQuad ? 2 * cy - lastQuad[1] : cy;
        const x = ax(args[0]);
        const y = ay(args[1]);
        parts.push(`Q ${X(x1)} ${Y(y1)} ${X(x)} ${Y(y)}`);
        nextQuad = [x1, y1];
        cx = x;
        cy = y;
        break;
      }
      case 'A': {
        const [rx, ry, rot, large, sweep] = args;
        const x = ax(args[5]);
        const y = ay(args[6]);
        // Spiegelung (negatives Vorzeichen) kehrt die Drehrichtung um
        const flipSweep = sx * sy < 0 ? 1 - sweep : sweep;
        parts.push(
          `A ${fmt(Math.abs(rx * sx))} ${fmt(Math.abs(ry * sy))} ${fmt(rot)} ${large} ${flipSweep} ${X(x)} ${Y(y)}`
        );
        cx = x;
        cy = y;
        break;
      }
      case 'Z':
        cx = startX;
        cy = startY;
        parts.push('Z');
        break;
    }
    lastCubic = nextCubic;
    lastQuad = nextQuad;
  }
  return parts.join(' ');
}
