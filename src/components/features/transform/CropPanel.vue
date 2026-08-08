<template>
  <div class="panel-section">
    <h3>
      <i class="fas fa-crop"></i>
      {{ $t('transform.crop.title') }}
    </h3>

    <!-- Im Crop-Modus: Bestätigen + Abbrechen nebeneinander -->
    <div v-if="cropMode" class="crop-actions">
      <button class="transform-btn active crop-confirm-btn" @click="$emit('toggle-crop')">
        <i class="fas fa-check"></i>
        <span>{{ $t('transform.crop.confirm') }}</span>
      </button>
      <button class="transform-btn crop-cancel-btn" @click="$emit('cancel-crop')">
        <i class="fas fa-times"></i>
        <span>{{ $t('transform.crop.cancel', 'Abbrechen') }}</span>
      </button>
    </div>
    <button v-else class="transform-btn" @click="$emit('toggle-crop')">
      <i class="fas fa-crop"></i>
      <span>{{ $t('transform.crop.button') }}</span>
    </button>

    <!-- Live-Anzeige der Zuschnittabmessungen -->
    <div v-if="cropMode && hasSelection" class="crop-size-section">
      <label class="aspect-label">
        <i class="fas fa-vector-square"></i>
        {{ $t('transform.crop.dimensions') }}
      </label>
      <div class="crop-size-grid">
        <div class="crop-size-item">
          <span class="crop-size-key">{{ $t('transform.crop.width') }}</span>
          <div class="crop-size-input-wrap">
            <input
              class="crop-size-input"
              type="number"
              min="1"
              step="1"
              :value="cropDimensions.width"
              :aria-label="$t('transform.crop.width')"
              @change="onWidthChange"
              @keyup.enter="onWidthChange"
            />
            <span class="crop-size-unit">px</span>
          </div>
        </div>
        <div class="crop-size-item">
          <span class="crop-size-key">{{ $t('transform.crop.height') }}</span>
          <div class="crop-size-input-wrap">
            <input
              class="crop-size-input"
              type="number"
              min="1"
              step="1"
              :value="cropDimensions.height"
              :aria-label="$t('transform.crop.height')"
              @change="onHeightChange"
              @keyup.enter="onHeightChange"
            />
            <span class="crop-size-unit">px</span>
          </div>
        </div>
      </div>

      <!-- Auswahl mit einem Klick mittig im Canvas positionieren -->
      <button class="crop-center-btn" @click="$emit('center-crop')">
        <i class="fas fa-crosshairs"></i>
        <span>{{ $t('transform.crop.center', 'Zentrieren') }}</span>
      </button>
    </div>

    <!-- Seitenverhältnis Presets -->
    <div v-if="cropMode" class="aspect-ratio-section">
      <label class="aspect-label">
        <i class="fas fa-expand-arrows-alt"></i>
        {{ $t('transform.crop.aspectRatio') }}
      </label>
      <div class="aspect-ratio-grid">
        <button
          v-for="preset in aspectRatioPresets"
          :key="preset.id"
          class="aspect-btn"
          :class="{ active: selectedAspectRatio === preset.id }"
          :title="getPresetLabel(preset)"
          @click="$emit('set-aspect-ratio', preset.id)"
        >
          <i :class="'fas ' + preset.icon"></i>
          <span>{{ getPresetLabel(preset) }}</span>
        </button>
      </div>
    </div>

    <button v-if="hasCropped" class="transform-btn undo-btn" @click="$emit('undo-crop')">
      <i class="fas fa-undo"></i>
      <span>{{ $t('transform.crop.undo') }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

const props = defineProps({
  cropMode: { type: Boolean, required: true },
  hasCropped: { type: Boolean, required: true },
  selectedAspectRatio: { type: String, default: 'free' },
  aspectRatioPresets: { type: Array, default: () => [] },
  cropDimensions: { type: Object, default: () => ({ width: 0, height: 0 }) },
});

const emit = defineEmits([
  'toggle-crop',
  'cancel-crop',
  'undo-crop',
  'set-aspect-ratio',
  'set-crop-width',
  'set-crop-height',
  'center-crop',
]);

// Nur anzeigen, wenn tatsächlich eine Auswahl aufgezogen wurde
const hasSelection = computed(
  () => props.cropDimensions.width > 0 && props.cropDimensions.height > 0
);

// Pixelgenaue Eingabe der Zuschnittgröße über die Zahlenfelder
function onWidthChange(event) {
  const value = Math.round(Number(event.target.value));
  if (Number.isFinite(value) && value > 0) {
    emit('set-crop-width', value);
  }
}

function onHeightChange(event) {
  const value = Math.round(Number(event.target.value));
  if (Number.isFinite(value) && value > 0) {
    emit('set-crop-height', value);
  }
}

function getPresetLabel(preset) {
  if (preset.id === 'free' || preset.id === 'circle') {
    return t(`transform.crop.presets.${preset.id}`);
  }
  return preset.label;
}
</script>

<style scoped lang="scss">
@import './shared';

.aspect-ratio-section,
.crop-size-section {
  margin: 0.75rem 0;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
}

.crop-size-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.35rem;
}

.crop-size-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.4rem 0.5rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: var(--color-primary, #014f99);
  }

  &:focus-within {
    border-color: var(--color-primary, #014f99);
    box-shadow: 0 0 0 2px rgba(1, 79, 153, 0.15);
  }
}

.crop-size-key {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-text-light, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.crop-size-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.crop-size-input {
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-primary, #014f99);
  font-variant-numeric: tabular-nums;

  &:focus {
    outline: none;
  }

  // Native Stepper-Pfeile sichtbar lassen (pixelgenaues Anpassen)
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
    height: 1.1rem;
  }
}

.crop-size-unit {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-light, #6b7280);
  flex-shrink: 0;
}

.crop-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  .transform-btn {
    flex: 1;
    margin-bottom: 0;
    justify-content: center;

    span {
      flex: 0 0 auto;
      text-align: center;
    }
  }
}

.crop-cancel-btn {
  &:hover {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
    transform: translateY(-1px);
  }
}

.crop-center-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.45rem 0.5rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text);
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;

  i {
    font-size: 0.8rem;
    color: var(--color-primary, #014f99);
  }

  &:hover {
    border-color: var(--color-primary, #014f99);
    background: rgba(1, 79, 153, 0.05);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.aspect-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-light, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;

  i {
    color: var(--color-primary, #014f99);
    font-size: 0.75rem;
  }
}

.aspect-ratio-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.35rem;
}

.aspect-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.5rem 0.25rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.65rem;
  color: var(--color-text);
  font-weight: 500;

  i {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &:hover {
    border-color: var(--color-primary, #014f99);
    background: rgba(1, 79, 153, 0.05);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--color-primary, #014f99);
    color: white;
    border-color: var(--color-primary, #014f99);
    box-shadow: 0 2px 8px rgba(1, 79, 153, 0.3);

    i {
      opacity: 1;
    }
  }
}

// Dark Mode
:root[data-theme='dark'] {
  .aspect-ratio-section,
  .crop-size-section {
    border-top-color: var(--color-border);
  }

  .crop-size-item {
    background: var(--color-card-bg, var(--color-bg));
    border-color: var(--color-border);
  }

  .crop-size-key {
    color: var(--color-text-light);
  }

  .crop-size-input {
    color: var(--color-text);
  }

  .crop-center-btn {
    background: var(--color-card-bg, var(--color-bg));
    border-color: var(--color-border);
    color: var(--color-text);

    &:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary);
    }
  }

  .aspect-label {
    color: var(--color-text-light);
  }

  .aspect-btn {
    background: var(--color-card-bg, var(--color-bg));
    border-color: var(--color-border);
    color: var(--color-text);

    &:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary);
    }

    &.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }
  }
}

// Mobile
@media (max-width: 768px) {
  .aspect-ratio-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .aspect-btn {
    padding: 0.6rem 0.35rem;
    font-size: 0.7rem;
  }

  .transform-btn {
    min-height: 44px;
    padding: 0.75rem;
  }
}
</style>
