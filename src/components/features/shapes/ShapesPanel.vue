<template>
  <div class="shapes-panel">
    <!-- Galerie -->
    <div class="panel-section shapes-gallery-section">
      <div class="section-header">
        <h3>
          <AppIcon name="shapes" />
          {{ $t('shapes.title') }}
        </h3>
      </div>

      <div class="segmented segmented--wrap" role="tablist" :aria-label="$t('shapes.title')">
        <button
          v-for="category in SHAPE_CATEGORIES"
          :key="category"
          type="button"
          role="tab"
          class="segmented__option"
          :class="{ active: activeCategory === category }"
          :aria-selected="activeCategory === category"
          @click="activeCategory = category"
        >
          {{ $t(`shapes.categories.${category}`) }}
        </button>
      </div>

      <div class="shape-grid" role="tabpanel">
        <button
          v-for="item in galleryItems"
          :key="item.id"
          type="button"
          class="shape-tile"
          :title="$t(`shapes.items.${item.id}`)"
          :aria-label="$t('shapes.add', { name: $t(`shapes.items.${item.id}`) })"
          :disabled="disabled"
          :data-shape="item.id"
          :class="{ active: isDrawToolItem(item) && drawTool === item.tool }"
          :aria-pressed="isDrawToolItem(item) ? drawTool === item.tool : undefined"
          @click="onTileClick(item)"
        >
          <ShapeIcon :item="item" :size="30" />
        </button>
      </div>

      <!-- Zeichenwerkzeuge: Stift / Textmarker -->
      <div v-if="activeCategory === 'draw'" class="draw-settings">
        <p class="control-hint draw-hint">
          {{ drawTool ? $t('shapes.draw.activeHint') : $t('shapes.draw.hint') }}
        </p>
        <template v-if="drawTool">
          <div class="control-group">
            <label class="mini-label">{{ $t('shapes.draw.color') }}</label>
            <div class="color-picker-row">
              <input
                type="color"
                class="color-input"
                :value="drawStyle.color"
                :aria-label="$t('shapes.draw.color')"
                @input="setDrawSetting({ color: $event.target.value })"
              />
              <input
                type="text"
                class="color-text"
                maxlength="7"
                :value="drawStyle.color"
                :aria-label="$t('shapes.draw.color')"
                @input="setDrawColor($event.target.value)"
              />
            </div>
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

      <!-- Eingefügte Formen -->
      <div v-if="shapes.length" class="shape-list">
        <p class="mini-label">{{ $t('shapes.listTitle') }} ({{ shapes.length }})</p>
        <div
          v-for="shape in reversedShapes"
          :key="shape.id"
          class="shape-item"
          :class="{ selected: shape.id === selectedId }"
          role="button"
          tabindex="0"
          @click="select(shape.id)"
          @keyup.enter="select(shape.id)"
        >
          <span class="shape-item__icon">
            <ShapeIcon :item="galleryItemFor(shape)" :shape="shape" :size="22" />
          </span>
          <span class="shape-item__name">{{
            knownGalleryId(shape) ? $t(`shapes.items.${knownGalleryId(shape)}`) : shape.type
          }}</span>
          <button
            type="button"
            class="icon-btn icon-btn--danger"
            :title="$t('shapes.edit.delete')"
            :aria-label="$t('shapes.edit.delete')"
            @click.stop="remove(shape.id)"
          >
            <AppIcon name="trash" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bearbeiten -->
    <div v-if="selectedShape" class="panel-section shape-edit-section">
      <div class="section-header">
        <h3>
          <AppIcon name="edit" />
          {{ $t('shapes.edit.title') }}
        </h3>
      </div>

      <p class="control-hint shape-hint">{{ $t('shapes.edit.hint') }}</p>

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
          <div class="color-picker-row">
            <input
              type="color"
              class="color-input"
              :value="selectedShape.textColor || '#ffffff'"
              :aria-label="$t('shapes.edit.textColor')"
              @input="update({ textColor: $event.target.value })"
              @change="commit"
            />
            <input
              type="text"
              class="color-text"
              maxlength="7"
              :value="selectedShape.textColor || '#ffffff'"
              :aria-label="$t('shapes.edit.textColor')"
              @input="updateColor('textColor', $event.target.value)"
              @change="commit"
            />
          </div>
        </div>
      </template>

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
            @input="update({ text: $event.target.value })"
            @change="commit"
          />
        </div>
        <div class="control-group">
          <label class="mini-label" for="shape-font">{{ $t('shapes.edit.font') }}</label>
          <select
            id="shape-font"
            class="font-select"
            :value="selectedShape.fontFamily || SHAPE_TEXT_DEFAULTS.fontFamily"
            @change="setFont($event.target.value)"
          >
            <option
              v-for="font in availableFonts"
              :key="font"
              :value="font"
              :style="{ fontFamily: font }"
            >
              {{ font }}
            </option>
          </select>
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
          <div class="color-picker-row">
            <input
              type="color"
              class="color-input"
              :value="selectedShape.textColor || SHAPE_TEXT_DEFAULTS.textColor"
              :aria-label="$t('shapes.edit.textFill')"
              @input="update({ textColor: $event.target.value })"
              @change="commit"
            />
            <input
              type="text"
              class="color-text"
              maxlength="7"
              :value="selectedShape.textColor || SHAPE_TEXT_DEFAULTS.textColor"
              :aria-label="$t('shapes.edit.textFill')"
              @input="updateColor('textColor', $event.target.value)"
              @change="commit"
            />
          </div>
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
          <ToggleSwitch
            id="shape-fill-toggle"
            :model-value="selectedShape.filled !== false"
            @update:model-value="toggleFill"
          />
          <label for="shape-fill-toggle">{{ $t('shapes.edit.fill') }}</label>
        </div>
        <div
          v-if="selectedShape.filled !== false"
          class="color-picker-row"
          :class="{ 'mt-2': isFillKind }"
        >
          <input
            type="color"
            class="color-input"
            :value="selectedShape.fillColor"
            :aria-label="$t('shapes.edit.fillColor')"
            @input="update({ fillColor: $event.target.value })"
            @change="commit"
          />
          <input
            type="text"
            class="color-text"
            maxlength="7"
            :value="selectedShape.fillColor"
            :aria-label="$t('shapes.edit.fillColor')"
            @input="updateColor('fillColor', $event.target.value)"
            @change="commit"
          />
        </div>
      </div>

      <!-- Linie bzw. Umrandung -->
      <div v-if="!isEffect" class="control-group">
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
        <div v-if="hasStroke" class="color-picker-row mt-2">
          <input
            type="color"
            class="color-input"
            :value="selectedShape.strokeColor"
            :aria-label="$t('shapes.edit.strokeColor')"
            @input="update({ strokeColor: $event.target.value })"
            @change="commit"
          />
          <input
            type="text"
            class="color-text"
            maxlength="7"
            :value="selectedShape.strokeColor"
            :aria-label="$t('shapes.edit.strokeColor')"
            @input="updateColor('strokeColor', $event.target.value)"
            @change="commit"
          />
        </div>
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
      <div v-if="isMarker" class="control-group">
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
      <div v-if="!isMarker" class="control-group">
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
      <div v-if="!heightless && !isMarker" class="control-group">
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
          <ToggleSwitch id="shape-lock-ratio" v-model="lockRatio" />
          <label for="shape-lock-ratio">{{ $t('shapes.edit.lockRatio') }}</label>
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
          <input
            type="color"
            class="color-input"
            :value="selectedShape.shadowColor || '#000000'"
            :aria-label="$t('shapes.edit.shadowColor')"
            @input="update({ shadowColor: $event.target.value })"
            @change="commit"
          />
          <input
            type="text"
            class="color-text"
            maxlength="7"
            :value="selectedShape.shadowColor || '#000000'"
            :aria-label="$t('shapes.edit.shadowColor')"
            @input="updateColor('shadowColor', $event.target.value)"
            @change="commit"
          />
        </div>
      </div>

      <!-- Ebene & Aktionen -->
      <div class="action-grid">
        <button
          type="button"
          class="transform-btn"
          :disabled="isTop"
          :title="$t('shapes.edit.bringForward')"
          @click="reorder('up')"
        >
          <AppIcon name="arrow-up" />
          <span>{{ $t('shapes.edit.bringForward') }}</span>
        </button>
        <button
          type="button"
          class="transform-btn"
          :disabled="isBottom"
          :title="$t('shapes.edit.sendBackward')"
          @click="reorder('down')"
        >
          <AppIcon name="arrow-down" />
          <span>{{ $t('shapes.edit.sendBackward') }}</span>
        </button>
      </div>
      <button type="button" class="transform-btn" @click="duplicate">
        <AppIcon name="copy" />
        <span>{{ $t('shapes.edit.duplicate') }}</span>
      </button>
      <button type="button" class="transform-btn delete-btn" @click="remove(selectedShape.id)">
        <AppIcon name="trash" />
        <span>{{ $t('shapes.edit.delete') }}</span>
      </button>
      <button type="button" class="transform-btn" @click="select(null)">
        <AppIcon name="times" />
        <span>{{ $t('shapes.edit.deselect') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * ShapesPanel – Galerie „Formen & Symbole“ plus Bearbeitung der ausgewählten
 * Form. Arbeitet direkt auf dem imageStore (shapes, selectedShapeId); der
 * Editor zeichnet bei jeder Änderung neu (Watcher in EditorView). Ein
 * Historien-Eintrag pro abgeschlossener Änderung (commit).
 *
 * Wird im Einzelbild-Modus (TransformPanel) und im Ebenen-Modus
 * (LayerControlPanel, Reiter „Formen“) verwendet.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { availableFonts } from '@/assets/fonts/fontList.js';
import { useImageStore } from '@/stores/imageStore';
import AppIcon from '@/components/ui/AppIcon.vue';
import SliderField from '@/components/ui/SliderField.vue';
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';
import ShapeIcon from './ShapeIcon.vue';
import {
  CENSOR_EFFECTS,
  CENSOR_REGIONS,
  DASH_STYLES,
  MARKER_MAX,
  MARKER_STYLES,
  SHAPE_CATEGORIES,
  SHAPE_GALLERY,
  SHAPE_KIND,
  SHAPE_LIMITS,
  SHAPE_TEXT_DEFAULTS,
  TEXT_ALIGNS,
  TEXT_SCALE_LIMITS,
  getDefaultDrawWidth,
  getShapeFontSize,
  getShapeKind,
  isDrawToolItem,
  isHeightless,
  supportsShapeText,
} from '@/utils/shapes';

const props = defineProps({
  /** Canvas-Größe in px (Startgröße/-position neuer Formen, Reglerbereiche) */
  canvasWidth: { type: Number, default: 0 },
  canvasHeight: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
});

const imageStore = useImageStore();

const activeCategory = ref(SHAPE_CATEGORIES[0]);
const lockRatio = ref(false);

const galleryItems = computed(() =>
  SHAPE_GALLERY.filter((item) => item.category === activeCategory.value)
);

const shapes = computed(() => imageStore.shapes || []);
// Oberste Form zuerst (wie in Ebenen-Listen üblich)
const reversedShapes = computed(() => [...shapes.value].reverse());
const selectedId = computed(() => imageStore.selectedShapeId);
const selectedShape = computed(() => imageStore.selectedShape);

const selectedKind = computed(() => getShapeKind(selectedShape.value?.type));
const isFillKind = computed(() => selectedKind.value === SHAPE_KIND.FILL);
const isStrokeKind = computed(() => selectedKind.value === SHAPE_KIND.STROKE);
const isMarker = computed(() => selectedKind.value === SHAPE_KIND.MARKER);
const isEffect = computed(() => selectedKind.value === SHAPE_KIND.EFFECT);
const heightless = computed(() => isHeightless(selectedShape.value?.type));
const hasStroke = computed(() => (selectedShape.value?.strokeWidth || 0) > 0);
const shapeIndex = computed(() => shapes.value.findIndex((s) => s.id === selectedId.value));
const hasTextBox = computed(() => supportsShapeText(selectedShape.value?.type));
const isTop = computed(() => shapeIndex.value === shapes.value.length - 1);

// ===== Text in Formen =====
const minSide = computed(() =>
  Math.max(1, Math.min(selectedShape.value?.width || 1, selectedShape.value?.height || 1))
);
const fontSizePx = computed(() =>
  selectedShape.value ? Math.round(getShapeFontSize(selectedShape.value)) : 0
);
const fontSizeMax = computed(() =>
  Math.max(8, Math.round(minSide.value * TEXT_SCALE_LIMITS.max), fontSizePx.value)
);

/** Schriftgröße in px → textScale (Anteil an der Form, damit sie mitskaliert) */
function setFontSize(px) {
  const scale = Number(px) / minSide.value;
  update({
    textScale:
      Math.round(Math.max(TEXT_SCALE_LIMITS.min, Math.min(TEXT_SCALE_LIMITS.max, scale)) * 10000) /
      10000,
  });
}

function setFont(fontFamily) {
  setAndCommit({ fontFamily });
  // Schrift laden; EditorView zeichnet nach 'loadingdone' neu
  document.fonts?.load?.(`32px "${fontFamily}"`).catch(() => {});
}

// ===== Zeichenwerkzeuge =====
const drawTool = computed(() => imageStore.drawTool ?? null);
const drawStyle = computed(
  () => imageStore.drawSettings?.[drawTool.value] ?? { color: '#000000', opacity: 100 }
);
const drawWidth = computed(() => {
  const { width, height } = canvasSize();
  return drawStyle.value.width ?? getDefaultDrawWidth(drawTool.value, width, height);
});

function setDrawTool(tool) {
  imageStore.setDrawTool?.(tool);
}

function setDrawSetting(patch) {
  if (drawTool.value) imageStore.updateDrawSettings?.(drawTool.value, patch);
}

function setDrawColor(value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) setDrawSetting({ color: value });
}

function onTileClick(item) {
  if (isDrawToolItem(item)) {
    if (props.disabled) return;
    setDrawTool(drawTool.value === item.tool ? null : item.tool);
    return;
  }
  setDrawTool(null);
  addShape(item.id);
}

// Zeichenmodus endet beim Verlassen des Reiters „Zeichnen“
watch(activeCategory, (category) => {
  if (category !== 'draw' && drawTool.value) setDrawTool(null);
});
// Wird der Modus von außen beendet/gestartet (Esc), Reiter passend halten
watch(drawTool, (tool) => {
  if (tool) activeCategory.value = 'draw';
});
onBeforeUnmount(() => {
  if (drawTool.value) setDrawTool(null);
});
const isBottom = computed(() => shapeIndex.value <= 0);

function canvasSize() {
  return {
    width: props.canvasWidth || imageStore.canvas?.width || 0,
    height: props.canvasHeight || imageStore.canvas?.height || 0,
  };
}

// Reglerbereich = Canvas; liegt die Form außerhalb, wird er erweitert
const rangeX = computed(() => {
  const x = Math.round(selectedShape.value?.x || 0);
  return { min: Math.min(0, x), max: Math.max(1, canvasSize().width, x) };
});
const rangeY = computed(() => {
  const y = Math.round(selectedShape.value?.y || 0);
  return { min: Math.min(0, y), max: Math.max(1, canvasSize().height, y) };
});

function sizeMax(current) {
  const { width, height } = canvasSize();
  return Math.max(SHAPE_LIMITS.minSize + 1, Math.round(Math.max(width, height) * 2), current);
}

function galleryItemFor(shape) {
  return (
    SHAPE_GALLERY.find((g) => g.id === shape.galleryId) ?? {
      id: shape.type,
      type: shape.type,
      aspect: shape.width / Math.max(1, shape.height),
    }
  );
}

/** Galerie-id der Form, falls bekannt (für den Listennamen) */
function knownGalleryId(shape) {
  return SHAPE_GALLERY.some((g) => g.id === shape.galleryId) ? shape.galleryId : null;
}

function commit() {
  imageStore.saveState('Form bearbeitet');
}

function update(patch) {
  if (!selectedShape.value) return;
  imageStore.updateShape(selectedShape.value.id, patch);
}

function setAndCommit(patch) {
  update(patch);
  commit();
}

function updateColor(key, value) {
  if (/^#[0-9a-f]{6}$/i.test(value)) update({ [key]: value });
}

function toggleFill(filled) {
  const shape = selectedShape.value;
  if (!shape) return;
  // Ohne Füllung muss eine Kontur sichtbar bleiben, sonst verschwindet die Form
  const patch = { filled };
  if (!filled && !(shape.strokeWidth > 0)) {
    patch.strokeWidth = Math.max(2, Math.round(Math.min(shape.width, shape.height) * 0.05));
  }
  setAndCommit(patch);
}

function setWidth(width) {
  const shape = selectedShape.value;
  if (!shape) return;
  const patch = { width };
  if (lockRatio.value && !heightless.value && shape.width > 0) {
    patch.height = Math.max(SHAPE_LIMITS.minSize, Math.round(width * (shape.height / shape.width)));
  }
  update(patch);
}

function setHeight(height) {
  const shape = selectedShape.value;
  if (!shape) return;
  const patch = { height };
  if (lockRatio.value && shape.height > 0) {
    patch.width = Math.max(SHAPE_LIMITS.minSize, Math.round(height * (shape.width / shape.height)));
  }
  update(patch);
}

function addShape(galleryId) {
  if (props.disabled) return;
  const { width, height } = canvasSize();
  if (imageStore.addShape(galleryId, width, height)) commit();
}

function select(id) {
  if (id !== null && drawTool.value) setDrawTool(null);
  imageStore.selectShape(id);
}

function remove(id) {
  if (imageStore.deleteShape(id)) commit();
}

function duplicate() {
  if (selectedShape.value && imageStore.duplicateShape(selectedShape.value.id)) commit();
}

function reorder(direction) {
  if (selectedShape.value && imageStore.moveShapeOrder(selectedShape.value.id, direction)) {
    commit();
  }
}
</script>

<style scoped lang="scss">
@import '../transform/shared';

// Reiter/Umschalter im UiSegmentedControl-Look
.segmented {
  display: flex;
  gap: 2px;
  padding: 2px;
  min-height: var(--ds-control-md);
  box-sizing: border-box;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-0);

  &.mt-2 {
    margin-top: var(--ds-space-2);
  }
}

// Kategorien: bei Platzmangel in zwei Zeilen (3 + 2) statt abgeschnitten
.segmented--wrap {
  flex-wrap: wrap;

  .segmented__option {
    flex: 1 1 30%;
    min-height: calc(var(--ds-control-md) - 6px);
  }
}

.segmented__option {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-1);
  padding: 0 var(--ds-space-2);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  font: inherit;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-surface-1);
    border-color: var(--ds-border-strong);
    color: var(--ds-text);
  }
}

// Galerie-Kacheln (SelectionTile)
.shape-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}

.shape-tile {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover:not(:disabled) {
    background: var(--ds-surface-3);
    border-color: var(--ds-accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

// Liste der eingefügten Formen (wie die Textliste)
.shape-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-4);

  .mini-label {
    margin-bottom: 0;
  }
}

.shape-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-1) var(--ds-space-2) var(--ds-space-1) var(--ds-space-3);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.selected {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
  }
}

.shape-item__icon {
  display: flex;
  color: var(--ds-text-2);
}

.shape-item__name {
  flex: 1;
  min-width: 0;
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// UiIconButton sm (ghost)
.icon-btn {
  flex-shrink: 0;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text-2);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-1);
  }

  &--danger:hover {
    color: var(--ds-danger);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.shape-hint {
  margin: 0 0 var(--ds-space-4);
}

.shape-tile.active {
  background: var(--ds-accent-soft);
  border-color: var(--ds-accent);
  color: var(--ds-accent);
}

.draw-settings {
  margin-top: var(--ds-space-3);
}

.draw-hint {
  margin: 0 0 var(--ds-space-3);
}

.draw-done-btn {
  width: 100%;
}

.shape-text-input {
  width: 100%;
  min-height: 64px;
  resize: vertical;
}

.font-select {
  width: 100%;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);

  &.mt-2 {
    margin-top: var(--ds-space-2);
  }

  label {
    margin: 0;
    font-size: var(--ds-text-sm);
    color: var(--ds-text);
    cursor: pointer;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--ds-space-2);

  .transform-btn {
    min-width: 0;
    gap: var(--ds-space-1);
    padding: 0 var(--ds-space-1);
    font-size: var(--ds-text-sm);
  }
}

// Destruktiv = UiButton danger
.transform-btn.delete-btn {
  background: transparent;
  border-color: transparent;
  color: var(--ds-danger);

  &:hover:not(:disabled) {
    background: var(--ds-surface-2);
  }
}
</style>
