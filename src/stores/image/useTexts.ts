import { createDefaultText, validateText } from '@/utils/textUtils';
import { logger } from '@/utils/logger';
import type { ImageStoreContext, StoreText } from './types';

/** Text-Ebenen: hinzufügen, ändern, löschen (alte Felder txt/size bleiben synchron) */
export function useTexts({
  texts,
  selectedTextId,
  imageWidth,
  imageHeight,
  draw,
}: ImageStoreContext) {
  /** Fügt einen Text hinzu */
  function addText(textData: Partial<StoreText> = {}) {
    // Erstelle Default-Text wenn keine Daten übergeben
    const defaultText = createDefaultText(
      textData.content || textData.txt || 'Neuer Text',
      textData.x !== undefined ? textData.x : imageWidth.value / 2,
      textData.y !== undefined ? textData.y : imageHeight.value / 2
    );

    // Merge mit übergebenen Daten
    const newText: StoreText = {
      ...defaultText,
      ...textData,
      id: Date.now() + Math.random(),
    };

    // Normalisiere für Rückwärtskompatibilität
    newText.txt = newText.content;
    newText.size = newText.fontSize;

    // Validierung
    const validation = validateText(newText);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    texts.value.push(newText);
    selectedTextId.value = newText.id;
    draw();

    return newText;
  }

  /** Aktualisiert einen Text */
  function updateText(textId: StoreText['id'], updates: Partial<StoreText>) {
    const text = texts.value.find((t) => t.id === textId);
    if (!text) {
      logger.warn(`Text mit ID ${textId} nicht gefunden`);
      return;
    }

    // Update durchführen
    Object.assign(text, updates);

    // Synchronisiere alte und neue Eigenschaften
    if (updates.content !== undefined) {
      text.txt = updates.content;
    }
    if (updates.txt !== undefined) {
      text.content = updates.txt;
    }
    if (updates.fontSize !== undefined) {
      text.size = updates.fontSize;
    }
    if (updates.size !== undefined) {
      text.fontSize = updates.size;
    }

    // Validierung
    const validation = validateText(text);
    if (!validation.isValid) {
      logger.warn('Text-Validierung fehlgeschlagen:', validation.errors);
    }

    draw();
  }

  /** Löscht einen Text */
  function deleteText(textId: StoreText['id']) {
    const index = texts.value.findIndex((t) => t.id === textId);
    if (index !== -1) {
      texts.value.splice(index, 1);
      if (selectedTextId.value === textId) {
        selectedTextId.value = null;
      }
      draw();
    }
  }

  return { addText, updateText, deleteText };
}
