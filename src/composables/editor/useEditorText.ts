/**
 * useEditorText
 *
 * Bündelt das Erstellen, Aktualisieren und Löschen der Text-Ebenen im
 * Editor. Ausgelagert aus EditorView.vue. Undo/Redo läuft über die
 * gemeinsame Editor-Historie (saveHistory), nicht über eine eigene Text-History.
 */
import type { Ref } from 'vue';
import type { useImageStore } from '@/stores/imageStore';
import type { StoreText } from '@/stores/image/types';
import type { EditorImage } from './types';

export interface EditorTextDeps {
  /** Aktuell geladenes Bild */
  currentImage: Ref<EditorImage | null>;
  /** Canvas-Element-Ref */
  canvas: Ref<HTMLCanvasElement | null>;
  /** Pinia-Image-Store */
  imageStore: Pick<ReturnType<typeof useImageStore>, 'texts'>;
  /** ID des selektierten Textes */
  selectedTextId: Ref<StoreText['id'] | null>;
  /** Rendert das Canvas neu */
  renderImage: () => void;
  /** Speichert allgemeine History */
  saveHistory: () => void;
}

export function useEditorText({
  currentImage,
  canvas,
  imageStore,
  selectedTextId,
  renderImage,
  saveHistory,
}: EditorTextDeps) {
  function addText() {
    if (!currentImage.value) return;
    // Mit geladenem Bild ist der Canvas gemountet
    const cv = canvas.value!;
    const newText: StoreText = {
      id: Date.now(),
      content: 'Neuer Text',
      x: Math.floor(cv.width / 2) - 50,
      y: Math.floor(cv.height / 2),
      fontSize: 32,
      fontFamily: 'Satoshi Regular',
      color: '#000000',
      rotation: 0,
      opacity: 100,
      bold: false,
      italic: false,
      skewX: 0,
      skewY: 0,
      strokeWidth: 0,
      strokeColor: '#000000',
      shadowBlur: 0,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: '#000000',
    };
    imageStore.texts.push(newText);
    selectedTextId.value = newText.id;
    renderImage();
    saveHistory();
  }

  function updateSelectedText(updates: Partial<StoreText>) {
    if (!selectedTextId.value) return;
    const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
    if (!text) return;
    Object.assign(text, updates);
    renderImage();
  }

  const handleTextContentUpdate = (content: string) =>
    updateSelectedText({ content, txt: content });
  const handleTextFontSizeUpdate = (fontSize: number) =>
    updateSelectedText({ fontSize, size: fontSize });
  const handleTextColorUpdate = (color: string) => updateSelectedText({ color });
  const handleTextRotationUpdate = (rotation: number) => updateSelectedText({ rotation });
  const handleTextOpacityUpdate = (opacity: number) => updateSelectedText({ opacity });
  const handleTextBoldUpdate = (bold: boolean) => updateSelectedText({ bold });
  const handleTextItalicUpdate = (italic: boolean) => updateSelectedText({ italic });
  const handleTextSkewXUpdate = (skewX: number) => updateSelectedText({ skewX });
  const handleTextSkewYUpdate = (skewY: number) => updateSelectedText({ skewY });
  const handleTextStrokeWidthUpdate = (strokeWidth: number) => updateSelectedText({ strokeWidth });
  const handleTextStrokeColorUpdate = (strokeColor: string) => updateSelectedText({ strokeColor });
  const handleTextShadowOffsetXUpdate = (shadowOffsetX: number) =>
    updateSelectedText({ shadowOffsetX });
  const handleTextShadowOffsetYUpdate = (shadowOffsetY: number) =>
    updateSelectedText({ shadowOffsetY });
  const handleTextShadowColorUpdate = (shadowColor: string) => updateSelectedText({ shadowColor });
  const handleTextPositionXUpdate = (x: number) => updateSelectedText({ x });
  const handleTextPositionYUpdate = (y: number) => updateSelectedText({ y });

  function handleTextFontFamilyUpdate(fontFamily: string) {
    updateSelectedText({ fontFamily });
    saveHistory();
  }

  function handleTextShadowBlurUpdate(shadowBlur: number) {
    if (!selectedTextId.value) return;
    const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
    if (!text) return;
    const updates: Partial<StoreText> = { shadowBlur };
    if (shadowBlur > 0 && !text.shadowOffsetX) {
      updates.shadowOffsetX = 2;
      updates.shadowOffsetY = 2;
      updates.shadowColor = text.shadowColor || '#000000';
    }
    Object.assign(text, updates);
    renderImage();
  }

  function handleDeleteText() {
    if (!selectedTextId.value) return;
    const index = imageStore.texts.findIndex((t) => t.id === selectedTextId.value);
    if (index !== -1) {
      imageStore.texts.splice(index, 1);
      selectedTextId.value = null;
      renderImage();
      saveHistory();
    }
  }

  function handleDeselectText() {
    selectedTextId.value = null;
    renderImage();
  }

  // Löscht einen Text anhand seiner ID (für die Textliste im Normal-Modus)
  function handleDeleteTextById(id: StoreText['id']) {
    const index = imageStore.texts.findIndex((t) => t.id === id);
    if (index !== -1) {
      imageStore.texts.splice(index, 1);
      if (selectedTextId.value === id) {
        selectedTextId.value = null;
      }
      renderImage();
      saveHistory();
    }
  }

  return {
    addText,
    updateSelectedText,
    handleTextContentUpdate,
    handleTextFontSizeUpdate,
    handleTextColorUpdate,
    handleTextRotationUpdate,
    handleTextOpacityUpdate,
    handleTextBoldUpdate,
    handleTextItalicUpdate,
    handleTextSkewXUpdate,
    handleTextSkewYUpdate,
    handleTextStrokeWidthUpdate,
    handleTextStrokeColorUpdate,
    handleTextShadowOffsetXUpdate,
    handleTextShadowOffsetYUpdate,
    handleTextShadowColorUpdate,
    handleTextPositionXUpdate,
    handleTextPositionYUpdate,
    handleTextFontFamilyUpdate,
    handleTextShadowBlurUpdate,
    handleDeleteText,
    handleDeleteTextById,
    handleDeselectText,
  };
}
