<template>
  <div class="sidebar-section">
    <h3>{{ $t('editor.sidebar.format') }}</h3>

    <UiSelect
      :model-value="outputFormat"
      :label="$t('editor.sidebar.format')"
      label-hidden
      :options="formatOptions"
      @update:model-value="$emit('update:outputFormat', $event)"
    />

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
      <UiSwitch
        :model-value="targetSizeEnabled"
        :label="$t('editor.export.targetSize.enable')"
        data-testid="target-size-enable"
        @update:model-value="$emit('update:targetSizeEnabled', $event)"
      />
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
              @input="
                $emit('update:targetSizeKb', Number(($event.target as HTMLInputElement).value))
              "
              @change="onKbCommit"
            />
            <span class="target-size__unit">KB</span>
          </div>
        </div>
        <UiSwitch
          :model-value="targetSizeDownscale"
          :label="$t('editor.export.targetSize.downscale')"
          @update:model-value="$emit('update:targetSizeDownscale', $event)"
        />
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

    <div v-if="exifAvailable" class="filter-control checkbox-control exif-option">
      <UiSwitch
        :model-value="keepExif"
        :label="$t('editor.export.exif.keep')"
        data-testid="keep-exif"
        @update:model-value="$emit('update:keepExif', $event)"
      />
    </div>

    <div v-if="outputFormat === 'png'" class="filter-control checkbox-control">
      <UiSwitch
        :model-value="exportTransparent"
        :label="$t('editor.export.transparentBackground', 'Transparenter Hintergrund')"
        @update:model-value="$emit('update:exportTransparent', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SizeEstimate } from '@/composables/editor/useEditorExport';
import type { FormatInfo } from '@/utils/formatInfo';
import AppIcon from '@/components/ui/AppIcon.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import FilterSlider from './FilterSlider.vue';
import { formatSize } from '@/utils/fileUtils';
import { TARGET_KB_MAX, TARGET_KB_MIN, clampTargetKb } from '@/utils/targetSize';

const { t } = useI18n();

const props = defineProps({
  outputFormat: { type: String, required: true },
  formats: { type: Array as PropType<string[]>, required: true },
  formatInfo: { type: Object, required: true },
  currentFormatInfo: { type: Object as PropType<FormatInfo | null>, default: null },
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
  sizeEstimate: { type: Object as PropType<SizeEstimate | null>, default: null },
  isEstimating: { type: Boolean, default: false },
  // EXIF der Originaldatei übernehmen (nur PNG/JPEG/WebP mit Originaldatei)
  exifAvailable: { type: Boolean, default: false },
  keepExif: { type: Boolean, default: false },
});

const emit = defineEmits([
  'update:outputFormat',
  'update:exportQuality',
  'update:exportTransparent',
  'update:targetSizeEnabled',
  'update:targetSizeKb',
  'update:targetSizeDownscale',
  'update:keepExif',
]);

const formatOptions = computed(() =>
  props.formats.map((format) => ({ value: format, label: format.toUpperCase() }))
);

/** Beim Verlassen des Felds auf den erlaubten Bereich begrenzen */
function onKbCommit(event: Event) {
  const input = event.target as HTMLInputElement;
  const kb = clampTargetKb(input.value) ?? props.targetSizeKb;
  input.value = String(kb);
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
