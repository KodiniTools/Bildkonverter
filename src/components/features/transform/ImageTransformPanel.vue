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
      @undo="emit('undo-transform')"
      @redo="emit('redo-transform')"
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
        @update:model-value="emit('update:opacity', $event)"
        @commit="emit('commit-transform')"
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
        @update:model-value="emit('update:rotation', $event)"
        @commit="emit('commit-transform')"
      />
    </div>

    <TransformQuickActions
      :flip-horizontal="transforms.flipHorizontal"
      :flip-vertical="transforms.flipVertical"
      @rotate-90-counter="emit('rotate-90-counter')"
      @rotate-180="emit('rotate-180')"
      @rotate-90="emit('rotate-90')"
      @flip-horizontal="emit('flip-horizontal')"
      @flip-vertical="emit('flip-vertical')"
    />

    <TransformSkewSection
      :transforms="transforms"
      @update:skew-x="emit('update:skew-x', $event)"
      @update:skew-y="emit('update:skew-y', $event)"
      @commit-transform="emit('commit-transform')"
    />

    <TransformDistortSection
      :enabled="!!transforms.distortEnabled"
      :has-distortion="hasDistortion"
      :is-applying-distort="isApplyingDistort"
      @toggle-distort="emit('toggle-distort')"
      @reset-distort="emit('reset-distort')"
      @apply-distort="emit('apply-distort')"
    />

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
        @update:model-value="emit('update:scale', $event)"
        @commit="emit('commit-transform')"
      />
    </div>

    <TransformPanInfo v-if="canPan" :has-pan="hasPan" @reset-pan="emit('reset-pan')" />

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
        @update:model-value="emit('update:border-radius', $event)"
        @commit="emit('commit-transform')"
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
        @update:model-value="emit('update:border-width', $event)"
        @commit="emit('commit-transform')"
      />

      <div v-if="transforms.borderWidth > 0" class="color-picker-group">
        <ColorField
          :model-value="transforms.borderColor"
          :label="$t('transform.borderColor')"
          class="color-input"
          @update:model-value="emit('update:border-color', $event)"
          @change="emit('commit-transform')"
        />
        <span class="color-label">{{ $t('transform.borderColor') }}</span>
      </div>
    </div>

    <TransformShadowSection
      :transforms="transforms"
      @update:shadow-enabled="emit('update:shadow-enabled', $event)"
      @update:shadow-offset-x="emit('update:shadow-offset-x', $event)"
      @update:shadow-offset-y="emit('update:shadow-offset-y', $event)"
      @update:shadow-blur="emit('update:shadow-blur', $event)"
      @update:shadow-opacity="emit('update:shadow-opacity', $event)"
      @update:shadow-color="emit('update:shadow-color', $event)"
      @commit-transform="emit('commit-transform')"
    />
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import ColorField from '@/components/ui/ColorField.vue';
import HistoryActions from '@/components/ui/HistoryActions.vue';
import SliderField from '@/components/ui/SliderField.vue';
import TransformQuickActions from './TransformQuickActions.vue';
import TransformSkewSection from './TransformSkewSection.vue';
import TransformDistortSection from './TransformDistortSection.vue';
import TransformPanInfo from './TransformPanInfo.vue';
import TransformShadowSection from './TransformShadowSection.vue';
import type { ImageTransforms } from '@/composables/transform/types';

withDefaults(
  defineProps<{
    transforms: ImageTransforms;
    canPan?: boolean;
    hasPan?: boolean;
    canUndoTransform?: boolean;
    canRedoTransform?: boolean;
    // Verzerrung sichtbar aktiv (Modus an UND Ecken versetzt)
    hasDistortion?: boolean;
    isApplyingDistort?: boolean;
  }>(),
  {
    canPan: false,
    hasPan: false,
    canUndoTransform: false,
    canRedoTransform: false,
    hasDistortion: false,
    isApplyingDistort: false,
  }
);

const emit = defineEmits<{
  'update:opacity': [value: number];
  'update:rotation': [value: number];
  'update:scale': [value: number];
  'update:border-radius': [value: number];
  'update:border-width': [value: number];
  'update:border-color': [value: string];
  'update:shadow-enabled': [value: boolean];
  'update:shadow-offset-x': [value: number];
  'update:shadow-offset-y': [value: number];
  'update:shadow-blur': [value: number];
  'update:shadow-color': [value: string];
  'update:shadow-opacity': [value: number];
  'update:skew-x': [value: number];
  'update:skew-y': [value: number];
  'toggle-distort': [];
  'reset-distort': [];
  'apply-distort': [];
  'rotate-90': [];
  'rotate-90-counter': [];
  'rotate-180': [];
  'flip-horizontal': [];
  'flip-vertical': [];
  'reset-pan': [];
  'undo-transform': [];
  'redo-transform': [];
  'commit-transform': [];
}>();
</script>

<style scoped lang="scss">
@use './shared' as *;
</style>
