<template>
  <div class="sidebar-section">
    <h3>{{ $t('editor.sidebar.format') }}</h3>

    <select
      :value="outputFormat"
      class="form-select"
      @change="$emit('update:outputFormat', $event.target.value)"
    >
      <option v-for="format in formats" :key="format" :value="format">
        {{ formatInfo[format]?.icon }} {{ format.toUpperCase() }}
      </option>
    </select>

    <div v-if="currentFormatInfo" class="format-info">
      <p class="format-description">{{ currentFormatInfo.description }}</p>
      <span class="format-badge">{{ currentFormatInfo.recommended }}</span>
      <span v-if="requiresBackend" class="backend-badge" :title="'Benötigt Backend-API'">
        🌐 Backend
      </span>
    </div>

    <div v-if="supportsQuality" class="filter-control">
      <label>
        <span class="filter-label">{{ $t('editor.export.quality', 'Qualität') }}</span>
        <span class="filter-value">{{ exportQuality }}%</span>
      </label>
      <div class="slider-row">
        <div class="slider-track">
          <input
            :value="exportQuality"
            type="range"
            min="1"
            max="100"
            class="modern-slider"
            :style="sliderStyle(exportQuality, 1, 100)"
            @input="$emit('update:exportQuality', Number($event.target.value))"
          />
        </div>
        <button
          v-if="exportQuality !== 92"
          class="reset-btn"
          title="Zurücksetzen"
          @click="$emit('update:exportQuality', 92)"
        >
          <i class="fas fa-undo-alt"></i>
        </button>
      </div>
    </div>

    <div v-if="outputFormat === 'png'" class="filter-control checkbox-control">
      <label class="checkbox-label">
        <input
          :checked="exportTransparent"
          type="checkbox"
          @change="$emit('update:exportTransparent', $event.target.checked)"
        />
        <span>{{ $t('editor.export.transparentBackground', 'Transparenter Hintergrund') }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
defineProps({
  outputFormat: { type: String, required: true },
  formats: { type: Array, required: true },
  formatInfo: { type: Object, required: true },
  currentFormatInfo: { type: Object, default: null },
  supportsQuality: { type: Boolean, default: false },
  requiresBackend: { type: Boolean, default: false },
  exportQuality: { type: Number, default: 92 },
  exportTransparent: { type: Boolean, default: false },
});

defineEmits(['update:outputFormat', 'update:exportQuality', 'update:exportTransparent']);

function sliderStyle(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    backgroundImage: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
  };
}
</script>
