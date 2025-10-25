/**
 * textUtils.js - Text Utility Funktionen
 * 
 * Reine Funktionen für Text-Berechnungen, Messungen und Rendering.
 * Keine DOM-Manipulationen, nur Canvas-Operationen.
 */

/**
 * Misst die Dimensionen eines Textes
 */
export function measureText(ctx, text, fontSize, fontFamily = 'Roboto, sans-serif') {
  ctx.save()
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  
  const metrics = ctx.measureText(text)
  const width = metrics.width
  const height = fontSize // Approximation
  
  ctx.restore()
  
  return { width, height }
}

/**
 * Berechnet die Bounding Box eines Textes mit Padding
 */
export function getTextBounds(text, padding = 8) {
  const { width, height } = measureText(
    null, // Wird später mit echtem Context aufgerufen
    text.content || text.txt,
    text.fontSize || text.size,
    text.fontFamily
  )
  
  return {
    x1: text.x - padding,
    y1: text.y - padding,
    x2: text.x + width + padding,
    y2: text.y + height + padding,
    width: width + padding * 2,
    height: height + padding * 2
  }
}

/**
 * Prüft ob ein Punkt innerhalb eines Text-Bereichs liegt
 */
export function isPointInText(point, textBounds) {
  return (
    point.x >= textBounds.x1 &&
    point.x <= textBounds.x2 &&
    point.y >= textBounds.y1 &&
    point.y <= textBounds.y2
  )
}

/**
 * Berechnet Positionen für Text-Handles
 */
export function getTextHandles(text, ctx) {
  const { width, height } = measureText(
    ctx,
    text.content || text.txt,
    text.fontSize || text.size,
    text.fontFamily
  )
  
  const handleSize = 20
  const deleteSize = 24
  
  return {
    nw: { 
      x: text.x - handleSize / 2, 
      y: text.y - handleSize / 2,
      size: handleSize,
      type: 'resize'
    },
    ne: { 
      x: text.x + width - deleteSize / 2, 
      y: text.y - deleteSize / 2,
      size: deleteSize,
      type: 'delete'
    },
    sw: { 
      x: text.x - handleSize / 2, 
      y: text.y + height - handleSize / 2,
      size: handleSize,
      type: 'resize'
    },
    se: { 
      x: text.x + width - handleSize / 2, 
      y: text.y + height - handleSize / 2,
      size: handleSize,
      type: 'resize'
    }
  }
}

/**
 * Findet den Handle an einer bestimmten Position
 */
export function getHandleAtPosition(point, handles, clickArea = 24) {
  for (const [handleName, handle] of Object.entries(handles)) {
    const clickX1 = handle.x + handle.size / 2 - clickArea / 2
    const clickY1 = handle.y + handle.size / 2 - clickArea / 2
    const clickX2 = clickX1 + clickArea
    const clickY2 = clickY1 + clickArea
    
    if (
      point.x >= clickX1 &&
      point.x <= clickX2 &&
      point.y >= clickY1 &&
      point.y <= clickY2
    ) {
      return { name: handleName, handle }
    }
  }
  
  return null
}

/**
 * Zeichnet einen einzelnen Text
 */
export function drawText(ctx, text) {
  ctx.save()
  
  // Text-Styling
  const fontWeight = text.bold ? 'bold' : 'normal'
  const fontStyle = text.italic ? 'italic' : 'normal'
  const fontSize = text.fontSize || text.size || 24
  const fontFamily = text.fontFamily || 'Roboto, sans-serif'
  
  ctx.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`
  ctx.fillStyle = text.color || '#000000'
  ctx.textBaseline = 'top'
  ctx.textAlign = text.align || 'left'
  ctx.globalAlpha = (text.opacity || 100) / 100
  
  // Position und Rotation
  if (text.rotation) {
    ctx.translate(text.x, text.y)
    ctx.rotate((text.rotation * Math.PI) / 180)
    ctx.translate(-text.x, -text.y)
  }
  
  // Schatten
  if (text.shadow) {
    ctx.shadowColor = text.shadowColor || 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = text.shadowBlur || 5
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
  }
  
  // Umrandung
  if (text.stroke) {
    ctx.strokeStyle = text.strokeColor || '#000000'
    ctx.lineWidth = text.strokeWidth || 2
    ctx.strokeText(text.content || text.txt, text.x, text.y)
  }
  
  // Text
  ctx.fillText(text.content || text.txt, text.x, text.y)
  
  ctx.restore()
}

/**
 * Zeichnet die Auswahl eines Textes mit Handles
 */
export function drawTextSelection(ctx, text, showHandles = true) {
  ctx.save()
  
  const { width, height } = measureText(
    ctx,
    text.content || text.txt,
    text.fontSize || text.size,
    text.fontFamily
  )
  
  // Gestrichelte Box
  ctx.strokeStyle = '#007bff'
  ctx.lineWidth = 3
  ctx.setLineDash([8, 4])
  
  const padding = 8
  ctx.strokeRect(
    text.x - padding,
    text.y - padding,
    width + padding * 2,
    height + padding * 2
  )
  
  ctx.setLineDash([])
  
  if (showHandles) {
    const handles = getTextHandles(text, ctx)
    
    // Resize-Handles (NW, SW, SE)
    const resizeHandles = [handles.nw, handles.sw, handles.se]
    resizeHandles.forEach((handle) => {
      // Äußerer Rahmen
      ctx.fillStyle = '#007bff'
      ctx.fillRect(handle.x - 2, handle.y - 2, handle.size + 4, handle.size + 4)
      
      // Weißes Inneres
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(handle.x + 2, handle.y + 2, handle.size - 4, handle.size - 4)
      
      // Schwarzer Punkt
      ctx.fillStyle = '#000000'
      const dotSize = 8
      ctx.fillRect(
        handle.x + (handle.size - dotSize) / 2,
        handle.y + (handle.size - dotSize) / 2,
        dotSize,
        dotSize
      )
    })
    
    // Delete-Button (NE)
    const deleteHandle = handles.ne
    
    // Roter Hintergrund
    ctx.fillStyle = '#EF4444'
    ctx.fillRect(
      deleteHandle.x - 2,
      deleteHandle.y - 2,
      deleteHandle.size + 4,
      deleteHandle.size + 4
    )
    
    // Weißes Inneres
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(
      deleteHandle.x + 2,
      deleteHandle.y + 2,
      deleteHandle.size - 4,
      deleteHandle.size - 4
    )
    
    // Rotes X
    ctx.strokeStyle = '#EF4444'
    ctx.lineWidth = 3
    const xPadding = 6
    ctx.beginPath()
    ctx.moveTo(deleteHandle.x + xPadding, deleteHandle.y + xPadding)
    ctx.lineTo(
      deleteHandle.x + deleteHandle.size - xPadding,
      deleteHandle.y + deleteHandle.size - xPadding
    )
    ctx.moveTo(deleteHandle.x + deleteHandle.size - xPadding, deleteHandle.y + xPadding)
    ctx.lineTo(deleteHandle.x + xPadding, deleteHandle.y + deleteHandle.size - xPadding)
    ctx.stroke()
  }
  
  ctx.restore()
}

/**
 * Berechnet neue Text-Größe basierend auf Resize
 */
export function calculateResizedText(text, startData, currentPos, handle) {
  const deltaX = currentPos.x - startData.startX
  const deltaY = currentPos.y - startData.startY
  
  let newSize = startData.originalSize
  
  switch (handle) {
    case 'nw':
      newSize = Math.max(8, startData.originalSize - deltaY)
      break
    case 'sw':
      newSize = Math.max(8, startData.originalSize + deltaY)
      break
    case 'se':
      newSize = Math.max(8, startData.originalSize + Math.max(deltaX, deltaY))
      break
  }
  
  return {
    ...text,
    fontSize: Math.round(newSize),
    size: Math.round(newSize)
  }
}

/**
 * Skaliert Text-Positionen für Export
 */
export function scaleTextForExport(text, scaleX, scaleY, offsetX = 0, offsetY = 0) {
  return {
    ...text,
    x: (text.x - offsetX) * scaleX,
    y: (text.y - offsetY) * scaleY,
    fontSize: (text.fontSize || text.size) * Math.min(scaleX, scaleY),
    size: (text.fontSize || text.size) * Math.min(scaleX, scaleY)
  }
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
    rotation: 0
  }
}

/**
 * Validiert Text-Eigenschaften
 */
export function validateText(text) {
  const errors = []
  
  if (!text.content && !text.txt) {
    errors.push('Text darf nicht leer sein')
  }
  
  const fontSize = text.fontSize || text.size || 0
  if (fontSize < 8 || fontSize > 500) {
    errors.push('Schriftgröße muss zwischen 8 und 500 liegen')
  }
  
  if (text.opacity !== undefined && (text.opacity < 0 || text.opacity > 100)) {
    errors.push('Deckkraft muss zwischen 0 und 100 liegen')
  }
  
  if (text.rotation !== undefined && (text.rotation < -360 || text.rotation > 360)) {
    errors.push('Rotation muss zwischen -360 und 360 Grad liegen')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Konvertiert zwischen altem und neuem Text-Format
 */
export function normalizeText(text) {
  return {
    ...text,
    content: text.content || text.txt,
    fontSize: text.fontSize || text.size || 24,
    // Behalte beide Formate für Rückwärtskompatibilität
    txt: text.txt || text.content,
    size: text.size || text.fontSize || 24
  }
}
