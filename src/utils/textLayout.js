/**
 * Skaliert Text-Ebenen proportional auf eine neue Canvas-Größe, damit sie
 * beim Ersetzen des Bildes an derselben relativen Stelle und in derselben
 * relativen Größe bleiben. Positionen werden je Achse skaliert, Größen
 * (Schrift, Umrandung, Schatten) mit dem kleineren Faktor, damit der Text
 * bei geändertem Seitenverhältnis nicht über das Bild hinauswächst.
 *
 * Mutiert die übergebenen Text-Objekte (reaktive Store-Einträge).
 *
 * @param {Array<object>} texts
 * @param {{width:number,height:number}} from  bisherige Canvas-Größe
 * @param {{width:number,height:number}} to    neue Canvas-Größe
 * @returns {boolean} true, wenn skaliert wurde
 */
export function scaleTextsToCanvas(texts, from, to) {
  if (!Array.isArray(texts) || texts.length === 0) return false;
  if (!(from?.width > 0 && from?.height > 0 && to?.width > 0 && to?.height > 0)) return false;

  const sx = to.width / from.width;
  const sy = to.height / from.height;
  if (sx === 1 && sy === 1) return false;
  const s = Math.min(sx, sy);

  for (const text of texts) {
    text.x = Math.round((Number(text.x) || 0) * sx);
    text.y = Math.round((Number(text.y) || 0) * sy);

    const fontSize = text.fontSize || text.size;
    if (fontSize) {
      const scaled = Math.max(1, Math.round(fontSize * s));
      text.fontSize = scaled;
      if (text.size !== undefined) text.size = scaled;
    }
    if (text.strokeWidth) text.strokeWidth = Math.round(text.strokeWidth * s * 10) / 10;
    if (text.shadowBlur) text.shadowBlur = Math.round(text.shadowBlur * s * 10) / 10;
    if (text.shadowOffsetX) text.shadowOffsetX = Math.round(text.shadowOffsetX * s);
    if (text.shadowOffsetY) text.shadowOffsetY = Math.round(text.shadowOffsetY * s);
  }
  return true;
}
