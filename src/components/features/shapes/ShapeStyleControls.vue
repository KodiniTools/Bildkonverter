<template>
  <template v-if="selectedShape">
    <!-- Marker: Nummer und Stil -->
    <template v-if="isMarker">
      <div class="control-group">
        <SliderField
          :model-value="Number(selectedShape.number) || 1"
          :min="1"
          :max="Math.max(99, Number(selectedShape.number) || 1)"
          :label="$t('shapes.edit.number')"
          icon="list"
          input-id="shape-marker-number"
          @update:model-value="update({ number: Math.min(MARKER_MAX, Math.max(1, $event)) })"
          @commit="commit"
        />
      </div>
      <div class="control-group">
        <div class="segmented" :aria-label="$t('shapes.edit.markerStyle')">
          <button
            v-for="style in MARKER_STYLES"
            :key="style"
            type="button"
            class="segmented__option"
            :class="{ active: (selectedShape.markerStyle || 'circle') === style }"
            :aria-pressed="(selectedShape.markerStyle || 'circle') === style"
            @click="setAndCommit({ markerStyle: style })"
          >
            {{ $t(`shapes.markerStyles.${style}`) }}
          </button>
        </div>
      </div>
      <div class="control-group">
        <label class="mini-label">{{ $t('shapes.edit.textColor') }}</label>
        <ColorField
          :model-value="selectedShape.textColor || '#ffffff'"
          :label="$t('shapes.edit.textColor')"
          :recent-label="$t('shapes.edit.recentColors')"
          @update:model-value="update({ textColor: $event })"
          @commit="commit"
        />
      </div>
    </template>

    <!-- Emoji tauschen -->
    <div v-if="isEmoji" class="control-group">
      <label class="mini-label">{{ $t('shapes.edit.emoji') }}</label>
      <div class="emoji-grid">
        <button
          v-for="(glyph, id) in EMOJI_SET"
          :key="id"
          type="button"
          class="emoji-option"
          :class="{ active: selectedShape.emoji === glyph }"
          :aria-pressed="selectedShape.emoji === glyph"
          :title="$t(`shapes.items.${id}`)"
          :aria-label="$t(`shapes.items.${id}`)"
          @click="setAndCommit({ emoji: glyph, galleryId: id })"
        >
          {{ glyph }}
        </button>
      </div>
    </div>

    <!-- Text in der Form (skaliert mit der Form) -->
    <template v-if="hasTextBox">
      <div class="control-group">
        <label class="mini-label" for="shape-text-input">{{ $t('shapes.edit.text') }}</label>
        <textarea
          id="shape-text-input"
          class="shape-text-input"
          rows="2"
          :value="selectedShape.text || ''"
          :placeholder="$t('shapes.edit.textPlaceholder')"
          @input="update({ text: ($event.target as HTMLTextAreaElement).value })"
          @change="commit"
        />
      </div>
      <div class="control-group">
        <UiSelect
          id="shape-font"
          :label="$t('shapes.edit.font')"
          :options="FONT_OPTIONS"
          :model-value="selectedShape.fontFamily || SHAPE_TEXT_DEFAULTS.fontFamily"
          @update:model-value="setFont"
        />
      </div>
      <div class="control-group">
        <SliderField
          :model-value="fontSizePx"
          :min="4"
          :max="fontSizeMax"
          unit="px"
          :label="$t('shapes.edit.fontSize')"
          icon="text-height"
          input-id="shape-font-size"
          @update:model-value="setFontSize"
          @commit="commit"
        />
      </div>
      <div class="control-group">
        <label class="mini-label">{{ $t('shapes.edit.textFill') }}</label>
        <ColorField
          :model-value="selectedShape.textColor || SHAPE_TEXT_DEFAULTS.textColor"
          :label="$t('shapes.edit.textFill')"
          :recent-label="$t('shapes.edit.recentColors')"
          @update:model-value="update({ textColor: $event })"
          @commit="commit"
        />
        <div class="segmented mt-2" :aria-label="$t('shapes.edit.textAlign')">
          <button
            v-for="align in TEXT_ALIGNS"
            :key="align"
            type="button"
            class="segmented__option"
            :class="{ active: (selectedShape.textAlign || 'center') === align }"
            :aria-pressed="(selectedShape.textAlign || 'center') === align"
            @click="setAndCommit({ textAlign: align })"
          >
            {{ $t(`shapes.align.${align}`) }}
          </button>
        </div>
      </div>
    </template>

    <!-- Verpixeln / Weichzeichnen -->
    <template v-if="isEffect">
      <div class="control-group">
        <div class="segmented" :aria-label="$t('shapes.edit.effect')">
          <button
            v-for="effect in CENSOR_EFFECTS"
            :key="effect"
            type="button"
            class="segmented__option"
            :class="{ active: (selectedShape.effect || 'pixelate') === effect }"
            :aria-pressed="(selectedShape.effect || 'pixelate') === effect"
            @click="setAndCommit({ effect })"
          >
            {{ $t(`shapes.effects.${effect}`) }}
          </button>
        </div>
        <div class="segmented mt-2" :aria-label="$t('shapes.edit.region')">
          <button
            v-for="region in CENSOR_REGIONS"
            :key="region"
            type="button"
            class="segmented__option"
            :class="{ active: (selectedShape.region || 'rect') === region }"
            :aria-pressed="(selectedShape.region || 'rect') === region"
            @click="setAndCommit({ region })"
          >
            {{ $t(`shapes.regions.${region}`) }}
          </button>
        </div>
      </div>
      <div class="control-group">
        <SliderField
          :model-value="Number(selectedShape.intensity) || 50"
          :min="1"
          :max="100"
          unit="%"
          :default-value="50"
          :label="$t('shapes.edit.intensity')"
          icon="sliders-h"
          input-id="shape-intensity"
          @update:model-value="update({ intensity: $event })"
          @commit="commit"
        />
      </div>
    </template>

    <!-- Farbe / Füllung -->
    <div v-if="isFillKind || isMarker" class="control-group">
      <label v-if="isMarker" class="mini-label">{{ $t('shapes.edit.fillColor') }}</label>
      <div v-if="isFillKind" class="toggle-row">
        <UiSwitch
          id="shape-fill-toggle"
          :model-value="selectedShape.filled !== false"
          :label="$t('shapes.edit.fill')"
          @update:model-value="toggleFill"
        />
      </div>
      <template v-if="selectedShape.filled !== false">
        <div
          class="segmented"
          :class="{ 'mt-2': isFillKind }"
          :aria-label="$t('shapes.edit.fillType')"
        >
          <button
            v-for="type in FILL_TYPES"
            :key="type"
            type="button"
            class="segmented__option"
            :class="{ active: fillType === type }"
            :aria-pressed="fillType === type"
            :data-fill-type="type"
            @click="setAndCommit({ fillType: type })"
          >
            {{ $t(`shapes.fillTypes.${type}`) }}
          </button>
        </div>
        <label v-if="isGradient" class="mini-label mt-2">{{
          $t('shapes.edit.gradientFrom')
        }}</label>
        <ColorField
          :class="{ 'mt-2': !isGradient }"
          :model-value="selectedShape.fillColor"
          :label="isGradient ? $t('shapes.edit.gradientFrom') : $t('shapes.edit.fillColor')"
          :recent-label="$t('shapes.edit.recentColors')"
          @update:model-value="update({ fillColor: $event })"
          @commit="commit"
        />
        <template v-if="isGradient">
          <label class="mini-label mt-2">{{ $t('shapes.edit.gradientTo') }}</label>
          <ColorField
            :model-value="selectedShape.fillColor2 || '#ffffff'"
            :label="$t('shapes.edit.gradientTo')"
            :recent-label="$t('shapes.edit.recentColors')"
            @update:model-value="update({ fillColor2: $event })"
            @commit="commit"
          />
          <button type="button" class="transform-btn swap-btn mt-2" @click="swapGradient">
            <AppIcon name="exchange-alt" />
            <span>{{ $t('shapes.edit.gradientSwap') }}</span>
          </button>
          <SliderField
            v-if="fillType === 'linear'"
            class="mt-2"
            :model-value="Math.round(selectedShape.gradientAngle ?? 90)"
            :min="0"
            :max="360"
            unit="°"
            :default-value="90"
            :label="$t('shapes.edit.gradientAngle')"
            icon="redo"
            input-id="shape-gradient-angle"
            @update:model-value="update({ gradientAngle: $event })"
            @commit="commit"
          />
        </template>
      </template>
    </div>

    <!-- Linie bzw. Umrandung -->
    <div v-if="!isEffect && !isEmoji" class="control-group">
      <SliderField
        :model-value="selectedShape.strokeWidth || 0"
        :min="isStrokeKind ? 1 : 0"
        :max="SHAPE_LIMITS.maxStroke"
        unit="px"
        :label="isStrokeKind ? $t('shapes.edit.lineWidth') : $t('shapes.edit.stroke')"
        icon="border-style"
        input-id="shape-stroke-width"
        @update:model-value="update({ strokeWidth: $event })"
        @commit="commit"
      />
      <ColorField
        v-if="hasStroke"
        class="mt-2"
        :model-value="selectedShape.strokeColor"
        :label="$t('shapes.edit.strokeColor')"
        :recent-label="$t('shapes.edit.recentColors')"
        @update:model-value="update({ strokeColor: $event })"
        @commit="commit"
      />
      <div
        v-if="hasStroke && !isMarker"
        class="segmented mt-2"
        :aria-label="$t('shapes.edit.lineStyle')"
      >
        <button
          v-for="dash in DASH_STYLES"
          :key="dash"
          type="button"
          class="segmented__option"
          :class="{ active: (selectedShape.dash || 'solid') === dash }"
          :aria-pressed="(selectedShape.dash || 'solid') === dash"
          @click="setAndCommit({ dash })"
        >
          {{ $t(`shapes.dash.${dash}`) }}
        </button>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
/**
 * Art-spezifische Einstellungen der ausgewählten Form: Marker, Emoji, Text,
 * Zensur-Effekt, Füllung und Kontur (Teil von ShapesPanel).
 */
import { availableFonts } from '@/assets/fonts/fontList.js';
import AppIcon from '@/components/ui/AppIcon.vue';
import SliderField from '@/components/ui/SliderField.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import { fontOptions } from '@/utils/fontOptions';
import {
  CENSOR_EFFECTS,
  CENSOR_REGIONS,
  DASH_STYLES,
  EMOJI_SET,
  FILL_TYPES,
  MARKER_MAX,
  MARKER_STYLES,
  SHAPE_LIMITS,
  SHAPE_TEXT_DEFAULTS,
  TEXT_ALIGNS,
} from '@/utils/shapes';
import { useShapeEditorContext } from '@/composables/shapes/useShapeEditor';
import ColorField from './ColorField.vue';

const FONT_OPTIONS = fontOptions(availableFonts);

const {
  selectedShape,
  isMarker,
  isEmoji,
  isEffect,
  isFillKind,
  isStrokeKind,
  hasTextBox,
  hasStroke,
  fillType,
  isGradient,
  fontSizePx,
  fontSizeMax,
  update,
  commit,
  setAndCommit,
  toggleFill,
  swapGradient,
  setFont,
  setFontSize,
} = useShapeEditorContext();
</script>

<style scoped lang="scss">
@use '../transform/shared' as *;
@use './shapes' as *;

.swap-btn {
  width: 100%;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--ds-space-1);
}

.emoji-option {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
  }
}

.shape-text-input {
  width: 100%;
  min-height: 64px;
  resize: vertical;
}
</style>
