import { computed, type ComputedRef, type Ref } from 'vue';

/** Pixelangaben der Crop-Box in Canvas-Koordinaten, wie useCrop sie liefert */
export interface CropBoxStyle {
  left: string;
  top: string;
  width: string;
  height: string;
}

export interface CropSize {
  width: number;
  height: number;
}

export interface CropOverlayOptions {
  canvas: Ref<HTMLCanvasElement | null | undefined>;
  /** Crop-Box in Canvas-Pixeln (null, solange keine Auswahl existiert) */
  cropOverlayStyle: Ref<CropBoxStyle | null>;
  cropping: Ref<boolean>;
  cropDimensions: Ref<CropSize>;
}

/** Ab diesem Abstand zum oberen Rand passt das Abmessungs-Label über die Box */
export const CROP_LABEL_SPACE = 34;

const parsePixels = (value: string): number => parseFloat(value) || 0;

/**
 * Rechnet die Crop-Box von Canvas- in Anzeige-Koordinaten um (das Canvas wird
 * per CSS skaliert) und liefert die Werte für CropOverlay und CropPanel.
 */
export function useCropOverlay({
  canvas,
  cropOverlayStyle,
  cropping,
  cropDimensions,
}: CropOverlayOptions) {
  const cropOverlayRect = computed(() => {
    const el = canvas.value;
    const box = cropOverlayStyle.value;
    if (!box || !el) return null;

    const canvasRect = el.getBoundingClientRect();
    const containerRect = el.parentElement!.getBoundingClientRect();

    const scaleX = canvasRect.width / el.width;
    const scaleY = canvasRect.height / el.height;
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    return {
      left: offsetX + parsePixels(box.left) * scaleX,
      top: offsetY + parsePixels(box.top) * scaleY,
      width: parsePixels(box.width) * scaleX,
      height: parsePixels(box.height) * scaleY,
    };
  });

  const scaledCropOverlayStyle: ComputedRef<CropBoxStyle | null> = computed(() => {
    const rect = cropOverlayRect.value;
    if (!rect) return null;
    return {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
  });

  // Label sitzt über der Box; klebt die Box oben, klappt es nach innen.
  const cropLabelInside = computed(() => {
    const rect = cropOverlayRect.value;
    return rect ? rect.top < CROP_LABEL_SPACE : false;
  });

  // Abmessungen für das Crop-Panel, nur solange eine Auswahl existiert
  const panelCropDimensions = computed<CropSize>(() =>
    cropping.value ? cropDimensions.value : { width: 0, height: 0 }
  );

  return { scaledCropOverlayStyle, cropLabelInside, panelCropDimensions };
}
