<template>
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
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import SliderField from '@/components/ui/SliderField.vue';
import type { ImageTransforms } from '@/composables/transform/types';

defineProps<{
  transforms: Pick<ImageTransforms, 'skewX' | 'skewY'>;
}>();

defineEmits<{
  'update:skew-x': [value: number];
  'update:skew-y': [value: number];
  'commit-transform': [];
}>();
</script>

<style scoped lang="scss">
@import './shared';
@import './transform-sections';

.skew-control-row {
  margin-bottom: var(--ds-space-2);

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
