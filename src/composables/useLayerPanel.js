import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImageStore } from '@/stores/imageStore';
import { useConfirm } from '@/composables/useConfirm';
import { availableFonts } from '@/assets/fonts/fontList.js';

/**
 * useLayerPanel
 *
 * Kapselt die gesamte Logik des LayerControlPanels (Layer-, Text- und
 * History-Steuerung). Wurde aus LayerControlPanel.vue extrahiert, damit das
 * Panel in kleinere Teilkomponenten aufgeteilt werden kann, ohne die
 * Funktionalität zu ändern. Das zurückgegebene Kontext-Objekt wird vom
 * Orchestrator per provide/inject an die Tab-Komponenten weitergereicht.
 *
 * @param {{ canvasSelectedTextId: string | null }} props - Props der Panel-Komponente
 * @param {(event: string, ...args: any[]) => void} emit - emit-Funktion der Panel-Komponente
 */
export function useLayerPanel(props, emit) {
  const { t } = useI18n();
  const { confirm: confirmDialog } = useConfirm();

  const imageStore = useImageStore();
  const maintainAspectRatio = ref(true);
  const activeTab = ref('layers');
  const selectedTextId = ref(null);

  // Debounce Timer für History-Speicherung
  let saveStateTimer = null;

  // Debounced saveState - speichert erst nach 500ms Inaktivität
  function debouncedSaveState(description, type = 'layer') {
    if (saveStateTimer) {
      clearTimeout(saveStateTimer);
    }
    saveStateTimer = setTimeout(() => {
      imageStore.saveState(description, type);
      saveStateTimer = null;
    }, 500);
  }

  // Sofortige State-Speicherung ohne Debounce
  function saveStateNow(description, type = 'layer') {
    if (saveStateTimer) {
      clearTimeout(saveStateTimer);
      saveStateTimer = null;
    }
    imageStore.saveState(description, type);
  }

  // Wenn Text auf Canvas ausgewählt wird, zu Text-Tab wechseln und Text auswählen
  watch(
    () => props.canvasSelectedTextId,
    (newTextId) => {
      if (newTextId) {
        selectedTextId.value = newTextId;
        activeTab.value = 'text';
        // Layer-Auswahl aufheben
        imageStore.selectImageLayer(null);
      } else {
        // Text wurde abgewählt - wenn ein Layer ausgewählt ist, zu Layers-Tab wechseln
        if (imageStore.selectedLayerId) {
          activeTab.value = 'layers';
          selectedTextId.value = null;
        }
      }
    }
  );

  // Wenn ein Layer ausgewählt wird, zu Layers-Tab wechseln
  watch(
    () => imageStore.selectedLayerId,
    (newLayerId) => {
      if (newLayerId) {
        activeTab.value = 'layers';
        selectedTextId.value = null;
      }
    }
  );

  const openSections = reactive({
    canvas: true,
    transform: true,
    filters: false,
    border: false,
    shadow: false,
  });

  // Schnellfarben für Hintergrund
  const quickColors = computed(() => [
    { value: 'transparent', label: t('layerPanel.background.transparent') },
    { value: '#ffffff', label: t('layerPanel.background.white') },
    { value: '#000000', label: t('layerPanel.background.black') },
    { value: '#f0f0f0', label: t('layerPanel.background.lightGray') },
    { value: '#808080', label: t('layerPanel.background.gray') },
    { value: '#ff0000', label: t('layerPanel.background.red') },
    { value: '#00ff00', label: t('layerPanel.background.green') },
    { value: '#0000ff', label: t('layerPanel.background.blue') },
  ]);

  // System-Fonts als Fallback
  const systemFonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'Impact',
    'Tahoma',
    'Trebuchet MS',
  ];

  const selectedLayer = computed(() => imageStore.selectedImageLayer);

  const reversedLayers = computed(() => {
    return [...imageStore.imageLayers].reverse();
  });

  const selectedText = computed(() => {
    if (!selectedTextId.value || !imageStore.texts) return null;
    return imageStore.texts.find((t) => t.id === selectedTextId.value);
  });

  // History Info Computed
  const historyInfo = computed(() => {
    const current = imageStore.historyIndex + 1;
    const total = imageStore.history.length;
    if (total === 0) return '';
    return `${current}/${total}`;
  });

  // Default Werte für Layer Border
  const layerBorder = computed(() => ({
    width: selectedLayer.value?.border?.width || 0,
    color: selectedLayer.value?.border?.color || '#000000',
    radius: selectedLayer.value?.border?.radius || 0,
  }));

  // Default Werte für Layer Shadow
  const layerShadow = computed(() => ({
    enabled: selectedLayer.value?.shadow?.enabled || false,
    offsetX: selectedLayer.value?.shadow?.offsetX || 5,
    offsetY: selectedLayer.value?.shadow?.offsetY || 5,
    blur: selectedLayer.value?.shadow?.blur || 10,
    color: selectedLayer.value?.shadow?.color || '#000000',
    opacity: selectedLayer.value?.shadow?.opacity || 50,
  }));

  function toggleSection(section) {
    openSections[section] = !openSections[section];
  }

  function updateBackgroundColor(color) {
    imageStore.canvasBackgroundColor = color;
    emit('render');
    debouncedSaveState('Hintergrundfarbe geändert', 'layer');
  }

  function selectLayer(layerId) {
    imageStore.selectImageLayer(layerId);
    emit('render');
  }

  function toggleVisibility(layer) {
    imageStore.updateImageLayer(layer.id, { visible: !layer.visible });
    emit('render');
    saveStateNow(layer.visible ? 'Layer ausgeblendet' : 'Layer eingeblendet', 'layer');
  }

  async function deleteLayer(layerId) {
    const confirmed = await confirmDialog(t('layerPanel.layers.confirmDelete'), {
      title: t('layerPanel.layers.delete'),
      confirmText: t('confirm.delete', 'Löschen'),
      cancelText: t('confirm.cancel', 'Abbrechen'),
      variant: 'danger',
    });
    if (confirmed) {
      imageStore.deleteImageLayer(layerId);
      emit('render');
    }
  }

  function moveLayer(direction) {
    if (selectedLayer.value) {
      imageStore.moveImageLayerOrder(selectedLayer.value.id, direction);
      emit('render');
    }
  }

  function duplicateLayer() {
    if (selectedLayer.value) {
      imageStore.duplicateImageLayer(selectedLayer.value.id);
      emit('render');
    }
  }

  function updateLayerProperty(property, value) {
    if (selectedLayer.value) {
      imageStore.updateImageLayer(selectedLayer.value.id, { [property]: value });
      emit('render');
      debouncedSaveState(`Layer ${property} geändert`, 'layer');
    }
  }

  function updateSize(property, value) {
    if (!selectedLayer.value) return;

    const layer = selectedLayer.value;
    const aspectRatio = layer.originalWidth / layer.originalHeight;

    if (maintainAspectRatio.value) {
      if (property === 'width') {
        imageStore.updateImageLayer(layer.id, {
          width: value,
          height: value / aspectRatio,
        });
      } else {
        imageStore.updateImageLayer(layer.id, {
          width: value * aspectRatio,
          height: value,
        });
      }
    } else {
      imageStore.updateImageLayer(layer.id, { [property]: value });
    }
    emit('render');
    debouncedSaveState('Layer-Größe geändert', 'layer');
  }

  function rotateBy(degrees) {
    if (selectedLayer.value) {
      const newRotation = (selectedLayer.value.rotation + degrees) % 360;
      updateLayerProperty('rotation', newRotation);
    }
  }

  function toggleFlip(direction) {
    if (selectedLayer.value) {
      const currentValue = selectedLayer.value[direction] || false;
      imageStore.updateImageLayer(selectedLayer.value.id, { [direction]: !currentValue });
      emit('render');
      saveStateNow(
        direction === 'flipX' ? 'Horizontal gespiegelt' : 'Vertikal gespiegelt',
        'layer'
      );
    }
  }

  function updateFilter(filterName, value) {
    if (selectedLayer.value) {
      const newFilters = { ...selectedLayer.value.filters, [filterName]: value };
      imageStore.updateImageLayer(selectedLayer.value.id, { filters: newFilters });
      emit('render');
      debouncedSaveState(`Layer-Filter ${filterName} geändert`, 'layer');
    }
  }

  function updateBorder(property, value) {
    if (selectedLayer.value) {
      const currentBorder = selectedLayer.value.border || { width: 0, color: '#000000', radius: 0 };
      const newBorder = { ...currentBorder, [property]: value };
      imageStore.updateImageLayer(selectedLayer.value.id, { border: newBorder });
      emit('render');
      debouncedSaveState('Layer-Umrandung geändert', 'layer');
    }
  }

  function updateShadow(property, value) {
    if (selectedLayer.value) {
      const currentShadow = selectedLayer.value.shadow || {
        enabled: false,
        offsetX: 5,
        offsetY: 5,
        blur: 10,
        color: '#000000',
        opacity: 50,
      };
      const newShadow = { ...currentShadow, [property]: value };
      imageStore.updateImageLayer(selectedLayer.value.id, { shadow: newShadow });
      emit('render');
      debouncedSaveState('Layer-Schatten geändert', 'layer');
    }
  }

  function resetLayerFilters() {
    if (selectedLayer.value) {
      imageStore.updateImageLayer(selectedLayer.value.id, {
        filters: {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: 0,
          sepia: 0,
          blur: 0,
          hue: 0,
        },
        rotation: 0,
        opacity: 100,
        border: { width: 0, color: '#000000', radius: 0 },
        shadow: { enabled: false, offsetX: 5, offsetY: 5, blur: 10, color: '#000000', opacity: 50 },
      });
      emit('render');
      saveStateNow('Layer-Filter zurückgesetzt', 'layer');
    }
  }

  // Text Funktionen
  function addText() {
    const newText = {
      id: `text_${Date.now()}`,
      content: t('layerPanel.text.newText'),
      x: 100,
      y: 100,
      fontSize: 48,
      fontFamily: availableFonts[0] || 'Arial', // Erste verfügbare Schriftart
      color: '#000000',
      opacity: 100,
      rotation: 0,
      strokeWidth: 0,
      strokeColor: '#ffffff',
      shadowBlur: 0,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: '#000000',
    };

    if (!imageStore.texts) {
      imageStore.texts = [];
    }
    imageStore.texts.push(newText);
    selectedTextId.value = newText.id;
    emit('render');
  }

  function selectText(textId) {
    selectedTextId.value = textId;
    // Layer-Auswahl aufheben
    imageStore.selectImageLayer(null);
    emit('select-text', textId);
    emit('render');
  }

  async function deleteText(textId) {
    const confirmed = await confirmDialog(t('layerPanel.text.confirmDelete'), {
      title: t('layerPanel.text.delete', 'Text löschen'),
      confirmText: t('confirm.delete', 'Löschen'),
      cancelText: t('confirm.cancel', 'Abbrechen'),
      variant: 'danger',
    });
    if (confirmed) {
      const index = imageStore.texts.findIndex((txt) => txt.id === textId);
      if (index !== -1) {
        imageStore.texts.splice(index, 1);
        if (selectedTextId.value === textId) {
          selectedTextId.value = null;
        }
        emit('render');
      }
    }
  }

  function updateTextProperty(property, value) {
    if (selectedText.value) {
      const index = imageStore.texts.findIndex((t) => t.id === selectedText.value.id);
      if (index !== -1) {
        imageStore.texts[index][property] = value;
        // Für ältere Text-Struktur auch 'txt' aktualisieren
        if (property === 'content') {
          imageStore.texts[index].txt = value;
        }
        emit('render');
      }
    }
  }

  // Undo/Redo Funktionen
  function handleUndo() {
    if (imageStore.canUndo) {
      imageStore.undo();
      emit('render');
    }
  }

  function handleRedo() {
    if (imageStore.canRedo) {
      imageStore.redo();
      emit('render');
    }
  }

  // Preview Funktion
  function handlePreview() {
    emit('render');
    emit('preview');
  }

  // Keyboard Shortcuts für Undo/Redo
  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
      event.preventDefault();
      handleUndo();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      ((event.shiftKey && event.key === 'z') || event.key === 'y')
    ) {
      event.preventDefault();
      handleRedo();
    }
  }

  // Event Listener für Keyboard Shortcuts
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return {
    // Store & shared state
    imageStore,
    activeTab,
    selectedTextId,
    maintainAspectRatio,
    openSections,
    // Fonts
    availableFonts,
    systemFonts,
    // Computeds
    quickColors,
    selectedLayer,
    reversedLayers,
    selectedText,
    historyInfo,
    layerBorder,
    layerShadow,
    // Section handling
    toggleSection,
    // Layer actions
    updateBackgroundColor,
    selectLayer,
    toggleVisibility,
    deleteLayer,
    moveLayer,
    duplicateLayer,
    updateLayerProperty,
    updateSize,
    rotateBy,
    toggleFlip,
    updateFilter,
    updateBorder,
    updateShadow,
    resetLayerFilters,
    // Text actions
    addText,
    selectText,
    deleteText,
    updateTextProperty,
    // History actions
    handleUndo,
    handleRedo,
    handlePreview,
  };
}

/** Injection key für den Layer-Panel-Kontext. */
export const LAYER_PANEL_KEY = Symbol('layerPanel');
