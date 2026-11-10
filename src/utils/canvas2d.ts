/**
 * 2D-Kontext eines Canvas. `getContext('2d')` liefert nur ohne Speicher oder bei
 * bereits anders belegtem Canvas null; der Code brach dann bisher an der ersten
 * Zeichenoperation mit TypeError ab. Jetzt an derselben Stelle mit klarer Meldung.
 */
export function context2d(
  canvas: HTMLCanvasElement,
  settings?: CanvasRenderingContext2DSettings
): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', settings);
  if (!ctx) throw new Error('Canvas-2D-Kontext nicht verfügbar');
  return ctx;
}
