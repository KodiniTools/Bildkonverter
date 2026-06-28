<template>
  <!-- Text-Bearbeitung (nur wenn Text ausgewählt) -->
  <div v-if="selectedText" class="panel-section text-section">
    <div class="section-header">
      <h3>
        <i class="fas fa-font"></i>
        {{ $t('textPanel.title', 'Text bearbeiten') }}
      </h3>
      <div class="text-history-controls">
        <button
          class="btn-icon-small"
          :disabled="!canUndoText"
          :title="$t('textPanel.undo', 'Rückgängig')"
          @click="$emit('undo-text')"
        >
          <i class="fas fa-undo"></i>
        </button>
        <button
          class="btn-icon-small"
          :disabled="!canRedoText"
          :title="$t('textPanel.redo', 'Wiederherstellen')"
          @click="$emit('redo-text')"
        >
          <i class="fas fa-redo"></i>
        </button>
      </div>
    </div>

    <!-- Text Inhalt -->
    <div class="control-group">
      <label>
        <i class="fas fa-i-cursor"></i>
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

    <!-- Schriftgröße -->
    <div class="control-group">
      <label>
        <i class="fas fa-text-height"></i>
        {{ $t('textPanel.fontSize', 'Schriftgröße') }}
        <span class="value">{{ selectedText.fontSize || selectedText.size || 32 }}px</span>
      </label>
      <div class="slider-row">
        <input
          type="range"
          min="8"
          max="200"
          :value="selectedText.fontSize || selectedText.size || 32"
          class="slider"
          @input="$emit('update:text-font-size', Number($event.target.value))"
          @change="$emit('save-text-history')"
        />
        <button
          v-if="(selectedText.fontSize || selectedText.size || 32) !== 32"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:text-font-size', 32); $emit('save-text-history')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
    </div>

    <!-- Schriftart -->
    <div class="control-group">
      <label>
        <i class="fas fa-font"></i>
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

    <!-- Textfarbe -->
    <div class="control-group">
      <label>
        <i class="fas fa-palette"></i>
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
      <label>
        <i class="fas fa-border-style"></i>
        {{ $t('textPanel.strokeWidth', 'Umrandung') }}
        <span class="value">{{ selectedText.strokeWidth || 0 }}px</span>
      </label>
      <div class="slider-row">
        <input
          type="range"
          min="0"
          max="50"
          :value="selectedText.strokeWidth || 0"
          class="slider"
          @input="$emit('update:text-stroke-width', Number($event.target.value))"
          @change="$emit('save-text-history')"
        />
        <button
          v-if="(selectedText.strokeWidth || 0) !== 0"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:text-stroke-width', 0); $emit('save-text-history')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
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
      <label>
        <i class="fas fa-clone"></i>
        {{ $t('textPanel.shadow', 'Schatten') }}
        <span class="value">{{ selectedText.shadowBlur || 0 }}px</span>
      </label>
      <div class="slider-row">
        <input
          type="range"
          min="0"
          max="20"
          :value="selectedText.shadowBlur || 0"
          class="slider"
          @input="$emit('update:text-shadow-blur', Number($event.target.value))"
          @change="$emit('save-text-history')"
        />
        <button
          v-if="(selectedText.shadowBlur || 0) !== 0"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:text-shadow-blur', 0); $emit('save-text-history')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
      <div v-if="(selectedText.shadowBlur || 0) > 0" class="shadow-controls">
        <div class="shadow-offset-row">
          <div class="mini-control">
            <label>X</label>
            <input
              type="number"
              min="-50"
              max="50"
              :value="selectedText.shadowOffsetX ?? 2"
              class="mini-input"
              @input="$emit('update:text-shadow-offset-x', Number($event.target.value))"
              @change="$emit('save-text-history')"
            />
          </div>
          <div class="mini-control">
            <label>Y</label>
            <input
              type="number"
              min="-50"
              max="50"
              :value="selectedText.shadowOffsetY ?? 2"
              class="mini-input"
              @input="$emit('update:text-shadow-offset-y', Number($event.target.value))"
              @change="$emit('save-text-history')"
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
      <label>
        <i class="fas fa-redo"></i>
        {{ $t('textPanel.rotation', 'Rotation') }}
        <span class="value">{{ selectedText.rotation || 0 }}°</span>
      </label>
      <div class="slider-row">
        <input
          type="range"
          min="-180"
          max="180"
          :value="selectedText.rotation || 0"
          class="slider"
          @input="$emit('update:text-rotation', Number($event.target.value))"
          @change="$emit('save-text-history')"
        />
        <button
          v-if="(selectedText.rotation || 0) !== 0"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:text-rotation', 0); $emit('save-text-history')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
    </div>

    <!-- Text-Deckkraft -->
    <div class="control-group">
      <label>
        <i class="fas fa-adjust"></i>
        {{ $t('textPanel.opacity', 'Opacity') }}
        <span class="value"
          >{{ selectedText.opacity !== undefined ? selectedText.opacity : 100 }}%</span
        >
      </label>
      <div class="slider-row">
        <input
          type="range"
          min="0"
          max="100"
          :value="selectedText.opacity !== undefined ? selectedText.opacity : 100"
          class="slider"
          @input="$emit('update:text-opacity', Number($event.target.value))"
          @change="$emit('save-text-history')"
        />
        <button
          v-if="(selectedText.opacity !== undefined ? selectedText.opacity : 100) !== 100"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:text-opacity', 100); $emit('save-text-history')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
    </div>

    <!-- Text löschen -->
    <button class="transform-btn delete-btn" @click="$emit('delete-text')">
      <i class="fas fa-trash"></i>
      <span>{{ $t('textPanel.delete', 'Text löschen') }}</span>
    </button>

    <!-- Auswahl aufheben -->
    <button class="transform-btn" @click="$emit('deselect-text')">
      <i class="fas fa-times"></i>
      <span>{{ $t('textPanel.deselect', 'Auswahl aufheben') }}</span>
    </button>
  </div>

  <!-- Hinweis wenn Texte vorhanden aber keiner ausgewählt -->
  <div v-else-if="hasTexts" class="panel-section text-hint">
    <p class="hint-text">
      <i class="fas fa-mouse-pointer"></i>
      {{ $t('textPanel.selectHint', 'Klicken Sie auf einen Text im Bild, um ihn zu bearbeiten') }}
    </p>
  </div>
</template>

<script setup>
import { availableFonts } from '@/assets/fonts/fontList.js';

const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];

defineProps({
  selectedText: { type: Object, default: null },
  hasTexts: { type: Boolean, default: false },
  canUndoText: { type: Boolean, default: false },
  canRedoText: { type: Boolean, default: false },
});

defineEmits([
  'update:text-content',
  'update:text-font-size',
  'update:text-font-family',
  'update:text-color',
  'update:text-rotation',
  'update:text-opacity',
  'update:text-stroke-width',
  'update:text-stroke-color',
  'update:text-shadow-blur',
  'update:text-shadow-offset-x',
  'update:text-shadow-offset-y',
  'update:text-shadow-color',
  'save-text-history',
  'undo-text',
  'redo-text',
  'delete-text',
  'deselect-text',
]);
</script>

<style scoped lang="scss">
@import './shared';

.text-section {
  background: rgba(1, 79, 153, 0.03);
  border: 1px solid rgba(1, 79, 153, 0.25);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;

  &:hover {
    border-color: rgba(1, 79, 153, 0.4);
    box-shadow: 0 2px 12px rgba(1, 79, 153, 0.08);
  }
}

.text-history-controls {
  display: flex;
  gap: 4px;
}

.text-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-bg, #ffffff);
  color: var(--color-text);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #014f99);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary, #014f99);
    box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.1);
  }
}

.font-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-bg, #ffffff);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #014f99);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary, #014f99);
    box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.1);
  }
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .slider {
    flex: 1;
  }

  .reset-btn {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--color-text-light, #9ca3af);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    border-radius: 50%;
    transition: all 0.2s ease;
    opacity: 0.6;

    &:hover {
      color: var(--color-primary, #014f99);
      background: rgba(1, 79, 153, 0.1);
      opacity: 1;
      transform: rotate(-45deg);
    }
  }
}

.shadow-controls {
  margin-top: 0.5rem;
}

.shadow-offset-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.mini-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-light);
    min-width: 14px;
  }

  .mini-input {
    flex: 1;
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 4px;
    background: var(--color-bg, #ffffff);
    color: var(--color-text);
    width: 100%;
    max-width: 70px;

    &:focus {
      outline: none;
      border-color: var(--color-primary, #014f99);
    }
  }
}

.delete-btn {
  border-color: #ef4444 !important;
  color: #ef4444 !important;

  &:hover {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: #dc2626 !important;
    color: #dc2626 !important;
  }
}

.text-hint {
  background: rgba(1, 79, 153, 0.05);
  border: 1px dashed rgba(1, 79, 153, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin: 0;
  line-height: 1.4;

  i {
    color: var(--color-primary, #014f99);
    font-size: 0.9rem;
  }
}

// Dark Mode
:root[data-theme='dark'] {
  .text-section {
    background: rgba(1, 79, 153, 0.1);
    border-color: rgba(1, 79, 153, 0.3);
  }

  .text-input,
  .font-select {
    background: var(--color-card-bg, var(--color-bg));
    border-color: var(--color-border);
    color: var(--color-text);
  }

  .mini-control .mini-input {
    background: var(--color-card-bg, var(--color-bg));
    border-color: var(--color-border);
    color: var(--color-text);
  }

  .text-hint {
    background: rgba(1, 79, 153, 0.1);
    border-color: rgba(1, 79, 153, 0.3);
  }
}

// Mobile
@media (max-width: 768px) {
  .btn-icon-small {
    width: 44px;
    height: 44px;
  }

  .transform-btn {
    min-height: 44px;
    padding: 0.75rem;
  }
}
</style>
