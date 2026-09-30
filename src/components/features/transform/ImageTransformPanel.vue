<template>
  <div class="panel-section">
    <div class="section-header">
      <h3>
        <i class="fas fa-magic"></i>
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
        <i class="fas fa-undo"></i>
        90°
      </button>
      <button
        class="quick-btn"
        :title="$t('transform.rotationTooltip.rotate180')"
        @click="$emit('rotate-180')"
      >
        <i class="fas fa-sync"></i>
        180°
      </button>
      <button
        class="quick-btn"
        :title="$t('transform.rotationTooltip.clockwise')"
        @click="$emit('rotate-90')"
      >
        <i class="fas fa-redo"></i>
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
        <i class="fas fa-arrows-alt-h"></i>
        {{ $t('transform.flip.horizontal') }}
      </button>
      <button
        class="quick-btn"
        :class="{ active: transforms.flipVertical }"
        :title="$t('transform.flip.verticalTooltip')"
        @click="$emit('flip-vertical')"
      >
        <i class="fas fa-arrows-alt-v"></i>
        {{ $t('transform.flip.vertical') }}
      </button>
    </div>

    <!-- Neigung/Skew -->
    <div class="control-group skew-section">
      <label>
        <span class="label-text">
          <i class="fas fa-italic"></i>
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
          <i class="fas fa-vector-square"></i>
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
          <i class="fas fa-undo"></i>
          {{ $t('transform.distort.resetShort') }}
        </button>
        <button
          type="button"
          class="distort-btn primary"
          :disabled="!hasDistortion || isApplyingDistort"
          :title="$t('transform.distort.applyHint')"
          @click="$emit('apply-distort')"
        >
          <i :class="isApplyingDistort ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
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
        <i class="fas fa-hand-paper"></i>
        {{ $t('transform.panHint', 'Leertaste + Ziehen oder Mausrad-Klick zum Verschieben') }}
      </p>
      <button v-if="hasPan" class="transform-btn pan-reset-btn" @click="$emit('reset-pan')">
        <i class="fas fa-compress-arrows-alt"></i>
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
          <i class="fas fa-clone"></i>
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
            <i class="fas fa-palette"></i>
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
  gap: 0.5rem;
  margin-bottom: 0.875rem;
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
  color: var(--color-text);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;

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
  }

  i {
    font-size: 1.1rem;
    opacity: 0.9;
  }
}

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
  color: var(--color-text-light);
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

.shadow-section {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
}

/* Titel links, Schalter rechts; stärker als das gemeinsame `.control-group label` */
.control-group .switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  margin-bottom: 0;
  cursor: pointer;
}

.shadow-controls-panel {
  background: rgba(1, 79, 153, 0.05);
  border: 1px solid rgba(1, 79, 153, 0.15);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.shadow-control-row {
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.skew-section {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
}

.distort-section {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
}

.distort-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.distort-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: var(--color-primary, #014f99);
  }

  &.primary {
    color: #ffffff;
    background: var(--color-primary, #014f99);
    border-color: var(--color-primary, #014f99);

    &:hover:not(:disabled) {
      background: #003971;
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.skew-control-row {
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

// Dark Mode
:root[data-theme='dark'] {
  .quick-btn {
    background: var(--color-card-bg, var(--color-bg));
    border-color: var(--color-border);
    color: var(--color-text);

    &:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-primary);
    }
  }

  .pan-info {
    background: rgba(74, 222, 128, 0.15);
    border-color: rgba(74, 222, 128, 0.3);
  }

  .pan-hint {
    color: var(--color-text-light);
  }

  .shadow-section {
    border-top-color: var(--color-border);
  }

  .shadow-controls-panel {
    background: rgba(1, 79, 153, 0.1);
    border-color: rgba(1, 79, 153, 0.25);
  }

  .skew-section,
  .distort-section {
    border-top-color: var(--color-border);
  }

  .distort-btn:not(.primary) {
    background: var(--color-card-bg, var(--color-bg));
    border-color: var(--color-border);
  }
}

// Mobile
@media (max-width: 768px) {
  .quick-btn {
    min-height: 44px;
    padding: 0.75rem 0.5rem;
  }
}
</style>
