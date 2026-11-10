/**
 * useTransform.ts - Composable für Transformationen
 * Deckkraft, Rotation, Drehen, Spiegeln, Zoom, Pan, etc.
 * Undo/Redo läuft über die gemeinsame Editor-Historie (useImageHistory).
 */

import { ref, computed } from 'vue';
import type { TransformState } from '@/types/transform';
import { context2d } from '@/utils/canvas2d';
import {
  CORNERS,
  emptyOffsets,
  hasDistortion as offsetsDistorted,
  type Corner,
  type CornerOffsets,
  type QuadCorners,
} from '@/utils/warpImage';

/** Ergebnis von applyPermanently */
export interface TransformedImage {
  img: HTMLImageElement;
  width: number;
  height: number;
}

// Standardwerte für Transformationen
const DEFAULT_TRANSFORMS: TransformState = {
  opacity: 100, // 0-100%
  rotation: 0, // -180 bis +180 Grad
  scale: 100, // 10-200%
  flipHorizontal: false, // true/false
  flipVertical: false, // true/false
  borderRadius: 0, // 0-50% (50% = vollständiger Kreis)
  borderWidth: 0, // 0-20px
  borderColor: '#000000', // Hex color
  panX: 0, // Pan-Offset X (in Pixeln)
  panY: 0, // Pan-Offset Y (in Pixeln)
  // Schlagschatten (Drop Shadow)
  shadowEnabled: false, // true/false
  shadowOffsetX: 10, // -50 bis +50 px
  shadowOffsetY: 10, // -50 bis +50 px
  shadowBlur: 20, // 0-100 px
  shadowColor: '#000000', // Hex color
  shadowOpacity: 50, // 0-100%
  // Skew/Neigung
  skewX: 0, // -45 bis +45 Grad
  skewY: 0, // -45 bis +45 Grad
  // Freies Verzerren (Distort / Eckpunkt-Pinning): Ist es aktiv, lassen sich die
  // 4 Bildecken im Canvas einzeln ziehen.
  distortEnabled: false, // true/false
  // Normierte Eck-Versätze {nw,ne,se,sw: {x,y}} (Anteil der Bildbreite/-höhe),
  // null = unverzerrt. Wird immer als neues Objekt ersetzt (die Historie
  // kopiert transforms nur flach).
  cornerOffsets: null,
  // Umrissform nach "Verzerrung übernehmen" (normiert 0..1 im Bild), null =
  // Rechteck. Schatten, runde Ecken und Rahmen folgen dieser Form.
  shapeQuad: null,
};

export function useTransform() {
  // State
  const transforms = ref<TransformState>({ ...DEFAULT_TRANSFORMS });

  // Computed - CSS Transform String
  const transformStyle = computed(() => {
    const parts: string[] = [];

    // Rotation
    if (transforms.value.rotation !== 0) {
      parts.push(`rotate(${transforms.value.rotation}deg)`);
    }

    // Scale
    const scaleValue = transforms.value.scale / 100;
    if (scaleValue !== 1) {
      parts.push(`scale(${scaleValue})`);
    }

    // Flip
    const flipX = transforms.value.flipHorizontal ? -1 : 1;
    const flipY = transforms.value.flipVertical ? -1 : 1;
    if (flipX !== 1 || flipY !== 1) {
      parts.push(`scale(${flipX}, ${flipY})`);
    }

    return parts.length > 0 ? parts.join(' ') : 'none';
  });

  // Methods

  /**
   * Setze Deckkraft
   */
  function setOpacity(value: number) {
    transforms.value.opacity = Math.max(0, Math.min(100, value));
  }

  /**
   * Setze Rotation
   */
  function setRotation(degrees: number) {
    transforms.value.rotation = degrees;
    // Normalisiere auf -180 bis +180
    while (transforms.value.rotation > 180) {
      transforms.value.rotation -= 360;
    }
    while (transforms.value.rotation < -180) {
      transforms.value.rotation += 360;
    }
  }

  /**
   * Drehe um fixe Grad
   */
  function rotate(degrees: number) {
    setRotation(transforms.value.rotation + degrees);
  }

  /**
   * Drehe 90° im Uhrzeigersinn
   */
  function rotate90() {
    rotate(90);
  }

  /**
   * Drehe 90° gegen Uhrzeigersinn
   */
  function rotate90Counter() {
    rotate(-90);
  }

  /**
   * Drehe 180°
   */
  function rotate180() {
    rotate(180);
  }

  /**
   * Spiegeln horizontal
   */
  function flipHorizontal() {
    transforms.value.flipHorizontal = !transforms.value.flipHorizontal;
  }

  /**
   * Spiegeln vertikal
   */
  function flipVertical() {
    transforms.value.flipVertical = !transforms.value.flipVertical;
  }

  /**
   * Setze Zoom/Skalierung
   */
  function setScale(value: number) {
    transforms.value.scale = Math.max(10, Math.min(200, value));
    // Bei Zoom <= 100% Pan zurücksetzen
    if (transforms.value.scale <= 100) {
      transforms.value.panX = 0;
      transforms.value.panY = 0;
    }
  }

  /**
   * Setze Pan-Offset
   */
  function setPan(x: number, y: number) {
    // Pan nur erlauben wenn gezoomt
    if (transforms.value.scale <= 100) {
      transforms.value.panX = 0;
      transforms.value.panY = 0;
      return;
    }
    transforms.value.panX = x;
    transforms.value.panY = y;
  }

  /**
   * Pan-Offset verschieben (relativ)
   */
  function pan(deltaX: number, deltaY: number) {
    if (transforms.value.scale <= 100) return;

    // Begrenze Pan basierend auf Zoom-Level
    const maxPan = (transforms.value.scale - 100) * 3; // Skalierter Max-Wert

    const newX = transforms.value.panX + deltaX;
    const newY = transforms.value.panY + deltaY;

    transforms.value.panX = Math.max(-maxPan, Math.min(maxPan, newX));
    transforms.value.panY = Math.max(-maxPan, Math.min(maxPan, newY));
  }

  /**
   * Pan zurücksetzen
   */
  function resetPan() {
    transforms.value.panX = 0;
    transforms.value.panY = 0;
  }

  /**
   * Setze Ecken-Rundung
   */
  function setBorderRadius(value: number) {
    transforms.value.borderRadius = Math.max(0, Math.min(50, value));
  }

  /**
   * Setze Rahmen-Dicke
   */
  function setBorderWidth(value: number) {
    transforms.value.borderWidth = Math.max(0, Math.min(20, value));
  }

  /**
   * Setze Rahmen-Farbe
   */
  function setBorderColor(color: string) {
    transforms.value.borderColor = color;
  }

  /**
   * Setze Schlagschatten aktiviert/deaktiviert
   */
  function setShadowEnabled(enabled: boolean) {
    transforms.value.shadowEnabled = enabled;
  }

  /**
   * Setze Schlagschatten X-Offset
   */
  function setShadowOffsetX(value: number) {
    transforms.value.shadowOffsetX = Math.max(-50, Math.min(50, value));
  }

  /**
   * Setze Schlagschatten Y-Offset
   */
  function setShadowOffsetY(value: number) {
    transforms.value.shadowOffsetY = Math.max(-50, Math.min(50, value));
  }

  /**
   * Setze Schlagschatten Blur
   */
  function setShadowBlur(value: number) {
    transforms.value.shadowBlur = Math.max(0, Math.min(100, value));
  }

  /**
   * Setze Schlagschatten Farbe
   */
  function setShadowColor(color: string) {
    transforms.value.shadowColor = color;
  }

  /**
   * Setze Schlagschatten Deckkraft
   */
  function setShadowOpacity(value: number) {
    transforms.value.shadowOpacity = Math.max(0, Math.min(100, value));
  }

  /**
   * Setze Skew X (horizontale Neigung)
   */
  function setSkewX(value: number) {
    transforms.value.skewX = Math.max(-45, Math.min(45, value));
  }

  /**
   * Setze Skew Y (vertikale Neigung)
   */
  function setSkewY(value: number) {
    transforms.value.skewY = Math.max(-45, Math.min(45, value));
  }

  /**
   * Freies Verzerren an-/ausschalten. Die Eck-Versätze bleiben erhalten,
   * wirken aber nur, solange der Modus aktiv ist.
   */
  function setDistortEnabled(enabled: unknown) {
    transforms.value.distortEnabled = !!enabled;
  }

  function toggleDistort() {
    setDistortEnabled(!transforms.value.distortEnabled);
  }

  /**
   * Setze den normierten Versatz einer einzelnen Ecke (immutabel).
   */
  function setCornerOffset(corner: Corner, offset: { x?: number; y?: number } | null | undefined) {
    if (!CORNERS.includes(corner)) return;
    const x = offset && Number.isFinite(offset.x) ? Number(offset.x) : 0;
    const y = offset && Number.isFinite(offset.y) ? Number(offset.y) : 0;
    const base = transforms.value.cornerOffsets ?? emptyOffsets();
    const next: CornerOffsets = {
      nw: { ...base.nw },
      ne: { ...base.ne },
      se: { ...base.se },
      sw: { ...base.sw },
      [corner]: { x, y },
    };
    transforms.value.cornerOffsets = offsetsDistorted(next) ? next : null;
  }

  /**
   * Verzerrung zurücksetzen (Ecken auf 0), Modus bleibt aktiv
   */
  function resetDistort() {
    transforms.value.cornerOffsets = null;
  }

  /**
   * Nach dem Backen der Verzerrung: Umrissform merken, Modus beenden.
   */
  function commitDistortion(shapeQuad: QuadCorners | null | undefined) {
    transforms.value.shapeQuad = shapeQuad ?? null;
    transforms.value.cornerOffsets = null;
    transforms.value.distortEnabled = false;
  }

  /** Umrissform verwerfen (z.B. nach einem Zuschnitt, der sie ungültig macht) */
  function clearShape() {
    transforms.value.shapeQuad = null;
  }

  /**
   * Wende Transformationen auf Canvas an
   */
  function applyToCanvas(
    canvas: HTMLCanvasElement | null | undefined,
    context: CanvasRenderingContext2D | null | undefined
  ): (() => void) | undefined {
    if (!canvas || !context) return;

    // Deckkraft
    context.globalAlpha = transforms.value.opacity / 100;

    // Transform matrix anwenden
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    context.save();
    context.translate(centerX, centerY);

    // Pan-Offset anwenden (nur bei Zoom > 100%)
    if (
      transforms.value.scale > 100 &&
      (transforms.value.panX !== 0 || transforms.value.panY !== 0)
    ) {
      context.translate(transforms.value.panX, transforms.value.panY);
    }

    // Rotation
    if (transforms.value.rotation !== 0) {
      const radians = (transforms.value.rotation * Math.PI) / 180;
      context.rotate(radians);
    }

    // Scale
    const scaleValue = transforms.value.scale / 100;
    if (scaleValue !== 1) {
      context.scale(scaleValue, scaleValue);
    }

    // Flip
    if (transforms.value.flipHorizontal || transforms.value.flipVertical) {
      const flipX = transforms.value.flipHorizontal ? -1 : 1;
      const flipY = transforms.value.flipVertical ? -1 : 1;
      context.scale(flipX, flipY);
    }

    // Skew/Neigung
    if (transforms.value.skewX !== 0 || transforms.value.skewY !== 0) {
      const skewXRad = Math.tan((transforms.value.skewX * Math.PI) / 180);
      const skewYRad = Math.tan((transforms.value.skewY * Math.PI) / 180);
      context.transform(1, skewYRad, skewXRad, 1, 0, 0);
    }

    context.translate(-centerX, -centerY);

    return () => {
      context.restore();
      context.globalAlpha = 1;
    };
  }

  /**
   * Wende Transformationen permanent auf Bild an (erstellt neues Bild)
   */
  async function applyPermanently(
    currentImage: CanvasImageSource | null | undefined,
    canvas: HTMLCanvasElement | null | undefined
  ): Promise<TransformedImage | null> {
    if (!currentImage || !canvas) return null;

    return new Promise<TransformedImage>((resolve, reject) => {
      try {
        // Berechne neue Dimensionen basierend auf Rotation, Scale und Skew
        const radians = (transforms.value.rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));

        const scaleValue = transforms.value.scale / 100;

        // Skew-Overflow berechnen
        const skewOverflowX =
          Math.abs(Math.tan((transforms.value.skewX * Math.PI) / 180)) * canvas.height;
        const skewOverflowY =
          Math.abs(Math.tan((transforms.value.skewY * Math.PI) / 180)) * canvas.width;

        const baseWidth = canvas.width + skewOverflowX;
        const baseHeight = canvas.height + skewOverflowY;

        const newWidth = Math.round((baseWidth * cos + baseHeight * sin) * scaleValue);
        const newHeight = Math.round((baseWidth * sin + baseHeight * cos) * scaleValue);

        // Erstelle temporäres Canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        const tempCtx = context2d(tempCanvas);

        // High quality
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';

        // Deckkraft
        tempCtx.globalAlpha = transforms.value.opacity / 100;

        // Zentriere und transformiere
        tempCtx.save();
        tempCtx.translate(newWidth / 2, newHeight / 2);

        // Rotation
        if (transforms.value.rotation !== 0) {
          tempCtx.rotate(radians);
        }

        // Scale
        if (scaleValue !== 1) {
          tempCtx.scale(scaleValue, scaleValue);
        }

        // Flip
        if (transforms.value.flipHorizontal || transforms.value.flipVertical) {
          const flipX = transforms.value.flipHorizontal ? -1 : 1;
          const flipY = transforms.value.flipVertical ? -1 : 1;
          tempCtx.scale(flipX, flipY);
        }

        // Skew/Neigung
        if (transforms.value.skewX !== 0 || transforms.value.skewY !== 0) {
          const skewXRad = Math.tan((transforms.value.skewX * Math.PI) / 180);
          const skewYRad = Math.tan((transforms.value.skewY * Math.PI) / 180);
          tempCtx.transform(1, skewYRad, skewXRad, 1, 0, 0);
        }

        // Zeichne Bild
        tempCtx.drawImage(
          currentImage,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas.width,
          canvas.height
        );

        tempCtx.restore();

        // Konvertiere zu Bild
        const dataUrl = tempCanvas.toDataURL('image/png');
        const img = new Image();

        img.onload = () => {
          resolve({ img, width: newWidth, height: newHeight });
        };

        img.onerror = () => {
          reject(new Error('Fehler beim Laden des transformierten Bildes'));
        };

        img.src = dataUrl;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Alle Transformationen zurücksetzen
   */
  function resetTransforms() {
    transforms.value = { ...DEFAULT_TRANSFORMS };
  }

  /**
   * Prüfe ob eine Verzerrung sichtbar wirkt (Modus aktiv UND Ecken versetzt)
   */
  const hasDistortion = computed(() => {
    return !!transforms.value.distortEnabled && offsetsDistorted(transforms.value.cornerOffsets);
  });

  /**
   * Prüfe ob Transformationen aktiv sind
   */
  const hasTransforms = computed(() => {
    return (
      transforms.value.opacity !== 100 ||
      transforms.value.rotation !== 0 ||
      transforms.value.scale !== 100 ||
      transforms.value.flipHorizontal ||
      transforms.value.flipVertical ||
      transforms.value.borderRadius !== 0 ||
      transforms.value.borderWidth !== 0 ||
      transforms.value.shadowEnabled ||
      transforms.value.skewX !== 0 ||
      transforms.value.skewY !== 0 ||
      hasDistortion.value
    );
  });

  /**
   * Prüfe ob Skew aktiv ist
   */
  const hasSkew = computed(() => {
    return transforms.value.skewX !== 0 || transforms.value.skewY !== 0;
  });

  /**
   * Prüfe ob Schlagschatten aktiv ist
   */
  const hasShadow = computed(() => {
    return transforms.value.shadowEnabled;
  });

  /**
   * Prüfe ob Pan aktiv ist
   */
  const hasPan = computed(() => {
    return transforms.value.panX !== 0 || transforms.value.panY !== 0;
  });

  /**
   * Prüfe ob Panning erlaubt ist (nur bei Zoom > 100%)
   */
  const canPan = computed(() => {
    return transforms.value.scale > 100;
  });

  return {
    // State
    transforms,
    transformStyle,
    hasTransforms,
    hasPan,
    canPan,
    hasShadow,
    hasSkew,
    hasDistortion,

    // Methods
    setOpacity,
    setRotation,
    rotate,
    rotate90,
    rotate90Counter,
    rotate180,
    flipHorizontal,
    flipVertical,
    setScale,
    setPan,
    pan,
    resetPan,
    setBorderRadius,
    setBorderWidth,
    setBorderColor,
    // Shadow methods
    setShadowEnabled,
    setShadowOffsetX,
    setShadowOffsetY,
    setShadowBlur,
    setShadowColor,
    setShadowOpacity,
    // Skew methods
    setSkewX,
    setSkewY,
    // Distort methods
    setDistortEnabled,
    toggleDistort,
    setCornerOffset,
    resetDistort,
    commitDistortion,
    clearShape,
    applyToCanvas,
    applyPermanently,
    resetTransforms,
  };
}
