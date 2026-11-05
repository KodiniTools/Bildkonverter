import { computed, ref, watch, type Ref } from 'vue';

/** Maximale Anzahl Verlaufsschritte im Text-Dialog */
export const MAX_HISTORY_SIZE = 50;

/** Formularzustand des Text-Dialogs */
export interface TextEditFields {
  content: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  x: number;
  y: number;
  id?: string | number;
}

/** Verlaufseintrag: nur die im Dialog editierbaren Felder */
export type TextEditSnapshot = Pick<
  TextEditFields,
  'content' | 'fontSize' | 'color' | 'fontFamily'
>;

/** Text, den useTextModal zum Bearbeiten übergibt (null = neuer Text) */
export type EditingText = Partial<TextEditFields> | null | undefined;

/** Formularwerte aus dem zu bearbeitenden Text; ohne Text die Standardwerte */
export function toTextEditFields(text: EditingText): TextEditFields {
  if (!text) {
    return { content: '', fontSize: 32, color: '#000000', fontFamily: 'Arial', x: 50, y: 50 };
  }
  return {
    content: text.content || '',
    fontSize: text.fontSize || 32,
    color: text.color || '#000000',
    fontFamily: text.fontFamily || 'Arial',
    x: text.x || 50,
    y: text.y || 50,
    id: text.id,
  };
}

/**
 * Formular des Text-Dialogs mit eigenem Rückgängig/Wiederherstellen-Verlauf.
 * Beim Öffnen (neuer editingText) wird das Formular befüllt und der Verlauf
 * neu begonnen.
 */
export function useTextEditForm(editingText: Ref<EditingText>) {
  const history = ref<TextEditSnapshot[]>([]);
  const historyIndex = ref(-1);
  const isUndoRedoAction = ref(false);

  const localText = ref<TextEditFields>(toTextEditFields(null));

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  function createSnapshot(): TextEditSnapshot {
    return {
      content: localText.value.content,
      fontSize: localText.value.fontSize,
      color: localText.value.color,
      fontFamily: localText.value.fontFamily,
    };
  }

  function saveToHistory() {
    if (isUndoRedoAction.value) return;

    const snapshot = createSnapshot();

    // Remove any redo states if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    history.value.push(snapshot);

    // Limit history size
    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value.shift();
    } else {
      historyIndex.value++;
    }
  }

  function initHistory() {
    history.value = [createSnapshot()];
    historyIndex.value = 0;
  }

  function restore(snapshot: TextEditSnapshot) {
    localText.value.content = snapshot.content;
    localText.value.fontSize = snapshot.fontSize;
    localText.value.color = snapshot.color;
    localText.value.fontFamily = snapshot.fontFamily;

    // Flag nach dem Vue-Update zurücksetzen (Eingaben lösen saveToHistory aus)
    setTimeout(() => {
      isUndoRedoAction.value = false;
    }, 0);
  }

  function undo() {
    if (!canUndo.value) return;
    isUndoRedoAction.value = true;
    historyIndex.value--;
    restore(history.value[historyIndex.value]!);
  }

  function redo() {
    if (!canRedo.value) return;
    isUndoRedoAction.value = true;
    historyIndex.value++;
    restore(history.value[historyIndex.value]!);
  }

  watch(
    editingText,
    (newText) => {
      localText.value = toTextEditFields(newText);
      // Initialize history when modal opens
      initHistory();
    },
    { immediate: true }
  );

  /** Daten für useTextModal.saveText */
  function savePayload() {
    const { content, fontSize, color, fontFamily, x, y } = localText.value;
    return { content, fontSize, color, fontFamily, x, y };
  }

  return { localText, canUndo, canRedo, saveToHistory, undo, redo, savePayload };
}
