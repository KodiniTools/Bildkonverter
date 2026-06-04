<template>
  <div class="sidebar-section">
    <h3>{{ $t('editor.sidebar.format') }}</h3>

    <!-- Format Dropdown -->
    <select :value="outputFormat" class="form-select" @change="$emit('update:outputFormat', $event.target.value)">
      <option v-for="format in formats" :key="format" :value="format">
        {{ formatInfo[format]?.icon }} {{ format.toUpperCase() }}
      </option>
    </select>

    <!-- Format Info -->
    <div v-if="currentFormatInfo" class="format-info">
      <p class="format-description">
        {{ currentFormatInfo.description }}
      </p>
      <span class="format-badge">
        {{ currentFormatInfo.recommended }}
      </span>
      <span v-if="requiresBackend" class="backend-badge" :title="'Benötigt Backend-API'">
        🌐 Backend
      </span>
    </div>

    <!-- Quality Slider (nur für Formate mit Quality-Support) -->
    <div v-if="supportsQuality" class="filter-control">
      <label>{{ $t('editor.export.quality', 'Qualität') }}</label>
      <input
        :value="exportQuality"
        type="range"
        min="1"
        max="100"
        @input="$emit('update:exportQuality', Number($event.target.value))"
      />
      <span>{{ exportQuality }}%</span>
    </div>

    <!-- Transparenter Hintergrund (für PNG) -->
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
  outputFormat: {
    type: String,
    required: true,
  },
  formats: {
    type: Array,
    required: true,
  },
  formatInfo: {
    type: Object,
    required: true,
  },
  currentFormatInfo: {
    type: Object,
    default: null,
  },
  supportsQuality: {
    type: Boolean,
    default: false,
  },
  requiresBackend: {
    type: Boolean,
    default: false,
  },
  exportQuality: {
    type: Number,
    default: 92,
  },
  exportTransparent: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['update:outputFormat', 'update:exportQuality', 'update:exportTransparent']);
</script>
