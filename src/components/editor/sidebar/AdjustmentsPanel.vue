<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.adjustments }">
    <h3 class="section-header" @click="$emit('toggle-section', 'adjustments')">
      <AppIcon name="sliders-h" class="section-icon" />
      {{ $t('editor.sidebar.adjustments') }}
      <AppIcon
        :name="sectionsOpen.adjustments ? 'chevron-up' : 'chevron-down'"
        class="toggle-icon"
      />
    </h3>

    <div v-show="sectionsOpen.adjustments" class="section-content">
      <UiButton
        class="auto-enhance-btn"
        size="sm"
        block
        :disabled="disabled"
        :title="$t('editor.adjustments.autoHint')"
        data-testid="auto-enhance"
        @click="$emit('auto-enhance')"
      >
        <template #icon><AppIcon name="magic" :size="16" /></template>
        {{ $t('editor.adjustments.auto') }}
      </UiButton>

      <!-- Hintergrund entfernen: KI-Modell im Browser (lib/backgroundRemoval) -->
      <div class="remove-bg">
        <UiButton
          size="sm"
          block
          :disabled="disabled || bgRemoval.busy || !bgRemoval.available"
          :aria-busy="bgRemoval.busy ? 'true' : 'false'"
          data-testid="remove-background"
          @click="$emit('remove-background')"
        >
          <template #icon><AppIcon name="eraser" :size="16" /></template>
          {{ $t(removeLabelKey, { percent: downloadPercent }) }}
        </UiButton>
        <progress
          v-if="bgRemoval.busy && bgRemoval.phase === 'download'"
          class="remove-bg__progress"
          max="100"
          :value="downloadPercent"
          :aria-label="$t('editor.removeBg.downloading', { percent: downloadPercent })"
        />
        <p class="remove-bg__hint">
          {{
            bgRemoval.available
              ? $t('editor.removeBg.hint', { size: bgRemoval.modelSizeMb })
              : $t('editor.removeBg.unsupported')
          }}
        </p>
      </div>

      <FilterSlider
        :model-value="filters.brightness"
        :label="$t('editor.filters.brightness')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'brightness', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.contrast"
        :label="$t('editor.filters.contrast')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'contrast', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.saturation"
        :label="$t('editor.filters.saturation')"
        :min="0"
        :max="200"
        :default-value="100"
        unit="%"
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'saturation', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />

      <FilterSlider
        :model-value="filters.exposure"
        :label="$t('editor.filters.exposure', 'Belichtung')"
        :min="-50"
        :max="50"
        :default-value="0"
        center-zero
        :disabled="disabled"
        @update:model-value="$emit('update-filter', 'exposure', $event)"
        @render="$emit('render')"
        @save-history="$emit('save-history')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import UiButton from '@/components/ui/UiButton.vue';
import FilterSlider from './FilterSlider.vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  sectionsOpen: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * Zustand von „Hintergrund entfernen“:
   * { available, busy, phase: 'download' | 'init' | 'run' | null, fraction: 0..1 | null, modelSizeMb }
   */
  bgRemoval: {
    type: Object,
    default: () => ({ available: true, busy: false, phase: null, fraction: null, modelSizeMb: 90 }),
  },
});

const downloadPercent = computed(() => Math.round((props.bgRemoval.fraction ?? 0) * 100));

/** Beschriftung des Buttons je nach Phase (Schlüssel für $t im Template) */
const removeLabelKey = computed(() => {
  if (!props.bgRemoval.busy) return 'editor.removeBg.remove';
  switch (props.bgRemoval.phase) {
    case 'download':
      return 'editor.removeBg.downloading';
    case 'init':
      return 'editor.removeBg.preparing';
    default:
      return 'editor.removeBg.running';
  }
});

// Props werden nicht verändert: Wertänderungen gehen als Ereignisse an den Editor
// auto-enhance: Editor berechnet die Werte aus dem Bild (utils/autoEnhance)
// remove-background: Editor entfernt den Hintergrund (lib/backgroundRemoval)
defineEmits([
  'update-filter',
  'toggle-section',
  'render',
  'save-history',
  'auto-enhance',
  'remove-background',
]);
</script>

<style scoped>
/* Abstand zum ersten Regler wie zwischen den Reglern (FilterSlider) */
.auto-enhance-btn {
  margin-bottom: var(--ds-space-2);
}

.remove-bg {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin-bottom: var(--ds-space-3);
}

.remove-bg__progress {
  width: 100%;
  height: 4px;
  accent-color: var(--ds-accent);
}

.remove-bg__hint {
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading);
}
</style>
