<template>
  <div class="panel-section">
    <div class="section-header">
      <h3>
        <AppIcon name="magic" />
        {{ $t('transform.title') }}
      </h3>
    </div>

    <HistoryActions
      :can-undo="canUndoTransform"
      :can-redo="canRedoTransform"
      :undo-title="$t('transform.undo', 'Rückgängig')"
      :redo-title="$t('transform.redo', 'Wiederherstellen')"
      @undo="$emit('undo-transform')"
      @redo="$emit('redo-transform')"
    />

    <!-- Deckkraft -->
    <div class="control-group">
      <SliderField
        :model-value="transforms.opacity"
        :min="0"
        :max="100"
        unit="%"
        :default-value="100"
        :label="$t('transform.opacity')"
        icon="fas fa-adjust"
        @update:model-value="$emit('update:opacity', $event)"
        @commit="$emit('commit-transform')"
      />
    </div>

    <!-- Rotation -->
    <div class="control-group">
      <SliderField
        :model-value="transforms.rotation"
        :min="-180"
        :max="180"
        unit="°"
        :default-value="0"
        :label="$t('transform.rotation')"
        icon="fas fa-redo"
        @update:model-value="$emit('update:rotation', $event)"
        @commit="$emit('commit-transform')"
      />
    </div>

    <!-- Schnell-Rotation Buttons -->
    <div class="button-group">
      <button
        class="quick-btn"
        :title="$t('transform.rotationTooltip.counterClockwise')"
        @click="$emit('rotate-90-counter')"
      >
        <AppIcon name="undo" />
        90°
      </button>
      <button
        class="quick-btn"
        :title="$t('transform.rotationTooltip.rotate180')"
        @click="$emit('rotate-180')"
      >
        <AppIcon name="sync" />
        180°
      </button>
      <button
        class="quick-btn"
        :title="$t('transform.rotationTooltip.clockwise')"
        @click="$emit('rotate-90')"
      >
        <AppIcon name="redo" />
        90°
      </button>
    </div>

    <!-- Spiegeln -->
    <div class="button-group">
      <button
        class="quick-btn"
        :class="{ active: transforms.flipHorizontal }"
        :title="$t('transform.flip.horizontalTooltip')"
        @click="$emit('flip-horizontal')"
      >
        <AppIcon name="arrows-alt-h" />
        {{ $t('transform.flip.horizontal') }}
      </button>
      <button
        class="quick-btn"
        :class="{ active: transforms.flipVertical }"
        :title="$t('transform.flip.verticalTooltip')"
        @click="$emit('flip-vertical')"
      >
        <AppIcon name="arrows-alt-v" />
        {{ $t('transform.flip.vertical') }}
      </button>
    </div>

    <!-- Neigung/Skew -->
    <div class="control-group skew-section">
      <label>
        <span class="label-text">
          <AppIcon name="italic" :size="14" />
          {{ $t('transform.skew.title', 'Neigung') }}
        </span>
      </label>

      <!-- Skew X (Horizontal) -->
      <div class="skew-control-row">
        <SliderField
          :model-value="transforms.skewX"
          :min="-45"
          :max="45"
          unit="°"
          :default-value="0"
          :label="$t('transform.skew.horizontal', 'Horizontal')"
          icon="fas fa-arrows-alt-h"
          @update:model-value="$emit('update:skew-x', $event)"
          @commit="$emit('commit-transform')"
        />
      </div>

      <!-- Skew Y (Vertikal) -->
      <div class="skew-control-row">
        <SliderField
          :model-value="transforms.skewY"
          :min="-45"
          :max="45"
          unit="°"
          :default-value="0"
          :label="$t('transform.skew.vertical', 'Vertikal')"
          icon="fas fa-arrows-alt-v"
          @update:model-value="$emit('update:skew-y', $event)"
          @commit="$emit('commit-transform')"
        />
      </div>
    </div>

    <!-- Freies Verzerren (Distort): Eckpunkte ziehen, dann übernehmen -->
    <div class="control-group distort-section">
      <label class="switch-row">
        <span class="label-text">
          <AppIcon name="vector-square" />
          {{ $t('transform.distort.title') }}
        </span>
        <ToggleSwitch
          :model-value="!!transforms.distortEnabled"
          :title="$t('transform.distort.hint')"
          @update:model-value="$emit('toggle-distort')"
        />
      </label>

      <div v-if="transforms.distortEnabled" class="distort-actions">
        <button
          type="button"
          class="distort-btn"
          :disabled="!hasDistortion || isApplyingDistort"
          :title="$t('transform.distort.reset')"
          @click="$emit('reset-distort')"
        >
          <AppIcon name="undo" />
          {{ $t('transform.distort.resetShort') }}
        </button>
        <button
          type="button"
          class="distort-btn primary"
          :disabled="!hasDistortion || isApplyingDistort"
          :title="$t('transform.distort.applyHint')"
          @click="$emit('apply-distort')"
        >
          <AppIcon :name="isApplyingDistort ? 'fas fa-spinner fa-spin' : 'fas fa-check'" />
          {{ $t('transform.distort.apply') }}
        </button>
      </div>
    </div>

    <!-- Zoom/Skalierung -->
    <div class="control-group">
      <SliderField
        :model-value="transforms.scale"
        :min="10"
        :max="200"
        unit="%"
        :default-value="100"
        :label="$t('transform.zoom')"
        icon="fas fa-search-plus"
        @update:model-value="$emit('update:scale', $event)"
        @commit="$emit('commit-transform')"
      />
    </div>

    <!-- Pan-Hinweis und Reset (nur bei Zoom > 100%) -->
    <div v-if="canPan" class="pan-info">
      <p class="pan-hint">
        <AppIcon name="hand-paper" />
        {{ $t('transform.panHint', 'Leertaste + Ziehen oder Mausrad-Klick zum Verschieben') }}
      </p>
      <button v-if="hasPan" class="transform-btn pan-reset-btn" @click="$emit('reset-pan')">
        <AppIcon name="compress-arrows-alt" />
        <span>{{ $t('transform.resetPan', 'Ansicht zentrieren') }}</span>
      </button>
    </div>

    <!-- Ecken abrunden -->
    <div class="control-group">
      <SliderField
        :model-value="transforms.borderRadius"
        :min="0"
        :max="50"
        unit="%"
        :default-value="0"
        :label="$t('transform.borderRadius')"
        icon="fas fa-circle"
        @update:model-value="$emit('update:border-radius', $event)"
        @commit="$emit('commit-transform')"
      />
      <p class="control-hint">
        {{ $t('transform.borderRadiusHint', '50% = vollständiger Kreis') }}
      </p>
    </div>

    <!-- Rahmen -->
    <div class="control-group">
      <SliderField
        :model-value="transforms.borderWidth"
        :min="0"
        :max="20"
        unit="px"
        :default-value="0"
        :label="$t('transform.border')"
        icon="fas fa-border-style"
        @update:model-value="$emit('update:border-width', $event)"
        @commit="$emit('commit-transform')"
      />

      <div v-if="transforms.borderWidth > 0" class="color-picker-group">
        <input
          type="color"
          :value="transforms.borderColor"
          class="color-input"
          @input="$emit('update:border-color', $event.target.value)"
          @change="$emit('commit-transform')"
        />
        <span class="color-label">{{ $t('transform.borderColor') }}</span>
      </div>
    </div>

    <!-- Schlagschatten -->
    <div class="control-group shadow-section">
      <label class="switch-row">
        <span class="label-text">
          <AppIcon name="clone" />
          {{ $t('transform.shadow.title', 'Schlagschatten') }}
        </span>
        <ToggleSwitch
          :model-value="!!transforms.shadowEnabled"
          @update:model-value="$emit('update:shadow-enabled', $event)"
        />
      </label>

      <div v-if="transforms.shadowEnabled" class="shadow-controls-panel">
        <!-- Offset X -->
        <div class="shadow-control-row">
          <SliderField
            :model-value="transforms.shadowOffsetX"
            :min="-50"
            :max="50"
            unit="px"
            :default-value="10"
            :label="$t('transform.shadow.offsetX', 'X-Versatz')"
            icon="fas fa-arrows-alt-h"
            @update:model-value="$emit('update:shadow-offset-x', $event)"
            @commit="$emit('commit-transform')"
          />
        </div>

        <!-- Offset Y -->
        <div class="shadow-control-row">
          <SliderField
            :model-value="transforms.shadowOffsetY"
            :min="-50"
            :max="50"
            unit="px"
            :default-value="10"
            :label="$t('transform.shadow.offsetY', 'Y-Versatz')"
            icon="fas fa-arrows-alt-v"
            @update:model-value="$emit('update:shadow-offset-y', $event)"
            @commit="$emit('commit-transform')"
          />
        </div>

        <!-- Blur -->
        <div class="shadow-control-row">
          <SliderField
            :model-value="transforms.shadowBlur"
            :min="0"
            :max="100"
            unit="px"
            :default-value="20"
            :label="$t('transform.shadow.blur', 'Weichzeichner')"
            icon="fas fa-adjust"
            @update:model-value="$emit('update:shadow-blur', $event)"
            @commit="$emit('commit-transform')"
          />
        </div>

        <!-- Opacity -->
        <div class="shadow-control-row">
          <SliderField
            :model-value="transforms.shadowOpacity"
            :min="0"
            :max="100"
            unit="%"
            :default-value="50"
            :label="$t('transform.shadow.opacity', 'Deckkraft')"
            icon="fas fa-eye"
            @update:model-value="$emit('update:shadow-opacity', $event)"
            @commit="$emit('commit-transform')"
          />
        </div>

        <!-- Farbe -->
        <div class="shadow-control-row">
          <label class="mini-label">
            <AppIcon name="palette" :size="14" />
            {{ $t('transform.shadow.color', 'Farbe') }}
          </label>
          <div class="color-picker-row">
            <input
              type="color"
              :value="transforms.shadowColor"
              class="color-input"
              :style="{ backgroundColor: transforms.shadowColor }"
              @input="$emit('update:shadow-color', $event.target.value)"
              @change="$emit('commit-transform')"
            />
            <input
              type="text"
              :value="transforms.shadowColor"
              class="color-text"
              maxlength="7"
              @input="$emit('update:shadow-color', $event.target.value)"
              @change="$emit('commit-transform')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';
import HistoryActions from '@/components/ui/HistoryActions.vue';
import SliderField from '@/components/ui/SliderField.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';

defineProps({
  transforms: { type: Object, required: true },
  canPan: { type: Boolean, default: false },
  hasPan: { type: Boolean, default: false },
  canUndoTransform: { type: Boolean, default: false },
  canRedoTransform: { type: Boolean, default: false },
  // Verzerrung sichtbar aktiv (Modus an UND Ecken versetzt)
  hasDistortion: { type: Boolean, default: false },
  isApplyingDistort: { type: Boolean, default: false },
});

defineEmits([
  'update:opacity',
  'update:rotation',
  'update:scale',
  'update:border-radius',
  'update:border-width',
  'update:border-color',
  'update:shadow-enabled',
  'update:shadow-offset-x',
  'update:shadow-offset-y',
  'update:shadow-blur',
  'update:shadow-color',
  'update:shadow-opacity',
  'update:skew-x',
  'update:skew-y',
  'toggle-distort',
  'reset-distort',
  'apply-distort',
  'rotate-90',
  'rotate-90-counter',
  'rotate-180',
  'flip-horizontal',
  'flip-vertical',
  'reset-pan',
  'undo-transform',
  'redo-transform',
  'commit-transform',
]);
</script>

<style scoped lang="scss">
@import './shared';

.button-group {
  display: flex;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-4);
}

// Schnellaktionen = UiButton secondary; Spiegeln aktiv = SelectionTile
.quick-btn {
  flex: 1;
  min-width: 0;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-2);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  font: inherit;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  color: var(--ds-text);
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-1);
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

  &.active {
    background: var(--ds-accent-soft);
    border-color: var(--ds-accent);
    color: var(--ds-text);
  }
}

// Hinweis = UiCallout (surface-2, 1-px-Rahmen, radius-md)
.pan-info {
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-3);
  margin-bottom: var(--ds-space-4);
}

.pan-hint {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-2);
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin: 0 0 var(--ds-space-2) 0;
  line-height: var(--ds-leading);

  .app-icon {
    color: var(--ds-text-2);
    margin-top: 2px;
  }
}

.pan-reset-btn {
  margin-bottom: 0;
}

.shadow-section,
.skew-section,
.distort-section {
  margin-top: var(--ds-space-2);
  padding-top: var(--ds-space-3);
  border-top: var(--ds-border-width) solid var(--ds-border);
}

/* Titel links, Schalter rechts; stärker als das gemeinsame `.control-group label` */
.control-group .switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  width: 100%;
  margin-bottom: 0;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text);
  cursor: pointer;

  .app-icon {
    color: var(--ds-text-2);
  }
}

.shadow-controls-panel {
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  padding: var(--ds-space-3);
  margin-top: var(--ds-space-2);
}

.shadow-control-row {
  margin-bottom: var(--ds-space-3);

  &:last-child {
    margin-bottom: 0;
  }
}

.distort-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-2);
}

// UiButton secondary bzw. primary (Übernehmen ist die Primäraktion des Modus)
.distort-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  min-width: 0;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-3);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  color: var(--ds-text);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    background: var(--ds-surface-3);
  }

  &.primary {
    color: var(--ds-on-accent);
    background: var(--ds-accent);
    border-color: var(--ds-accent);
    font-weight: var(--ds-weight-semibold);

    &:hover:not(:disabled) {
      background: var(--ds-accent-hover);
      border-color: var(--ds-accent-hover);
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.skew-control-row {
  margin-bottom: var(--ds-space-2);

  &:last-child {
    margin-bottom: 0;
  }
}

// Mobile
@media (max-width: 768px) {
  .quick-btn {
    min-height: var(--ds-row-height);
  }
}
</style>
