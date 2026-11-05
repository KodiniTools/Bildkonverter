import { getAdjustedImage } from '@/utils/imageAdjustments';
import { drawLayerSelection } from '@/composables/useCanvasRenderer';
import { drawText, drawTextSelection, normalizeText } from '@/utils/textUtils';
import { drawShape } from '@/utils/shapes';
import type { ImageStoreContext } from './types';

type DrawState = Omit<ImageStoreContext, 'draw'>;

/**
 * Schnelle Zwischenansicht nach Store-Aktionen: Bild oder Bild-Layer
 * plus Formen und Texte. Die vollständige Darstellung (Filter,
 * Transformationen, Schatten, Rahmen) übernimmt useCanvasRenderer im Editor.
 */
export function useImageDraw(state: DrawState) {
  const { canvas, ctx, originalImage, imageWidth, imageHeight, imageLayers, shapes, texts } = state;

  /** Zeichnet alle sichtbaren Bild-Layer */
  function drawImageLayers(context: CanvasRenderingContext2D) {
    imageLayers.value.forEach((layer) => {
      if (!layer.visible) return;

      context.save();

      // Deckkraft
      context.globalAlpha = layer.opacity / 100;

      // Echte, pixelbasierte Tonwert-Anpassungen in die Ebenen-Quelle backen;
      // Effekt-Filter (Graustufen, Sepia) bleiben CSS-Filter.
      const { el: layerSource, cssFilter: layerCssFilter } = getAdjustedImage(
        layer.image as HTMLImageElement,
        layer.filters
      );
      context.filter = layerCssFilter;

      // Rotation um Mittelpunkt
      if (layer.rotation !== 0) {
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        context.translate(centerX, centerY);
        context.rotate((layer.rotation * Math.PI) / 180);
        context.translate(-centerX, -centerY);
      }

      // Bild zeichnen
      context.drawImage(layerSource, layer.x, layer.y, layer.width, layer.height);

      context.restore();

      // Auswahl-Rahmen zeichnen
      if (layer.id === state.selectedLayerId.value) {
        drawLayerSelection(context, layer);
      }
    });
  }

  /** Zeichnet alle Text-Elemente */
  function drawTexts(context: CanvasRenderingContext2D | null) {
    if (!context) return;

    texts.value.forEach((text) => {
      const normalizedText = normalizeText(text);
      drawText(context, normalizedText);

      // Zeige Selection für ausgewählten Text
      if (text.id === state.selectedTextId.value) {
        drawTextSelection(context, normalizedText, true);
      }
    });
  }

  function draw() {
    if (!ctx.value) return;

    const c = ctx.value;

    // Canvas leeren
    c.clearRect(0, 0, canvas.value!.width, canvas.value!.height);

    // Collage-Modus: Zeichne Bild-Layer
    if (imageLayers.value.length > 0) {
      drawImageLayers(c);
    } else if (originalImage.value) {
      // Normaler Modus: Einzelnes Bild
      c.drawImage(originalImage.value, 0, 0, imageWidth.value, imageHeight.value);
    }

    c.filter = 'none';

    // Formen unter den Texten
    shapes.value.forEach((shape) => drawShape(c, shape));

    // Texte zeichnen
    drawTexts(c);
  }

  return { draw };
}
