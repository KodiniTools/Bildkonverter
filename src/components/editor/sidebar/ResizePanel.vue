<template>
  <div class="sidebar-section">
    <h3>{{ $t('editor.sidebar.resize') }}</h3>
    <div class="resize-controls">
      <!-- Social Media Presets -->
      <div class="resize-presets">
        <label>{{ $t('editor.resize.presets', 'Presets') }}</label>
        <select
          class="form-select form-select-sm"
          :disabled="disabled"
          @change="
            $emit('apply-preset', $event.target.value);
            $event.target.value = '';
          "
        >
          <option value="">
            {{ $t('editor.resize.selectPreset', 'Preset wählen...') }}
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
          @change="
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
          @change="
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
defineProps({
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
});

defineEmits([
  'update:resizeWidth',
  'update:resizeHeight',
  'update:maintainAspectRatio',
  'dimension-change',
  'apply-preset',
  'apply-resize',
]);
</script>
