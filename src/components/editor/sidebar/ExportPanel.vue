<template>
  <div class="sidebar-section">
    <h3>{{ $t('editor.sidebar.format') }}</h3>

    <select
      :value="outputFormat"
      class="form-select"
      @change="$emit('update:outputFormat', $event.target.value)"
    >
      <option v-for="format in formats" :key="format" :value="format">
        {{ format.toUpperCase() }}
      </option>
    </select>

    <div v-if="currentFormatInfo" class="format-info">
      <p class="format-description">{{ $t(`editor.formats.${outputFormat}.description`) }}</p>
      <span class="format-badge">{{ $t(`editor.formats.${outputFormat}.recommended`) }}</span>
      <span
        v-if="requiresBackend"
        class="backend-badge"
        :title="$t('editor.format.backendRequired', 'Benötigt Backend-API')"
      >
        <AppIcon name="cloud" />
        {{ $t('editor.format.backendBadge', 'Backend') }}
      </span>
    </div>

    <FilterSlider
      v-if="supportsQuality"
      :model-value="exportQuality"
      :label="$t('editor.export.quality', 'Qualität')"
      :min="1"
      :max="100"
      :default-value="92"
      unit="%"
      @update:model-value="$emit('update:exportQuality', $event)"
    />

    <div v-if="targetSizeAvailable" class="target-size">
      <label class="checkbox-label">
        <input
          :checked="targetSizeEnabled"
          type="checkbox"
          data-testid="target-size-enable"
          @change="$emit('update:targetSizeEnabled', $event.target.checked)"
        />
        <span>{{ $t('editor.export.targetSize.enable') }}</span>
      </label>
      <template v-if="targetSizeEnabled">
        <div class="target-size__row">
          <label for="target-size-kb">{{ $t('editor.export.targetSize.max') }}</label>
          <div class="target-size__input">
            <input
              id="target-size-kb"
              :value="targetSizeKb"
              type="number"
              :min="TARGET_KB_MIN"
              :max="TARGET_KB_MAX"
              step="10"
              @input="$emit('update:targetSizeKb', Number($event.target.value))"
              @change="onKbCommit"
            />
            <span class="target-size__unit">KB</span>
          </div>
        </div>
        <label class="checkbox-label">
          <input
            :checked="targetSizeDownscale"
            type="checkbox"
            @change="$emit('update:targetSizeDownscale', $event.target.checked)"
          />
          <span>{{ $t('editor.export.targetSize.downscale') }}</span>
        </label>
        <p class="target-size__hint">{{ $t('editor.export.targetSize.hint') }}</p>
      </template>
    </div>

    <p
      v-if="estimateText"
      class="size-estimate"
      :class="{ 'size-estimate--warn': sizeEstimate && !sizeEstimate.reached }"
      data-testid="size-estimate"
    >
      <span class="size-estimate__label">{{ $t('editor.export.estimate') }}</span>
      <span class="size-estimate__value">{{ estimateText }}</span>
    </p>

    <div v-if="outputFormat === 'png'" class="filter-control checkbox-control">
      <label class="checkbox-label">
        <input
          :checked="exportTransparent"
          type="checkbox"
          @change="$emit('update:exportTransparent', $event.target.checked)"
        />
        <span>{{ $t('editor.export.transparentBackground', 'Transparenter Hintergrund') }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/ui/AppIcon.vue';
import FilterSlider from './FilterSlider.vue';
import { formatSize } from '@/utils/fileUtils';
import { TARGET_KB_MAX, TARGET_KB_MIN, clampTargetKb } from '@/utils/targetSize';

const { t } = useI18n();

const props = defineProps({
  outputFormat: { type: String, required: true },
  formats: { type: Array, required: true },
  formatInfo: { type: Object, required: true },
  currentFormatInfo: { type: Object, default: null },
  supportsQuality: { type: Boolean, default: false },
  requiresBackend: { type: Boolean, default: false },
  exportQuality: { type: Number, default: 92 },
  exportTransparent: { type: Boolean, default: false },
  // Ziel-Dateigröße (nur JPEG/WebP)
  targetSizeAvailable: { type: Boolean, default: false },
  targetSizeEnabled: { type: Boolean, default: false },
  targetSizeKb: { type: Number, default: 500 },
  targetSizeDownscale: { type: Boolean, default: false },
  // Ergebnis der Größenschätzung (useEditorExport), null = keine
  sizeEstimate: { type: Object, default: null },
  isEstimating: { type: Boolean, default: false },
});

const emit = defineEmits([
  'update:outputFormat',
  'update:exportQuality',
  'update:exportTransparent',
  'update:targetSizeEnabled',
  'update:targetSizeKb',
  'update:targetSizeDownscale',
]);

/** Beim Verlassen des Felds auf den erlaubten Bereich begrenzen */
function onKbCommit(event) {
  const kb = clampTargetKb(event.target.value) ?? props.targetSizeKb;
  event.target.value = String(kb);
  emit('update:targetSizeKb', kb);
}

const estimateText = computed(() => {
  const e = props.sizeEstimate;
  if (!e) return props.isEstimating ? t('editor.export.estimating') : '';
  const size = formatSize(e.bytes);
  if (!e.reached) return t('editor.export.estimateMissed', { size });
  if (e.quality === undefined) return t('editor.export.estimateValue', { size });
  if (e.scaled) {
    return t('editor.export.estimateScaled', {
      size,
      quality: e.quality,
      width: e.width,
      height: e.height,
    });
  }
  return t('editor.export.estimateQuality', { size, quality: e.quality });
});
</script>

<style scoped lang="scss">
.target-size {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}

// wie .filter-control.checkbox-control in EditorView.styles.scss
.target-size .checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  cursor: pointer;
  font-size: var(--ds-text-sm);
  color: var(--ds-text);

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    cursor: pointer;
    accent-color: var(--ds-accent);
  }
}

.target-size__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);

  label {
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text-2);
  }
}

.target-size__input {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);

  input {
    width: 96px;
    text-align: right;
  }
}

.target-size__unit {
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
}

.target-size__hint {
  margin: 0;
  font-size: var(--ds-text-xs);
  color: var(--ds-text-3);
}

.size-estimate {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: var(--ds-space-3) 0 0;
  padding: var(--ds-space-2) var(--ds-space-3);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  font-size: var(--ds-text-sm);
  font-variant-numeric: tabular-nums;
}

.size-estimate__label {
  font-size: var(--ds-text-xs);
  color: var(--ds-text-3);
}

.size-estimate__value {
  color: var(--ds-text);
  font-weight: var(--ds-weight-medium);
}

.size-estimate--warn .size-estimate__value {
  color: var(--ds-warning);
}
</style>
