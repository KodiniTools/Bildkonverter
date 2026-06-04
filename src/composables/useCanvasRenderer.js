/**
 * useCanvasRenderer Composable
 * Extrahiert Canvas-Rendering-Logik aus EditorView.vue
 */

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

  function drawLayerSelection(context, layer) {
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

  // Zeichnet Text-Auswahl als Overlay (nur visuell, nicht Teil des exportierten Bildes)
  function drawTextSelection() {
    if (!canvas.value || !selectedTextId.value) return;

    const ctx = canvas.value.getContext('2d');
    const text = imageStore.texts?.find((t) => t.id === selectedTextId.value);
    if (!text) return;

    ctx.save();
    ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`;
    const metrics = ctx.measureText(text.content || text.txt || '');
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(text.x - 4, text.y - 4, metrics.width + 8, (text.fontSize || text.size || 32) + 8);
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

  function renderImage() {
    // Im Collage-Modus benutze den imageStore zum Zeichnen
    if (isCollageMode.value && imageStore.hasImageLayers) {
      if (!canvas.value) return;

      const ctx = canvas.value.getContext('2d');
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

      // Hintergrund zeichnen (Canvas-Hintergrundfarbe aus imageStore für Collage-Modus)
      const bgColor = imageStore.canvasBackgroundColor;
      if (bgColor && bgColor !== 'transparent') {
        ctx.save();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
        ctx.restore();
      }

      // Layer direkt zeichnen (ohne Canvas zu löschen)
      imageStore.imageLayers.forEach((layer) => {
        if (!layer.visible) return;
        if (!layer.image || !layer.image.complete) {
          console.warn(`Layer "${layer.name}" hat kein gültiges Bild`);
          return;
        }

        ctx.save();

        // Deckkraft
        ctx.globalAlpha = layer.opacity / 100;

        // Filter für diesen Layer
        const filterParts = [];
        if (layer.filters.brightness !== 100)
          filterParts.push(`brightness(${layer.filters.brightness}%)`);
        if (layer.filters.contrast !== 100) filterParts.push(`contrast(${layer.filters.contrast}%)`);
        if (layer.filters.saturation !== 100)
          filterParts.push(`saturate(${layer.filters.saturation}%)`);
        if (layer.filters.grayscale > 0) filterParts.push(`grayscale(${layer.filters.grayscale}%)`);
        if (layer.filters.sepia > 0) filterParts.push(`sepia(${layer.filters.sepia}%)`);
        ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';

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

        // Schlagschatten für Layer - MUSS VOR dem Clipping gezeichnet werden
        const hasShadow = layer.shadow && layer.shadow.enabled;
        const borderRadiusPercent = layer.border?.radius || 0;

        if (hasShadow && borderRadiusPercent > 0) {
          // Bei abgerundeten Ecken: Schatten als separate Form zeichnen
          ctx.save();
          const shadowOpacity = (layer.shadow.opacity || 50) / 100;
          const hexColor = layer.shadow.color || '#000000';
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);

          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
          ctx.shadowBlur = layer.shadow.blur || 10;
          ctx.shadowOffsetX = layer.shadow.offsetX || 5;
          ctx.shadowOffsetY = layer.shadow.offsetY || 5;

          // Schattenform als abgerundetes Rechteck zeichnen
          const rx = layer.x;
          const ry = layer.y;
          const rw = layer.width;
          const rh = layer.height;
          const minDimension = Math.min(rw, rh);
          const rad = (borderRadiusPercent / 100) * (minDimension / 2);

          // WICHTIG: Muss mit deckender Farbe gefüllt werden, damit Schatten sichtbar ist
          // Die Form wird später vom geclippten Bild überdeckt
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(rx + rad, ry);
          ctx.lineTo(rx + rw - rad, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
          ctx.lineTo(rx + rw, ry + rh - rad);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
          ctx.lineTo(rx + rad, ry + rh);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
          ctx.lineTo(rx, ry + rad);
          ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (hasShadow) {
          // Ohne Radius: Schatten normal setzen
          const shadowOpacity = (layer.shadow.opacity || 50) / 100;
          const hexColor = layer.shadow.color || '#000000';
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
          ctx.shadowBlur = layer.shadow.blur || 10;
          ctx.shadowOffsetX = layer.shadow.offsetX || 5;
          ctx.shadowOffsetY = layer.shadow.offsetY || 5;
        }

        // Umrandung mit Radius
        const borderWidth = layer.border?.width || 0;

        if (borderRadiusPercent > 0) {
          // Clipping-Pfad für abgerundete Ecken
          ctx.save();

          // Schatten zurücksetzen für geclipptes Bild (wurde bereits separat gezeichnet)
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          ctx.beginPath();
          const rx = layer.x;
          const ry = layer.y;
          const rw = layer.width;
          const rh = layer.height;
          // Konvertiere Prozent in Pixel (basierend auf kleinerer Dimension)
          const minDimension = Math.min(rw, rh);
          const rad = (borderRadiusPercent / 100) * (minDimension / 2);
          ctx.moveTo(rx + rad, ry);
          ctx.lineTo(rx + rw - rad, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
          ctx.lineTo(rx + rw, ry + rh - rad);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
          ctx.lineTo(rx + rad, ry + rh);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
          ctx.lineTo(rx, ry + rad);
          ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
          ctx.closePath();
          ctx.clip();

          // Bild zeichnen (innerhalb des Clipping-Pfads)
          ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);

          ctx.restore();

          // Schatten zurücksetzen für Umrandung
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Umrandung zeichnen (außerhalb des Clips)
          if (borderWidth > 0) {
            ctx.strokeStyle = layer.border?.color || '#000000';
            ctx.lineWidth = borderWidth;
            ctx.beginPath();
            ctx.moveTo(rx + rad, ry);
            ctx.lineTo(rx + rw - rad, ry);
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
            ctx.lineTo(rx + rw, ry + rh - rad);
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
            ctx.lineTo(rx + rad, ry + rh);
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
            ctx.lineTo(rx, ry + rad);
            ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
            ctx.closePath();
            ctx.stroke();
          }
        } else {
          // Bild ohne abgerundete Ecken zeichnen
          ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);

          // Schatten zurücksetzen für Umrandung
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Rechteckige Umrandung zeichnen
          if (borderWidth > 0) {
            ctx.strokeStyle = layer.border?.color || '#000000';
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
          }
        }

        ctx.restore();

        // Auswahl-Rahmen zeichnen
        if (layer.id === imageStore.selectedLayerId) {
          drawLayerSelection(ctx, layer);
        }
      });

      // Texte zeichnen
      ctx.filter = 'none';
      if (imageStore.texts && imageStore.texts.length > 0) {
        imageStore.texts.forEach((text) => {
          ctx.save();
          const opacity = text.opacity !== undefined ? text.opacity : 100;
          ctx.globalAlpha = opacity / 100;
          const fontSize = text.fontSize || text.size || 32;
          ctx.font = `${fontSize}px ${text.fontFamily || 'Arial'}`;
          ctx.fillStyle = text.color || '#000000';
          ctx.textBaseline = 'top';

          // Rotation um Textmittelpunkt
          if (text.rotation && text.rotation !== 0) {
            const metrics = ctx.measureText(text.content || text.txt || '');
            const centerX = (text.x || 0) + metrics.width / 2;
            const centerY = (text.y || 0) + fontSize / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((text.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }

          // Schatten
          if (text.shadowBlur && text.shadowBlur > 0) {
            ctx.shadowColor = text.shadowColor || '#000000';
            ctx.shadowBlur = text.shadowBlur;
            ctx.shadowOffsetX = text.shadowOffsetX || 2;
            ctx.shadowOffsetY = text.shadowOffsetY || 2;
          }

          // Text mit Kontur (Stroke) zeichnen
          if (text.strokeWidth && text.strokeWidth > 0) {
            ctx.strokeStyle = text.strokeColor || '#000000';
            ctx.lineWidth = text.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0);
          }

          // Text füllen
          ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0);

          // Auswahl-Rahmen für selektierten Text
          if (text.id === selectedTextId.value) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            const metrics = ctx.measureText(text.content || text.txt || '');
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect((text.x || 0) - 4, (text.y || 0) - 4, metrics.width + 8, fontSize + 8);
            ctx.setLineDash([]);
          }

          ctx.restore();
        });
      }

      return;
    }

    if (!canvas.value || !currentImage.value) return;

    const ctx = canvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Berechne Shadow-Padding wenn Schatten aktiviert ist
    let shadowPadding = 0;
    if (transform.transforms.value.shadowEnabled) {
      const offsetX = Math.abs(transform.transforms.value.shadowOffsetX);
      const offsetY = Math.abs(transform.transforms.value.shadowOffsetY);
      const blur = transform.transforms.value.shadowBlur;
      // Padding = max(offset) + blur + extra margin
      shadowPadding = Math.max(offsetX, offsetY) + blur + 10;
    }

    // Berechne Skew-Padding damit das geskewte Bild nicht abgeschnitten wird
    let skewPadX = 0;
    let skewPadY = 0;
    if (transform.transforms.value.skewX !== 0 || transform.transforms.value.skewY !== 0) {
      skewPadX = Math.ceil(
        (Math.abs(Math.tan((transform.transforms.value.skewX * Math.PI) / 180)) *
          canvas.value.height) /
          2
      );
      skewPadY = Math.ceil(
        (Math.abs(Math.tan((transform.transforms.value.skewY * Math.PI) / 180)) *
          canvas.value.width) /
          2
      );
    }

    // Berechne Rotations-Padding damit das rotierte Bild nicht abgeschnitten wird
    let rotPadX = 0;
    let rotPadY = 0;
    if (transform.transforms.value.rotation !== 0) {
      const radians = (transform.transforms.value.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      const w = canvas.value.width - (shadowPadding + skewPadX) * 2;
      const h = canvas.value.height - (shadowPadding + skewPadY) * 2;
      const rotatedW = w * cos + h * sin;
      const rotatedH = w * sin + h * cos;
      rotPadX = Math.ceil((rotatedW - w) / 2);
      rotPadY = Math.ceil((rotatedH - h) / 2);
    }

    // Berechne Bildbereich mit Padding (Shadow + Skew + Rotation)
    const totalPadX = shadowPadding + skewPadX + rotPadX;
    const totalPadY = shadowPadding + skewPadY + rotPadY;
    const drawX = totalPadX;
    const drawY = totalPadY;
    const drawWidth = canvas.value.width - totalPadX * 2;
    const drawHeight = canvas.value.height - totalPadY * 2;

    // Hintergrund zeichnen (unterste Ebene)
    if (background.value.opacity > 0) {
      ctx.save();
      ctx.globalAlpha = background.value.opacity / 100;
      ctx.fillStyle = background.value.color;
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.restore();
    }

    // Wende Transformationen an (temporär für Vorschau)
    const restoreTransform = transform.applyToCanvas(canvas.value, ctx);

    // Apply filters (inkl. neue Filter)
    // Berechne erweiterte Werte für Exposure, Highlights, Shadows
    const exposureAdjust = 100 + filters.value.exposure;
    const highlightsAdjust = 100 + filters.value.highlights * 0.5;
    const shadowsAdjust = 100 + filters.value.shadows * 0.3;

    const filterString = `
      brightness(${filters.value.brightness * (exposureAdjust / 100) * (highlightsAdjust / 100)}%)
      contrast(${filters.value.contrast * (shadowsAdjust / 100)}%)
      saturate(${filters.value.saturation}%)
      blur(${filters.value.blur}px)
      hue-rotate(${filters.value.hue}deg)
      sepia(${filters.value.sepia}%)
      grayscale(${filters.value.grayscale}%)
      invert(${filters.value.invert}%)
    `;

    ctx.filter = filterString;

    // Berechne BorderRadius in Pixeln für den Zeichenbereich
    const getBorderRadiusForDraw = () => {
      const radiusPercent = transform.transforms.value.borderRadius;
      const minDimension = Math.min(drawWidth, drawHeight);
      return (radiusPercent / 100) * minDimension;
    };

    // Schlagschatten (Drop Shadow) - muss VOR dem Clipping gezeichnet werden
    if (transform.transforms.value.shadowEnabled) {
      ctx.save();
      // Reset filter für Schatten
      ctx.filter = 'none';

      // Berechne Schatten-Farbe mit Deckkraft
      const shadowOpacity = transform.transforms.value.shadowOpacity / 100;
      const shadowColor = transform.transforms.value.shadowColor;
      // Konvertiere Hex zu RGBA
      const r = parseInt(shadowColor.slice(1, 3), 16);
      const g = parseInt(shadowColor.slice(3, 5), 16);
      const b = parseInt(shadowColor.slice(5, 7), 16);

      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
      ctx.shadowBlur = transform.transforms.value.shadowBlur;
      ctx.shadowOffsetX = transform.transforms.value.shadowOffsetX;
      ctx.shadowOffsetY = transform.transforms.value.shadowOffsetY;

      // Zeichne die Schatten-Form (abhängig von borderRadius) - mit Padding
      ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Nur für die Schatten-Silhouette
      if (transform.transforms.value.borderRadius >= 50) {
        // Kreis-Schatten
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        const radius = Math.min(drawWidth, drawHeight) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (transform.transforms.value.borderRadius > 0) {
        // Abgerundetes Rechteck-Schatten
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw());
        ctx.fill();
      } else {
        // Normales Rechteck-Schatten
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();

      // Filter wieder anwenden
      ctx.filter = filterString;
    }

    // Border Radius (abgerundete Ecken)
    if (transform.transforms.value.borderRadius > 0) {
      ctx.save();
      if (transform.transforms.value.borderRadius >= 50) {
        // Vollständiger Kreis-Clip (50% = perfekter Kreis)
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        const radius = Math.min(drawWidth, drawHeight) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
      } else {
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw());
        ctx.clip();
      }
    }

    ctx.drawImage(currentImage.value, drawX, drawY, drawWidth, drawHeight);

    // Border zeichnen
    if (transform.transforms.value.borderWidth > 0) {
      ctx.strokeStyle = transform.transforms.value.borderColor;
      ctx.lineWidth = transform.transforms.value.borderWidth;
      if (transform.transforms.value.borderRadius >= 50) {
        // Vollständiger Kreis (50% = perfekter Kreis)
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        const radius =
          Math.min(drawWidth, drawHeight) / 2 - transform.transforms.value.borderWidth / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (transform.transforms.value.borderRadius > 0) {
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw());
        ctx.stroke();
      } else {
        ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
      }
    }

    if (transform.transforms.value.borderRadius > 0) {
      ctx.restore();
    }

    // Vignette-Effekt anwenden
    if (filters.value.vignette > 0) {
      ctx.save();
      const vignetteStrength = filters.value.vignette / 100;
      const centerX = canvas.value.width / 2;
      const centerY = canvas.value.height / 2;
      const radius = Math.max(centerX, centerY) * (1.5 - vignetteStrength * 0.5);

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.3,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.5, `rgba(0, 0, 0, ${vignetteStrength * 0.3})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength * 0.8})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.restore();
    }

    // Reset filter for texts
    ctx.filter = 'none';

    // Restore Transform
    if (restoreTransform) {
      restoreTransform();
    }

    // Draw texts from imageStore (ohne Auswahl-Markierung für sauberen Export)
    if (imageStore.texts && imageStore.texts.length > 0) {
      imageStore.texts.forEach((text) => {
        ctx.save();

        // Deckkraft anwenden
        const opacity = text.opacity !== undefined ? text.opacity : 100;
        ctx.globalAlpha = opacity / 100;

        ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`;
        ctx.fillStyle = text.color || '#000000';
        ctx.textBaseline = 'top';

        // Schatten anwenden
        if (text.shadowBlur && text.shadowBlur > 0) {
          ctx.shadowColor = text.shadowColor || '#000000';
          ctx.shadowBlur = text.shadowBlur;
          ctx.shadowOffsetX = text.shadowOffsetX || 2;
          ctx.shadowOffsetY = text.shadowOffsetY || 2;
        }

        // Rotation anwenden (um den Textmittelpunkt)
        const rotation = text.rotation || 0;
        if (rotation !== 0) {
          const textMetrics = ctx.measureText(text.content || text.txt || '');
          const textWidth = textMetrics.width;
          const textHeight = text.fontSize || text.size || 32;
          const centerX = (text.x || 0) + textWidth / 2;
          const centerY = (text.y || 0) + textHeight / 2;

          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        // Umrandung (Stroke) zeichnen
        if (text.strokeWidth && text.strokeWidth > 0) {
          ctx.strokeStyle = text.strokeColor || '#000000';
          ctx.lineWidth = text.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0);
        }

        // Text füllen
        ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0);
        ctx.restore();
      });
    }

    // Text-Auswahl separat zeichnen (nur für Vorschau, nicht auf Canvas für Export)
    drawTextSelection();
  }

  // Rendert Bild ohne Auswahl-Markierung (für Export)
  function renderImageForExport(forceTransparent = false) {
    // Im Collage-Modus: Zeichne Layer direkt ohne Auswahl-Markierung
    if (isCollageMode.value && imageStore.hasImageLayers) {
      const ctx = canvas.value.getContext('2d');
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

      // Hintergrund zeichnen (nur wenn nicht transparent forciert wird)
      const bgColor = imageStore.canvasBackgroundColor;
      if (!forceTransparent && bgColor && bgColor !== 'transparent') {
        ctx.save();
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
        ctx.restore();
      }

      // Layer direkt zeichnen (ohne Auswahl-Markierung für Export)
      imageStore.imageLayers.forEach((layer) => {
        if (!layer.visible) return;
        if (!layer.image || !layer.image.complete) return;

        ctx.save();

        // Deckkraft
        ctx.globalAlpha = layer.opacity / 100;

        // Filter für diesen Layer
        const filterParts = [];
        if (layer.filters.brightness !== 100)
          filterParts.push(`brightness(${layer.filters.brightness}%)`);
        if (layer.filters.contrast !== 100) filterParts.push(`contrast(${layer.filters.contrast}%)`);
        if (layer.filters.saturation !== 100)
          filterParts.push(`saturate(${layer.filters.saturation}%)`);
        if (layer.filters.grayscale > 0) filterParts.push(`grayscale(${layer.filters.grayscale}%)`);
        if (layer.filters.sepia > 0) filterParts.push(`sepia(${layer.filters.sepia}%)`);
        ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';

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

        // Schlagschatten für Layer - MUSS VOR dem Clipping gezeichnet werden
        const hasShadow = layer.shadow && layer.shadow.enabled;
        const borderRadiusPercent = layer.border?.radius || 0;

        if (hasShadow && borderRadiusPercent > 0) {
          // Bei abgerundeten Ecken: Schatten als separate Form zeichnen
          ctx.save();
          const shadowOpacity = (layer.shadow.opacity || 50) / 100;
          const hexColor = layer.shadow.color || '#000000';
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);

          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
          ctx.shadowBlur = layer.shadow.blur || 10;
          ctx.shadowOffsetX = layer.shadow.offsetX || 5;
          ctx.shadowOffsetY = layer.shadow.offsetY || 5;

          // Schattenform als abgerundetes Rechteck zeichnen
          const rx = layer.x;
          const ry = layer.y;
          const rw = layer.width;
          const rh = layer.height;
          const minDimension = Math.min(rw, rh);
          const rad = (borderRadiusPercent / 100) * (minDimension / 2);

          // WICHTIG: Muss mit deckender Farbe gefüllt werden, damit Schatten sichtbar ist
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(rx + rad, ry);
          ctx.lineTo(rx + rw - rad, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
          ctx.lineTo(rx + rw, ry + rh - rad);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
          ctx.lineTo(rx + rad, ry + rh);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
          ctx.lineTo(rx, ry + rad);
          ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (hasShadow) {
          const shadowOpacity = (layer.shadow.opacity || 50) / 100;
          const hexColor = layer.shadow.color || '#000000';
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
          ctx.shadowBlur = layer.shadow.blur || 10;
          ctx.shadowOffsetX = layer.shadow.offsetX || 5;
          ctx.shadowOffsetY = layer.shadow.offsetY || 5;
        }

        // Umrandung mit Radius
        const borderWidth = layer.border?.width || 0;

        if (borderRadiusPercent > 0) {
          // Clipping-Pfad für abgerundete Ecken
          ctx.save();

          // Schatten zurücksetzen für geclipptes Bild
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          ctx.beginPath();
          const rx = layer.x;
          const ry = layer.y;
          const rw = layer.width;
          const rh = layer.height;
          const minDimension = Math.min(rw, rh);
          const rad = (borderRadiusPercent / 100) * (minDimension / 2);
          ctx.moveTo(rx + rad, ry);
          ctx.lineTo(rx + rw - rad, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
          ctx.lineTo(rx + rw, ry + rh - rad);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
          ctx.lineTo(rx + rad, ry + rh);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
          ctx.lineTo(rx, ry + rad);
          ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
          ctx.restore();

          // Schatten zurücksetzen für Umrandung
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          if (borderWidth > 0) {
            ctx.strokeStyle = layer.border?.color || '#000000';
            ctx.lineWidth = borderWidth;
            ctx.beginPath();
            ctx.moveTo(rx + rad, ry);
            ctx.lineTo(rx + rw - rad, ry);
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
            ctx.lineTo(rx + rw, ry + rh - rad);
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
            ctx.lineTo(rx + rad, ry + rh);
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
            ctx.lineTo(rx, ry + rad);
            ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
            ctx.closePath();
            ctx.stroke();
          }
        } else {
          ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);

          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          if (borderWidth > 0) {
            ctx.strokeStyle = layer.border?.color || '#000000';
            ctx.lineWidth = borderWidth;
            ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
          }
        }

        ctx.restore();
      });

      // Texte zeichnen für Export
      ctx.filter = 'none';
      if (imageStore.texts && imageStore.texts.length > 0) {
        imageStore.texts.forEach((text) => {
          ctx.save();
          const opacity = text.opacity !== undefined ? text.opacity : 100;
          ctx.globalAlpha = opacity / 100;
          const fontSize = text.fontSize || text.size || 32;
          ctx.font = `${fontSize}px ${text.fontFamily || 'Arial'}`;
          ctx.fillStyle = text.color || '#000000';
          ctx.textBaseline = 'top';

          // Rotation um Textmittelpunkt
          if (text.rotation && text.rotation !== 0) {
            const metrics = ctx.measureText(text.content || text.txt || '');
            const centerX = (text.x || 0) + metrics.width / 2;
            const centerY = (text.y || 0) + fontSize / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((text.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }

          // Schatten
          if (text.shadowBlur && text.shadowBlur > 0) {
            ctx.shadowColor = text.shadowColor || '#000000';
            ctx.shadowBlur = text.shadowBlur;
            ctx.shadowOffsetX = text.shadowOffsetX || 2;
            ctx.shadowOffsetY = text.shadowOffsetY || 2;
          }

          // Text mit Kontur (Stroke) zeichnen
          if (text.strokeWidth && text.strokeWidth > 0) {
            ctx.strokeStyle = text.strokeColor || '#000000';
            ctx.lineWidth = text.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0);
          }

          // Text füllen
          ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0);
          ctx.restore();
        });
      }

      return;
    }

    if (!canvas.value || !currentImage.value) return;

    const ctx = canvas.value.getContext('2d');
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // Berechne Shadow-Padding wenn Schatten aktiviert ist
    let shadowPadding = 0;
    if (transform.transforms.value.shadowEnabled) {
      const offsetX = Math.abs(transform.transforms.value.shadowOffsetX);
      const offsetY = Math.abs(transform.transforms.value.shadowOffsetY);
      const blur = transform.transforms.value.shadowBlur;
      shadowPadding = Math.max(offsetX, offsetY) + blur + 10;
    }

    // Berechne Skew-Padding damit das geskewte Bild nicht abgeschnitten wird
    let skewPadX = 0;
    let skewPadY = 0;
    if (transform.transforms.value.skewX !== 0 || transform.transforms.value.skewY !== 0) {
      skewPadX = Math.ceil(
        (Math.abs(Math.tan((transform.transforms.value.skewX * Math.PI) / 180)) *
          canvas.value.height) /
          2
      );
      skewPadY = Math.ceil(
        (Math.abs(Math.tan((transform.transforms.value.skewY * Math.PI) / 180)) *
          canvas.value.width) /
          2
      );
    }

    // Berechne Rotations-Padding damit das rotierte Bild nicht abgeschnitten wird
    let rotPadX = 0;
    let rotPadY = 0;
    if (transform.transforms.value.rotation !== 0) {
      const radians = (transform.transforms.value.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      const w = canvas.value.width - (shadowPadding + skewPadX) * 2;
      const h = canvas.value.height - (shadowPadding + skewPadY) * 2;
      const rotatedW = w * cos + h * sin;
      const rotatedH = w * sin + h * cos;
      rotPadX = Math.ceil((rotatedW - w) / 2);
      rotPadY = Math.ceil((rotatedH - h) / 2);
    }

    // Berechne Bildbereich mit Padding (Shadow + Skew + Rotation)
    const totalPadX = shadowPadding + skewPadX + rotPadX;
    const totalPadY = shadowPadding + skewPadY + rotPadY;
    const drawX = totalPadX;
    const drawY = totalPadY;
    const drawWidth = canvas.value.width - totalPadX * 2;
    const drawHeight = canvas.value.height - totalPadY * 2;

    // Hintergrund zeichnen (nur wenn nicht transparent forciert wird)
    if (!forceTransparent && background.value.opacity > 0) {
      ctx.save();
      ctx.globalAlpha = background.value.opacity / 100;
      ctx.fillStyle = background.value.color;
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      ctx.restore();
    }

    // Transformationen
    const restoreTransform = transform.applyToCanvas(canvas.value, ctx);

    // Filter
    const filterString = `
      brightness(${filters.value.brightness}%)
      contrast(${filters.value.contrast}%)
      saturate(${filters.value.saturation}%)
      blur(${filters.value.blur}px)
      hue-rotate(${filters.value.hue}deg)
    `;
    ctx.filter = filterString;

    // Berechne BorderRadius in Pixeln für den Zeichenbereich
    const getBorderRadiusForDraw = () => {
      const radiusPercent = transform.transforms.value.borderRadius;
      const minDimension = Math.min(drawWidth, drawHeight);
      return (radiusPercent / 100) * minDimension;
    };

    // Schlagschatten (Drop Shadow) für Export
    if (transform.transforms.value.shadowEnabled) {
      ctx.save();
      ctx.filter = 'none';

      const shadowOpacity = transform.transforms.value.shadowOpacity / 100;
      const shadowColor = transform.transforms.value.shadowColor;
      const r = parseInt(shadowColor.slice(1, 3), 16);
      const g = parseInt(shadowColor.slice(3, 5), 16);
      const b = parseInt(shadowColor.slice(5, 7), 16);

      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowOpacity})`;
      ctx.shadowBlur = transform.transforms.value.shadowBlur;
      ctx.shadowOffsetX = transform.transforms.value.shadowOffsetX;
      ctx.shadowOffsetY = transform.transforms.value.shadowOffsetY;

      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      if (transform.transforms.value.borderRadius >= 50) {
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        const radius = Math.min(drawWidth, drawHeight) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (transform.transforms.value.borderRadius > 0) {
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw());
        ctx.fill();
      } else {
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();
      ctx.filter = filterString;
    }

    // Border Radius
    if (transform.transforms.value.borderRadius > 0) {
      ctx.save();
      if (transform.transforms.value.borderRadius >= 50) {
        // Vollständiger Kreis-Clip (50% = perfekter Kreis)
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        const radius = Math.min(drawWidth, drawHeight) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
      } else {
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw());
        ctx.clip();
      }
    }

    ctx.drawImage(currentImage.value, drawX, drawY, drawWidth, drawHeight);

    // Border
    if (transform.transforms.value.borderWidth > 0) {
      ctx.strokeStyle = transform.transforms.value.borderColor;
      ctx.lineWidth = transform.transforms.value.borderWidth;
      if (transform.transforms.value.borderRadius >= 50) {
        // Vollständiger Kreis (50% = perfekter Kreis)
        const centerX = drawX + drawWidth / 2;
        const centerY = drawY + drawHeight / 2;
        const radius =
          Math.min(drawWidth, drawHeight) / 2 - transform.transforms.value.borderWidth / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (transform.transforms.value.borderRadius > 0) {
        roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, getBorderRadiusForDraw());
        ctx.stroke();
      } else {
        ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
      }
    }

    if (transform.transforms.value.borderRadius > 0) {
      ctx.restore();
    }

    ctx.filter = 'none';

    if (restoreTransform) {
      restoreTransform();
    }

    // Texte OHNE Auswahl-Markierung (mit Rotation, Deckkraft, Umrandung und Schatten)
    if (imageStore.texts && imageStore.texts.length > 0) {
      imageStore.texts.forEach((text) => {
        ctx.save();

        // Deckkraft anwenden
        const opacity = text.opacity !== undefined ? text.opacity : 100;
        ctx.globalAlpha = opacity / 100;

        ctx.font = `${text.fontSize || text.size || 32}px ${text.fontFamily || 'Arial'}`;
        ctx.fillStyle = text.color || '#000000';
        ctx.textBaseline = 'top';

        // Schatten anwenden
        if (text.shadowBlur && text.shadowBlur > 0) {
          ctx.shadowColor = text.shadowColor || '#000000';
          ctx.shadowBlur = text.shadowBlur;
          ctx.shadowOffsetX = text.shadowOffsetX || 2;
          ctx.shadowOffsetY = text.shadowOffsetY || 2;
        }

        // Rotation anwenden (um den Textmittelpunkt)
        const rotation = text.rotation || 0;
        if (rotation !== 0) {
          const textMetrics = ctx.measureText(text.content || text.txt || '');
          const textWidth = textMetrics.width;
          const textHeight = text.fontSize || text.size || 32;
          const centerX = (text.x || 0) + textWidth / 2;
          const centerY = (text.y || 0) + textHeight / 2;

          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        // Umrandung (Stroke) zeichnen
        if (text.strokeWidth && text.strokeWidth > 0) {
          ctx.strokeStyle = text.strokeColor || '#000000';
          ctx.lineWidth = text.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.strokeText(text.content || text.txt || '', text.x || 0, text.y || 0);
        }

        // Text füllen
        ctx.fillText(text.content || text.txt || '', text.x || 0, text.y || 0);
        ctx.restore();
      });
    }
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
