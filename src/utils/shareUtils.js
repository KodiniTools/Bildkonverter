/**
 * shareUtils - Teilen und Kopieren exportierter Bilder, vollständig im Browser.
 *
 * Reihenfolge beim Teilen:
 * 1. Systemdialog mit Datei (Web Share API Level 2: navigator.share({ files }))
 * 2. Zwischenablage (navigator.clipboard.write, praktisch nur PNG)
 * 3. Download als Rückfall
 *
 * Es wird nichts hochgeladen; die Datei geht direkt an das Betriebssystem.
 */

/** MIME-Typen der Export-Formate (Editor-Format-Schlüssel) */
const MIME_BY_FORMAT = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  heif: 'image/heif',
  heic: 'image/heic',
  pdf: 'application/pdf',
  svg: 'image/svg+xml',
};

/** @param {string} format @returns {string} */
export function mimeForFormat(format) {
  return MIME_BY_FORMAT[String(format || '').toLowerCase()] || 'application/octet-stream';
}

/**
 * Kann der Browser eine Datei dieses Typs über den Systemdialog teilen?
 * Synchron, damit die Entscheidung noch innerhalb der Nutzergeste fällt.
 *
 * @param {string} mimeType
 * @param {Navigator} [nav]
 */
export function canShareFileType(mimeType, nav = globalThis.navigator) {
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  if (typeof File !== 'function') return false;
  try {
    const ext = mimeType.split('/')[1]?.split('+')[0] || 'bin';
    const probe = new File([new Uint8Array(1)], `probe.${ext}`, { type: mimeType });
    return nav.canShare({ files: [probe] }) === true;
  } catch {
    return false;
  }
}

/**
 * Kann der Browser ein Bild in die Zwischenablage schreiben?
 *
 * @param {Navigator} [nav]
 */
export function canCopyImage(nav = globalThis.navigator) {
  return (
    !!nav &&
    typeof nav.clipboard?.write === 'function' &&
    typeof globalThis.ClipboardItem === 'function'
  );
}

/**
 * Wählt die beste verfügbare Art zu teilen.
 *
 * @param {string} mimeType
 * @param {Navigator} [nav]
 * @returns {'share' | 'clipboard' | 'download'}
 */
export function pickShareStrategy(mimeType, nav = globalThis.navigator) {
  if (canShareFileType(mimeType, nav)) return 'share';
  if (canCopyImage(nav)) return 'clipboard';
  return 'download';
}

/**
 * Öffnet den Systemdialog zum Teilen.
 *
 * @param {File} file
 * @param {{ title?: string }} [options]
 * @param {Navigator} [nav]
 * @returns {Promise<'shared' | 'cancelled'>}
 * @throws {DOMException} NotAllowedError, wenn die Nutzergeste abgelaufen ist
 *   (Aufrufer bieten dann einen zweiten Klick an), sonst andere Fehler.
 */
export async function shareFile(file, { title } = {}, nav = globalThis.navigator) {
  try {
    await nav.share({ files: [file], ...(title ? { title } : {}) });
    return 'shared';
  } catch (error) {
    if (error?.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

/**
 * Schreibt ein PNG in die Zwischenablage. Ein Promise als Inhalt ist erlaubt:
 * Safari verlangt, dass clipboard.write synchron in der Nutzergeste startet,
 * das Kodieren darf danach fertig werden.
 *
 * @param {Blob | Promise<Blob>} pngBlob
 * @param {Navigator} [nav]
 */
export async function copyImageToClipboard(pngBlob, nav = globalThis.navigator) {
  if (!canCopyImage(nav)) throw new Error('Clipboard API nicht verfügbar');
  const item = new globalThis.ClipboardItem({ 'image/png': Promise.resolve(pngBlob) });
  await nav.clipboard.write([item]);
}
