<template>
  <div class="panel-section">
    <h3>
      <AppIcon name="crop" />
      {{ $t('transform.crop.title') }}
    </h3>

    <!-- Im Crop-Modus: Bestätigen + Abbrechen nebeneinander -->
    <div v-if="cropMode" class="crop-actions">
      <button class="transform-btn active crop-confirm-btn" @click="$emit('toggle-crop')">
        <AppIcon name="check" />
        <span>{{ $t('transform.crop.confirm') }}</span>
      </button>
      <button class="transform-btn crop-cancel-btn" @click="$emit('cancel-crop')">
        <AppIcon name="times" />
        <span>{{ $t('transform.crop.cancel', 'Abbrechen') }}</span>
      </button>
    </div>
    <button v-else class="transform-btn" @click="$emit('toggle-crop')">
      <AppIcon name="crop" />
      <span>{{ $t('transform.crop.button') }}</span>
    </button>

    <!-- Live-Anzeige der Zuschnittabmessungen -->
    <div v-if="cropMode && hasSelection" class="crop-size-section">
      <label class="aspect-label">
        <AppIcon name="vector-square" :size="14" />
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
        <AppIcon name="crosshairs" />
        <span>{{ $t('transform.crop.center', 'Zentrieren') }}</span>
      </button>
    </div>

    <!-- Seitenverhältnis Presets -->
    <div v-if="cropMode" class="aspect-ratio-section">
      <label class="aspect-label">
        <AppIcon name="expand-arrows-alt" :size="14" />
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
          <AppIcon :name="preset.icon" />
          <span>{{ getPresetLabel(preset) }}</span>
        </button>
      </div>
    </div>

    <button
      v-if="hasCropped"
      type="button"
      class="btn-history btn-reset btn-history--full"
      @click="$emit('undo-crop')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7v6h6" />
        <path d="M3 13C5.33 7.5 10 4 16 4a9 9 0 0 1 0 18H8" />
      </svg>
      <span>{{ $t('transform.crop.undo') }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
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
  margin: var(--ds-space-3) 0;
  padding-top: var(--ds-space-3);
  border-top: var(--ds-border-width) solid var(--ds-border);
}

.crop-size-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ds-space-2);
}

// Zahlenfeld im UiTextField-Look: Kennung klein darüber, Wert + Einheit
.crop-size-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--ds-space-1) var(--ds-space-3);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);

  &:focus-within {
    border-color: var(--ds-accent);
    box-shadow: var(--ds-focus-ring);
  }
}

.crop-size-key {
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-regular);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
}

.crop-size-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}

.crop-size-input {
  width: 100%;
  min-width: 0;
  height: auto;
  border: none;
  background: transparent;
  padding: 0;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  font-variant-numeric: tabular-nums;

  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }

  // Native Stepper-Pfeile sichtbar lassen (pixelgenaues Anpassen)
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
    height: var(--ds-space-5);
  }
}

.crop-size-unit {
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
  flex-shrink: 0;
}

.crop-actions {
  display: flex;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-2);

  .transform-btn {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
  }
}

// Bestätigen ist die Primäraktion des Zuschnitt-Modus (Gold statt Grün)
.transform-btn.crop-confirm-btn {
  background: var(--ds-accent);
  border-color: var(--ds-accent);
  color: var(--ds-on-accent);
  font-weight: var(--ds-weight-semibold);

  &:hover:not(:disabled) {
    background: var(--ds-accent-hover);
    border-color: var(--ds-accent-hover);
  }
}

// Abbrechen: Sekundär-Button, destruktiver Hinweis nur über Textfarbe
.crop-cancel-btn {
  &:hover:not(:disabled) {
    color: var(--ds-danger);
  }
}

// Zentrieren = UiButton secondary
.crop-center-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  width: 100%;
  height: var(--ds-control-md);
  margin-top: var(--ds-space-2);
  padding: 0 var(--ds-space-4);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  color: var(--ds-text);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.aspect-label {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-regular);
  line-height: var(--ds-leading);
  color: var(--ds-text-2);
  margin-bottom: var(--ds-space-2);
}

// Seitenverhältnis-Chips im UiSegmentedControl-Look
.aspect-ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 2px;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-0);
}

.aspect-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-1);
  min-width: 0;
  padding: var(--ds-space-2) var(--ds-space-1);
  background: transparent;
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  color: var(--ds-text-2);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &:hover {
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
}

// Mobile
@media (max-width: 768px) {
  .aspect-btn {
    min-height: var(--ds-row-height);
  }

  .transform-btn {
    min-height: var(--ds-row-height);
  }
}
</style>
