import { currentThemeColorsV2 } from '@/design-system/tokens-v2';
/**
 * textUtils - Text Utility Funktionen
 *
 * Reine Funktionen für Text-Berechnungen, Messungen und Rendering.
 * Keine DOM-Manipulationen, nur Canvas-Operationen.
 */

/** Text-Felder, die diese Helfer lesen (kompatibel zu StoreText; alte Felder txt/size) */
export interface CanvasText {
  content?: string;
  txt?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  size?: number;
  fontFamily?: string;
  color?: string;
  align?: CanvasTextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  stroke?: boolean;
  strokeWidth?: number;
  strokeColor?: string;
  shadow?: boolean;
  shadowBlur?: number;
  shadowColor?: string;
  opacity?: number;
  rotation?: number;
}

export interface TextHandle {
  x: number;
  y: number;
  size: number;
  type: 'resize' | 'delete';
}

/**
 * Inhalt und Position wie bisher bei impliziter Umwandlung: fehlender Text wird
 * zu 'undefined', fehlende Koordinaten zu NaN (validateText verhindert leere Texte).
 */
const textContent = (text: CanvasText): string => String(text.content || text.txt);
const textX = (text: CanvasText): number => Number(text.x);
const textY = (text: CanvasText): number => Number(text.y);

/**
 * Misst die Dimensionen eines Textes
 */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number | undefined,
  fontFamily = 'Roboto, sans-serif'
): { width: number; height: number } {
  ctx.save();
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const metrics = ctx.measureText(text);
  const width = metrics.width;
  const height = Number(fontSize); // Approximation

  ctx.restore();

  return { width, height };
}

/**
 * Berechnet Positionen für Text-Handles
 */
export function getTextHandles(
  text: CanvasText,
  ctx: CanvasRenderingContext2D
): Record<'nw' | 'ne' | 'sw' | 'se', TextHandle> {
  const { width, height } = measureText(
    ctx,
    textContent(text),
    text.fontSize || text.size,
    text.fontFamily
  );
  const x = textX(text);
  const y = textY(text);

  const handleSize = 20;
  const deleteSize = 24;

  return {
    nw: {
      x: x - handleSize / 2,
      y: y - handleSize / 2,
      size: handleSize,
      type: 'resize',
    },
    ne: {
      x: x + width - deleteSize / 2,
      y: y - deleteSize / 2,
      size: deleteSize,
      type: 'delete',
    },
    sw: {
      x: x - handleSize / 2,
      y: y + height - handleSize / 2,
      size: handleSize,
      type: 'resize',
    },
    se: {
      x: x + width - handleSize / 2,
      y: y + height - handleSize / 2,
      size: handleSize,
      type: 'resize',
    },
  };
}

/**
 * Zeichnet einen einzelnen Text
 */
export function drawText(ctx: CanvasRenderingContext2D, text: CanvasText): void {
  ctx.save();

  // Text-Styling
  const fontWeight = text.bold ? 'bold' : 'normal';
  const fontStyle = text.italic ? 'italic' : 'normal';
  const fontSize = text.fontSize || text.size || 24;
  const fontFamily = text.fontFamily || 'Roboto, sans-serif';

  ctx.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = text.color || '#000000';
  ctx.textBaseline = 'top';
  ctx.textAlign = text.align || 'left';
  ctx.globalAlpha = (text.opacity || 100) / 100;

  // Position und Rotation
  const x = textX(text);
  const y = textY(text);
  if (text.rotation) {
    ctx.translate(x, y);
    ctx.rotate((text.rotation * Math.PI) / 180);
    ctx.translate(-x, -y);
  }

  // Schatten
  if (text.shadow) {
    ctx.shadowColor = text.shadowColor || 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = text.shadowBlur || 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  // Umrandung
  if (text.stroke) {
    ctx.strokeStyle = text.strokeColor || '#000000';
    ctx.lineWidth = text.strokeWidth || 2;
    ctx.strokeText(textContent(text), x, y);
  }

  // Text
  ctx.fillText(textContent(text), x, y);

  ctx.restore();
}

/**
 * Zeichnet die Auswahl eines Textes mit Handles
 */
export function drawTextSelection(
  ctx: CanvasRenderingContext2D,
  text: CanvasText,
  showHandles = true
): void {
  ctx.save();

  const { width, height } = measureText(
    ctx,
    textContent(text),
    text.fontSize || text.size,
    text.fontFamily
  );

  // Overlay-Farben aus den Design-Tokens des aktiven Themes
  const colors = currentThemeColorsV2();

  // Gestrichelte Box
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);

  const padding = 8;
  ctx.strokeRect(
    textX(text) - padding,
    textY(text) - padding,
    width + padding * 2,
    height + padding * 2
  );

  ctx.setLineDash([]);

  if (showHandles) {
    const handles = getTextHandles(text, ctx);

    // Resize-Handles (NW, SW, SE)
    const resizeHandles = [handles.nw, handles.sw, handles.se];
    resizeHandles.forEach((handle) => {
      // Äußerer Rahmen
      ctx.fillStyle = colors.accent;
      ctx.fillRect(handle.x - 2, handle.y - 2, handle.size + 4, handle.size + 4);

      // Weißes Inneres
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(handle.x + 2, handle.y + 2, handle.size - 4, handle.size - 4);

      // Punkt in Akzentfarbe
      ctx.fillStyle = colors.accent;
      const dotSize = 8;
      ctx.fillRect(
        handle.x + (handle.size - dotSize) / 2,
        handle.y + (handle.size - dotSize) / 2,
        dotSize,
        dotSize
      );
    });

    // Delete-Button (NE)
    const deleteHandle = handles.ne;

    // Hintergrund in Danger-Farbe
    ctx.fillStyle = colors.danger;
    ctx.fillRect(
      deleteHandle.x - 2,
      deleteHandle.y - 2,
      deleteHandle.size + 4,
      deleteHandle.size + 4
    );

    // Weißes Inneres
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      deleteHandle.x + 2,
      deleteHandle.y + 2,
      deleteHandle.size - 4,
      deleteHandle.size - 4
    );

    // X in Danger-Farbe
    ctx.strokeStyle = colors.danger;
    ctx.lineWidth = 3;
    const xPadding = 6;
    ctx.beginPath();
    ctx.moveTo(deleteHandle.x + xPadding, deleteHandle.y + xPadding);
    ctx.lineTo(
      deleteHandle.x + deleteHandle.size - xPadding,
      deleteHandle.y + deleteHandle.size - xPadding
    );
    ctx.moveTo(deleteHandle.x + deleteHandle.size - xPadding, deleteHandle.y + xPadding);
    ctx.lineTo(deleteHandle.x + xPadding, deleteHandle.y + deleteHandle.size - xPadding);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Erstellt einen Default-Text
 */
export function createDefaultText(content = 'Neuer Text', x = 100, y = 100) {
  return {
    id: Date.now() + Math.random(),
    content,
    txt: content, // Rückwärtskompatibilität
    x,
    y,
    fontSize: 32,
    size: 32, // Rückwärtskompatibilität
    fontFamily: 'Roboto, sans-serif',
    color: '#000000',
    align: 'left',
    bold: false,
    italic: false,
    underline: false,
    stroke: false,
    strokeWidth: 2,
    strokeColor: '#ffffff',
    shadow: false,
    shadowBlur: 5,
    shadowColor: 'rgba(0,0,0,0.5)',
    opacity: 100,
    rotation: 0,
  };
}

/**
 * Validiert Text-Eigenschaften
 */
export function validateText(text: CanvasText): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!text.content && !text.txt) {
    errors.push('Text darf nicht leer sein');
  }

  const fontSize = text.fontSize || text.size || 0;
  if (fontSize < 8 || fontSize > 500) {
    errors.push('Schriftgröße muss zwischen 8 und 500 liegen');
  }

  if (text.opacity !== undefined && (text.opacity < 0 || text.opacity > 100)) {
    errors.push('Deckkraft muss zwischen 0 und 100 liegen');
  }

  if (text.rotation !== undefined && (text.rotation < -360 || text.rotation > 360)) {
    errors.push('Rotation muss zwischen -360 und 360 Grad liegen');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Konvertiert zwischen altem und neuem Text-Format
 */
export function normalizeText<T extends CanvasText>(text: T) {
  return {
    ...text,
    content: text.content || text.txt,
    fontSize: text.fontSize || text.size || 24,
    // Behalte beide Formate für Rückwärtskompatibilität
    txt: text.txt || text.content,
    size: text.size || text.fontSize || 24,
  };
}
