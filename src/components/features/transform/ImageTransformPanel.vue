<template>
  <div class="panel-section">
    <div class="section-header">
      <h3>
        <i class="fas fa-magic"></i>
        {{ $t('transform.title') }}
      </h3>
      <div class="transform-history-controls">
        <button
          class="btn-icon-small"
          :disabled="!canUndoTransform"
          :title="$t('transform.undo', 'Rückgängig')"
          @click="$emit('undo-transform')"
        >
          <i class="fas fa-undo"></i>
        </button>
        <button
          class="btn-icon-small"
          :disabled="!canRedoTransform"
          :title="$t('transform.redo', 'Wiederherstellen')"
          @click="$emit('redo-transform')"
        >
          <i class="fas fa-redo"></i>
        </button>
      </div>
    </div>

    <!-- Deckkraft -->
    <div class="control-group">
      <label>
        <span class="label-text">
          <i class="fas fa-adjust"></i>
          {{ $t('transform.opacity') }}
        </span>
      </label>
      <div class="slider-with-input">
        <input
          type="range"
          min="0"
          max="100"
          :value="transforms.opacity"
          class="slider"
          @input="$emit('update:opacity', Number($event.target.value))"
          @change="$emit('commit-transform')"
        />
        <div class="number-input-wrapper">
          <input
            type="number"
            min="0"
            max="100"
            :value="transforms.opacity"
            class="number-input"
            @input="$emit('update:opacity', Math.min(100, Math.max(0, Number($event.target.value))))"
            @change="$emit('commit-transform')"
          />
          <span class="unit">%</span>
        </div>
        <button
          v-if="transforms.opacity !== 100"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:opacity', 100); $emit('commit-transform')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
    </div>

    <!-- Rotation -->
    <div class="control-group">
      <label>
        <span class="label-text">
          <i class="fas fa-redo"></i>
          {{ $t('transform.rotation') }}
        </span>
      </label>
      <div class="slider-with-input">
        <input
          type="range"
          min="-180"
          max="180"
          :value="transforms.rotation"
          class="slider"
          @input="$emit('update:rotation', Number($event.target.value))"
          @change="$emit('commit-transform')"
        />
        <div class="number-input-wrapper">
          <input
            type="number"
            min="-180"
            max="180"
            :value="transforms.rotation"
            class="number-input"
            @input="$emit('update:rotation', Math.min(180, Math.max(-180, Number($event.target.value))))"
            @change="$emit('commit-transform')"
          />
          <span class="unit">°</span>
        </div>
        <button
          v-if="transforms.rotation !== 0"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:rotation', 0); $emit('commit-transform')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
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
        <label class="mini-label">
          <i class="fas fa-arrows-alt-h"></i>
          {{ $t('transform.skew.horizontal', 'Horizontal') }}
        </label>
        <div class="slider-with-input compact">
          <input
            type="range"
            min="-45"
            max="45"
            :value="transforms.skewX"
            class="slider"
            @input="$emit('update:skew-x', Number($event.target.value))"
            @change="$emit('commit-transform')"
          />
          <div class="number-input-wrapper">
            <input
              type="number"
              min="-45"
              max="45"
              :value="transforms.skewX"
              class="number-input"
              @input="$emit('update:skew-x', Math.min(45, Math.max(-45, Number($event.target.value))))"
              @change="$emit('commit-transform')"
            />
            <span class="unit">°</span>
          </div>
          <button
            v-if="transforms.skewX !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="$emit('update:skew-x', 0); $emit('commit-transform')"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>

      <!-- Skew Y (Vertikal) -->
      <div class="skew-control-row">
        <label class="mini-label">
          <i class="fas fa-arrows-alt-v"></i>
          {{ $t('transform.skew.vertical', 'Vertikal') }}
        </label>
        <div class="slider-with-input compact">
          <input
            type="range"
            min="-45"
            max="45"
            :value="transforms.skewY"
            class="slider"
            @input="$emit('update:skew-y', Number($event.target.value))"
            @change="$emit('commit-transform')"
          />
          <div class="number-input-wrapper">
            <input
              type="number"
              min="-45"
              max="45"
              :value="transforms.skewY"
              class="number-input"
              @input="$emit('update:skew-y', Math.min(45, Math.max(-45, Number($event.target.value))))"
              @change="$emit('commit-transform')"
            />
            <span class="unit">°</span>
          </div>
          <button
            v-if="transforms.skewY !== 0"
            class="reset-btn"
            title="Zurücksetzen"
            @click="$emit('update:skew-y', 0); $emit('commit-transform')"
          >
            <i class="fas fa-undo-alt"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Zoom/Skalierung -->
    <div class="control-group">
      <label>
        <span class="label-text">
          <i class="fas fa-search-plus"></i>
          {{ $t('transform.zoom') }}
        </span>
      </label>
      <div class="slider-with-input">
        <input
          type="range"
          min="10"
          max="200"
          :value="transforms.scale"
          class="slider"
          @input="$emit('update:scale', Number($event.target.value))"
          @change="$emit('commit-transform')"
        />
        <div class="number-input-wrapper">
          <input
            type="number"
            min="10"
            max="200"
            :value="transforms.scale"
            class="number-input"
            @input="$emit('update:scale', Math.min(200, Math.max(10, Number($event.target.value))))"
            @change="$emit('commit-transform')"
          />
          <span class="unit">%</span>
        </div>
        <button
          v-if="transforms.scale !== 100"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:scale', 100); $emit('commit-transform')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
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
      <label>
        <span class="label-text">
          <i class="fas fa-circle"></i>
          {{ $t('transform.borderRadius') }}
        </span>
      </label>
      <div class="slider-with-input">
        <input
          type="range"
          min="0"
          max="50"
          :value="transforms.borderRadius"
          class="slider"
          @input="$emit('update:border-radius', Number($event.target.value))"
          @change="$emit('commit-transform')"
        />
        <div class="number-input-wrapper">
          <input
            type="number"
            min="0"
            max="50"
            :value="transforms.borderRadius"
            class="number-input"
            @input="$emit('update:border-radius', Math.min(50, Math.max(0, Number($event.target.value))))"
            @change="$emit('commit-transform')"
          />
          <span class="unit">%</span>
        </div>
        <button
          v-if="transforms.borderRadius !== 0"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:border-radius', 0); $emit('commit-transform')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
      <p class="control-hint">
        {{ $t('transform.borderRadiusHint', '50% = vollständiger Kreis') }}
      </p>
    </div>

    <!-- Rahmen -->
    <div class="control-group">
      <label>
        <span class="label-text">
          <i class="fas fa-border-style"></i>
          {{ $t('transform.border') }}
        </span>
      </label>
      <div class="slider-with-input">
        <input
          type="range"
          min="0"
          max="20"
          :value="transforms.borderWidth"
          class="slider"
          @input="$emit('update:border-width', Number($event.target.value))"
          @change="$emit('commit-transform')"
        />
        <div class="number-input-wrapper">
          <input
            type="number"
            min="0"
            max="20"
            :value="transforms.borderWidth"
            class="number-input"
            @input="$emit('update:border-width', Math.min(20, Math.max(0, Number($event.target.value))))"
            @change="$emit('commit-transform')"
          />
          <span class="unit">px</span>
        </div>
        <button
          v-if="transforms.borderWidth !== 0"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:border-width', 0); $emit('commit-transform')"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>

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
      <label class="shadow-toggle-label">
        <span class="label-text">
          <i class="fas fa-clone"></i>
          {{ $t('transform.shadow.title', 'Schlagschatten') }}
        </span>
        <button
          class="toggle-btn"
          :class="{ active: transforms.shadowEnabled }"
          @click="$emit('update:shadow-enabled', !transforms.shadowEnabled)"
        >
          <span class="toggle-slider"></span>
        </button>
      </label>

      <div v-if="transforms.shadowEnabled" class="shadow-controls-panel">
        <!-- Offset X -->
        <div class="shadow-control-row">
          <label class="mini-label">
            <i class="fas fa-arrows-alt-h"></i>
            {{ $t('transform.shadow.offsetX', 'X-Versatz') }}
          </label>
          <div class="slider-with-input compact">
            <input
              type="range"
              min="-50"
              max="50"
              :value="transforms.shadowOffsetX"
              class="slider"
              @input="$emit('update:shadow-offset-x', Number($event.target.value))"
              @change="$emit('commit-transform')"
            />
            <div class="number-input-wrapper">
              <input
                type="number"
                min="-50"
                max="50"
                :value="transforms.shadowOffsetX"
                class="number-input"
                @input="$emit('update:shadow-offset-x', Math.min(50, Math.max(-50, Number($event.target.value))))"
                @change="$emit('commit-transform')"
              />
              <span class="unit">px</span>
            </div>
            <button
              v-if="transforms.shadowOffsetX !== 10"
              class="reset-btn"
              title="Zurücksetzen"
              @click="$emit('update:shadow-offset-x', 10); $emit('commit-transform')"
            >
              <i class="fas fa-undo-alt"></i>
            </button>
          </div>
        </div>

        <!-- Offset Y -->
        <div class="shadow-control-row">
          <label class="mini-label">
            <i class="fas fa-arrows-alt-v"></i>
            {{ $t('transform.shadow.offsetY', 'Y-Versatz') }}
          </label>
          <div class="slider-with-input compact">
            <input
              type="range"
              min="-50"
              max="50"
              :value="transforms.shadowOffsetY"
              class="slider"
              @input="$emit('update:shadow-offset-y', Number($event.target.value))"
              @change="$emit('commit-transform')"
            />
            <div class="number-input-wrapper">
              <input
                type="number"
                min="-50"
                max="50"
                :value="transforms.shadowOffsetY"
                class="number-input"
                @input="$emit('update:shadow-offset-y', Math.min(50, Math.max(-50, Number($event.target.value))))"
                @change="$emit('commit-transform')"
              />
              <span class="unit">px</span>
            </div>
            <button
              v-if="transforms.shadowOffsetY !== 10"
              class="reset-btn"
              title="Zurücksetzen"
              @click="$emit('update:shadow-offset-y', 10); $emit('commit-transform')"
            >
              <i class="fas fa-undo-alt"></i>
            </button>
          </div>
        </div>

        <!-- Blur -->
        <div class="shadow-control-row">
          <label class="mini-label">
            <i class="fas fa-adjust"></i>
            {{ $t('transform.shadow.blur', 'Weichzeichner') }}
          </label>
          <div class="slider-with-input compact">
            <input
              type="range"
              min="0"
              max="100"
              :value="transforms.shadowBlur"
              class="slider"
              @input="$emit('update:shadow-blur', Number($event.target.value))"
              @change="$emit('commit-transform')"
            />
            <div class="number-input-wrapper">
              <input
                type="number"
                min="0"
                max="100"
                :value="transforms.shadowBlur"
                class="number-input"
                @input="$emit('update:shadow-blur', Math.min(100, Math.max(0, Number($event.target.value))))"
                @change="$emit('commit-transform')"
              />
              <span class="unit">px</span>
            </div>
            <button
              v-if="transforms.shadowBlur !== 20"
              class="reset-btn"
              title="Zurücksetzen"
              @click="$emit('update:shadow-blur', 20); $emit('commit-transform')"
            >
              <i class="fas fa-undo-alt"></i>
            </button>
          </div>
        </div>

        <!-- Opacity -->
        <div class="shadow-control-row">
          <label class="mini-label">
            <i class="fas fa-eye"></i>
            {{ $t('transform.shadow.opacity', 'Deckkraft') }}
          </label>
          <div class="slider-with-input compact">
            <input
              type="range"
              min="0"
              max="100"
              :value="transforms.shadowOpacity"
              class="slider"
              @input="$emit('update:shadow-opacity', Number($event.target.value))"
              @change="$emit('commit-transform')"
            />
            <div class="number-input-wrapper">
              <input
                type="number"
                min="0"
                max="100"
                :value="transforms.shadowOpacity"
                class="number-input"
                @input="$emit('update:shadow-opacity', Math.min(100, Math.max(0, Number($event.target.value))))"
                @change="$emit('commit-transform')"
              />
              <span class="unit">%</span>
            </div>
            <button
              v-if="transforms.shadowOpacity !== 50"
              class="reset-btn"
              title="Zurücksetzen"
              @click="$emit('update:shadow-opacity', 50); $emit('commit-transform')"
            >
              <i class="fas fa-undo-alt"></i>
            </button>
          </div>
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
defineProps({
  transforms: { type: Object, required: true },
  canPan: { type: Boolean, default: false },
  hasPan: { type: Boolean, default: false },
  canUndoTransform: { type: Boolean, default: false },
  canRedoTransform: { type: Boolean, default: false },
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

.transform-history-controls {
  display: flex;
  gap: 4px;
}

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

.shadow-toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.5rem;
}

.toggle-btn {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border, #d1d5db);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 2px;
  overflow: hidden;
  outline: none;
  flex-shrink: 0;

  &.active {
    background: linear-gradient(135deg, #014f99, #003971);
  }

  .toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  &.active .toggle-slider {
    transform: translateX(20px);
  }
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

  .toggle-btn {
    background: var(--color-border);

    &.active {
      background: linear-gradient(135deg, #014f99, #003971);
    }
  }

  .shadow-controls-panel {
    background: rgba(1, 79, 153, 0.1);
    border-color: rgba(1, 79, 153, 0.25);
  }

  .skew-section {
    border-top-color: var(--color-border);
  }
}

// Mobile
@media (max-width: 768px) {
  .quick-btn {
    min-height: 44px;
    padding: 0.75rem 0.5rem;
  }

  .toggle-btn {
    width: 50px;
    height: 28px;
  }
}
</style>
