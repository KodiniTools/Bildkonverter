<template>
  <div class="draw-settings">
    <p class="control-hint draw-hint">
      {{ drawTool ? $t('shapes.draw.activeHint') : $t('shapes.draw.hint') }}
    </p>
    <template v-if="drawTool">
      <div class="control-group">
        <label class="mini-label">{{ $t('shapes.draw.color') }}</label>
        <ColorField
          :model-value="drawStyle.color"
          :label="$t('shapes.draw.color')"
          :recent-label="$t('shapes.edit.recentColors')"
          @update:model-value="setDrawSetting({ color: $event })"
        />
      </div>
      <div class="control-group">
        <SliderField
          :model-value="drawWidth"
          :min="1"
          :max="SHAPE_LIMITS.maxStroke"
          unit="px"
          :label="$t('shapes.edit.lineWidth')"
          icon="border-style"
          input-id="draw-width"
          @update:model-value="setDrawSetting({ width: $event })"
        />
      </div>
      <div class="control-group">
        <SliderField
          :model-value="drawStyle.opacity"
          :min="5"
          :max="100"
          unit="%"
          :label="$t('shapes.edit.opacity')"
          icon="adjust"
          input-id="draw-opacity"
          @update:model-value="setDrawSetting({ opacity: $event })"
        />
      </div>
      <button type="button" class="transform-btn draw-done-btn" @click="setDrawTool(null)">
        <AppIcon name="check" />
        <span>{{ $t('shapes.draw.done') }}</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
/** Einstellungen für Stift und Textmarker (Teil von ShapesPanel) */
import AppIcon from '@/components/ui/AppIcon.vue';
import SliderField from '@/components/ui/SliderField.vue';
import { SHAPE_LIMITS } from '@/utils/shapes';
import { useShapeEditorContext } from '@/composables/shapes/useShapeEditor';
import ColorField from './ColorField.vue';

const { drawTool, drawStyle, drawWidth, setDrawTool, setDrawSetting } = useShapeEditorContext();
</script>

<style scoped lang="scss">
@use '../transform/shared' as *;
@use './shapes' as *;

.draw-settings {
  margin-top: var(--ds-space-3);
}

.draw-hint {
  margin: 0 0 var(--ds-space-3);
}

.draw-done-btn {
  width: 100%;
}
</style>
