import { computed, type Ref } from 'vue';
import { isFontBold, isFontItalic } from '@/utils/textRender';
import type { EditorText } from './types';

/**
 * Fett/Kursiv-Umschalter: Bringt die Schriftart den Stil schon mit, ist der
 * Umschalter aktiv und gesperrt; sonst zählt der manuell gesetzte Wert.
 */
export function useTextFontStyle(selectedText: Ref<EditorText | null | undefined>) {
  // Bringt die aktuelle Schriftart Fett/Kursiv bereits von Haus aus mit?
  // Dann werden die entsprechenden Umschalter deaktiviert (Ausnahme laut Vorgabe).
  const fontIsBold = computed(() => isFontBold(selectedText.value?.fontFamily || ''));
  const fontIsItalic = computed(() => isFontItalic(selectedText.value?.fontFamily || ''));

  // Aktiv-Zustand der Umschalter: durch die Schriftart bedingt ODER manuell gesetzt
  const isBoldActive = computed(() => fontIsBold.value || !!selectedText.value?.bold);
  const isItalicActive = computed(() => fontIsItalic.value || !!selectedText.value?.italic);

  return { fontIsBold, fontIsItalic, isBoldActive, isItalicActive };
}
