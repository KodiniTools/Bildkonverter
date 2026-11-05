<template>
  <!-- Schlagschatten -->
  <div class="control-group shadow-section">
    <label class="switch-row">
      <span class="label-text">
        <AppIcon name="clone" />
        {{ $t('transform.shadow.title', 'Schlagschatten') }}
      </span>
      <UiSwitch
        :model-value="!!transforms.shadowEnabled"
        :label="$t('transform.shadow.title', 'Schlagschatten')"
        label-hidden
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
          <ColorField
            :model-value="transforms.shadowColor"
            :label="$t('transform.shadow.color', 'Farbe')"
            class="color-input"
            @update:model-value="$emit('update:shadow-color', $event)"
            @change="$emit('commit-transform')"
          />
          <input
            type="text"
            :value="transforms.shadowColor"
            class="color-text"
            maxlength="7"
            @input="$emit('update:shadow-color', ($event.target as HTMLInputElement).value)"
            @change="$emit('commit-transform')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import ColorField from '@/components/ui/ColorField.vue';
import SliderField from '@/components/ui/SliderField.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import type { ImageTransforms } from '@/composables/transform/types';

defineProps<{
  transforms: Pick<
    ImageTransforms,
    | 'shadowEnabled'
    | 'shadowOffsetX'
    | 'shadowOffsetY'
    | 'shadowBlur'
    | 'shadowColor'
    | 'shadowOpacity'
  >;
}>();

defineEmits<{
  'update:shadow-enabled': [value: boolean];
  'update:shadow-offset-x': [value: number];
  'update:shadow-offset-y': [value: number];
  'update:shadow-blur': [value: number];
  'update:shadow-opacity': [value: number];
  'update:shadow-color': [value: string];
  'commit-transform': [];
}>();
</script>

<style scoped lang="scss">
@import './shared';
@import './transform-sections';

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
</style>
