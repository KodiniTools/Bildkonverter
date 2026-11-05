<template>
  <!-- Text-Umrandung (Stroke) -->
  <div class="control-group">
    <SliderField
      :model-value="selectedText.strokeWidth || 0"
      :min="0"
      :max="50"
      unit="px"
      :default-value="0"
      :label="$t('textPanel.strokeWidth', 'Umrandung')"
      icon="fas fa-border-style"
      @update:model-value="$emit('update:text-stroke-width', $event)"
      @commit="$emit('save-text-history')"
    />
    <div v-if="(selectedText.strokeWidth || 0) > 0" class="color-picker-row mt-2">
      <ColorField
        :model-value="selectedText.strokeColor || '#000000'"
        :label="$t('layerPanel.text.strokeColor')"
        class="color-input"
        @update:model-value="$emit('update:text-stroke-color', $event)"
        @change="$emit('save-text-history')"
      />
      <input
        type="text"
        :value="selectedText.strokeColor || '#000000'"
        class="color-text"
        maxlength="7"
        @input="$emit('update:text-stroke-color', ($event.target as HTMLInputElement).value)"
        @change="$emit('save-text-history')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ColorField from '@/components/ui/ColorField.vue';
import SliderField from '@/components/ui/SliderField.vue';
import type { EditorText } from '@/composables/text/types';

defineProps<{
  selectedText: EditorText;
}>();

defineEmits<{
  'update:text-stroke-width': [value: number];
  'update:text-stroke-color': [value: string];
  'save-text-history': [];
}>();
</script>

<style scoped lang="scss">
@import './shared';
</style>
