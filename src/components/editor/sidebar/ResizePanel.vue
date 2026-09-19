<template>
  <div class="sidebar-section" :class="{ 'sidebar-section--hero': variant === 'hero' }">
    <h3>{{ $t('editor.sidebar.resize') }}</h3>
    <div class="resize-controls">
      <!-- Social Media Presets -->
      <div class="resize-presets">
        <label>{{ $t('editor.resize.presets', 'Presets') }}</label>
        <select
          ref="presetSelect"
          class="form-select form-select-sm"
          :disabled="disabled"
          :value="selectedPreset"
          @change="onPresetChange"
        >
          <option value="">
            {{ $t('editor.resize.selectPreset', 'Preset wählen...') }}
          </option>
          <option value="none">
            ↺ {{ $t('editor.resize.noPreset', 'Ohne Preset – Originalgröße')
            }}{{ naturalSizeLabel }}
          </option>
          <option value="instagram">📷 Instagram Post (1080×1080)</option>
          <option value="instagramStory">📱 Instagram Story (1080×1920)</option>
          <option value="facebook">👤 Facebook Post (1200×630)</option>
          <option value="twitter">🐦 Twitter Post (1200×675)</option>
          <option value="youtube">▶️ YouTube Thumbnail (1280×720)</option>
          <option value="hd">🖥️ Full HD (1920×1080)</option>
          <option value="4k">📺 4K UHD (3840×2160)</option>
        </select>
      </div>
      <div class="resize-input">
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
      <div class="resize-input">
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
      <label class="checkbox-label">
        <input
          :checked="maintainAspectRatio"
          type="checkbox"
          @change="$emit('update:maintainAspectRatio', $event.target.checked)"
        />
        {{ $t('editor.resize.maintainAspect') }}
      </label>
      <button class="btn btn-primary" :disabled="disabled" @click="$emit('apply-resize')">
        {{ $t('editor.resize.apply') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';

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
  'dimension-change',
  'apply-preset',
  'apply-resize',
]);

const presetSelect = ref(null);

const naturalSizeLabel = computed(() => {
  if (!props.naturalWidth || !props.naturalHeight) return '';
  return ` (${props.naturalWidth} × ${props.naturalHeight})`;
});

/**
 * Meldet die Auswahl an den Parent und gleicht die Anzeige anschließend wieder
 * mit dessen State ab.
 *
 * Der DOM-Wert wird bewusst direkt gesetzt: "Ohne Preset" ist ein Befehl und
 * kein Zustand, der Parent bleibt dabei auf ''. Ohne Prop-Änderung patcht Vue
 * das :value-Binding nicht erneut – die Auswahl bliebe sonst sichtbar hängen.
 */
function onPresetChange(event) {
  emit('apply-preset', event.target.value);

  nextTick(() => {
    if (presetSelect.value) {
      presetSelect.value.value = props.selectedPreset;
    }
  });
}
</script>
