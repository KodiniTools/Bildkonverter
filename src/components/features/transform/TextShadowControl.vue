<template>
  <!-- Text-Schatten -->
  <div class="control-group">
    <SliderField
      :model-value="selectedText.shadowBlur || 0"
      :min="0"
      :max="20"
      unit="px"
      :default-value="0"
      :label="$t('textPanel.shadow', 'Schatten')"
      icon="fas fa-clone"
      @update:model-value="$emit('update:text-shadow-blur', $event)"
      @commit="$emit('save-text-history')"
    />
    <div v-if="(selectedText.shadowBlur || 0) > 0" class="shadow-controls">
      <div class="shadow-offset-row">
        <div class="mini-control">
          <label>X</label>
          <NumberSpinner
            :model-value="selectedText.shadowOffsetX ?? 2"
            :min="-50"
            :max="50"
            unit="px"
            :label="$t('transform.shadow.offsetX')"
            @update:model-value="$emit('update:text-shadow-offset-x', $event)"
            @commit="$emit('save-text-history')"
          />
        </div>
        <div class="mini-control">
          <label>Y</label>
          <NumberSpinner
            :model-value="selectedText.shadowOffsetY ?? 2"
            :min="-50"
            :max="50"
            unit="px"
            :label="$t('transform.shadow.offsetY')"
            @update:model-value="$emit('update:text-shadow-offset-y', $event)"
            @commit="$emit('save-text-history')"
          />
        </div>
      </div>
      <div class="color-picker-row mt-2">
        <ColorField
          :model-value="selectedText.shadowColor || '#000000'"
          :label="$t('layerPanel.text.shadowColor')"
          class="color-input"
          @update:model-value="$emit('update:text-shadow-color', $event)"
          @change="$emit('save-text-history')"
        />
        <input
          type="text"
          :value="selectedText.shadowColor || '#000000'"
          class="color-text"
          maxlength="7"
          @input="$emit('update:text-shadow-color', ($event.target as HTMLInputElement).value)"
          @change="$emit('save-text-history')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColorField from '@/components/ui/ColorField.vue';
import NumberSpinner from '@/components/ui/NumberSpinner.vue';
import SliderField from '@/components/ui/SliderField.vue';
import type { EditorText } from '@/composables/text/types';

defineProps<{
  selectedText: EditorText;
}>();

defineEmits<{
  'update:text-shadow-blur': [value: number];
  'update:text-shadow-offset-x': [value: number];
  'update:text-shadow-offset-y': [value: number];
  'update:text-shadow-color': [value: string];
  'save-text-history': [];
}>();
</script>

<style scoped lang="scss">
@use './shared' as *;

.shadow-controls {
  margin-top: var(--ds-space-2);
}

.shadow-offset-row {
  display: flex;
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-2);
}

.mini-control {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);

  label {
    margin-bottom: 0;
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text-2);
    min-width: 12px;
  }
}
</style>
