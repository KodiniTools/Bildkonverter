/**
 * useProjectAutosave
 *
 * Sichert die Bearbeitung im Editor automatisch lokal (IndexedDB) und bietet
 * sie beim nächsten Besuch zum Fortsetzen an.
 *
 * Gesichert wird der aktuelle Eintrag der Undo-Historie (useEditorHistory):
 * Bild, Filter, Hintergrund, Transformationen, Texte, Formen, Ebenen und
 * Canvas-Größe. Jede Aktion, die in der Historie landet, löst kurz danach eine
 * Sicherung aus; eine geleerte Historie („Bild entfernen“) löscht sie. Die
 * Undo-Schritte selbst werden nicht gesichert, nach dem Fortsetzen beginnt die
 * Historie neu.
 */
import { ref, watch, type Ref } from 'vue';
import {
  deleteProject,
  isProjectStorageAvailable,
  loadProject,
  saveProject,
  PROJECT_FORMAT_VERSION,
  type StoredProject,
} from '@/lib/project/projectStorage';
import {
  packSnapshot,
  unpackSnapshot,
  urlToBlob,
  type EditorSnapshot,
} from '@/lib/project/projectSnapshot';
import { logger } from '@/utils/logger';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Angaben zur Fortsetzen-Karte */
export interface SavedProjectInfo {
  name: string;
  savedAt: number;
  thumbnailUrl: string | null;
  isCollage: boolean;
  layerCount: number;
  textCount: number;
  shapeCount: number;
}

export interface ProjectAutosaveDeps {
  canvas: Ref<HTMLCanvasElement | null>;
  history: Ref<unknown[]>;
  historyIndex: Ref<number>;
  currentFileName: Ref<string>;
  currentImageFormat: Ref<string>;
  originalImageDataUrl: Ref<string>;
  originalImage: Ref<HTMLImageElement | null>;
  sourceFile: Ref<File | null>;
  /** useEditorHistory().restoreSnapshot */
  restoreSnapshot: (state: EditorSnapshot) => Promise<void>;
  /** Wartezeit nach der letzten Änderung (ms) */
  delay?: number;
  /** Speicher-Funktionen (für Tests austauschbar) */
  storage?: {
    save: (project: StoredProject) => Promise<void>;
    load: () => Promise<StoredProject | null>;
    remove: () => Promise<void>;
    available: () => boolean;
  };
  onError?: (error: unknown) => void;
}

const THUMB_SIZE = 240;

function canvasThumbnail(canvas: HTMLCanvasElement | null): Promise<Blob | null> {
  if (!canvas || !canvas.width || !canvas.height) return Promise.resolve(null);
  const scale = Math.min(1, THUMB_SIZE / Math.max(canvas.width, canvas.height));
  const thumb = document.createElement('canvas');
  thumb.width = Math.max(1, Math.round(canvas.width * scale));
  thumb.height = Math.max(1, Math.round(canvas.height * scale));
  const ctx = thumb.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  try {
    ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => thumb.toBlob((blob) => resolve(blob), 'image/webp', 0.8));
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Ausgangsbild nicht ladbar'));
    img.src = url;
  });
}

export function useProjectAutosave(deps: ProjectAutosaveDeps) {
  const storage = deps.storage ?? {
    save: saveProject,
    load: loadProject,
    remove: deleteProject,
    available: isProjectStorageAvailable,
  };
  const delay = deps.delay ?? 800;
  const enabled = storage.available();

  const status = ref<AutosaveStatus>('idle');
  const savedProject = ref<SavedProjectInfo | null>(null);
  const isRestoring = ref(false);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;
  let pending = false;
  let suspended = false;
  let errorReported = false;
  // Ausgangsbild nur neu lesen, wenn es sich geändert hat
  let originalCache: { url: string; blob: Blob | null } | null = null;
  let thumbnailUrl: string | null = null;

  function currentSnapshot(): EditorSnapshot | null {
    const list = deps.history.value;
    const index = deps.historyIndex.value;
    if (!list.length || index < 0 || index >= list.length) return null;
    return list[index] as EditorSnapshot;
  }

  async function originalBlob(): Promise<Blob | null> {
    const url = deps.originalImageDataUrl.value;
    if (!url) return null;
    if (originalCache?.url !== url) {
      originalCache = { url, blob: await urlToBlob(url).catch(() => null) };
    }
    return originalCache.blob;
  }

  async function persist() {
    const snapshot = currentSnapshot();
    if (!snapshot) {
      await storage.remove();
      status.value = 'idle';
      return;
    }
    status.value = 'saving';
    const file = deps.sourceFile.value;
    const project: StoredProject = {
      version: PROJECT_FORMAT_VERSION,
      savedAt: Date.now(),
      name: deps.currentFileName.value || '',
      format: deps.currentImageFormat.value || '',
      thumbnail: await canvasThumbnail(deps.canvas.value),
      original: await originalBlob(),
      sourceFile: file
        ? { blob: file, name: file.name, type: file.type, lastModified: file.lastModified }
        : null,
      snapshot: await packSnapshot(snapshot),
    };
    await storage.save(project);
    status.value = 'saved';
  }

  /** Sicherungen nacheinander ausführen; während einer laufenden höchstens eine nachholen */
  function run(): Promise<void> {
    if (running) {
      pending = true;
      return running;
    }
    running = persist()
      .catch((error) => {
        status.value = 'error';
        logger.warn('Projekt konnte nicht gesichert werden:', error);
        if (!errorReported) {
          errorReported = true;
          deps.onError?.(error);
        }
      })
      .finally(() => {
        running = null;
        if (pending) {
          pending = false;
          void run();
        }
      });
    return running;
  }

  function schedule() {
    if (!enabled || suspended) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, delay);
  }

  /** Ausstehende Sicherung sofort schreiben (Seite wird verlassen) */
  function flush(): Promise<void> {
    if (!timer) return running ?? Promise.resolve();
    clearTimeout(timer);
    timer = null;
    return run();
  }

  watch([deps.historyIndex, () => deps.history.value.length], schedule);

  function setThumbnail(blob: Blob | null) {
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    thumbnailUrl = blob ? URL.createObjectURL(blob) : null;
  }

  /** Gespeichertes Projekt suchen und als Fortsetzen-Angebot bereitstellen */
  async function checkForSavedProject(): Promise<boolean> {
    if (!enabled) return false;
    try {
      const project = await storage.load();
      if (!project) return false;
      // Inzwischen wurde schon etwas geöffnet: nicht mehr anbieten
      if (currentSnapshot()) return false;
      const state = project.snapshot.state as Record<string, unknown>;
      setThumbnail(project.thumbnail);
      savedProject.value = {
        name: project.name,
        savedAt: project.savedAt,
        thumbnailUrl,
        isCollage: !!state.isCollageMode,
        layerCount: project.snapshot.layerImages.filter(Boolean).length,
        textCount: Array.isArray(state.texts) ? state.texts.length : 0,
        shapeCount: Array.isArray(state.shapes) ? state.shapes.length : 0,
      };
      return true;
    } catch (error) {
      logger.warn('Gespeichertes Projekt nicht lesbar:', error);
      return false;
    }
  }

  /** Gespeichertes Projekt in den Editor laden */
  async function resumeProject(): Promise<boolean> {
    if (!enabled || isRestoring.value) return false;
    isRestoring.value = true;
    suspended = true;
    try {
      const project = await storage.load();
      if (!project) {
        savedProject.value = null;
        return false;
      }
      const state = unpackSnapshot(project.snapshot);

      deps.currentFileName.value = project.name || '';
      deps.currentImageFormat.value = project.format || '';
      if (project.sourceFile) {
        const { blob, name, type, lastModified } = project.sourceFile;
        deps.sourceFile.value = new File([blob], name, { type, lastModified });
      } else {
        deps.sourceFile.value = null;
      }
      if (project.original) {
        const url = URL.createObjectURL(project.original);
        deps.originalImageDataUrl.value = url;
        originalCache = { url, blob: project.original };
        deps.originalImage.value = await loadImageElement(url).catch(() => null);
      }

      await deps.restoreSnapshot(state);
      if (!deps.originalImage.value && state.rawImageSrc) {
        deps.originalImage.value = await loadImageElement(state.rawImageSrc).catch(() => null);
      }
      savedProject.value = null;
      setThumbnail(null);
      // Der fortgesetzte Stand ist bereits gesichert
      status.value = 'saved';
      return true;
    } finally {
      suspended = false;
      isRestoring.value = false;
    }
  }

  /** Gespeichertes Projekt verwerfen */
  async function discardProject() {
    savedProject.value = null;
    setThumbnail(null);
    if (!enabled) return;
    try {
      await storage.remove();
    } catch (error) {
      logger.warn('Gespeichertes Projekt nicht löschbar:', error);
    }
  }

  /** Angebot ausblenden, ohne zu löschen (z. B. neues Bild geöffnet) */
  function dismissOffer() {
    savedProject.value = null;
    setThumbnail(null);
  }

  return {
    enabled,
    status,
    savedProject,
    isRestoring,
    checkForSavedProject,
    resumeProject,
    discardProject,
    dismissOffer,
    flush,
  };
}
