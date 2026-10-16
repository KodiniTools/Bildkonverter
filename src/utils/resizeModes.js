/**
 * Resize-Modi für „Größe ändern“ im Editor.
 *
 * - exact:    feste Breite/Höhe (bisheriges Verhalten, rechnet der ResizeManager)
 * - percent:  Skalierung in Prozent
 * - longEdge: die längere Seite bekommt eine feste Länge
 * - fit:      in einen Rahmen einpassen, Seitenverhältnis bleibt
 *
 * longEdge und fit können Vergrößern verhindern („nicht vergrößern“).
 */

export const RESIZE_MODES = Object.freeze(['exact', 'percent', 'longEdge', 'fit']);

/** Maximale Kantenlänge, identisch zu MAX_RESIZE_DIMENSION in useEditorResize */
export const RESIZE_PX_MAX = 10000;
export const RESIZE_PERCENT_MIN = 1;
export const RESIZE_PERCENT_MAX = 1000;

/**
 * @typedef {'exact'|'percent'|'longEdge'|'fit'} ResizeMode
 * @typedef {{
 *   mode: ResizeMode,
 *   percent: number,
 *   longEdge: number,
 *   fitWidth: number,
 *   fitHeight: number,
 *   noUpscale: boolean,
 * }} ResizeSpec
 */

/** @type {ResizeSpec} */
export const defaultResizeSpec = Object.freeze({
  mode: 'exact',
  percent: 50,
  longEdge: 1920,
  fitWidth: 1920,
  fitHeight: 1080,
  noUpscale: true,
});

function isPositive(value) {
  return Number.isFinite(value) && value >= 1;
}

/**
 * Sind die Eingaben des gewählten Modus gültig?
 * @param {ResizeSpec} spec
 */
export function isResizeSpecValid(spec) {
  switch (spec.mode) {
    case 'percent':
      return (
        Number.isFinite(spec.percent) &&
        spec.percent >= RESIZE_PERCENT_MIN &&
        spec.percent <= RESIZE_PERCENT_MAX
      );
    case 'longEdge':
      return isPositive(spec.longEdge) && spec.longEdge <= RESIZE_PX_MAX;
    case 'fit':
      return (
        isPositive(spec.fitWidth) &&
        isPositive(spec.fitHeight) &&
        spec.fitWidth <= RESIZE_PX_MAX &&
        spec.fitHeight <= RESIZE_PX_MAX
      );
    case 'exact':
    default:
      return true;
  }
}

function clampPx(value) {
  return Math.min(RESIZE_PX_MAX, Math.max(1, Math.round(value)));
}

/**
 * Zielgröße eines Bildes der Größe `src` in den relativen Modi.
 * Liefert die unveränderte Größe für „exact“, ungültige Eingaben und wenn
 * „nicht vergrößern“ greift.
 *
 * @param {{width:number,height:number}} src
 * @param {ResizeSpec} spec
 * @returns {{width:number,height:number}}
 */
export function computeResizeTarget(src, spec) {
  const unchanged = { width: src.width, height: src.height };
  if (!(src.width > 0 && src.height > 0) || !isResizeSpecValid(spec)) return unchanged;

  let factor;
  switch (spec.mode) {
    case 'percent':
      factor = spec.percent / 100;
      break;
    case 'longEdge':
      factor = spec.longEdge / Math.max(src.width, src.height);
      break;
    case 'fit':
      factor = Math.min(spec.fitWidth / src.width, spec.fitHeight / src.height);
      break;
    case 'exact':
    default:
      return unchanged;
  }

  if (spec.mode !== 'percent' && spec.noUpscale && factor >= 1) return unchanged;
  return { width: clampPx(src.width * factor), height: clampPx(src.height * factor) };
}
