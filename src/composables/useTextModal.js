/**
 * useTextModal.js - Composable für Text-Modal-Verwaltung
 * 
 * Bietet eine einfache API zum Öffnen/Schließen des Text-Modals
 */

import { ref, readonly } from 'vue'
import { useImageStore } from '@/stores/imageStore'

// Globaler State (außerhalb der Funktion für Singleton-Pattern)
const isModalOpen = ref(false)
const editingText = ref(null)
const modalMode = ref('add') // 'add' oder 'edit'

/**
 * Composable für Text-Modal
 */
export function useTextModal() {
  const imageStore = useImageStore()
  
  /**
   * Öffnet Modal zum Hinzufügen eines neuen Textes
   */
  function openAddTextModal(defaultPosition = null) {
    editingText.value = null
    modalMode.value = 'add'
    
    // Wenn Position übergeben, speichere sie
    if (defaultPosition) {
      editingText.value = {
        x: defaultPosition.x,
        y: defaultPosition.y
      }
    }
    
    isModalOpen.value = true
  }
  
  /**
   * Öffnet Modal zum Bearbeiten eines bestehenden Textes
   */
  function openEditTextModal(textId) {
    const text = imageStore.texts.find(t => t.id === textId)
    
    if (!text) {
      console.warn(`Text mit ID ${textId} nicht gefunden`)
      return
    }
    
    editingText.value = { ...text }
    modalMode.value = 'edit'
    isModalOpen.value = true
  }
  
  /**
   * Schließt das Modal
   */
  function closeModal() {
    isModalOpen.value = false
    editingText.value = null
    modalMode.value = 'add'
  }
  
  /**
   * Speichert den Text (hinzufügen oder aktualisieren)
   */
  function saveText(textData) {
    try {
      if (modalMode.value === 'edit' && editingText.value?.id) {
        // Bestehenden Text aktualisieren
        imageStore.updateText(editingText.value.id, textData)
        imageStore.saveState('Text bearbeitet', 'text')
      } else {
        // Neuen Text hinzufügen
        imageStore.addText(textData)
      }
      
      closeModal()
    } catch (error) {
      console.error('Fehler beim Speichern des Textes:', error)
      throw error
    }
  }
  
  /**
   * Schnell einen Text mit Standardwerten hinzufügen
   */
  function quickAddText(content, position = null) {
    try {
      const textData = {
        content,
        x: position?.x || imageStore.imageWidth / 2,
        y: position?.y || imageStore.imageHeight / 2
      }
      
      imageStore.addText(textData)
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Textes:', error)
      throw error
    }
  }
  
  /**
   * Löscht einen Text
   */
  function deleteText(textId) {
    try {
      imageStore.deleteText(textId)
      closeModal()
    } catch (error) {
      console.error('Fehler beim Löschen des Textes:', error)
      throw error
    }
  }
  
  return {
    // State (readonly für externe Verwendung)
    isModalOpen: readonly(isModalOpen),
    editingText: readonly(editingText),
    modalMode: readonly(modalMode),
    
    // Methods
    openAddTextModal,
    openEditTextModal,
    closeModal,
    saveText,
    deleteText,
    quickAddText
  }
}
