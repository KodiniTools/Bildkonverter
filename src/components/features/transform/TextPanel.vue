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
      @undo="$emit('undo-text')"
      @redo="$emit('redo-text')"
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
        @input="$emit('update:text-content', $event.target.value)"
        @change="$emit('save-text-history')"
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
        @update:model-value="$emit('update:text-position-x', $event)"
        @commit="$emit('save-text-history')"
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
        @update:model-value="$emit('update:text-position-y', $event)"
        @commit="$emit('save-text-history')"
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
        @update:model-value="$emit('update:text-font-size', $event)"
        @commit="$emit('save-text-history')"
      />
    </div>

    <!-- Schriftart -->
    <div class="control-group">
      <label>
        <AppIcon name="font" :size="14" />
        {{ $t('textPanel.fontFamily', 'Schriftart') }}
      </label>
      <select
        :value="selectedText.fontFamily || 'Satoshi Regular'"
        class="font-select"
        @change="$emit('update:text-font-family', $event.target.value)"
      >
        <optgroup :label="$t('textPanel.customFonts', 'Benutzerdefinierte Schriften')">
          <option
            v-for="font in availableFonts"
            :key="font"
            :value="font"
            :style="{ fontFamily: font }"
          >
            {{ font }}
          </option>
        </optgroup>
        <optgroup :label="$t('textPanel.systemFonts', 'System-Schriften')">
          <option
            v-for="font in systemFonts"
            :key="font"
            :value="font"
            :style="{ fontFamily: font }"
          >
            {{ font }}
          </option>
        </optgroup>
      </select>
    </div>

    <!-- Textstil: Fett / Kursiv -->
    <div class="control-group">
      <label>
        <AppIcon name="bold" :size="14" />
        {{ $t('textPanel.style', 'Stil') }}
      </label>
      <div class="style-toggle-row">
        <button
          type="button"
          class="style-toggle"
          :class="{ active: isBoldActive }"
          :disabled="fontIsBold"
          :title="
            fontIsBold
              ? $t('textPanel.boldInherent', 'Schriftart ist bereits fett')
              : $t('textPanel.bold', 'Fett')
          "
          @click="toggleBold"
        >
          <AppIcon name="bold" />
          <span>{{ $t('textPanel.bold', 'Fett') }}</span>
        </button>
        <button
          type="button"
          class="style-toggle"
          :class="{ active: isItalicActive }"
          :disabled="fontIsItalic"
          :title="
            fontIsItalic
              ? $t('textPanel.italicInherent', 'Schriftart ist bereits kursiv')
              : $t('textPanel.italic', 'Kursiv')
          "
          @click="toggleItalic"
        >
          <AppIcon name="italic" />
          <span>{{ $t('textPanel.italic', 'Kursiv') }}</span>
        </button>
      </div>
    </div>

    <!-- Textfarbe -->
    <div class="control-group">
      <label>
        <AppIcon name="palette" :size="14" />
        {{ $t('textPanel.color', 'Farbe') }}
      </label>
      <div class="color-picker-row">
        <input
          type="color"
          :value="selectedText.color || '#000000'"
          class="color-input"
          :style="{ backgroundColor: selectedText.color || '#000000' }"
          @input="$emit('update:text-color', $event.target.value)"
          @change="$emit('save-text-history')"
        />
        <input
          type="text"
          :value="selectedText.color || '#000000'"
          class="color-text"
          maxlength="7"
          @input="$emit('update:text-color', $event.target.value)"
          @change="$emit('save-text-history')"
        />
      </div>
    </div>

    <!-- Text-Umrandung (Stroke) -->
    <div class="control-group">
      <SliderField
        :model-value="selectedText.strokeWidth || 0"
        :min="0"
        :max="50"
        unit="px"
        :default-value="0"
        :label="$t('textPanel.strokeWidth', 'Umrandung')"
        icon="fas fa-border-style"
        @update:model-value="$emit('update:text-stroke-width', $event)"
        @commit="$emit('save-text-history')"
      />
      <div v-if="(selectedText.strokeWidth || 0) > 0" class="color-picker-row mt-2">
        <input
          type="color"
          :value="selectedText.strokeColor || '#000000'"
          class="color-input"
          :style="{ backgroundColor: selectedText.strokeColor || '#000000' }"
          @input="$emit('update:text-stroke-color', $event.target.value)"
          @change="$emit('save-text-history')"
        />
        <input
          type="text"
          :value="selectedText.strokeColor || '#000000'"
          class="color-text"
          maxlength="7"
          @input="$emit('update:text-stroke-color', $event.target.value)"
          @change="$emit('save-text-history')"
        />
      </div>
    </div>

    <!-- Text-Schatten -->
    <div class="control-group">
      <SliderField
        :model-value="selectedText.shadowBlur || 0"
        :min="0"
        :max="20"
        unit="px"
        :default-value="0"
        :label="$t('textPanel.shadow', 'Schatten')"
        icon="fas fa-clone"
        @update:model-value="$emit('update:text-shadow-blur', $event)"
        @commit="$emit('save-text-history')"
      />
      <div v-if="(selectedText.shadowBlur || 0) > 0" class="shadow-controls">
        <div class="shadow-offset-row">
          <div class="mini-control">
            <label>X</label>
            <NumberSpinner
              :model-value="selectedText.shadowOffsetX ?? 2"
              :min="-50"
              :max="50"
              unit="px"
              @update:model-value="$emit('update:text-shadow-offset-x', $event)"
              @commit="$emit('save-text-history')"
            />
          </div>
          <div class="mini-control">
            <label>Y</label>
            <NumberSpinner
              :model-value="selectedText.shadowOffsetY ?? 2"
              :min="-50"
              :max="50"
              unit="px"
              @update:model-value="$emit('update:text-shadow-offset-y', $event)"
              @commit="$emit('save-text-history')"
            />
          </div>
        </div>
        <div class="color-picker-row mt-2">
          <input
            type="color"
            :value="selectedText.shadowColor || '#000000'"
            class="color-input"
            :style="{ backgroundColor: selectedText.shadowColor || '#000000' }"
            @input="$emit('update:text-shadow-color', $event.target.value)"
            @change="$emit('save-text-history')"
          />
          <input
            type="text"
            :value="selectedText.shadowColor || '#000000'"
            class="color-text"
            maxlength="7"
            @input="$emit('update:text-shadow-color', $event.target.value)"
            @change="$emit('save-text-history')"
          />
        </div>
      </div>
    </div>

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
        @update:model-value="$emit('update:text-rotation', $event)"
        @commit="$emit('save-text-history')"
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
        @update:model-value="$emit('update:text-skew-x', $event)"
        @commit="$emit('save-text-history')"
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
        @update:model-value="$emit('update:text-skew-y', $event)"
        @commit="$emit('save-text-history')"
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
        @update:model-value="$emit('update:text-opacity', $event)"
        @commit="$emit('save-text-history')"
      />
    </div>

    <!-- Text löschen -->
    <button class="transform-btn delete-btn" @click="$emit('delete-text')">
      <AppIcon name="trash" />
      <span>{{ $t('textPanel.delete', 'Text löschen') }}</span>
    </button>

    <!-- Auswahl aufheben -->
    <button class="transform-btn" @click="$emit('deselect-text')">
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

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';
import HistoryActions from '@/components/ui/HistoryActions.vue';
import NumberSpinner from '@/components/ui/NumberSpinner.vue';
import SliderField from '@/components/ui/SliderField.vue';
import { computed, ref, watch } from 'vue';
import { availableFonts } from '@/assets/fonts/fontList.js';
import { isFontBold, isFontItalic } from '@/utils/textRender';

const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];

const props = defineProps({
  selectedText: { type: Object, default: null },
  hasTexts: { type: Boolean, default: false },
  canUndoText: { type: Boolean, default: false },
  canRedoText: { type: Boolean, default: false },
  /** Canvas-Breite in px – Obergrenze des X-Reglers */
  canvasWidth: { type: Number, default: 0 },
  /** Canvas-Höhe in px – Obergrenze des Y-Reglers */
  canvasHeight: { type: Number, default: 0 },
});

const emit = defineEmits([
  'update:text-content',
  'update:text-font-size',
  'update:text-font-family',
  'update:text-color',
  'update:text-rotation',
  'update:text-opacity',
  'update:text-bold',
  'update:text-italic',
  'update:text-skew-x',
  'update:text-skew-y',
  'update:text-stroke-width',
  'update:text-stroke-color',
  'update:text-shadow-blur',
  'update:text-shadow-offset-x',
  'update:text-shadow-offset-y',
  'update:text-shadow-color',
  'update:text-position-x',
  'update:text-position-y',
  'save-text-history',
  'undo-text',
  'redo-text',
  'delete-text',
  'deselect-text',
]);

// Position: Werte aus dem Canvas-Drag können gebrochen sein → gerundet anzeigen
const posX = computed(() => Math.round(Number(props.selectedText?.x) || 0));
const posY = computed(() => Math.round(Number(props.selectedText?.y) || 0));

// Reglerbereich = Canvas; liegt der Text (per Drag) außerhalb, wird der
// Bereich erweitert, damit der aktuelle Wert nicht abgeschnitten wird.
const rangeX = computed(() => ({
  min: Math.min(0, posX.value),
  max: Math.max(1, props.canvasWidth, posX.value),
}));
const rangeY = computed(() => ({
  min: Math.min(0, posY.value),
  max: Math.max(1, props.canvasHeight, posY.value),
}));

// Position beim Auswählen des Textes merken – Ziel des Rückgängig-Buttons (↺)
const startPos = ref({ x: 0, y: 0 });
watch(
  () => props.selectedText?.id,
  () => {
    startPos.value = { x: posX.value, y: posY.value };
  },
  { immediate: true }
);

// Bringt die aktuelle Schriftart Fett/Kursiv bereits von Haus aus mit?
// Dann werden die entsprechenden Umschalter deaktiviert (Ausnahme laut Vorgabe).
const fontIsBold = computed(() => isFontBold(props.selectedText?.fontFamily || ''));
const fontIsItalic = computed(() => isFontItalic(props.selectedText?.fontFamily || ''));

// Aktiv-Zustand der Umschalter: durch die Schriftart bedingt ODER manuell gesetzt
const isBoldActive = computed(() => fontIsBold.value || !!props.selectedText?.bold);
const isItalicActive = computed(() => fontIsItalic.value || !!props.selectedText?.italic);

function toggleBold() {
  if (fontIsBold.value) return;
  emit('update:text-bold', !props.selectedText?.bold);
  emit('save-text-history');
}

function toggleItalic() {
  if (fontIsItalic.value) return;
  emit('update:text-italic', !props.selectedText?.italic);
  emit('save-text-history');
}
</script>

<style scoped lang="scss">
@import './shared';

// Eingaben nutzen die globalen Feldstile (UiTextField / UiSelect)
.text-input,
.font-select {
  width: 100%;
}

// Fett/Kursiv im UiSegmentedControl-Look
.style-toggle-row {
  display: flex;
  gap: 2px;
  padding: 2px;
  height: var(--ds-control-md);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-0);
}

.style-toggle {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-surface-1);
    border-color: var(--ds-border-strong);
    color: var(--ds-text);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.shadow-controls {
  margin-top: var(--ds-space-2);
}

.shadow-offset-row {
  display: flex;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-2);
}

.mini-control {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);

  label {
    margin-bottom: 0;
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text-2);
    min-width: 12px;
  }
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
