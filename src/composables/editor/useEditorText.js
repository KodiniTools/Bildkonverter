/**
 * useEditorText
 *
 * Bündelt das Erstellen, Aktualisieren, Löschen und die History der
 * Text-Ebenen im Editor. Ausgelagert aus EditorView.vue. Verhalten
 * unverändert.
 *
 * @param {object}   deps
 * @param {import('vue').Ref} deps.currentImage    Aktuell geladenes Bild
 * @param {import('vue').Ref} deps.canvas          Canvas-Element-Ref
 * @param {object}   deps.imageStore               Pinia-Image-Store
 * @param {import('vue').Ref} deps.selectedTextId  ID des selektierten Textes
 * @param {Function} deps.renderImage              Rendert das Canvas neu
 * @param {Function} deps.saveHistory              Speichert allgemeine History
 * @param {Function} deps.saveTextHistory          Speichert Text-History
 * @param {Function} deps.undoText                 Text-Undo
 * @param {Function} deps.redoText                 Text-Redo
 */
export function useEditorText({
  currentImage,
  canvas,
  imageStore,
  selectedTextId,
  renderImage,
  saveHistory,
  saveTextHistory,
  undoText,
  redoText,
}) {
  function addText() {
    if (!currentImage.value) return;
    const newText = {
      id: Date.now(),
      content: 'Neuer Text',
      x: Math.floor(canvas.value.width / 2) - 50,
      y: Math.floor(canvas.value.height / 2),
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

  function updateSelectedText(updates) {
    if (!selectedTextId.value) return;
    const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
    if (!text) return;
    Object.assign(text, updates);
    renderImage();
  }

  const handleTextContentUpdate = (content) => updateSelectedText({ content, txt: content });
  const handleTextFontSizeUpdate = (fontSize) => updateSelectedText({ fontSize, size: fontSize });
  const handleTextColorUpdate = (color) => updateSelectedText({ color });
  const handleTextRotationUpdate = (rotation) => updateSelectedText({ rotation });
  const handleTextOpacityUpdate = (opacity) => updateSelectedText({ opacity });
  const handleTextBoldUpdate = (bold) => updateSelectedText({ bold });
  const handleTextItalicUpdate = (italic) => updateSelectedText({ italic });
  const handleTextSkewXUpdate = (skewX) => updateSelectedText({ skewX });
  const handleTextSkewYUpdate = (skewY) => updateSelectedText({ skewY });
  const handleTextStrokeWidthUpdate = (strokeWidth) => updateSelectedText({ strokeWidth });
  const handleTextStrokeColorUpdate = (strokeColor) => updateSelectedText({ strokeColor });
  const handleTextShadowOffsetXUpdate = (shadowOffsetX) => updateSelectedText({ shadowOffsetX });
  const handleTextShadowOffsetYUpdate = (shadowOffsetY) => updateSelectedText({ shadowOffsetY });
  const handleTextShadowColorUpdate = (shadowColor) => updateSelectedText({ shadowColor });

  function handleTextFontFamilyUpdate(fontFamily) {
    updateSelectedText({ fontFamily });
    saveHistory();
  }

  function handleTextShadowBlurUpdate(shadowBlur) {
    if (!selectedTextId.value) return;
    const text = imageStore.texts.find((t) => t.id === selectedTextId.value);
    if (!text) return;
    const updates = { shadowBlur };
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
  function handleDeleteTextById(id) {
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

  const handleSaveTextHistory = () => saveTextHistory();
  const handleUndoText = () => {
    undoText();
    renderImage();
  };
  const handleRedoText = () => {
    redoText();
    renderImage();
  };

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
    handleTextFontFamilyUpdate,
    handleTextShadowBlurUpdate,
    handleDeleteText,
    handleDeleteTextById,
    handleDeselectText,
    handleSaveTextHistory,
    handleUndoText,
    handleRedoText,
  };
}
