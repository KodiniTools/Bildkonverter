/**
 * useCanvasRenderer Composable
 * Extrahiert Canvas-Rendering-Logik aus EditorView.vue
 */

import { buildTextFontString, applyTextTransform } from '@/utils/textRender';
import { getAdjustedImage } from '@/utils/imageAdjustments';
import { logger } from '@/utils/logger';

/**
 * Zeichnet den Auswahl-Rahmen mit Resize-Handles für eine Bild-Ebene.
 * Modulweit exportiert, damit auch die Zwischenansicht des imageStore ihn nutzt.
 */
export function drawLayerSelection(context, layer) {
  context.save();

  // Rotation für Auswahl-Rahmen
  if (layer.rotation !== 0) {
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    context.translate(centerX, centerY);
    context.rotate((layer.rotation * Math.PI) / 180);
    context.translate(-centerX, -centerY);
  }

  // Gestrichelter Rahmen
  context.strokeStyle = '#014f99';
  context.lineWidth = 2;
  context.setLineDash([5, 5]);
  context.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);

  // Resize-Handles
  context.setLineDash([]);
  context.fillStyle = '#014f99';
  const handleSize = 8;
  const handles = [
    { x: layer.x - handleSize / 2, y: layer.y - handleSize / 2 },
    { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y - handleSize / 2 },
    { x: layer.x + layer.width - handleSize / 2, y: layer.y - handleSize / 2 },
    { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 },
    { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
    { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
    { x: layer.x - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
    { x: layer.x - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 },
  ];

  handles.forEach((pos) => {
    context.fillRect(pos.x, pos.y, handleSize, handleSize);
  });

  context.restore();
}

/**
 * @param {Object} options
 * @param {import('vue').Ref<HTMLCanvasElement>} options.canvas
 * @param {import('vue').Ref<HTMLImageElement>} options.currentImage
 * @param {import('vue').Ref<boolean>} options.isCollageMode
 * @param {Object} options.imageStore - Pinia store instance
 * @param {Object} options.transform - useTransform() composable instance
 * @param {import('vue').Ref<Object>} options.filters - reactive filters ref
 * @param {import('vue').Ref<Object>} options.background - reactive background ref
 * @param {import('vue').Ref<number|null>} options.selectedTextId
 */
export function useCanvasRenderer({
  canvas,
  currentImage,
  isCollageMode,
  imageStore,
  transform,
  filters,
  background,
  selectedTextId,
}) {
  // Helper-Funktion für abgerundete Rechtecke
  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Berechnet den Border-Radius in Pixeln aus dem Prozentwert (50% = perfekter Kreis)
  function getBorderRadiusPixels() {
    if (!canvas.value) return 0;
    const percentage = transform.transforms.value.borderRadius;
    return (percentage / 100) * Math.min(canvas.value.width, canvas.value.height);
  }

  // Zeichnet Text-Auswahl als Overlay (nur visuell, nicht Teil des exportierten Bildes)
  function drawTextSelection() {
    if (!canvas.value || !selectedTextId.value) return;

    const ctx = canvas.value.getContext('2d');
    const text = imageStore.texts?.find((t) => t.id === selectedTextId.value);
    if (!text) return;

    ctx.save();
    ctx.font = buildTextFontString(text);
    const metrics = ctx.measureText(text.content || text.txt || '');
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      text.x - 4,
      text.y - 4,
      metrics.width + 8,
      (text.fontSize || text.size || 32) + 8
    );
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Schnelle Funktion: nur Dimensionen aktualisieren (wird bei jedem renderImage() aufgerufen)
  function updateImageDimensions() {
    // This is a helper used inside renderImage; the actual ref updates happen in EditorView
    // We expose it so EditorView can call it directly too
    if (!canvas.value) return;
    // Note: imageWidth/imageHeight refs live in EditorView; this composable calls this as a side-effect marker
  }

  // Wandelt eine Hex-Farbe (#rrggbb) in einen rgba()-String mit Deckkraft um
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Setzt Canvas-Schatten auf die Werte eines Layers (Collage-Modus)
  function applyLayerShadow(ctx, layer) {
    ctx.shadowColor = hexToRgba(
      layer.shadow.color || '#000000',
      (layer.shadow.opacity || 50) / 100
    );
    ctx.shadowBlur = layer.shadow.blur || 10;
    ctx.shadowOffsetX = layer.shadow.offsetX || 5;
    ctx.shadowOffsetY = layer.shadow.offsetY || 5;
  }

  function clearShadow(ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Zeichnet eine einzelne Bild-Ebene (Collage-Modus) mit Deckkraft, Filtern,
   * Rotation, Spiegelung, Schatten, abgerundeten Ecken und Umrandung.
   */
  function drawImageLayer(ctx, layer) {
    ctx.save();

    // Deckkraft
    ctx.globalAlpha = layer.opacity / 100;

    // Echte, pixelbasierte Tonwert-Anpassungen (Helligkeit, Kontrast,
    // Sättigung) werden in die Ebenen-Quelle gebacken; Effekt-Filter
    // (Graustufen, Sepia) bleiben CSS-Filter – wie beim Hauptbild.
    const { el: layerSource, cssFilter: layerCssFilter } = getAdjustedImage(
      layer.image,
      layer.filters
    );
    ctx.filter = layerCssFilter;

    // Rotation um Mittelpunkt
    if (layer.rotation !== 0) {
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Spiegelung (horizontal und/oder vertikal)
    if (layer.flipX || layer.flipY) {
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
      ctx.translate(-centerX, -centerY);
    }

    const hasShadow = layer.shadow && layer.shadow.enabled;
    const borderRadiusPercent = layer.border?.radius || 0;
    const borderWidth = layer.border?.width || 0;
    // Radius in Pixeln (Prozent bezogen auf die halbe kleinere Kante)
    const rad = (borderRadiusPercent / 100) * (Math.min(layer.width, layer.height) / 2);

    // Schlagschatten - MUSS VOR dem Clipping gezeichnet werden
    if (hasShadow && borderRadiusPercent > 0) {
      // Bei abgerundeten Ecken: Schatten als separate, deckend gefüllte Form,
      // die später vom geclippten Bild überdeckt wird
      ctx.save();
      applyLayerShadow(ctx, layer);
      ctx.fillStyle = '#ffffff';
      roundedRect(ctx, layer.x, layer.y, layer.width, layer.height, rad);
      ctx.fill();
      ctx.restore();
    } else if (hasShadow) {
      // Ohne Radius: Schatten direkt am gezeichneten Bild
      applyLayerShadow(ctx, layer);
    }

    if (borderRadiusPercent > 0) {
      // Bild innerhalb eines abgerundeten Clipping-Pfads zeichnen
      ctx.save();
      clearShadow(ctx);
      roundedRect(ctx, layer.x, layer.y, layer.width, layer.height, rad);
      ctx.clip();
      ctx.drawImage(layerSource, layer.x, layer.y, layer.width, layer.height);
      ctx.restore();

      clearShadow(ctx);
      if (borderWidth > 0) {
        ctx.strokeStyle = layer.border?.color || '#000000';
        ctx.lineWidth = borderWidth;
        roundedRect(ctx, layer.x, layer.y, layer.width, layer.height, rad);
        ctx.stroke();
      }
    } else {
      ctx.drawImage(layerSource, layer.x, layer.y, layer.width, layer.height);

      clearShadow(ctx);
      if (borderWidth > 0) {
        ctx.strokeStyle = layer.border?.color || '#000000';
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
      }
    }

    ctx.restore();
  }

  /**
   * Zeichnet eine Text-Ebene mit Deckkraft, Rotation/Neigung, Schatten und Kontur.
   * @param {boolean} inlineSelection Auswahl-Rahmen direkt im transformierten
   *   Kontext mitzeichnen (Collage-Vorschau)
   */
  function drawTextLayer(ctx, text, inlineSelection = false) {
    ctx.save();

    const opacity = text.opacity !== undefined ? text.opacity : 100;
    ctx.globalAlpha = opacity / 100;
    ctx.font = buildTextFontString(text);
    ctx.fillStyle = text.color || '#000000';
    ctx.textBaseline = 'top';

    // Rotation + Neigung um den Textmittelpunkt
    applyTextTransform(ctx, text);

    // Schatten
    if (text.shadowBlur && text.shadowBlur > 0) {
      ctx.shadowColor = text.shadowColor || '#000000';
      ctx.shadowBlur = text.shadowBlur;
      ctx.shadowOffsetX = text.shadowOffsetX || 2;
      ctx.shadowOffsetY = text.shadowOffsetY || 2;
    }

    const content = text.content || text.txt || '';
    const x = text.x || 0;
    const y = text.y || 0;

    // Kontur (Stroke)
    if (text.strokeWidth && text.strokeWidth > 0) {
      ctx.strokeStyle = text.strokeColor || '#000000';
      ctx.lineWidth = text.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(content, x, y);
    }

    ctx.fillText(content, x, y);

    if (inlineSelection && text.id === selectedTextId.value) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      const metrics = ctx.measureText(content);
      const fontSize = text.fontSize || text.size || 32;
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x - 4, y - 4, metrics.width + 8, fontSize + 8);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  /**
   * Collage-Modus: Canvas-Hintergrund, alle sichtbaren Bild-Ebenen und Texte.
   */
  function renderCollage(ctx, { showSelection, forceTransparent, includeTexts }) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Hintergrund (Canvas-Hintergrundfarbe aus dem imageStore)
    const bgColor = imageStore.canvasBackgroundColor;
    if (!forceTransparent && bgColor && bgColor !== 'transparent') {
      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.restore();
    }

    imageStore.imageLayers.forEach((layer) => {
      if (!layer.visible) return;
      if (!layer.image || !layer.image.complete) {
        if (showSelection) logger.warn(`Layer "${layer.name}" hat kein gültiges Bild`);
        return;
      }

      drawImageLayer(ctx, layer);

      if (showSelection && layer.id === imageStore.selectedLayerId) {
        drawLayerSelection(ctx, layer);
      }
    });

    ctx.filter = 'none';
    if (includeTexts && imageStore.texts && imageStore.texts.length > 0) {
      imageStore.texts.forEach((text) => drawTextLayer(ctx, text, showSelection));
    }
  }

  /**
   * Normal-Modus: Hintergrund, transformiertes Hauptbild mit Schatten,
   * Rahmen und abgerundeten Ecken, Vignette und Texte.
   */
  function renderSingleImage(ctx, { showSelection, forceTransparent, includeTexts }) {
    const tf = transform.transforms.value;
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Shadow-Padding, damit der Schatten nicht abgeschnitten wird
    let shadowPadding = 0;
    if (tf.shadowEnabled) {
      const offsetX = Math.abs(tf.shadowOffsetX);
      const offsetY = Math.abs(tf.shadowOffsetY);
      // Padding = max(offset) + blur + extra margin
      shadowPadding = Math.max(offsetX, offsetY) + tf.shadowBlur + 10;
    }

    // Skew-Padding, damit das geneigte Bild nicht abgeschnitten wird
    let skewPadX = 0;
    let skewPadY = 0;
    if (tf.skewX !== 0 || tf.skewY !== 0) {
      skewPadX = Math.ceil(
        (Math.abs(Math.tan((tf.skewX * Math.PI) / 180)) * canvas.value.height) / 2
      );
      skewPadY = Math.ceil(
        (Math.abs(Math.tan((tf.skewY * Math.PI) / 180)) * canvas.value.width) / 2
      );
    }

    // Rotations-Padding, damit das rotierte Bild nicht abgeschnitten wird.
    // Einheitlicher Skalierungsfaktor bewahrt das Seitenverhältnis (auch bei Rechtecken)
    let rotPadX = 0;
    let rotPadY = 0;
    if (tf.rotation !== 0) {
      const radians = (tf.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      const w = canvas.value.width - (shadowPadding + skewPadX) * 2;
      const h = canvas.value.height - (shadowPadding + skewPadY) * 2;
      const rotatedW = w * cos + h * sin;
      const rotatedH = w * sin + h * cos;
      const scale = Math.min(w / rotatedW, h / rotatedH);
      rotPadX = Math.ceil((w * (1 - scale)) / 2);
      rotPadY = Math.ceil((h * (1 - scale)) / 2);
    }

    // Bildbereich mit Padding (Shadow + Skew + Rotation)
    const totalPadX = shadowPadding + skewPadX + rotPadX;
    const totalPadY = shadowPadding + skewPadY + rotPadY;
    const drawX = totalPadX;
    const drawY = totalPadY;
    const drawWidth = canvas.value.width - totalPadX * 2;
    const drawHeight = canvas.value.height - totalPadY * 2;

    // Hintergrund (unterste Ebene)
    if (!forceTransparent && background.value.opacity > 0) {
      ctx.save();
      ctx.globalAlpha = background.value.opacity / 100;
      ctx.fillStyle = background.value.color;
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.restore();
    }

    // Transformationen (temporär, wird am Ende wieder zurückgenommen)
    const restoreTransform = transform.applyToCanvas(canvas.value, ctx);

    // Echte Tonwert-Anpassungen (Belichtung, Helligkeit, Kontrast, Lichter,
    // Schatten, Sättigung) werden pixelbasiert in die Zeichenquelle gebacken.
    // Die verbleibenden Effekt-Filter (Blur, Farbton, Sepia, Graustufen,
    // Invertieren) bleiben CSS-Filter.
    const { el: adjustedSource, cssFilter: filterString } = getAdjustedImage(
      currentImage.value,
      filters.value
    );
    ctx.filter = filterString;

    const isCircle = tf.borderRadius >= 50;
    const isRounded = tf.borderRadius > 0;
    const radiusPx = (tf.borderRadius / 100) * Math.min(drawWidth, drawHeight);
    const centerX = drawX + drawWidth / 2;
    const centerY = drawY + drawHeight / 2;
    const circleRadius = Math.min(drawWidth, drawHeight) / 2;

    // Baut den Pfad der Bildform (Kreis, abgerundetes Rechteck oder Rechteck)
    const tracePath = () => {
      if (isCircle) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
      } else {
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, radiusPx);
      }
    };

    // Schlagschatten (Drop Shadow) - muss VOR dem Clipping gezeichnet werden
    if (tf.shadowEnabled) {
      ctx.save();
      ctx.filter = 'none';
      ctx.shadowColor = hexToRgba(tf.shadowColor, tf.shadowOpacity / 100);
      ctx.shadowBlur = tf.shadowBlur;
      ctx.shadowOffsetX = tf.shadowOffsetX;
      ctx.shadowOffsetY = tf.shadowOffsetY;

      // Schatten-Silhouette in der Form des Bildes (mit Padding)
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      if (isRounded) {
        tracePath();
        ctx.fill();
      } else {
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();

      ctx.filter = filterString;
    }

    // Abgerundete Ecken / Kreis als Clipping-Pfad
    if (isRounded) {
      ctx.save();
      tracePath();
      ctx.clip();
    }

    ctx.drawImage(adjustedSource, drawX, drawY, drawWidth, drawHeight);

    // Rahmen
    if (tf.borderWidth > 0) {
      ctx.strokeStyle = tf.borderColor;
      ctx.lineWidth = tf.borderWidth;
      if (isCircle) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, circleRadius - tf.borderWidth / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isRounded) {
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, radiusPx);
        ctx.stroke();
      } else {
        ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
      }
    }

    if (isRounded) {
      ctx.restore();
    }

    // Vignette-Overlay (Teil des Bildes, daher auch im Export)
    if (filters.value.vignette > 0) {
      ctx.save();
      const vignetteStrength = filters.value.vignette / 100;
      const cx = canvas.value.width / 2;
      const cy = canvas.value.height / 2;
      const radius = Math.max(cx, cy) * (1.5 - vignetteStrength * 0.5);

      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${vignetteStrength * 0.3})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength * 0.8})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.restore();
    }

    // Filter zurücksetzen und Transformation zurücknehmen, bevor Texte gezeichnet werden
    ctx.filter = 'none';
    if (restoreTransform) {
      restoreTransform();
    }

    if (includeTexts && imageStore.texts && imageStore.texts.length > 0) {
      imageStore.texts.forEach((text) => drawTextLayer(ctx, text));
    }

    // Text-Auswahl als Overlay (nur Vorschau)
    if (showSelection) {
      drawTextSelection();
    }
  }

  /**
   * Gemeinsamer Render-Pfad für Vorschau und Export.
   *
   * @param {Object}  opts
   * @param {boolean} opts.showSelection    Auswahl-Rahmen für Ebene/Text zeichnen (nur Vorschau)
   * @param {boolean} opts.forceTransparent Hintergrund weglassen (transparenter Export)
   * @param {boolean} opts.includeTexts     Text-Ebenen mitzeichnen
   */
  function renderScene(opts) {
    if (!canvas.value) return;
    const ctx = canvas.value.getContext('2d');

    if (isCollageMode.value && imageStore.hasImageLayers) {
      renderCollage(ctx, opts);
      return;
    }

    if (!currentImage.value) return;
    renderSingleImage(ctx, opts);
  }

  // Vorschau: mit Auswahl-Markierungen, Hintergrund und Texten
  function renderImage() {
    renderScene({ showSelection: true, forceTransparent: false, includeTexts: true });
  }

  // Export: ohne Auswahl-Markierungen.
  // forceTransparent=true lässt den Hintergrund weg (z.B. PNG mit Transparenz).
  // includeTexts=false backt nur das Bild/die Ebenen ohne Text-Overlays (z.B. beim
  // "Bild vom Hintergrund lösen", damit Text als separate Ebene erhalten bleibt).
  function renderImageForExport(forceTransparent = false, includeTexts = true) {
    renderScene({ showSelection: false, forceTransparent, includeTexts });
  }

  return {
    renderImage,
    renderImageForExport,
    updateImageDimensions,
    drawTextSelection,
    roundedRect,
    getBorderRadiusPixels,
  };
}

export default useCanvasRenderer;
