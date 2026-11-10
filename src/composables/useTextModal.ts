/**
 * useTextModal.ts - Composable für Text-Modal-Verwaltung
 *
 * Bietet eine einfache API zum Öffnen/Schließen des Text-Modals
 */

import { ref, readonly } from 'vue';
import { useImageStore } from '@/stores/imageStore';
import { logger } from '@/utils/logger';
import type { StoreText } from '@/stores/image/types';

export type TextModalMode = 'add' | 'edit';

/** Position für einen neuen Text (Canvas-Koordinaten) */
export interface TextPosition {
  x: number;
  y: number;
}

// Globaler State (außerhalb der Funktion für Singleton-Pattern)
const isModalOpen = ref(false);
/** Neuer Text: null oder nur die Position; Bearbeiten: Kopie des Textes */
const editingText = ref<Partial<StoreText> | null>(null);
const modalMode = ref<TextModalMode>('add');

/**
 * Composable für Text-Modal
 */
export function useTextModal() {
  const imageStore = useImageStore();

  /**
   * Öffnet Modal zum Hinzufügen eines neuen Textes
   */
  function openAddTextModal(defaultPosition: TextPosition | null = null): void {
    editingText.value = null;
    modalMode.value = 'add';

    // Wenn Position übergeben, speichere sie
    if (defaultPosition) {
      editingText.value = {
        x: defaultPosition.x,
        y: defaultPosition.y,
      };
    }

    isModalOpen.value = true;
  }

  /**
   * Öffnet Modal zum Bearbeiten eines bestehenden Textes
   */
  function openEditTextModal(textId: StoreText['id']): void {
    const text = imageStore.texts.find((t) => t.id === textId);

    if (!text) {
      logger.warn(`Text mit ID ${textId} nicht gefunden`);
      return;
    }

    editingText.value = { ...text };
    modalMode.value = 'edit';
    isModalOpen.value = true;
  }

  /**
   * Schließt das Modal
   */
  function closeModal(): void {
    isModalOpen.value = false;
    editingText.value = null;
    modalMode.value = 'add';
  }

  /**
   * Speichert den Text (hinzufügen oder aktualisieren)
   */
  function saveText(textData: Partial<StoreText>): void {
    try {
      if (modalMode.value === 'edit' && editingText.value?.id) {
        // Bestehenden Text aktualisieren
        imageStore.updateText(editingText.value.id, textData);
        imageStore.saveState('Text bearbeitet');
      } else {
        // Neuen Text hinzufügen
        imageStore.addText(textData);
        imageStore.saveState('Text hinzugefügt');
      }

      closeModal();
    } catch (error) {
      logger.error('Fehler beim Speichern des Textes:', error);
      throw error;
    }
  }

  /**
   * Schnell einen Text mit Standardwerten hinzufügen
   */
  function quickAddText(content: string, position: TextPosition | null = null): void {
    try {
      const textData = {
        content,
        x: position?.x || imageStore.imageWidth / 2,
        y: position?.y || imageStore.imageHeight / 2,
      };

      imageStore.addText(textData);
      imageStore.saveState('Text hinzugefügt');
    } catch (error) {
      logger.error('Fehler beim Hinzufügen des Textes:', error);
      throw error;
    }
  }

  /**
   * Löscht einen Text
   */
  function deleteText(textId: StoreText['id']): void {
    try {
      imageStore.deleteText(textId);
      imageStore.saveState('Text gelöscht');
      closeModal();
    } catch (error) {
      logger.error('Fehler beim Löschen des Textes:', error);
      throw error;
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
    quickAddText,
  };
}
