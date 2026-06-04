<template>
  <div class="sidebar-section collapsible" :class="{ collapsed: !sectionsOpen.effects }">
    <h3 class="section-header" @click="sectionsOpen.effects = !sectionsOpen.effects">
      <i class="fas fa-magic section-icon"></i>
      {{ $t('editor.sidebar.effects', 'Effekte') }}
      <i
        :class="sectionsOpen.effects ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="toggle-icon"
      ></i>
    </h3>

    <div v-show="sectionsOpen.effects" class="section-content">
      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.blur') }}</span>
          <span class="filter-value">{{ filters.blur }}px</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.blur"
            type="range"
            min="0"
            max="20"
            step="0.5"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.vignette', 'Vignette') }}</span>
          <span class="filter-value">{{ filters.vignette }}%</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.vignette"
            type="range"
            min="0"
            max="100"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.grayscale', 'Graustufen') }}</span>
          <span class="filter-value">{{ filters.grayscale }}%</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.grayscale"
            type="range"
            min="0"
            max="100"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>

      <div class="filter-control">
        <label>
          <span class="filter-label">{{ $t('editor.filters.invert', 'Invertieren') }}</span>
          <span class="filter-value">{{ filters.invert }}%</span>
        </label>
        <div class="slider-track">
          <input
            v-model.number="filters.invert"
            type="range"
            min="0"
            max="100"
            class="modern-slider"
            :disabled="disabled"
            @input="$emit('render')"
            @change="$emit('save-history')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filters: {
    type: Object,
    required: true,
  },
  sectionsOpen: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['render', 'save-history']);
</script>
