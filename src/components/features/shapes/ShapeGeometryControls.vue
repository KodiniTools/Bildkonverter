<template>
  <template v-if="selectedShape">
    <!-- Deckkraft -->
    <div class="control-group">
      <SliderField
        :model-value="selectedShape.opacity ?? 100"
        :min="0"
        :max="100"
        unit="%"
        :default-value="100"
        :label="$t('shapes.edit.opacity')"
        icon="adjust"
        input-id="shape-opacity"
        @update:model-value="update({ opacity: $event })"
        @commit="commit"
      />
    </div>

    <!-- Drehen + Spiegeln -->
    <div class="control-group">
      <SliderField
        :model-value="Math.round(selectedShape.rotation || 0)"
        :min="-180"
        :max="180"
        unit="°"
        :default-value="0"
        :label="$t('shapes.edit.rotation')"
        icon="redo"
        input-id="shape-rotation"
        @update:model-value="update({ rotation: $event })"
        @commit="commit"
      />
      <div v-if="!isMarker && !isEffect" class="segmented mt-2">
        <button
          type="button"
          class="segmented__option"
          :class="{ active: selectedShape.flipX }"
          :aria-pressed="!!selectedShape.flipX"
          @click="setAndCommit({ flipX: !selectedShape.flipX })"
        >
          <AppIcon name="arrows-alt-h" />
          {{ $t('shapes.edit.flipH') }}
        </button>
        <button
          type="button"
          class="segmented__option"
          :class="{ active: selectedShape.flipY }"
          :aria-pressed="!!selectedShape.flipY"
          @click="setAndCommit({ flipY: !selectedShape.flipY })"
        >
          <AppIcon name="arrows-alt-v" />
          {{ $t('shapes.edit.flipV') }}
        </button>
      </div>
    </div>

    <!-- Größe -->
    <div v-if="isMarker || isEmoji" class="control-group">
      <SliderField
        :model-value="Math.round(selectedShape.width)"
        :min="SHAPE_LIMITS.minSize"
        :max="sizeMax(selectedShape.width)"
        unit="px"
        :label="$t('shapes.edit.size')"
        icon="expand-arrows-alt"
        input-id="shape-size"
        @update:model-value="update({ width: $event, height: $event })"
        @commit="commit"
      />
    </div>
    <div v-if="!isMarker && !isEmoji" class="control-group">
      <SliderField
        :model-value="Math.round(selectedShape.width)"
        :min="SHAPE_LIMITS.minSize"
        :max="sizeMax(selectedShape.width)"
        unit="px"
        :label="heightless ? $t('shapes.edit.length') : $t('shapes.edit.width')"
        icon="arrows-alt-h"
        input-id="shape-width"
        @update:model-value="setWidth"
        @commit="commit"
      />
    </div>
    <div v-if="!heightless && !isMarker && !isEmoji" class="control-group">
      <SliderField
        :model-value="Math.round(selectedShape.height)"
        :min="SHAPE_LIMITS.minSize"
        :max="sizeMax(selectedShape.height)"
        unit="px"
        :label="$t('shapes.edit.height')"
        icon="arrows-alt-v"
        input-id="shape-height"
        @update:model-value="setHeight"
        @commit="commit"
      />
      <div class="toggle-row mt-2">
        <UiSwitch id="shape-lock-ratio" v-model="lockRatio" :label="$t('shapes.edit.lockRatio')" />
      </div>
    </div>

    <!-- Position (Mittelpunkt) -->
    <div class="control-group">
      <SliderField
        :model-value="Math.round(selectedShape.x)"
        :min="rangeX.min"
        :max="rangeX.max"
        unit="px"
        :label="$t('shapes.edit.positionX')"
        icon="arrows-alt-h"
        input-id="shape-position-x"
        @update:model-value="update({ x: $event })"
        @commit="commit"
      />
    </div>
    <div class="control-group">
      <SliderField
        :model-value="Math.round(selectedShape.y)"
        :min="rangeY.min"
        :max="rangeY.max"
        unit="px"
        :label="$t('shapes.edit.positionY')"
        icon="arrows-alt-v"
        input-id="shape-position-y"
        @update:model-value="update({ y: $event })"
        @commit="commit"
      />
    </div>

    <!-- Schatten -->
    <div v-if="!isEffect" class="control-group">
      <SliderField
        :model-value="selectedShape.shadowBlur || 0"
        :min="0"
        :max="SHAPE_LIMITS.maxShadow"
        unit="px"
        :default-value="0"
        :label="$t('shapes.edit.shadow')"
        icon="clone"
        input-id="shape-shadow"
        @update:model-value="update({ shadowBlur: $event })"
        @commit="commit"
      />
      <div v-if="(selectedShape.shadowBlur || 0) > 0" class="color-picker-row mt-2">
        <UiColorField
          class="color-input"
          :model-value="selectedShape.shadowColor || '#000000'"
          :label="$t('shapes.edit.shadowColor')"
          @update:model-value="update({ shadowColor: $event })"
          @change="commit"
        />
        <input
          type="text"
          class="color-text"
          maxlength="7"
          :value="selectedShape.shadowColor || '#000000'"
          :aria-label="$t('shapes.edit.shadowColor')"
          @input="updateColor('shadowColor', ($event.target as HTMLInputElement).value)"
          @change="commit"
        />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
/** Deckkraft, Drehung, Größe, Position und Schatten der ausgewählten Form (Teil von ShapesPanel) */
import AppIcon from '@/components/ui/AppIcon.vue';
import UiColorField from '@/components/ui/ColorField.vue';
import SliderField from '@/components/ui/SliderField.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import { SHAPE_LIMITS } from '@/utils/shapes';
import { useShapeEditorContext } from '@/composables/shapes/useShapeEditor';

const {
  selectedShape,
  isMarker,
  isEmoji,
  isEffect,
  heightless,
  lockRatio,
  rangeX,
  rangeY,
  sizeMax,
  update,
  commit,
  setAndCommit,
  updateColor,
  setWidth,
  setHeight,
} = useShapeEditorContext();
</script>

<style scoped lang="scss">
@use '../transform/shared' as *;
@use './shapes' as *;
</style>
