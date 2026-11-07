/**
 * saveFile - Speichern mit Systemdialog (Speicherort + Dateiname)
 *
 * Chrome/Edge (File System Access API): `showSaveFilePicker` öffnet den
 * Speichern-unter-Dialog des Betriebssystems, `showDirectoryPicker` einen
 * Ordnerdialog für mehrere Dateien.
 * Firefox/Safari haben diese API nicht: Dort fragt die App den Dateinamen ab
 * (useSavePrompt) und lädt klassisch herunter. Den Speicherort legt dann der
 * Browser fest (Download-Ordner oder seine eigene Nachfrage).
 *
 * Wichtig: Die Picker brauchen eine gültige Nutzergeste. Deshalb öffnen
 * `saveFile` und `pickSaveFolder` den Dialog synchron beim Aufruf, bevor
 * irgendetwas awaited wird. Die Datei selbst (`getBlob`) entsteht erst danach,
 * und nur, wenn der Nutzer nicht abgebrochen hat.
 */
import { logger } from '@/utils/logger';
import { useSavePrompt } from '@/composables/useSavePrompt';

export type SaveOutcome = 'saved' | 'downloaded' | 'cancelled';

export interface SaveResult {
  outcome: SaveOutcome;
  /** Tatsächlich verwendeter Dateiname (im Systemdialog evtl. geändert) */
  filename: string;
  /** Erzeugte Datei; null, wenn vor dem Erzeugen abgebrochen wurde */
  blob: Blob | null;
}

export interface SaveFileOptions {
  /** Vorgeschlagener Dateiname inkl. Endung */
  suggestedName: string;
  /** Liefert die Datei; wird erst nach der Auswahl aufgerufen, bei Abbruch gar nicht */
  getBlob: () => Blob | Promise<Blob>;
  /** MIME-Typ für den Typ-Filter des Systemdialogs */
  mimeType?: string;
  /**
   * Ohne Systemdialog den Dateinamen in der App abfragen. false, wenn der
   * Aufrufer ihn schon abgefragt hat (Export-Dialog im Editor).
   */
  askName?: boolean;
}

/** Teil der File System Access API, der (noch) nicht in lib.dom steht */
interface SavePickerType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SavePickerOptions {
  suggestedName?: string;
  types?: SavePickerType[];
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
}

interface FileSystemAccessWindow {
  showSaveFilePicker?: (options?: SavePickerOptions) => Promise<FileSystemFileHandle>;
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
}

const FALLBACK_NAME = 'datei';
// Unter Windows/macOS verbotene Zeichen und Steuerzeichen
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heif: 'image/heif',
  heic: 'image/heic',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  zip: 'application/zip',
  json: 'application/json',
};

function fsWindow(): FileSystemAccessWindow | null {
  return typeof window === 'undefined' ? null : (window as unknown as FileSystemAccessWindow);
}

function errorName(error: unknown): string | undefined {
  return (error as { name?: string } | null)?.name;
}

function isAbort(error: unknown): boolean {
  return errorName(error) === 'AbortError';
}

/** true, wenn der Browser den Speichern-unter-Dialog des Systems kann */
export function supportsSavePicker(): boolean {
  return typeof fsWindow()?.showSaveFilePicker === 'function';
}

/** true, wenn der Browser einen Zielordner für mehrere Dateien wählen lassen kann */
export function supportsFolderPicker(): boolean {
  return typeof fsWindow()?.showDirectoryPicker === 'function';
}

/** Endung ohne Punkt, klein geschrieben; '' wenn keine */
export function extensionOf(filename: string | null | undefined): string {
  const match = /\.([a-z0-9]{1,10})$/i.exec(filename || '');
  return match ? match[1].toLowerCase() : '';
}

/**
 * Bereinigt einen Dateinamen: verbotene Zeichen werden zu `_`, Leerzeichen
 * und Punkte am Rand fallen weg, die Endung von `suggestedName` wird ergänzt,
 * falls sie fehlt. Leere Eingabe ergibt `suggestedName`.
 */
export function sanitizeFilename(input: unknown, suggestedName: string = FALLBACK_NAME): string {
  const fallback = String(suggestedName || FALLBACK_NAME);
  let name = String(input ?? '')
    .replace(FORBIDDEN_CHARS, '_')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .trim();
  if (!name) return fallback;

  const ext = extensionOf(fallback);
  if (ext && extensionOf(name) !== ext) name = `${name}.${ext}`;
  return name;
}

/** Dateityp-Filter für den Systemdialog; [] wenn die Endung unbekannt ist */
export function pickerTypes(suggestedName: string, mimeType?: string): SavePickerType[] {
  const ext = extensionOf(suggestedName);
  if (!ext) return [];
  const mime = mimeType || MIME_BY_EXT[ext];
  if (!mime) return [];
  const exts = ext === 'jpg' || ext === 'jpeg' ? ['.jpg', '.jpeg'] : [`.${ext}`];
  return [{ description: ext.toUpperCase(), accept: { [mime]: exts } }];
}

/** Klassischer Download über einen unsichtbaren Link */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Öffnet den Systemdialog synchron. Ein ungültiger Typ-Filter (TypeError,
 * z. B. bei exotischen MIME-Typen) wird einmal ohne Filter wiederholt.
 */
function openSavePicker(
  picker: NonNullable<FileSystemAccessWindow['showSaveFilePicker']>,
  suggestedName: string,
  mimeType?: string
): Promise<FileSystemFileHandle> {
  const types = pickerTypes(suggestedName, mimeType);
  let attempt: Promise<FileSystemFileHandle>;
  try {
    attempt = picker(types.length ? { suggestedName, types } : { suggestedName });
  } catch (error) {
    return Promise.reject(error);
  }
  return attempt.catch((error: unknown) => {
    if (errorName(error) === 'TypeError' && types.length) return picker({ suggestedName });
    throw error;
  });
}

async function writeToHandle(handle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writable = await handle.createWritable();
  try {
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
}

/**
 * Speichert eine Datei mit Dialog für Speicherort und Dateinamen.
 * Synchron aus dem Klick heraus aufrufen (Nutzergeste).
 * Fehler beim Erzeugen der Datei (`getBlob`) werden weitergeworfen.
 */
export async function saveFile({
  suggestedName,
  getBlob,
  mimeType,
  askName = true,
}: SaveFileOptions): Promise<SaveResult> {
  const name = sanitizeFilename(suggestedName);
  const picker = fsWindow()?.showSaveFilePicker;

  if (typeof picker === 'function') {
    // Synchron in der Nutzergeste öffnen, erst danach awaiten
    const picking = openSavePicker(picker.bind(window), name, mimeType);
    let handle: FileSystemFileHandle | null = null;
    try {
      handle = await picking;
    } catch (error) {
      if (isAbort(error)) return { outcome: 'cancelled', filename: name, blob: null };
      // z. B. SecurityError (Geste abgelaufen, eingebettet in fremdem iframe):
      // auf den klassischen Download ausweichen
      logger.warn('Speichern-Dialog nicht verfügbar, normaler Download:', error);
    }

    const blob = await getBlob();
    if (!handle) {
      downloadBlob(blob, name);
      return { outcome: 'downloaded', filename: name, blob };
    }

    const chosen = handle.name || name;
    try {
      await writeToHandle(handle, blob);
      return { outcome: 'saved', filename: chosen, blob };
    } catch (error) {
      if (isAbort(error)) return { outcome: 'cancelled', filename: chosen, blob };
      logger.warn('Schreiben in die gewählte Datei fehlgeschlagen, normaler Download:', error);
      downloadBlob(blob, chosen);
      return { outcome: 'downloaded', filename: chosen, blob };
    }
  }

  let filename = name;
  if (askName) {
    const entered = await useSavePrompt().prompt(name);
    if (entered === null) return { outcome: 'cancelled', filename: name, blob: null };
    filename = sanitizeFilename(entered, name);
  }
  const blob = await getBlob();
  downloadBlob(blob, filename);
  return { outcome: 'downloaded', filename, blob };
}

/**
 * Zielordner für mehrere Dateien wählen (ein Dialog statt einer pro Datei).
 * Synchron in der Nutzergeste aufrufen.
 *
 * @returns Ordner; null = abgebrochen; undefined = nicht möglich (normal herunterladen)
 */
export async function pickSaveFolder(): Promise<FileSystemDirectoryHandle | null | undefined> {
  const picker = fsWindow()?.showDirectoryPicker;
  if (typeof picker !== 'function') return undefined;
  try {
    return await picker.call(window, { id: 'bildkonverter-save', mode: 'readwrite' });
  } catch (error) {
    if (isAbort(error)) return null;
    logger.warn('Ordner-Dialog nicht verfügbar, normaler Download:', error);
    return undefined;
  }
}

async function nameTaken(dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch (error) {
    if (errorName(error) === 'NotFoundError') return false;
    // Gleichnamiger Unterordner: Name ist ebenfalls belegt
    if (errorName(error) === 'TypeMismatchError') return true;
    throw error;
  }
}

/**
 * Freier Name im Ordner: "bild.png", sonst "bild (1).png", "bild (2).png" …
 * Vorhandene Dateien werden nie überschrieben. `taken` enthält die in diesem
 * Durchgang schon vergebenen Namen (klein geschrieben).
 */
export async function uniqueNameInFolder(
  dir: FileSystemDirectoryHandle,
  filename: string,
  taken: Set<string> = new Set()
): Promise<string> {
  const ext = extensionOf(filename);
  const base = ext ? filename.slice(0, -(ext.length + 1)) : filename;
  for (let i = 0; i < 1000; i++) {
    const candidate = i === 0 ? filename : `${base} (${i})${ext ? `.${ext}` : ''}`;
    const key = candidate.toLowerCase();
    if (taken.has(key)) continue;
    if (!(await nameTaken(dir, candidate))) {
      taken.add(key);
      return candidate;
    }
  }
  throw new Error(`Kein freier Dateiname für ${filename}`);
}

/**
 * Schreibt eine Datei in den gewählten Ordner, ohne Vorhandenes zu überschreiben.
 * @returns tatsächlich verwendeter Dateiname
 */
export async function writeFileToFolder(
  dir: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob,
  taken?: Set<string>
): Promise<string> {
  const name = await uniqueNameInFolder(dir, sanitizeFilename(filename), taken);
  const handle = await dir.getFileHandle(name, { create: true });
  await writeToHandle(handle, blob);
  return name;
}
