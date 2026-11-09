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
const MIME_BY_FORMAT: Readonly<Record<string, string>> = {
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

export type ShareStrategy = 'share' | 'clipboard' | 'download';

/** Der Teil von `navigator`, den diese Helfer nutzen (in Tests durch Attrappen ersetzbar) */
export interface ShareNavigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data?: ShareData) => boolean;
  clipboard?: { write?: (items: ClipboardItem[]) => Promise<void> };
}

export function mimeForFormat(format: string | null | undefined): string {
  return MIME_BY_FORMAT[String(format || '').toLowerCase()] || 'application/octet-stream';
}

/**
 * Kann der Browser eine Datei dieses Typs über den Systemdialog teilen?
 * Synchron, damit die Entscheidung noch innerhalb der Nutzergeste fällt.
 */
export function canShareFileType(
  mimeType: string,
  nav: ShareNavigator | undefined = globalThis.navigator
): boolean {
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
 */
export function canCopyImage(nav: ShareNavigator | undefined = globalThis.navigator): boolean {
  return (
    !!nav &&
    typeof nav.clipboard?.write === 'function' &&
    typeof globalThis.ClipboardItem === 'function'
  );
}

/**
 * Wählt die beste verfügbare Art zu teilen.
 */
export function pickShareStrategy(
  mimeType: string,
  nav: ShareNavigator | undefined = globalThis.navigator
): ShareStrategy {
  if (canShareFileType(mimeType, nav)) return 'share';
  if (canCopyImage(nav)) return 'clipboard';
  return 'download';
}

/**
 * Öffnet den Systemdialog zum Teilen.
 *
 * @throws DOMException NotAllowedError, wenn die Nutzergeste abgelaufen ist
 *   (Aufrufer bieten dann einen zweiten Klick an), sonst andere Fehler.
 */
export async function shareFile(
  file: File,
  { title }: { title?: string } = {},
  nav: Pick<Required<ShareNavigator>, 'share'> = globalThis.navigator
): Promise<'shared' | 'cancelled'> {
  try {
    await nav.share({ files: [file], ...(title ? { title } : {}) });
    return 'shared';
  } catch (error) {
    if ((error as { name?: unknown } | null)?.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

/**
 * Schreibt ein PNG in die Zwischenablage. Ein Promise als Inhalt ist erlaubt:
 * Safari verlangt, dass clipboard.write synchron in der Nutzergeste startet,
 * das Kodieren darf danach fertig werden.
 */
export async function copyImageToClipboard(
  pngBlob: Blob | Promise<Blob>,
  nav: ShareNavigator = globalThis.navigator
): Promise<void> {
  if (!canCopyImage(nav)) throw new Error('Clipboard API nicht verfügbar');
  const item = new globalThis.ClipboardItem({ 'image/png': Promise.resolve(pngBlob) });
  // canCopyImage hat clipboard.write geprüft; Aufruf am Objekt erhält `this`
  await nav.clipboard!.write!([item]);
}
