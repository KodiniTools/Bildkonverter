/**
 * useCrop.ts - Composable für Crop-Funktionalität
 * Extrahiert aus EditorView.vue - Alle Crop-Logik in einem Composable
 */

import { ref, computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from '@/composables/useConfirm';
import { getAdjustedImage } from '@/utils/imageAdjustments';
import { logger } from '@/utils/logger';
import { context2d } from '@/utils/canvas2d';
import { cropShapes, type Shape } from '@/utils/shapes';
import { findSocialCropPreset, getSocialDownscaleTarget } from '@/utils/socialCropPresets';
import type { AdjustableImage } from '@/utils/imageAdjustments';
import type { FilterValues } from '@/types/filters';
import type { StoreText } from '@/stores/image/types';
import type { useImageStore } from '@/stores/imageStore';

type ImageStore = ReturnType<typeof useImageStore>;

/** Teil des imageStore, den Zuschnitt und Rückgängig lesen und ändern */
export type CropImageStore = Pick<
  ImageStore,
  'texts' | 'shapes' | 'selectedShapeId' | 'updateText' | 'deleteText'
>;

export interface AspectRatioPreset {
  id: string;
  label: string;
  /** null = freies Seitenverhältnis */
  ratio: number | null;
  icon: string;
  isCircle?: boolean;
  /** Zielgröße (Social-Media-Presets); das Ergebnis wird darauf verkleinert */
  target?: { width: number; height: number };
}

/** Griff der Crop-Box: Ecken und Kantenmitten */
export type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface CropPoint {
  x: number;
  y: number;
}

/** Zustand vor dem ersten Zuschnitt (für undoCrop) */
export interface BeforeCropImage {
  dataUrl: string;
  width: number;
  height: number;
  filters: FilterValues;
  texts: StoreText[];
  shapes: Shape[];
  borderRadius: number;
}

export interface FinishCropContext {
  canvas: Ref<HTMLCanvasElement | null>;
  currentImage: Ref<AdjustableImage | null>;
  filters: Ref<FilterValues>;
  imageStore?: CropImageStore | null;
  borderRadiusBeforeCrop?: number;
  onCropComplete?: (
    img: HTMLImageElement,
    width: number,
    height: number,
    isCircleCrop: boolean,
    /** Zielgröße eines Social-Media-Presets (sonst undefined) */
    target?: { width: number; height: number }
    /** Optional: endgültige Bildgröße, falls der Aufrufer danach noch skaliert (für den Toast) */
  ) => { width: number; height: number } | void;
}

export interface UndoCropContext {
  imageStore?: CropImageStore | null;
  onUndoComplete?: (img: HTMLImageElement, beforeCropData: BeforeCropImage) => void;
}

// Seitenverhältnis-Presets
export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: 'free', label: 'Frei', ratio: null, icon: 'fa-expand' },
  { id: 'circle', label: 'Kreis', ratio: 1, icon: 'fa-circle', isCircle: true },
  { id: '1:1', label: '1:1', ratio: 1, icon: 'fa-square' },
  { id: '4:3', label: '4:3', ratio: 4 / 3, icon: 'fa-image' },
  { id: '16:9', label: '16:9', ratio: 16 / 9, icon: 'fa-tv' },
  { id: '9:16', label: '9:16', ratio: 9 / 16, icon: 'fa-mobile-alt' },
];

/**
 * Sucht ein Preset für die Crop-Box: zuerst die Seitenverhältnisse, dann die
 * Social-Media-Presets (feste Zielgröße → Seitenverhältnis = Breite / Höhe).
 */
export function findCropPreset(id: string): AspectRatioPreset | undefined {
  const base = ASPECT_RATIO_PRESETS.find((p) => p.id === id);
  if (base) return base;
  const social = findSocialCropPreset(id);
  if (!social) return undefined;
  return {
    id: social.id,
    label: `${social.width}×${social.height}`,
    ratio: social.ratio,
    icon: 'fa-image',
    target: { width: social.width, height: social.height },
  };
}

export function useCrop() {
  const { t } = useI18n();
  const { confirm: confirmDialog } = useConfirm();

  // State
  const cropMode = ref(false);
  const cropping = ref(false);
  const cropStart = ref<CropPoint>({ x: 0, y: 0 });
  const cropEnd = ref<CropPoint>({ x: 0, y: 0 });
  const hasCropped = ref(false);
  const beforeCropImage = ref<BeforeCropImage | null>(null);

  // Seitenverhältnis State
  const selectedAspectRatio = ref('free');
  const canvasSize = ref({ width: 0, height: 0 });

  // Drag & Resize State
  const isDragging = ref(false);
  const isResizing = ref(false);
  const isCreating = ref(false); // Neue Auswahl wird erstellt
  const activeHandle = ref<CropHandle | null>(null);
  const dragOffset = ref({ x: 0, y: 0 });

  // Computed
  const cropOverlayStyle = computed(() => {
    if (!cropping.value) return null;

    const startX = Math.min(cropStart.value.x, cropEnd.value.x);
    const startY = Math.min(cropStart.value.y, cropEnd.value.y);
    const width = Math.abs(cropEnd.value.x - cropStart.value.x);
    const height = Math.abs(cropEnd.value.y - cropStart.value.y);

    return {
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  });

  // Berechne die normalisierte Crop-Box (immer positive Werte)
  const normalizedCropBox = computed(() => {
    return {
      x: Math.min(cropStart.value.x, cropEnd.value.x),
      y: Math.min(cropStart.value.y, cropEnd.value.y),
      width: Math.abs(cropEnd.value.x - cropStart.value.x),
      height: Math.abs(cropEnd.value.y - cropStart.value.y),
    };
  });

  // Aktuelle Zuschnittabmessungen in Bild-Pixeln (Breite × Höhe)
  // Die Crop-Koordinaten sind bereits Canvas-Koordinaten, entsprechen also 1:1 den Bildpixeln
  const cropDimensions = computed(() => {
    const box = normalizedCropBox.value;
    return {
      width: Math.max(0, Math.round(box.width)),
      height: Math.max(0, Math.round(box.height)),
    };
  });

  // Endgröße nach dem Bestätigen, wenn ein Social-Preset den Ausschnitt noch
  // auf seine Zielgröße verkleinert (sonst null = Ausschnitt bleibt wie er ist)
  const cropOutputSize = computed(() => {
    const target = findCropPreset(selectedAspectRatio.value)?.target;
    if (!target) return null;
    const { width, height } = cropDimensions.value;
    return getSocialDownscaleTarget(target, width, height);
  });

  // Methods
  function toggleCropMode() {
    if (cropMode.value && cropping.value) {
      // Signal zum finishCrop aufrufen
      return 'finish';
    }

    cropMode.value = !cropMode.value;

    if (!cropMode.value) {
      clearCropSelection();
      selectedAspectRatio.value = 'free';
    } else {
      logger.log('Crop-Modus aktiviert: Ziehen Sie einen Bereich auf');
      if (window.$toast) {
        window.$toast.info(t('toast.crop.modeActivated'));
      }
    }

    return cropMode.value ? 'activated' : 'deactivated';
  }

  function clearCropSelection() {
    cropping.value = false;
    isDragging.value = false;
    isResizing.value = false;
    isCreating.value = false;
    activeHandle.value = null;
    cropStart.value = { x: 0, y: 0 };
    cropEnd.value = { x: 0, y: 0 };
  }

  function startCrop(x: number, y: number) {
    cropping.value = true;
    isCreating.value = true;
    cropStart.value = { x, y };
    cropEnd.value = { x, y };
  }

  // Erstelle eine zentrierte Crop-Box mit dem gewählten Seitenverhältnis
  // fill = Anteil des Canvas, den die Box maximal einnimmt (Standard 80 %;
  // Social-Presets nutzen 100 %, damit möglichst viel Bild in die Zielgröße passt)
  function createCenteredCropBox(ratio: number | null, fill = 0.8) {
    if (canvasSize.value.width <= 0 || canvasSize.value.height <= 0) return;

    const canvasW = canvasSize.value.width;
    const canvasH = canvasSize.value.height;

    // Berechne maximale Größe die ins Canvas passt
    const maxWidth = canvasW * fill;
    const maxHeight = canvasH * fill;

    let boxWidth: number, boxHeight: number;

    if (ratio === null) {
      // Freie Auswahl - nutze 60% des Canvas
      boxWidth = canvasW * 0.6;
      boxHeight = canvasH * 0.6;
    } else {
      // Berechne Größe basierend auf Seitenverhältnis
      if (maxWidth / ratio <= maxHeight) {
        boxWidth = maxWidth;
        boxHeight = maxWidth / ratio;
      } else {
        boxHeight = maxHeight;
        boxWidth = maxHeight * ratio;
      }
    }

    // Auf ganze Pixel abrunden: bei fill = 1 darf die Box durch
    // Gleitkomma-Rundung nicht über den Canvas-Rand hinausragen
    boxWidth = Math.max(1, Math.floor(boxWidth));
    boxHeight = Math.max(1, Math.floor(boxHeight));

    // Zentriere die Box
    const startX = Math.floor((canvasW - boxWidth) / 2);
    const startY = Math.floor((canvasH - boxHeight) / 2);

    cropStart.value = { x: startX, y: startY };
    cropEnd.value = { x: startX + boxWidth, y: startY + boxHeight };
    cropping.value = true;
  }

  function updateCrop(x: number, y: number) {
    const preset = findCropPreset(selectedAspectRatio.value);

    // Wenn kein festes Seitenverhältnis, einfach die Position setzen
    if (!preset || preset.ratio === null) {
      cropEnd.value = { x, y };
      return;
    }

    // Berechne Breite und Höhe basierend auf dem Seitenverhältnis
    const ratio = preset.ratio;
    const startX = cropStart.value.x;
    const startY = cropStart.value.y;

    const width = x - startX;
    const height = y - startY;

    // Berechne die neue Höhe basierend auf der Breite und dem Seitenverhältnis
    const absWidth = Math.abs(width);
    const absHeight = Math.abs(height);

    // Entscheide, ob wir nach Breite oder Höhe skalieren
    let newWidth: number, newHeight: number;

    if (absWidth / ratio > absHeight) {
      // Breite ist dominant, passe Höhe an
      newWidth = absWidth;
      newHeight = absWidth / ratio;
    } else {
      // Höhe ist dominant, passe Breite an
      newHeight = absHeight;
      newWidth = absHeight * ratio;
    }

    // Wende Vorzeichen an (für verschiedene Ziehrichtungen)
    if (width < 0) newWidth = -newWidth;
    if (height < 0) newHeight = -newHeight;

    // Begrenze auf Canvas-Größe
    let endX = startX + newWidth;
    let endY = startY + newHeight;

    if (canvasSize.value.width > 0 && canvasSize.value.height > 0) {
      endX = Math.max(0, Math.min(canvasSize.value.width, endX));
      endY = Math.max(0, Math.min(canvasSize.value.height, endY));
    }

    cropEnd.value = { x: endX, y: endY };
  }

  // Verschiebe die Crop-Box
  function moveCropBox(x: number, y: number) {
    const box = normalizedCropBox.value;

    // Berechne neue Position basierend auf Drag-Offset
    let newX = x - dragOffset.value.x;
    let newY = y - dragOffset.value.y;

    // Begrenze auf Canvas-Grenzen
    if (canvasSize.value.width > 0 && canvasSize.value.height > 0) {
      newX = Math.max(0, Math.min(canvasSize.value.width - box.width, newX));
      newY = Math.max(0, Math.min(canvasSize.value.height - box.height, newY));
    }

    // Aktualisiere Start und End
    cropStart.value = { x: newX, y: newY };
    cropEnd.value = { x: newX + box.width, y: newY + box.height };
  }

  // Resize die Crop-Box von einem Handle aus
  function resizeCropBox(x: number, y: number) {
    const handle = activeHandle.value;
    if (!handle) return;

    const preset = findCropPreset(selectedAspectRatio.value);
    const ratio = preset?.ratio || null;

    // Begrenze auf Canvas
    x = Math.max(0, Math.min(canvasSize.value.width, x));
    y = Math.max(0, Math.min(canvasSize.value.height, y));

    let newStart = { ...cropStart.value };
    let newEnd = { ...cropEnd.value };

    // Normalisiere Start/End für konsistente Berechnung
    const minX = Math.min(cropStart.value.x, cropEnd.value.x);
    const minY = Math.min(cropStart.value.y, cropEnd.value.y);
    const maxX = Math.max(cropStart.value.x, cropEnd.value.x);
    const maxY = Math.max(cropStart.value.y, cropEnd.value.y);

    // Handle basierte Resize-Logik
    switch (handle) {
      case 'nw': // Oben-Links
        newStart = { x: x, y: y };
        newEnd = { x: maxX, y: maxY };
        break;
      case 'n': // Oben-Mitte
        newStart = { x: minX, y: y };
        newEnd = { x: maxX, y: maxY };
        break;
      case 'ne': // Oben-Rechts
        newStart = { x: minX, y: y };
        newEnd = { x: x, y: maxY };
        break;
      case 'e': // Rechts-Mitte
        newStart = { x: minX, y: minY };
        newEnd = { x: x, y: maxY };
        break;
      case 'se': // Unten-Rechts
        newStart = { x: minX, y: minY };
        newEnd = { x: x, y: y };
        break;
      case 's': // Unten-Mitte
        newStart = { x: minX, y: minY };
        newEnd = { x: maxX, y: y };
        break;
      case 'sw': // Unten-Links
        newStart = { x: x, y: minY };
        newEnd = { x: maxX, y: y };
        break;
      case 'w': // Links-Mitte
        newStart = { x: x, y: minY };
        newEnd = { x: maxX, y: maxY };
        break;
    }

    // Wenn Seitenverhältnis gesetzt, passe an
    if (ratio !== null) {
      const newWidth = Math.abs(newEnd.x - newStart.x);
      const newHeight = Math.abs(newEnd.y - newStart.y);

      // Entscheide basierend auf Handle, welche Dimension führend ist
      const isHorizontalHandle = handle === 'e' || handle === 'w';
      const isVerticalHandle = handle === 'n' || handle === 's';

      let adjustedWidth: number, adjustedHeight: number;

      if (isHorizontalHandle) {
        adjustedWidth = newWidth;
        adjustedHeight = newWidth / ratio;
      } else if (isVerticalHandle) {
        adjustedHeight = newHeight;
        adjustedWidth = newHeight * ratio;
      } else {
        // Eck-Handle: nutze größere Dimension
        if (newWidth / ratio > newHeight) {
          adjustedWidth = newWidth;
          adjustedHeight = newWidth / ratio;
        } else {
          adjustedHeight = newHeight;
          adjustedWidth = newHeight * ratio;
        }
      }

      // Passe die Position basierend auf dem Handle an
      if (handle.includes('w')) {
        newStart.x = newEnd.x - adjustedWidth;
      } else {
        newEnd.x = newStart.x + adjustedWidth;
      }

      if (handle.includes('n')) {
        newStart.y = newEnd.y - adjustedHeight;
      } else {
        newEnd.y = newStart.y + adjustedHeight;
      }
    }

    // Mindestgröße sicherstellen
    const minSize = 20;
    if (Math.abs(newEnd.x - newStart.x) >= minSize && Math.abs(newEnd.y - newStart.y) >= minSize) {
      cropStart.value = newStart;
      cropEnd.value = newEnd;
    }
  }

  // Prüfe ob ein Punkt innerhalb der Crop-Box liegt
  function isPointInCropBox(x: number, y: number) {
    if (!cropping.value) return false;
    const box = normalizedCropBox.value;
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
  }

  // Prüfe welches Handle getroffen wurde (returns null wenn keines)
  function getHandleAtPoint(x: number, y: number, displayScale = 1): CropHandle | null {
    if (!cropping.value) return null;

    const box = normalizedCropBox.value;
    // Größe des Klickbereichs - skaliert basierend auf Display
    // Bei kleiner Darstellung größerer Klickbereich in Canvas-Koordinaten
    const handleSize = Math.max(15, 20 / displayScale);

    const handles: Record<CropHandle, CropPoint> = {
      nw: { x: box.x, y: box.y },
      n: { x: box.x + box.width / 2, y: box.y },
      ne: { x: box.x + box.width, y: box.y },
      e: { x: box.x + box.width, y: box.y + box.height / 2 },
      se: { x: box.x + box.width, y: box.y + box.height },
      s: { x: box.x + box.width / 2, y: box.y + box.height },
      sw: { x: box.x, y: box.y + box.height },
      w: { x: box.x, y: box.y + box.height / 2 },
    };

    for (const [name, pos] of Object.entries(handles) as [CropHandle, CropPoint][]) {
      if (Math.abs(x - pos.x) <= handleSize && Math.abs(y - pos.y) <= handleSize) {
        return name;
      }
    }

    return null;
  }

  function setAspectRatio(ratioId: string) {
    selectedAspectRatio.value = ratioId;

    const preset = findCropPreset(ratioId);

    // Wenn noch keine Crop-Box existiert, erstelle eine zentrierte
    if (preset?.target) {
      // Social-Preset: immer die größtmögliche Box im Zielformat, mittig
      createCenteredCropBox(preset.ratio, 1);
    } else if (!cropping.value && preset) {
      createCenteredCropBox(preset.ratio);
    } else if (cropping.value && preset && preset.ratio !== null) {
      // Wenn bereits eine Box existiert, passe sie an das neue Seitenverhältnis an
      const box = normalizedCropBox.value;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Berechne neue Größe mit gleichem Seitenverhältnis
      let newWidth: number, newHeight: number;
      const ratio = preset.ratio;

      // Behalte die größere Dimension und passe die andere an
      if (box.width / ratio <= box.height) {
        newWidth = box.width;
        newHeight = box.width / ratio;
      } else {
        newHeight = box.height;
        newWidth = box.height * ratio;
      }

      // Begrenze auf Canvas
      if (newWidth > canvasSize.value.width) {
        newWidth = canvasSize.value.width * 0.9;
        newHeight = newWidth / ratio;
      }
      if (newHeight > canvasSize.value.height) {
        newHeight = canvasSize.value.height * 0.9;
        newWidth = newHeight * ratio;
      }

      // Zentriere um den alten Mittelpunkt
      let newX = centerX - newWidth / 2;
      let newY = centerY - newHeight / 2;

      // Stelle sicher, dass die Box im Canvas bleibt
      newX = Math.max(0, Math.min(canvasSize.value.width - newWidth, newX));
      newY = Math.max(0, Math.min(canvasSize.value.height - newHeight, newY));

      cropStart.value = { x: newX, y: newY };
      cropEnd.value = { x: newX + newWidth, y: newY + newHeight };
    }
  }

  function setCanvasSize(width: number, height: number) {
    canvasSize.value = { width, height };
  }

  // Setzt die Crop-Box auf eine exakte Größe (in Bild-Pixeln) und hält sie
  // dabei innerhalb des Canvas. Die obere linke Ecke bleibt möglichst
  // verankert; passt die Box nicht mehr, wird sie nach links/oben verschoben
  // bzw. auf Canvas-Größe begrenzt.
  function applyExactCropSize(width: number, height: number) {
    const cw = canvasSize.value.width;
    const ch = canvasSize.value.height;
    const box = normalizedCropBox.value;

    let w = Math.max(1, Math.round(width));
    let h = Math.max(1, Math.round(height));
    let x = box.x;
    let y = box.y;

    if (cw > 0) {
      w = Math.min(w, cw);
      x = Math.max(0, Math.min(x, cw - w));
    }
    if (ch > 0) {
      h = Math.min(h, ch);
      y = Math.max(0, Math.min(y, ch - h));
    }

    cropStart.value = { x, y };
    cropEnd.value = { x: x + w, y: y + h };
  }

  // Positioniert die aktuelle Crop-Box (unter Beibehaltung ihrer Größe)
  // mittig im Canvas.
  function centerCropBox() {
    if (!cropping.value) return;
    const cw = canvasSize.value.width;
    const ch = canvasSize.value.height;
    if (cw <= 0 || ch <= 0) return;

    const box = normalizedCropBox.value;
    const w = Math.min(box.width, cw);
    const h = Math.min(box.height, ch);
    const x = Math.max(0, Math.round((cw - w) / 2));
    const y = Math.max(0, Math.round((ch - h) / 2));

    cropStart.value = { x, y };
    cropEnd.value = { x: x + w, y: y + h };
  }

  function currentCropRatio() {
    const preset = findCropPreset(selectedAspectRatio.value);
    return preset?.ratio ?? null;
  }

  // Exakte Breite setzen (px). Bei aktivem Seitenverhältnis wird die Höhe
  // mitgeführt; die Box bleibt innerhalb des Canvas.
  function setCropWidth(width: number) {
    if (!cropping.value) return;
    const cw = canvasSize.value.width;
    const ch = canvasSize.value.height;
    const ratio = currentCropRatio();

    let w = Math.max(1, Math.round(width));
    if (cw > 0) w = Math.min(w, cw);

    let h: number;
    if (ratio) {
      h = w / ratio;
      if (ch > 0 && h > ch) {
        h = ch;
        w = h * ratio;
      }
    } else {
      h = normalizedCropBox.value.height;
    }

    applyExactCropSize(w, h);
  }

  // Exakte Höhe setzen (px). Bei aktivem Seitenverhältnis wird die Breite
  // mitgeführt; die Box bleibt innerhalb des Canvas.
  function setCropHeight(height: number) {
    if (!cropping.value) return;
    const cw = canvasSize.value.width;
    const ch = canvasSize.value.height;
    const ratio = currentCropRatio();

    let h = Math.max(1, Math.round(height));
    if (ch > 0) h = Math.min(h, ch);

    let w: number;
    if (ratio) {
      w = h * ratio;
      if (cw > 0 && w > cw) {
        w = cw;
        h = w / ratio;
      }
    } else {
      w = normalizedCropBox.value.width;
    }

    applyExactCropSize(w, h);
  }

  async function finishCrop(context: FinishCropContext) {
    const { canvas, currentImage, filters, imageStore } = context;

    const sourceCanvas = canvas.value;
    const sourceImage = currentImage.value;
    if (!cropping.value || !sourceCanvas || !sourceImage) return;

    cropping.value = false;

    const startX = Math.min(cropStart.value.x, cropEnd.value.x);
    const startY = Math.min(cropStart.value.y, cropEnd.value.y);
    const width = Math.abs(cropEnd.value.x - cropStart.value.x);
    const height = Math.abs(cropEnd.value.y - cropStart.value.y);

    if (width < 10 || height < 10) {
      clearCropSelection();
      logger.warn('Crop-Bereich zu klein (mindestens 10x10 Pixel)');
      if (window.$toast) {
        window.$toast.warning(t('toast.crop.tooSmall'), t('toast.crop.tooSmallDetail'));
      }
      return;
    }

    try {
      // Speichere das Bild VOR dem Zuschneiden (falls noch nicht gespeichert)
      if (!hasCropped.value) {
        // Erstelle temporäres Canvas NUR mit Bild (ohne Texte) für sauberes Backup
        const backupCanvas = document.createElement('canvas');
        const backupCtx = context2d(backupCanvas);
        backupCanvas.width = sourceCanvas.width;
        backupCanvas.height = sourceCanvas.height;

        // Kopiere nur das gerenderte Bild (ohne Texte) vom Canvas
        // Echte Tonwert-Anpassungen werden in die Quelle gebacken,
        // Effekt-Filter als CSS angewendet (identisch zur Vorschau).
        const { el: adjustedSource, cssFilter } = getAdjustedImage(sourceImage, filters.value);
        backupCtx.filter = cssFilter;
        backupCtx.drawImage(adjustedSource, 0, 0, backupCanvas.width, backupCanvas.height);
        backupCtx.filter = 'none';

        beforeCropImage.value = {
          dataUrl: backupCanvas.toDataURL('image/png'),
          width: sourceCanvas.width,
          height: sourceCanvas.height,
          filters: { ...filters.value },
          texts: imageStore ? [...imageStore.texts] : [],
          shapes: imageStore?.shapes ? JSON.parse(JSON.stringify(imageStore.shapes)) : [],
          borderRadius: context.borderRadiusBeforeCrop ?? 0,
        };
        logger.log('Original-Bild (ohne Texte) vor Crop gespeichert');
      }

      // cropStart und cropEnd sind bereits Canvas-Koordinaten (nicht Display-Koordinaten)
      // weil getMousePos() in EditorView.vue bereits die Skalierung durchführt
      const cropX = startX;
      const cropY = startY;
      const cropWidth = width;
      const cropHeight = height;

      logger.log(`Crop-Bereich: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`);

      // Validierung
      if (
        cropX < 0 ||
        cropY < 0 ||
        cropX + cropWidth > sourceCanvas.width ||
        cropY + cropHeight > sourceCanvas.height
      ) {
        logger.error(
          `Crop außerhalb: Canvas=${sourceCanvas.width}x${sourceCanvas.height}, Crop=${cropX},${cropY},${cropWidth},${cropHeight}`
        );
        if (window.$toast) {
          window.$toast.error(t('toast.crop.outOfBounds'));
        }
        throw new Error('Crop-Bereich muss vollständig auf dem Bild liegen');
      }

      // Erstelle temporäres Canvas NUR mit Bild (ohne Texte) für sauberen Crop
      const tempCanvas = document.createElement('canvas');
      const tempCtx = context2d(tempCanvas);
      tempCanvas.width = sourceCanvas.width;
      tempCanvas.height = sourceCanvas.height;

      // Rendere das Bild mit Filtern (OHNE Texte) - gleiche Logik wie beim Backup
      const { el: adjustedSource, cssFilter } = getAdjustedImage(sourceImage, filters.value);
      tempCtx.filter = cssFilter;
      tempCtx.drawImage(adjustedSource, 0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.filter = 'none';

      // Erstelle neues Canvas für zugeschnittenes Bild
      const cropCanvas = document.createElement('canvas');
      const cropCtx = context2d(cropCanvas);

      cropCanvas.width = Math.max(1, Math.round(cropWidth));
      cropCanvas.height = Math.max(1, Math.round(cropHeight));

      // High-quality rendering
      cropCtx.imageSmoothingEnabled = true;
      cropCtx.imageSmoothingQuality = 'high';

      // Prüfe ob Kreis-Preset aktiv ist
      const currentPreset = findCropPreset(selectedAspectRatio.value);
      const isCircleCrop = currentPreset?.isCircle === true;

      if (isCircleCrop) {
        // Kreisförmiger Zuschnitt: Verwende Clipping-Maske
        const centerX = cropCanvas.width / 2;
        const centerY = cropCanvas.height / 2;
        const radius = Math.min(cropCanvas.width, cropCanvas.height) / 2;

        // Erstelle kreisförmigen Clip-Pfad
        cropCtx.beginPath();
        cropCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        cropCtx.closePath();
        cropCtx.clip();

        // Zeichne das Bild innerhalb des Kreises
        cropCtx.drawImage(
          tempCanvas,
          Math.max(0, cropX),
          Math.max(0, cropY),
          Math.min(cropWidth, tempCanvas.width - cropX),
          Math.min(cropHeight, tempCanvas.height - cropY),
          0,
          0,
          cropCanvas.width,
          cropCanvas.height
        );
      } else {
        // Normaler rechteckiger Zuschnitt
        cropCtx.drawImage(
          tempCanvas,
          Math.max(0, cropX),
          Math.max(0, cropY),
          Math.min(cropWidth, tempCanvas.width - cropX),
          Math.min(cropHeight, tempCanvas.height - cropY),
          0,
          0,
          cropCanvas.width,
          cropCanvas.height
        );
      }

      // Passe Text-Positionen an
      if (imageStore && imageStore.texts) {
        const textsToRemove: StoreText['id'][] = [];

        imageStore.texts.forEach((text) => {
          // Wie bisher: fehlende Koordinaten vergleichen als NaN (nie außerhalb)
          const tx = Number(text.x);
          const ty = Number(text.y);
          if (tx < cropX || tx > cropX + cropWidth || ty < cropY || ty > cropY + cropHeight) {
            textsToRemove.push(text.id);
          } else {
            imageStore.updateText(text.id, {
              x: tx - cropX,
              y: ty - cropY,
            });
          }
        });

        textsToRemove.forEach((id) => {
          imageStore.deleteText(id);
        });

        logger.log(`Text-Positionen angepasst. ${textsToRemove.length} Texte entfernt.`);
      }

      // Formen verschieben bzw. entfernen (Mittelpunkt außerhalb des Ausschnitts)
      if (imageStore && Array.isArray(imageStore.shapes)) {
        cropShapes(imageStore.shapes, { x: cropX, y: cropY, width: cropWidth, height: cropHeight });
        if (
          imageStore.selectedShapeId &&
          !imageStore.shapes.some((s) => s.id === imageStore.selectedShapeId)
        ) {
          imageStore.selectedShapeId = null;
        }
      }

      // Lade das zugeschnittene Bild
      const croppedDataUrl = cropCanvas.toDataURL('image/png');
      const img = new Image();

      img.onload = () => {
        // Callback für externe Updates (mit isCircle Flag für automatischen Kreis-Rahmen)
        let finalSize = { width: cropCanvas.width, height: cropCanvas.height };
        if (context.onCropComplete) {
          finalSize =
            context.onCropComplete(
              img,
              cropCanvas.width,
              cropCanvas.height,
              isCircleCrop,
              currentPreset?.target
            ) ?? finalSize;
        }

        // Markiere dass zugeschnitten wurde
        hasCropped.value = true;

        logger.log(`Bild zugeschnitten: ${finalSize.width}×${finalSize.height}px`);
        if (window.$toast) {
          window.$toast.success(
            t('toast.crop.success', {
              width: finalSize.width,
              height: finalSize.height,
            })
          );
        }
      };

      img.src = croppedDataUrl;

      // Beende Crop-Modus
      cropMode.value = false;
      clearCropSelection();
    } catch (error) {
      logger.error('Crop-Fehler:', error);
      if (window.$toast) {
        window.$toast.error(t('toast.crop.error'), (error as Error).message);
      }
      clearCropSelection();
    }
  }

  async function undoCrop(context: UndoCropContext) {
    const before = beforeCropImage.value;
    if (!hasCropped.value || !before) {
      if (window.$toast) {
        window.$toast.warning(t('toast.crop.undoNotAvailable'));
      }
      return;
    }

    const confirmed = await confirmDialog(
      'Möchten Sie den Zuschnitt rückgängig machen und das Original-Bild wiederherstellen?',
      {
        title: 'Zuschnitt rückgängig?',
        confirmText: 'Rückgängig',
        cancelText: 'Abbrechen',
        variant: 'warning',
      }
    );
    if (!confirmed) return;

    const { imageStore } = context;

    // Lade das gespeicherte Bild vor dem Crop
    const img = new Image();
    img.onload = () => {
      // Stelle Texte wieder her
      if (imageStore && before.texts) {
        // Leere das Array komplett
        imageStore.texts.splice(0, imageStore.texts.length);

        // Füge Original-Texte wieder ein (behält IDs)
        imageStore.texts.splice(0, 0, ...before.texts);

        logger.log(`✅ ${imageStore.texts.length} Texte wiederhergestellt`);
      }
      // Formen wiederherstellen
      if (imageStore && Array.isArray(before.shapes)) {
        imageStore.shapes = JSON.parse(JSON.stringify(before.shapes));
        imageStore.selectedShapeId = null;
      }

      // Callback für externe Updates
      if (context.onUndoComplete) {
        context.onUndoComplete(img, before);
      }

      // Zurücksetzen
      hasCropped.value = false;
      beforeCropImage.value = null;

      logger.log('✅ Original-Bild erfolgreich wiederhergestellt');
      if (window.$toast) {
        window.$toast.success(t('toast.crop.undoSuccess'));
      }
    };

    img.src = before.dataUrl;
  }

  // Bricht den laufenden Zuschneide-Vorgang ab: verlässt den Crop-Modus und
  // verwirft die aktuelle Auswahl, ohne zuzuschneiden. Ein bereits
  // angewandter Zuschnitt (hasCropped) bleibt unberührt.
  function cancelCrop() {
    cropMode.value = false;
    clearCropSelection();
    selectedAspectRatio.value = 'free';
    if (window.$toast) {
      window.$toast.info(t('toast.crop.cancelled', 'Zuschneiden abgebrochen'));
    }
  }

  function resetCropState() {
    if (cropMode.value) {
      cropMode.value = false;
      clearCropSelection();
    }
    hasCropped.value = false;
    beforeCropImage.value = null;
  }

  // Event Handlers für einfache Integration
  function handleMouseDown(pos: CropPoint, displayScale = 1) {
    if (!cropMode.value) return false;

    const { x, y } = pos;

    // Prüfe zuerst ob ein Resize-Handle getroffen wurde
    const handle = getHandleAtPoint(x, y, displayScale);
    if (handle) {
      isResizing.value = true;
      activeHandle.value = handle;
      return true;
    }

    // Prüfe ob innerhalb der bestehenden Crop-Box geklickt wurde
    if (isPointInCropBox(x, y)) {
      isDragging.value = true;
      const box = normalizedCropBox.value;
      dragOffset.value = { x: x - box.x, y: y - box.y };
      return true;
    }

    // Ansonsten starte eine neue Crop-Auswahl
    startCrop(x, y);
    return true;
  }

  function handleMouseMove(pos: CropPoint) {
    const { x, y } = pos;

    // Resize-Modus
    if (isResizing.value) {
      resizeCropBox(x, y);
      return true;
    }

    // Drag-Modus (Box verschieben)
    if (isDragging.value) {
      moveCropBox(x, y);
      return true;
    }

    // Neue Auswahl wird erstellt (User zieht gerade eine neue Box auf)
    if (isCreating.value) {
      updateCrop(x, y);
      return true;
    }

    return false;
  }

  function handleMouseUp() {
    const wasResizing = isResizing.value;
    const wasDragging = isDragging.value;
    const wasCreating = isCreating.value;

    isResizing.value = false;
    isDragging.value = false;
    isCreating.value = false;
    activeHandle.value = null;

    // Wenn wir verschoben, resized oder neu erstellt haben, nicht finishen
    // Der User muss explizit den Bestätigen-Button klicken
    if (wasResizing || wasDragging || wasCreating) {
      return false;
    }

    return false;
  }

  // Cursor-Style basierend auf Position
  function getCursorForPosition(x: number, y: number, displayScale = 1) {
    if (!cropMode.value || !cropping.value) return 'crosshair';

    const handle = getHandleAtPoint(x, y, displayScale);
    if (handle) {
      const cursors: Record<CropHandle, string> = {
        nw: 'nwse-resize',
        se: 'nwse-resize',
        ne: 'nesw-resize',
        sw: 'nesw-resize',
        n: 'ns-resize',
        s: 'ns-resize',
        e: 'ew-resize',
        w: 'ew-resize',
      };
      return cursors[handle] || 'move';
    }

    if (isPointInCropBox(x, y)) {
      return 'move';
    }

    return 'crosshair';
  }

  // Stoppe alle aktiven Drag/Resize-Operationen (für globales mouseup)
  function cancelDragResize() {
    isResizing.value = false;
    isDragging.value = false;
    isCreating.value = false;
    activeHandle.value = null;
  }

  return {
    // State
    cropMode,
    cropping,
    hasCropped,
    cropOverlayStyle,
    selectedAspectRatio,
    isDragging,
    isResizing,
    isCreating,
    normalizedCropBox,
    cropDimensions,
    cropOutputSize,

    // Methods
    toggleCropMode,
    finishCrop,
    undoCrop,
    cancelCrop,
    resetCropState,
    clearCropSelection,
    setAspectRatio,
    setCanvasSize,
    setCropWidth,
    setCropHeight,
    centerCropBox,
    getCursorForPosition,
    getHandleAtPoint,
    cancelDragResize,

    // Event Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
