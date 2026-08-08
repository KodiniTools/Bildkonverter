/**
 * textRender.js
 *
 * Gemeinsame Helfer für das Zeichnen von Text-Ebenen auf dem Canvas.
 * Kapselt den Aufbau des Font-Strings (inkl. Fett/Kursiv) sowie die
 * Transformation (Rotation + horizontale/vertikale Neigung), damit alle
 * Render-Pfade identisch arbeiten.
 */

// Erkennt, ob eine Schriftart bereits fett ist (z. B. "Author Bold",
// "GeneralSans Semibold", "Supreme Extrabold", "… Black/Heavy").
export function isFontBold(fontFamily = '') {
  return /bold|black|heavy/i.test(fontFamily);
}

// Erkennt, ob eine Schriftart bereits kursiv/schräg ist
// (z. B. "Author Italic", "GeneralSans BoldItalic").
export function isFontItalic(fontFamily = '') {
  return /italic|oblique/i.test(fontFamily);
}

/**
 * Baut den Canvas-Font-String für ein Text-Objekt.
 * Fett/Kursiv wird nur ergänzt, wenn die Schriftart die Eigenschaft nicht
 * bereits selbst mitbringt (verhindert doppeltes „Faux-Bold/Italic").
 */
export function buildTextFontString(text = {}) {
  const fontSize = text.fontSize || text.size || 32;
  const family = text.fontFamily || 'Arial';
  const bold = text.bold && !isFontBold(family);
  const italic = text.italic && !isFontItalic(family);
  const style = italic ? 'italic ' : '';
  const weight = bold ? 'bold ' : '';
  return `${style}${weight}${fontSize}px ${family}`;
}

/**
 * Wendet Rotation und Neigung (Skew) eines Text-Objekts auf den Canvas-
 * Kontext an – jeweils um den Textmittelpunkt. Setzt voraus, dass ctx.font
 * bereits gesetzt ist (für measureText). Ohne Rotation/Neigung passiert nichts.
 */
export function applyTextTransform(ctx, text = {}) {
  const fontSize = text.fontSize || text.size || 32;
  const rotation = text.rotation || 0;
  const skewX = text.skewX || 0;
  const skewY = text.skewY || 0;

  if (rotation === 0 && skewX === 0 && skewY === 0) return;

  const metrics = ctx.measureText(text.content || text.txt || '');
  const centerX = (text.x || 0) + metrics.width / 2;
  const centerY = (text.y || 0) + fontSize / 2;

  ctx.translate(centerX, centerY);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  if (skewX !== 0 || skewY !== 0) {
    // Scher-Matrix: horizontale Neigung über den c-Parameter,
    // vertikale Neigung über den b-Parameter.
    ctx.transform(1, Math.tan((skewY * Math.PI) / 180), Math.tan((skewX * Math.PI) / 180), 1, 0, 0);
  }
  ctx.translate(-centerX, -centerY);
}
