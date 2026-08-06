<template>
  <div class="panel-section">
    <h3>
      <i class="fas fa-crop"></i>
      {{ $t('transform.crop.title') }}
    </h3>

    <button class="transform-btn" :class="{ active: cropMode }" @click="$emit('toggle-crop')">
      <i :class="cropMode ? 'fas fa-check' : 'fas fa-crop'"></i>
      <span>{{ cropMode ? $t('transform.crop.confirm') : $t('transform.crop.button') }}</span>
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
          <span class="crop-size-value">{{ cropDimensions.width }} px</span>
        </div>
        <div class="crop-size-item">
          <span class="crop-size-key">{{ $t('transform.crop.height') }}</span>
          <span class="crop-size-value">{{ cropDimensions.height }} px</span>
        </div>
      </div>
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

defineEmits(['toggle-crop', 'undo-crop', 'set-aspect-ratio']);

// Nur anzeigen, wenn tatsächlich eine Auswahl aufgezogen wurde
const hasSelection = computed(
  () => props.cropDimensions.width > 0 && props.cropDimensions.height > 0
);

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
}

.crop-size-key {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-text-light, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.crop-size-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-primary, #014f99);
  font-variant-numeric: tabular-nums;
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

  .crop-size-value {
    color: var(--color-text);
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
