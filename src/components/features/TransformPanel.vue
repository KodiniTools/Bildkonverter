<template>
  <aside class="transform-panel">
    <!-- Text Sektion (nur wenn Text ausgewählt) -->
    <div v-if="selectedText" class="panel-section text-section">
      <h3>
        <i class="fas fa-font"></i>
        {{ $t('textPanel.title', 'Text bearbeiten') }}
      </h3>

      <!-- Text Inhalt -->
      <div class="control-group">
        <label>
          <i class="fas fa-i-cursor"></i>
          {{ $t('textPanel.content', 'Text') }}
        </label>
        <input
          type="text"
          :value="selectedText.content || selectedText.txt"
          @input="$emit('update:text-content', $event.target.value)"
          @change="$emit('save-text-history')"
          class="text-input"
          :placeholder="$t('textPanel.placeholder', 'Text eingeben...')"
        >
      </div>

      <!-- Schriftgröße -->
      <div class="control-group">
        <label>
          <i class="fas fa-text-height"></i>
          {{ $t('textPanel.fontSize', 'Schriftgröße') }}
          <span class="value">{{ selectedText.fontSize || selectedText.size || 32 }}px</span>
        </label>
        <input
          type="range"
          min="8"
          max="200"
          :value="selectedText.fontSize || selectedText.size || 32"
          @input="$emit('update:text-font-size', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
      </div>

      <!-- Schriftart -->
      <div class="control-group">
        <label>
          <i class="fas fa-font"></i>
          {{ $t('textPanel.fontFamily', 'Schriftart') }}
        </label>
        <select
          :value="selectedText.fontFamily || 'Satoshi Regular'"
          @change="$emit('update:text-font-family', $event.target.value)"
          class="font-select"
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
            @input="$emit('update:text-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-input"
            :style="{ backgroundColor: selectedText.color || '#000000' }"
          >
          <input
            type="text"
            :value="selectedText.color || '#000000'"
            @input="$emit('update:text-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-text"
            maxlength="7"
          >
          <div
            class="color-preview"
            :style="{ backgroundColor: selectedText.color || '#000000' }"
          ></div>
        </div>
      </div>

      <!-- Text-Umrandung (Stroke) -->
      <div class="control-group">
        <label>
          <i class="fas fa-border-style"></i>
          {{ $t('textPanel.strokeWidth', 'Umrandung') }}
          <span class="value">{{ selectedText.strokeWidth || 0 }}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="10"
          :value="selectedText.strokeWidth || 0"
          @input="$emit('update:text-stroke-width', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
        <div v-if="(selectedText.strokeWidth || 0) > 0" class="color-picker-row mt-2">
          <input
            type="color"
            :value="selectedText.strokeColor || '#000000'"
            @input="$emit('update:text-stroke-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-input"
          >
          <input
            type="text"
            :value="selectedText.strokeColor || '#000000'"
            @input="$emit('update:text-stroke-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-text"
            maxlength="7"
          >
          <div
            class="color-preview"
            :style="{ backgroundColor: selectedText.strokeColor || '#000000' }"
          ></div>
        </div>
      </div>

      <!-- Text-Schatten -->
      <div class="control-group">
        <label>
          <i class="fas fa-clone"></i>
          {{ $t('textPanel.shadow', 'Schatten') }}
          <span class="value">{{ selectedText.shadowBlur || 0 }}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
          :value="selectedText.shadowBlur || 0"
          @input="$emit('update:text-shadow-blur', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
        <div v-if="(selectedText.shadowBlur || 0) > 0" class="shadow-controls">
          <div class="shadow-offset-row">
            <div class="mini-control">
              <label>X</label>
              <input
                type="number"
                min="-50"
                max="50"
                :value="selectedText.shadowOffsetX ?? 2"
                @input="$emit('update:text-shadow-offset-x', Number($event.target.value))"
                @change="$emit('save-text-history')"
                class="mini-input"
              >
            </div>
            <div class="mini-control">
              <label>Y</label>
              <input
                type="number"
                min="-50"
                max="50"
                :value="selectedText.shadowOffsetY ?? 2"
                @input="$emit('update:text-shadow-offset-y', Number($event.target.value))"
                @change="$emit('save-text-history')"
                class="mini-input"
              >
            </div>
          </div>
          <div class="color-picker-row mt-2">
            <input
              type="color"
              :value="selectedText.shadowColor || '#000000'"
              @input="$emit('update:text-shadow-color', $event.target.value)"
              @change="$emit('save-text-history')"
              class="color-input"
            >
            <input
              type="text"
              :value="selectedText.shadowColor || '#000000'"
              @input="$emit('update:text-shadow-color', $event.target.value)"
              @change="$emit('save-text-history')"
              class="color-text"
              maxlength="7"
            >
            <div
              class="color-preview"
              :style="{ backgroundColor: selectedText.shadowColor || '#000000' }"
            ></div>
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
        <input
          type="range"
          min="-180"
          max="180"
          :value="selectedText.rotation || 0"
          @input="$emit('update:text-rotation', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
      </div>

      <!-- Text-Deckkraft -->
      <div class="control-group">
        <label>
          <i class="fas fa-adjust"></i>
          {{ $t('textPanel.opacity', 'Opacity') }}
          <span class="value">{{ selectedText.opacity !== undefined ? selectedText.opacity : 100 }}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          :value="selectedText.opacity !== undefined ? selectedText.opacity : 100"
          @input="$emit('update:text-opacity', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
      </div>

      <!-- Text löschen -->
      <button
        class="transform-btn delete-btn"
        @click="$emit('delete-text')"
      >
        <i class="fas fa-trash"></i>
        <span>{{ $t('textPanel.delete', 'Text löschen') }}</span>
      </button>

      <!-- Auswahl aufheben -->
      <button
        class="transform-btn"
        @click="$emit('deselect-text')"
      >
        <i class="fas fa-times"></i>
        <span>{{ $t('textPanel.deselect', 'Auswahl aufheben') }}</span>
      </button>
    </div>

    <!-- Info wenn kein Text ausgewählt -->
    <div v-else-if="hasTexts" class="panel-section text-hint">
      <p class="hint-text">
        <i class="fas fa-mouse-pointer"></i>
        {{ $t('textPanel.selectHint', 'Klicken Sie auf einen Text im Bild, um ihn zu bearbeiten') }}
      </p>
    </div>

    <!-- Crop Sektion -->
    <div class="panel-section">
      <h3>
        <i class="fas fa-crop"></i>
        {{ $t('transform.crop.title') }}
      </h3>
      
      <button 
        class="transform-btn"
        :class="{ 'active': cropMode }"
        @click="$emit('toggle-crop')"
      >
        <i :class="cropMode ? 'fas fa-check' : 'fas fa-crop'"></i>
        <span>{{ cropMode ? $t('transform.crop.confirm') : $t('transform.crop.button') }}</span>
      </button>
      
      <button 
        v-if="hasCropped"
        class="transform-btn undo-btn"
        @click="$emit('undo-crop')"
      >
        <i class="fas fa-undo"></i>
        <span>{{ $t('transform.crop.undo') }}</span>
      </button>
    </div>

    <!-- Transform Sektion -->
    <div class="panel-section">
      <h3>
        <i class="fas fa-magic"></i>
        {{ $t('transform.title') }}
      </h3>

      <!-- Deckkraft -->
      <div class="control-group">
        <label>
          <i class="fas fa-adjust"></i>
          {{ $t('transform.opacity') }}
          <span class="value">{{ transforms.opacity }}%</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          :value="transforms.opacity"
          @input="$emit('update:opacity', Number($event.target.value))"
          class="slider"
        >
      </div>

      <!-- Rotation -->
      <div class="control-group">
        <label>
          <i class="fas fa-redo"></i>
          {{ $t('transform.rotation') }}
          <span class="value">{{ transforms.rotation }}°</span>
        </label>
        <input 
          type="range" 
          min="-180" 
          max="180" 
          :value="transforms.rotation"
          @input="$emit('update:rotation', Number($event.target.value))"
          class="slider"
        >
      </div>

      <!-- Schnell-Rotation Buttons -->
      <div class="button-group">
        <button 
          class="quick-btn"
          @click="$emit('rotate-90-counter')"
          :title="$t('transform.rotationTooltip.counterClockwise')"
        >
          <i class="fas fa-undo"></i>
          90°
        </button>
        <button 
          class="quick-btn"
          @click="$emit('rotate-180')"
          :title="$t('transform.rotationTooltip.rotate180')"
        >
          <i class="fas fa-sync"></i>
          180°
        </button>
        <button 
          class="quick-btn"
          @click="$emit('rotate-90')"
          :title="$t('transform.rotationTooltip.clockwise')"
        >
          <i class="fas fa-redo"></i>
          90°
        </button>
      </div>

      <!-- Spiegeln -->
      <div class="button-group">
        <button 
          class="quick-btn"
          :class="{ 'active': transforms.flipHorizontal }"
          @click="$emit('flip-horizontal')"
          :title="$t('transform.flip.horizontalTooltip')"
        >
          <i class="fas fa-arrows-alt-h"></i>
          {{ $t('transform.flip.horizontal') }}
        </button>
        <button 
          class="quick-btn"
          :class="{ 'active': transforms.flipVertical }"
          @click="$emit('flip-vertical')"
          :title="$t('transform.flip.verticalTooltip')"
        >
          <i class="fas fa-arrows-alt-v"></i>
          {{ $t('transform.flip.vertical') }}
        </button>
      </div>

      <!-- Zoom/Skalierung -->
      <div class="control-group">
        <label>
          <i class="fas fa-search-plus"></i>
          {{ $t('transform.zoom') }}
          <span class="value">{{ transforms.scale }}%</span>
        </label>
        <input
          type="range"
          min="10"
          max="200"
          :value="transforms.scale"
          @input="$emit('update:scale', Number($event.target.value))"
          class="slider"
        >
      </div>

      <!-- Pan-Hinweis und Reset (nur bei Zoom > 100%) -->
      <div v-if="canPan" class="pan-info">
        <p class="pan-hint">
          <i class="fas fa-hand-paper"></i>
          {{ $t('transform.panHint', 'Leertaste + Ziehen oder Mausrad-Klick zum Verschieben') }}
        </p>
        <button
          v-if="hasPan"
          class="transform-btn pan-reset-btn"
          @click="$emit('reset-pan')"
        >
          <i class="fas fa-compress-arrows-alt"></i>
          <span>{{ $t('transform.resetPan', 'Ansicht zentrieren') }}</span>
        </button>
      </div>

      <!-- Ecken abrunden -->
      <div class="control-group">
        <label>
          <i class="fas fa-circle"></i>
          {{ $t('transform.borderRadius') }}
          <span class="value">{{ transforms.borderRadius }}px</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="50" 
          :value="transforms.borderRadius"
          @input="$emit('update:border-radius', Number($event.target.value))"
          class="slider"
        >
      </div>

      <!-- Rahmen -->
      <div class="control-group">
        <label>
          <i class="fas fa-border-style"></i>
          {{ $t('transform.border') }}
          <span class="value">{{ transforms.borderWidth }}px</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="20" 
          :value="transforms.borderWidth"
          @input="$emit('update:border-width', Number($event.target.value))"
          class="slider"
        >
        
        <div v-if="transforms.borderWidth > 0" class="color-picker-group">
          <input 
            type="color" 
            :value="transforms.borderColor"
            @input="$emit('update:border-color', $event.target.value)"
            class="color-input"
          >
          <span class="color-label">{{ $t('transform.borderColor') }}</span>
        </div>
      </div>

      <!-- Anwenden Button -->
      <button 
        v-if="hasTransforms"
        class="transform-btn apply-btn"
        @click="$emit('apply-transforms')"
        :title="$t('transform.applyTooltip')"
      >
        <i class="fas fa-check-circle"></i>
        <span>{{ $t('transform.apply') }}</span>
      </button>

      <!-- Reset Button -->
      <button 
        v-if="hasTransforms"
        class="transform-btn reset-btn"
        @click="$emit('reset-transforms')"
      >
        <i class="fas fa-undo-alt"></i>
        <span>{{ $t('transform.reset') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { availableFonts } from '@/assets/fonts/fontList.js'

// System-Schriftarten als Fallback
const systemFonts = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New'
]

// Alle Schriften kombinieren (benutzerdefiniert zuerst, dann System)
const allFonts = [...availableFonts, ...systemFonts]

defineProps({
  cropMode: {
    type: Boolean,
    required: true
  },
  hasCropped: {
    type: Boolean,
    required: true
  },
  transforms: {
    type: Object,
    required: true
  },
  hasTransforms: {
    type: Boolean,
    default: false
  },
  canPan: {
    type: Boolean,
    default: false
  },
  hasPan: {
    type: Boolean,
    default: false
  },
  selectedText: {
    type: Object,
    default: null
  },
  hasTexts: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'toggle-crop',
  'undo-crop',
  'update:opacity',
  'update:rotation',
  'update:scale',
  'update:border-radius',
  'update:border-width',
  'update:border-color',
  'rotate-90',
  'rotate-90-counter',
  'rotate-180',
  'flip-horizontal',
  'flip-vertical',
  'apply-transforms',
  'reset-transforms',
  'reset-pan',
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
  'delete-text',
  'deselect-text'
])
</script>

<style scoped>
.transform-panel {
  width: 280px;
  background: var(--color-bg-secondary, #f9fafb);
  border-left: 1px solid var(--color-border, #e5e7eb);
  overflow-y: auto;
  padding: 1rem;
  max-height: 100%;
}

.panel-section {
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.panel-section h3 {
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.8;
  
  i {
    color: var(--color-primary, #3b82f6);
    font-size: 0.75rem;
  }
}

/* Buttons */
.transform-btn {
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-primary, #111827);
  margin-bottom: 0.5rem;
  font-weight: 500;
  
  &:hover {
    border-color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
  }
  
  &.active {
    background: linear-gradient(135deg, #4ade80, #22c55e);
    color: white;
    border-color: #22c55e;
    box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #22c55e, #16a34a);
    }
  }
  
  &.undo-btn {
    border-color: #f59e0b;
    color: #f59e0b;
    
    &:hover {
      background: rgba(245, 158, 11, 0.1);
      border-color: #d97706;
      color: #d97706;
    }
  }
  
  &.apply-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-color: #2563eb;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }
  }
  
  &.reset-btn {
    border-color: #ef4444;
    color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #dc2626;
      color: #dc2626;
    }
  }
  
  i {
    font-size: 0.9rem;
  }
  
  span {
    flex: 1;
    text-align: left;
  }
}

/* Control Groups */
.control-group {
  margin-bottom: 1rem;
  
  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--color-text-primary, #111827);
    margin-bottom: 0.5rem;
    font-weight: 500;
    
    i {
      margin-right: 0.5rem;
      color: var(--color-primary, #3b82f6);
      font-size: 0.8rem;
    }
    
    .value {
      font-weight: 600;
      color: var(--color-text-secondary, #6b7280);
      font-size: 0.75rem;
      min-width: 45px;
      text-align: right;
    }
  }
}

/* Slider */
.slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border, #d1d5db);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary, #3b82f6);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    &:hover {
      background: var(--color-primary-dark, #2563eb);
      transform: scale(1.15);
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
    }
  }
  
  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary, #3b82f6);
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    &:hover {
      background: var(--color-primary-dark, #2563eb);
      transform: scale(1.15);
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
    }
  }
}

/* Button Groups */
.button-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.quick-btn {
  flex: 1;
  padding: 0.65rem 0.5rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  color: var(--color-text-primary, #111827);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  
  &:hover {
    border-color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
  }
  
  &.active {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }
  
  i {
    font-size: 1rem;
    opacity: 0.9;
  }
}

/* Color Picker */
.color-picker-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.color-input {
  width: 50px;
  height: 35px;
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  
  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
}

.color-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 500;
}

/* Dark Mode */
.dark-mode .transform-panel {
  background: #1f2937;
  border-left-color: #374151;
}

.dark-mode .panel-section h3 {
  color: #9ca3af;
}

.dark-mode .transform-btn {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark-mode .transform-btn:hover {
  background: #4b5563;
}

.dark-mode .quick-btn {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark-mode .quick-btn:hover {
  background: #4b5563;
}

.dark-mode .control-group label {
  color: #f9fafb;
}

.dark-mode .control-group label .value {
  color: #9ca3af;
}

.dark-mode .slider {
  background: #4b5563;
}

.dark-mode .color-input {
  border-color: #4b5563;
}

/* Text Section */
.text-section {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.text-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--color-bg, #ffffff);
  color: var(--color-text-primary, #111827);
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.font-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-bg, #ffffff);
  color: var(--color-text-primary, #111827);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
  }
}

.color-picker-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  &.mt-2 {
    margin-top: 0.5rem;
  }

  .color-text {
    flex: 1;
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    font-family: monospace;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 4px;
    background: var(--color-bg, #ffffff);
    color: var(--color-text-primary, #111827);
    text-transform: uppercase;

    &:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
    }
  }
}

/* Color Preview Tile */
.color-preview {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid var(--color-border, #d1d5db);
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Shadow Controls */
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
    color: var(--color-text-secondary, #6b7280);
    min-width: 14px;
  }

  .mini-input {
    flex: 1;
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 4px;
    background: var(--color-bg, #ffffff);
    color: var(--color-text-primary, #111827);
    width: 100%;
    max-width: 70px;

    &:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
    }

    /* Entferne Spinner-Arrows für bessere UX */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
  }
}

.dark-mode .mini-control .mini-input {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
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
  background: rgba(59, 130, 246, 0.05);
  border: 1px dashed rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 1rem;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0;
  line-height: 1.4;

  i {
    color: var(--color-primary, #3b82f6);
    font-size: 1rem;
  }
}

/* Dark Mode Text Section */
.dark-mode .text-section {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.dark-mode .text-input,
.dark-mode .font-select {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark-mode .color-picker-row .color-text {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark-mode .text-hint {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

/* Pan Info Styles */
.pan-info {
  background: rgba(74, 222, 128, 0.1);
  border: 1px dashed rgba(74, 222, 128, 0.4);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.pan-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;

  i {
    color: #22c55e;
    font-size: 0.9rem;
    margin-top: 0.1rem;
  }
}

.pan-reset-btn {
  border-color: #22c55e !important;
  color: #22c55e !important;

  &:hover {
    background: rgba(34, 197, 94, 0.1) !important;
    border-color: #16a34a !important;
    color: #16a34a !important;
  }
}

.dark-mode .pan-info {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
}

.dark-mode .pan-hint {
  color: #9ca3af;
}
</style>
