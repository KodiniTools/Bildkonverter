<template>
  <div class="sidebar-section" :class="{ 'sidebar-section--hero': variant === 'hero' }">
    <h3>{{ $t('editor.sidebar.resize') }}</h3>
    <div class="resize-controls">
      <!-- Social Media Presets -->
      <div class="resize-presets">
        <UiSelect
          ref="presetSelect"
          :label="$t('editor.resize.presets', 'Presets')"
          :options="presetOptions($t)"
          :disabled="disabled"
          :model-value="selectedPreset"
          @update:model-value="onPresetChange"
        />
      </div>
      <div class="resize-input resize-mode">
        <UiSelect
          id="resize-mode-select"
          :label="$t('editor.resize.mode')"
          :options="modeOptions($t)"
          :disabled="disabled"
          :model-value="spec.mode"
          @update:model-value="updateSpec('mode', $event)"
        />
      </div>

      <template v-if="spec.mode === 'percent'">
        <div class="resize-input">
          <label for="resize-percent">{{ $t('editor.resize.percent') }}</label>
          <input
            id="resize-percent"
            :value="spec.percent"
            type="number"
            :min="RESIZE_PERCENT_MIN"
            :max="RESIZE_PERCENT_MAX"
            :disabled="disabled"
            @input="updateSpec('percent', Number($event.target.value))"
          />
        </div>
      </template>

      <template v-else-if="spec.mode === 'longEdge'">
        <div class="resize-input">
          <label for="resize-long-edge">{{ $t('editor.resize.longEdge') }}</label>
          <input
            id="resize-long-edge"
            :value="spec.longEdge"
            type="number"
            min="1"
            :max="RESIZE_PX_MAX"
            :disabled="disabled"
            @input="updateSpec('longEdge', Number($event.target.value))"
          />
        </div>
      </template>

      <template v-else-if="spec.mode === 'fit'">
        <div class="resize-input">
          <label for="resize-fit-width">{{ $t('editor.resize.maxWidth') }}</label>
          <input
            id="resize-fit-width"
            :value="spec.fitWidth"
            type="number"
            min="1"
            :max="RESIZE_PX_MAX"
            :disabled="disabled"
            @input="updateSpec('fitWidth', Number($event.target.value))"
          />
        </div>
        <div class="resize-input">
          <label for="resize-fit-height">{{ $t('editor.resize.maxHeight') }}</label>
          <input
            id="resize-fit-height"
            :value="spec.fitHeight"
            type="number"
            min="1"
            :max="RESIZE_PX_MAX"
            :disabled="disabled"
            @input="updateSpec('fitHeight', Number($event.target.value))"
          />
        </div>
      </template>

      <UiSwitch
        v-if="spec.mode === 'longEdge' || spec.mode === 'fit'"
        class="resize-switch"
        :model-value="spec.noUpscale"
        :label="$t('editor.resize.noUpscale')"
        :disabled="disabled"
        @update:model-value="updateSpec('noUpscale', $event)"
      />

      <p v-if="spec.mode !== 'exact' && baseWidth && baseHeight" class="resize-result">
        {{
          isChanged
            ? $t('editor.resize.result', {
                from: `${baseWidth} × ${baseHeight}`,
                to: `${resizeWidth} × ${resizeHeight}`,
              })
            : $t('editor.resize.resultUnchanged', { size: `${baseWidth} × ${baseHeight}` })
        }}
      </p>

      <div v-if="spec.mode === 'exact'" class="resize-input">
        <label>{{ $t('editor.resize.width') }}</label>
        <input
          :value="resizeWidth"
          type="number"
          :disabled="disabled"
          @input="
            $emit('update:resizeWidth', Number($event.target.value));
            $emit('dimension-change', 'width');
          "
        />
      </div>
      <div v-if="spec.mode === 'exact'" class="resize-input">
        <label>{{ $t('editor.resize.height') }}</label>
        <input
          :value="resizeHeight"
          type="number"
          :disabled="disabled"
          @input="
            $emit('update:resizeHeight', Number($event.target.value));
            $emit('dimension-change', 'height');
          "
        />
      </div>
      <UiSwitch
        v-if="spec.mode === 'exact'"
        class="resize-switch"
        :model-value="maintainAspectRatio"
        :label="$t('editor.resize.maintainAspect')"
        @update:model-value="$emit('update:maintainAspectRatio', $event)"
      />
      <button class="btn btn-secondary" :disabled="disabled" @click="$emit('apply-resize')">
        {{ $t('editor.resize.apply') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import {
  RESIZE_MODES,
  RESIZE_PERCENT_MAX,
  RESIZE_PERCENT_MIN,
  RESIZE_PX_MAX,
  defaultResizeSpec,
} from '@/utils/resizeModes';

const props = defineProps({
  resizeWidth: {
    type: Number,
    default: null,
  },
  resizeHeight: {
    type: Number,
    default: null,
  },
  maintainAspectRatio: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  // Aktiv gewähltes Preset ('' = keines). Wird vom Parent gesteuert, damit die
  // Auswahl sichtbar bleibt und bei manuellen Änderungen wieder verfällt.
  selectedPreset: {
    type: String,
    default: '',
  },
  // Originalgröße des geladenen Bildes – nur für die Beschriftung der
  // "Ohne Preset"-Option.
  naturalWidth: {
    type: Number,
    default: 0,
  },
  naturalHeight: {
    type: Number,
    default: 0,
  },
  // Resize-Modus und seine Eingaben (siehe utils/resizeModes.ts). Ohne Angabe
  // bleibt es beim Modus "Exakt" (nur Breite/Höhe).
  resizeSpec: {
    type: Object,
    default: null,
  },
  // Aktuelle Bildgröße, Bezug der relativen Modi (für die Ergebniszeile)
  baseWidth: {
    type: Number,
    default: 0,
  },
  baseHeight: {
    type: Number,
    default: 0,
  },
  // 'sidebar' (Standard) oder 'hero' für die horizontale Leiste oben
  variant: {
    type: String,
    default: 'sidebar',
  },
});

const emit = defineEmits([
  'update:resizeWidth',
  'update:resizeHeight',
  'update:maintainAspectRatio',
  'update:resizeSpec',
  'dimension-change',
  'apply-preset',
  'apply-resize',
]);

const presetSelect = ref(null);

const SOCIAL_PRESET_OPTIONS = [
  { value: 'instagram', label: 'Instagram Post (1080×1080)' },
  { value: 'instagramStory', label: 'Instagram Story (1080×1920)' },
  { value: 'facebook', label: 'Facebook Post (1200×630)' },
  { value: 'twitter', label: 'Twitter Post (1200×675)' },
  { value: 'youtube', label: 'YouTube Thumbnail (1280×720)' },
  { value: 'hd', label: 'Full HD (1920×1080)' },
  { value: '4k', label: '4K UHD (3840×2160)' },
];

const spec = computed(() => props.resizeSpec ?? defaultResizeSpec);

const isChanged = computed(
  () => props.resizeWidth !== props.baseWidth || props.resizeHeight !== props.baseHeight
);

function updateSpec(key, value) {
  emit('update:resizeSpec', { ...spec.value, [key]: value });
}

const naturalSizeLabel = computed(() => {
  if (!props.naturalWidth || !props.naturalHeight) return '';
  return ` (${props.naturalWidth} × ${props.naturalHeight})`;
});

// Optionen bekommen die Übersetzungsfunktion aus dem Template ($t) als t, damit das
// Panel weiterhin ohne eigenes useI18n auskommt.
function presetOptions(t) {
  return [
    { value: '', label: t('editor.resize.selectPreset', 'Preset wählen...') },
    {
      value: 'none',
      label: `↺ ${t('editor.resize.noPreset', 'Ohne Preset – Originalgröße')}${naturalSizeLabel.value}`,
    },
    ...SOCIAL_PRESET_OPTIONS,
  ];
}

function modeOptions(t) {
  return RESIZE_MODES.map((mode) => ({
    value: mode,
    label: t(`editor.resize.modes.${mode}`),
  }));
}

/**
 * Meldet die Auswahl an den Parent und gleicht die Anzeige anschließend wieder
 * mit dessen State ab.
 *
 * Der DOM-Wert wird bewusst direkt gesetzt: "Ohne Preset" ist ein Befehl und
 * kein Zustand, der Parent bleibt dabei auf ''. Ohne Prop-Änderung patcht Vue
 * das :value-Binding nicht erneut – die Auswahl bliebe sonst sichtbar hängen.
 */
function onPresetChange(value) {
  emit('apply-preset', value);

  nextTick(() => {
    const select = presetSelect.value?.$el?.querySelector('select');
    if (select) {
      select.value = props.selectedPreset;
    }
  });
}
</script>
