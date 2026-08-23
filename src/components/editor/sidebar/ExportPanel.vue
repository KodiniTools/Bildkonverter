<template>
  <div class="sidebar-section">
    <h3>{{ $t('editor.sidebar.format') }}</h3>

    <select
      :value="outputFormat"
      class="form-select"
      @change="$emit('update:outputFormat', $event.target.value)"
    >
      <option v-for="format in formats" :key="format" :value="format">
        {{ format.toUpperCase() }}
      </option>
    </select>

    <div v-if="currentFormatInfo" class="format-info">
      <p class="format-description">{{ $t(`editor.formats.${outputFormat}.description`) }}</p>
      <span class="format-badge">{{ $t(`editor.formats.${outputFormat}.recommended`) }}</span>
      <span
        v-if="requiresBackend"
        class="backend-badge"
        :title="$t('editor.format.backendRequired', 'Benötigt Backend-API')"
      >
        🌐 {{ $t('editor.format.backendBadge', 'Backend') }}
      </span>
    </div>

    <FilterSlider
      v-if="supportsQuality"
      :model-value="exportQuality"
      :label="$t('editor.export.quality', 'Qualität')"
      :min="1"
      :max="100"
      :default-value="92"
      unit="%"
      @update:model-value="$emit('update:exportQuality', $event)"
    />

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
import FilterSlider from './FilterSlider.vue';

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
</script>
