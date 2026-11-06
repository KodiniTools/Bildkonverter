/**
 * Lokale Projektsicherung des Editors in IndexedDB.
 *
 * Es gibt genau einen Platz („zuletzt bearbeitet“). Alles bleibt im Browser,
 * nichts geht an einen Server. Ohne IndexedDB (z. B. manche privaten Fenster)
 * meldet isProjectStorageAvailable() false und der Editor sichert nicht.
 */
import type { PackedSnapshot } from './projectSnapshot';

export const PROJECT_DB_NAME = 'bildkonverter-projekt';
const DB_VERSION = 1;
const STORE = 'projects';
const CURRENT_KEY = 'current';
/** Version des gespeicherten Formats; ältere/neuere Einträge werden verworfen */
export const PROJECT_FORMAT_VERSION = 1;

export interface StoredSourceFile {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
}

/** Gespeichertes Projekt */
export interface StoredProject {
  version: typeof PROJECT_FORMAT_VERSION;
  savedAt: number;
  /** Dateiname ohne Endung (Export, Anzeige) */
  name: string;
  /** Format des Ausgangsbildes, z. B. „jpg“ */
  format: string;
  /** Kleines Vorschaubild für die Fortsetzen-Karte */
  thumbnail: Blob | null;
  /** Ausgangsbild (für Zurücksetzen und Vorher/Nachher) */
  original: Blob | null;
  /** Originaldatei (EXIF beim Export), falls vorhanden */
  sourceFile: StoredSourceFile | null;
  snapshot: PackedSnapshot;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function isProjectStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  if (!isProjectStorageAvailable()) {
    return Promise.reject(new Error('IndexedDB nicht verfügbar'));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(PROJECT_DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        // Andere Tabs mit neuerer Version nicht blockieren
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('IndexedDB blockiert'));
    }).catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || request.error);
    tx.onabort = () => reject(tx.error || new Error('Transaktion abgebrochen'));
  });
}

export async function saveProject(project: StoredProject): Promise<void> {
  await withStore('readwrite', (store) => store.put(project, CURRENT_KEY));
}

/** Gespeichertes Projekt oder null (nichts gespeichert oder unbekanntes Format) */
export async function loadProject(): Promise<StoredProject | null> {
  const project = await withStore<StoredProject | undefined>('readonly', (store) =>
    store.get(CURRENT_KEY)
  );
  if (!project || project.version !== PROJECT_FORMAT_VERSION || !project.snapshot) return null;
  return project;
}

export async function deleteProject(): Promise<void> {
  await withStore('readwrite', (store) => store.delete(CURRENT_KEY));
}

/** Nur für Tests: Verbindung schließen und Datenbank löschen */
export async function resetProjectStorageForTests(): Promise<void> {
  if (dbPromise) {
    try {
      (await dbPromise).close();
    } catch {
      /* ignorieren */
    }
    dbPromise = null;
  }
  await requestToPromise(indexedDB.deleteDatabase(PROJECT_DB_NAME));
}
