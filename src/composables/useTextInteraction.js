/**
 * useTextInteraction.js - Vue Composable für Text-Interaktionen
 * 
 * Verwaltet Drag & Drop, Resize, Selection und andere Text-Interaktionen
 */

import { ref, computed, watch } from 'vue'
import {
  measureText,
  getTextBounds,
  isPointInText,
  getTextHandles,
  getHandleAtPosition,
  calculateResizedText,
  normalizeText
} from './textUtils'

export function useTextInteraction(imageStore) {
  // ===== STATE =====
  
  const isDragging = ref(false)
  const isResizing = ref(false)
  const dragStartPos = ref(null)
  const resizeStartData = ref(null)
  const currentHandle = ref(null)
  
  const lastClickTime = ref(0)
  const lastClickIndex = ref(-1)
  const doubleClickThreshold = 300 // ms
  
  // ===== COMPUTED =====
  
  const isInteracting = computed(() => isDragging.value || isResizing.value)
  
  const selectedText = computed(() => imageStore.selectedText)
  
  const selectedTextId = computed(() => imageStore.selectedTextId)
  
  // ===== METHODS =====
  
  /**
   * Findet den Text-Index an einer Position
   */
  function findTextAtPosition(x, y) {
    if (!imageStore.ctx) return -1
    
    const texts = imageStore.texts
    
    // Von hinten nach vorne iterieren (oberste Texte zuerst)
    for (let i = texts.length - 1; i >= 0; i--) {
      const text = normalizeText(texts[i])
      const { width, height } = measureText(
        imageStore.ctx,
        text.content,
        text.fontSize,
        text.fontFamily
      )
      
      const padding = 8
      const bounds = {
        x1: text.x - padding,
        y1: text.y - padding,
        x2: text.x + width + padding,
        y2: text.y + height + padding
      }
      
      if (isPointInText({ x, y }, bounds)) {
        return i
      }
    }
    
    return -1
  }
  
  /**
   * Findet den Handle an einer Position für einen Text
   */
  function findHandleAtPosition(x, y, textIndex) {
    if (textIndex < 0 || textIndex >= imageStore.texts.length) {
      return null
    }
    
    if (!imageStore.ctx) return null
    
    const text = normalizeText(imageStore.texts[textIndex])
    const handles = getTextHandles(text, imageStore.ctx)
    
    return getHandleAtPosition({ x, y }, handles)
  }
  
  /**
   * Behandelt Mouse Down Event
   */
  function handleMouseDown(x, y) {
    if (!imageStore.hasImage) return false
    
    // Prüfe auf Handle-Klick bei selektiertem Text
    if (selectedTextId.value !== null) {
      const textIndex = imageStore.texts.findIndex(t => t.id === selectedTextId.value)
      const handleInfo = findHandleAtPosition(x, y, textIndex)
      
      if (handleInfo) {
        if (handleInfo.handle.type === 'delete') {
          // Delete-Handle wurde geklickt
          imageStore.deleteText(selectedTextId.value)
          return true
        } else if (handleInfo.handle.type === 'resize') {
          // Resize-Handle wurde geklickt
          startResize(x, y, handleInfo.name)
          return true
        }
      }
    }
    
    // Prüfe auf Text-Klick
    const textIndex = findTextAtPosition(x, y)
    
    if (textIndex !== -1) {
      const clickedText = imageStore.texts[textIndex]
      
      // Doppelklick-Erkennung
      const now = Date.now()
      const isDoubleClick = 
        textIndex === lastClickIndex.value &&
        now - lastClickTime.value < doubleClickThreshold
      
      lastClickTime.value = now
      lastClickIndex.value = textIndex
      
      if (isDoubleClick) {
        // Bei Doppelklick: Text bearbeiten
        return { action: 'edit', textId: clickedText.id, textIndex }
      } else {
        // Bei Einzelklick: Text selektieren und Drag starten
        imageStore.selectedTextId = clickedText.id
        startDrag(x, y)
        return true
      }
    } else {
      // Klick außerhalb: Deselektieren
      imageStore.selectedTextId = null
      imageStore.draw()
      return false
    }
  }
  
  /**
   * Startet das Drag-Verhalten
   */
  function startDrag(x, y) {
    isDragging.value = true
    dragStartPos.value = { x, y }
    
    if (imageStore.canvas) {
      imageStore.canvas.style.cursor = 'move'
    }
  }
  
  /**
   * Startet das Resize-Verhalten
   */
  function startResize(x, y, handle) {
    if (!selectedText.value) return
    
    isResizing.value = true
    currentHandle.value = handle
    
    const text = normalizeText(selectedText.value)
    
    resizeStartData.value = {
      startX: x,
      startY: y,
      originalSize: text.fontSize,
      originalX: text.x,
      originalY: text.y
    }
    
    if (imageStore.canvas) {
      imageStore.canvas.style.cursor = 'nwse-resize'
    }
  }
  
  /**
   * Behandelt Mouse Move Event
   */
  function handleMouseMove(x, y) {
    if (!imageStore.hasImage) return false
    
    // Resize
    if (isResizing.value && selectedText.value && resizeStartData.value) {
      const text = normalizeText(selectedText.value)
      const resizedText = calculateResizedText(
        text,
        resizeStartData.value,
        { x, y },
        currentHandle.value
      )
      
      imageStore.updateText(selectedText.value.id, {
        fontSize: resizedText.fontSize,
        size: resizedText.fontSize // Für Rückwärtskompatibilität
      })
      
      imageStore.draw()
      return true
    }
    
    // Drag
    if (isDragging.value && selectedText.value && dragStartPos.value) {
      const deltaX = x - dragStartPos.value.x
      const deltaY = y - dragStartPos.value.y
      
      imageStore.updateText(selectedText.value.id, {
        x: selectedText.value.x + deltaX,
        y: selectedText.value.y + deltaY
      })
      
      dragStartPos.value = { x, y }
      imageStore.draw()
      return true
    }
    
    // Cursor-Update bei Hover
    if (selectedTextId.value !== null && imageStore.canvas) {
      const textIndex = imageStore.texts.findIndex(t => t.id === selectedTextId.value)
      const handleInfo = findHandleAtPosition(x, y, textIndex)
      
      if (handleInfo) {
        if (handleInfo.handle.type === 'delete') {
          imageStore.canvas.style.cursor = 'pointer'
        } else {
          imageStore.canvas.style.cursor = 'nwse-resize'
        }
        return true
      } else {
        const textIndex = findTextAtPosition(x, y)
        if (textIndex !== -1) {
          imageStore.canvas.style.cursor = 'move'
          return true
        }
      }
      
      imageStore.canvas.style.cursor = 'default'
    }
    
    return false
  }
  
  /**
   * Behandelt Mouse Up Event
   */
  function handleMouseUp() {
    let wasInteracting = false
    
    if (isResizing.value) {
      isResizing.value = false
      resizeStartData.value = null
      currentHandle.value = null
      wasInteracting = true
      
      if (imageStore.canvas) {
        imageStore.canvas.style.cursor = 'default'
      }
      
      imageStore.saveState('Text skaliert', 'text')
    }
    
    if (isDragging.value) {
      isDragging.value = false
      dragStartPos.value = null
      wasInteracting = true
      
      if (imageStore.canvas) {
        imageStore.canvas.style.cursor = 'default'
      }
      
      imageStore.saveState('Text verschoben', 'text')
    }
    
    return wasInteracting
  }
  
  /**
   * Behandelt Keyboard Events
   */
  function handleKeyDown(event) {
    if (!selectedTextId.value) return false
    
    // Delete
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      imageStore.deleteText(selectedTextId.value)
      return true
    }
    
    // Escape - Deselektieren
    if (event.key === 'Escape') {
      event.preventDefault()
      imageStore.selectedTextId = null
      imageStore.draw()
      return true
    }
    
    // Arrow Keys - Text verschieben
    const step = event.shiftKey ? 10 : 1
    let moved = false
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        imageStore.updateText(selectedTextId.value, {
          x: selectedText.value.x - step
        })
        moved = true
        break
      case 'ArrowRight':
        event.preventDefault()
        imageStore.updateText(selectedTextId.value, {
          x: selectedText.value.x + step
        })
        moved = true
        break
      case 'ArrowUp':
        event.preventDefault()
        imageStore.updateText(selectedTextId.value, {
          y: selectedText.value.y - step
        })
        moved = true
        break
      case 'ArrowDown':
        event.preventDefault()
        imageStore.updateText(selectedTextId.value, {
          y: selectedText.value.y + step
        })
        moved = true
        break
    }
    
    if (moved) {
      imageStore.draw()
      return true
    }
    
    return false
  }
  
  /**
   * Setzt alle Interaktionen zurück
   */
  function reset() {
    isDragging.value = false
    isResizing.value = false
    dragStartPos.value = null
    resizeStartData.value = null
    currentHandle.value = null
    lastClickTime.value = 0
    lastClickIndex.value = -1
  }
  
  // ===== WATCHERS =====
  
  // Reset bei Bildwechsel
  watch(() => imageStore.workingUrl, () => {
    reset()
  })
  
  // ===== RETURN =====
  
  return {
    // State
    isDragging,
    isResizing,
    isInteracting,
    
    // Methods
    findTextAtPosition,
    findHandleAtPosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    reset
  }
}
