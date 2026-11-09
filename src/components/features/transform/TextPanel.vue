<template>
  <!-- Text-Bearbeitung (nur wenn Text ausgewählt) -->
  <div v-if="selectedText" class="panel-section text-section">
    <div class="section-header">
      <h3>
        <AppIcon name="font" />
        {{ $t('textPanel.title', 'Text bearbeiten') }}
      </h3>
    </div>

    <HistoryActions
      :can-undo="canUndoText"
      :can-redo="canRedoText"
      :undo-title="$t('textPanel.undo', 'Rückgängig')"
      :redo-title="$t('textPanel.redo', 'Wiederherstellen')"
      @undo="emit('undo-text')"
      @redo="emit('redo-text')"
    />

    <!-- Text Inhalt -->
    <div class="control-group">
      <label>
        <AppIcon name="i-cursor" :size="14" />
        {{ $t('textPanel.content', 'Text') }}
      </label>
      <input
        type="text"
        :value="selectedText.content || selectedText.txt"
        class="text-input"
        :placeholder="$t('textPanel.placeholder', 'Text eingeben...')"
        @input="emit('update:text-content', ($event.target as HTMLInputElement).value)"
        @change="emit('save-text-history')"
      />
    </div>

    <!-- Position (X/Y in Bildpixeln, linke obere Ecke des Textes) -->
    <div class="control-group">
      <SliderField
        :model-value="posX"
        :min="rangeX.min"
        :max="rangeX.max"
        unit="px"
        :default-value="startPos.x"
        :label="$t('textPanel.positionX', 'Position X')"
        icon="fas fa-arrows-alt-h"
        input-id="text-position-x"
        @update:model-value="emit('update:text-position-x', $event)"
        @commit="emit('save-text-history')"
      />
    </div>
    <div class="control-group">
      <SliderField
        :model-value="posY"
        :min="rangeY.min"
        :max="rangeY.max"
        unit="px"
        :default-value="startPos.y"
        :label="$t('textPanel.positionY', 'Position Y')"
        icon="fas fa-arrows-alt-v"
        input-id="text-position-y"
        @update:model-value="emit('update:text-position-y', $event)"
        @commit="emit('save-text-history')"
      />
    </div>

    <!-- Schriftgröße -->
    <div class="control-group">
      <SliderField
        :model-value="selectedText.fontSize || selectedText.size || 32"
        :min="8"
        :max="200"
        unit="px"
        :default-value="32"
        :label="$t('textPanel.fontSize', 'Schriftgröße')"
        icon="fas fa-text-height"
        @update:model-value="emit('update:text-font-size', $event)"
        @commit="emit('save-text-history')"
      />
    </div>

    <!-- Schriftart -->
    <div class="control-group">
      <!-- sichtbare Beschriftung mit Icon; den Namen trägt das versteckte UiSelect-Label -->
      <label aria-hidden="true">
        <AppIcon name="font" :size="14" />
        {{ $t('textPanel.fontFamily', 'Schriftart') }}
      </label>
      <UiSelect
        :label="$t('textPanel.fontFamily', 'Schriftart')"
        label-hidden
        :options="[
          ...fontOptions(
            availableFonts,
            $t('textPanel.customFonts', 'Benutzerdefinierte Schriften')
          ),
          ...fontOptions(systemFonts, $t('textPanel.systemFonts', 'System-Schriften')),
        ]"
        :model-value="selectedText.fontFamily || 'Satoshi Regular'"
        @update:model-value="emit('update:text-font-family', $event)"
      />
    </div>

    <TextStyleToggles
      :selected-text="selectedText"
      @update:text-bold="emit('update:text-bold', $event)"
      @update:text-italic="emit('update:text-italic', $event)"
      @save-text-history="emit('save-text-history')"
    />

    <!-- Textfarbe -->
    <div class="control-group">
      <label>
        <AppIcon name="palette" :size="14" />
        {{ $t('textPanel.color', 'Farbe') }}
      </label>
      <div class="color-picker-row">
        <ColorField
          :model-value="selectedText.color || '#000000'"
          :label="$t('textPanel.color', 'Farbe')"
          class="color-input"
          @update:model-value="emit('update:text-color', $event)"
          @change="emit('save-text-history')"
        />
        <input
          type="text"
          :value="selectedText.color || '#000000'"
          class="color-text"
          maxlength="7"
          @input="emit('update:text-color', ($event.target as HTMLInputElement).value)"
          @change="emit('save-text-history')"
        />
      </div>
    </div>

    <TextStrokeControl
      :selected-text="selectedText"
      @update:text-stroke-width="emit('update:text-stroke-width', $event)"
      @update:text-stroke-color="emit('update:text-stroke-color', $event)"
      @save-text-history="emit('save-text-history')"
    />

    <TextShadowControl
      :selected-text="selectedText"
      @update:text-shadow-blur="emit('update:text-shadow-blur', $event)"
      @update:text-shadow-offset-x="emit('update:text-shadow-offset-x', $event)"
      @update:text-shadow-offset-y="emit('update:text-shadow-offset-y', $event)"
      @update:text-shadow-color="emit('update:text-shadow-color', $event)"
      @save-text-history="emit('save-text-history')"
    />

    <!-- Text-Rotation -->
    <div class="control-group">
      <SliderField
        :model-value="selectedText.rotation || 0"
        :min="-180"
        :max="180"
        unit="°"
        :default-value="0"
        :label="$t('textPanel.rotation', 'Rotation')"
        icon="fas fa-redo"
        @update:model-value="emit('update:text-rotation', $event)"
        @commit="emit('save-text-history')"
      />
    </div>

    <!-- Text-Neigung horizontal (Skew X) -->
    <div class="control-group">
      <SliderField
        :model-value="selectedText.skewX || 0"
        :min="-60"
        :max="60"
        unit="°"
        :default-value="0"
        :label="$t('textPanel.skewX', 'Neigung horizontal')"
        icon="fas fa-arrows-alt-h"
        @update:model-value="emit('update:text-skew-x', $event)"
        @commit="emit('save-text-history')"
      />
    </div>

    <!-- Text-Neigung vertikal (Skew Y) -->
    <div class="control-group">
      <SliderField
        :model-value="selectedText.skewY || 0"
        :min="-60"
        :max="60"
        unit="°"
        :default-value="0"
        :label="$t('textPanel.skewY', 'Neigung vertikal')"
        icon="fas fa-arrows-alt-v"
        @update:model-value="emit('update:text-skew-y', $event)"
        @commit="emit('save-text-history')"
      />
    </div>

    <!-- Text-Deckkraft -->
    <div class="control-group">
      <SliderField
        :model-value="selectedText.opacity !== undefined ? selectedText.opacity : 100"
        :min="0"
        :max="100"
        unit="%"
        :default-value="100"
        :label="$t('textPanel.opacity', 'Opacity')"
        icon="fas fa-adjust"
        @update:model-value="emit('update:text-opacity', $event)"
        @commit="emit('save-text-history')"
      />
    </div>

    <!-- Text löschen -->
    <button class="transform-btn delete-btn" @click="emit('delete-text')">
      <AppIcon name="trash" />
      <span>{{ $t('textPanel.delete', 'Text löschen') }}</span>
    </button>

    <!-- Auswahl aufheben -->
    <button class="transform-btn" @click="emit('deselect-text')">
      <AppIcon name="times" />
      <span>{{ $t('textPanel.deselect', 'Auswahl aufheben') }}</span>
    </button>
  </div>

  <!-- Hinweis wenn Texte vorhanden aber keiner ausgewählt -->
  <div v-else-if="hasTexts" class="panel-section text-hint">
    <p class="hint-text">
      <AppIcon name="mouse-pointer" />
      {{ $t('textPanel.selectHint', 'Klicken Sie auf einen Text im Bild, um ihn zu bearbeiten') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import ColorField from '@/components/ui/ColorField.vue';
import HistoryActions from '@/components/ui/HistoryActions.vue';
import SliderField from '@/components/ui/SliderField.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import TextStyleToggles from './TextStyleToggles.vue';
import TextStrokeControl from './TextStrokeControl.vue';
import TextShadowControl from './TextShadowControl.vue';
import { availableFonts } from '@/assets/fonts/fontList';
import { fontOptions } from '@/utils/fontOptions';
import { useTextPosition } from '@/composables/text/useTextPosition';
import type { EditorText } from '@/composables/text/types';

const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];

const props = withDefaults(
  defineProps<{
    selectedText?: EditorText | null;
    hasTexts?: boolean;
    canUndoText?: boolean;
    canRedoText?: boolean;
    /** Canvas-Breite in px – Obergrenze des X-Reglers */
    canvasWidth?: number;
    /** Canvas-Höhe in px – Obergrenze des Y-Reglers */
    canvasHeight?: number;
  }>(),
  {
    selectedText: null,
    hasTexts: false,
    canUndoText: false,
    canRedoText: false,
    canvasWidth: 0,
    canvasHeight: 0,
  }
);

const emit = defineEmits<{
  'update:text-content': [value: string];
  'update:text-font-size': [value: number];
  'update:text-font-family': [value: string];
  'update:text-color': [value: string];
  'update:text-rotation': [value: number];
  'update:text-opacity': [value: number];
  'update:text-bold': [value: boolean];
  'update:text-italic': [value: boolean];
  'update:text-skew-x': [value: number];
  'update:text-skew-y': [value: number];
  'update:text-stroke-width': [value: number];
  'update:text-stroke-color': [value: string];
  'update:text-shadow-blur': [value: number];
  'update:text-shadow-offset-x': [value: number];
  'update:text-shadow-offset-y': [value: number];
  'update:text-shadow-color': [value: string];
  'update:text-position-x': [value: number];
  'update:text-position-y': [value: number];
  'save-text-history': [];
  'undo-text': [];
  'redo-text': [];
  'delete-text': [];
  'deselect-text': [];
}>();

const { posX, posY, rangeX, rangeY, startPos } = useTextPosition({
  selectedText: toRef(props, 'selectedText'),
  canvasWidth: toRef(props, 'canvasWidth'),
  canvasHeight: toRef(props, 'canvasHeight'),
});
</script>

<style scoped lang="scss">
@use './shared' as *;

// Eingaben nutzen die globalen Feldstile (UiTextField)
.text-input {
  width: 100%;
}

// Destruktiv = UiButton danger: Text in --ds-danger auf flacher Fläche
.transform-btn.delete-btn {
  background: transparent;
  border-color: transparent;
  color: var(--ds-danger);

  &:hover:not(:disabled) {
    background: var(--ds-surface-2);
  }
}

.hint-text {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin: 0;
  line-height: var(--ds-leading);

  .app-icon {
    color: var(--ds-text-3);
  }
}

// Mobile
@media (max-width: 768px) {
  .transform-btn {
    min-height: var(--ds-row-height);
  }
}
</style>
