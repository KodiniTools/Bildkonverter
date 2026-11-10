<template>
  <div class="sidebar-section" :class="{ 'disabled-section': disabled }">
    <h3>{{ $t('editor.sidebar.detach', 'Vom Hintergrund lösen') }}</h3>

    <div class="detach-toggle-row">
      <UiSwitch
        id="detach-toggle"
        :model-value="detached"
        :disabled="disabled"
        :label="
          detached
            ? $t('editor.detach.on', 'Als freie Ebene aktiv')
            : $t('editor.detach.off', 'Bild vom Hintergrund lösen')
        "
        @update:model-value="$emit('toggle')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import UiSwitch from '@/components/ui/UiSwitch.vue';

defineProps({
  detached: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle']);
</script>

<style scoped lang="scss">
.detach-toggle-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
}
</style>
