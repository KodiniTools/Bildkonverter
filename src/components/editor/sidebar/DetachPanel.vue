<template>
  <div class="sidebar-section" :class="{ 'disabled-section': disabled }">
    <h3>{{ $t('editor.sidebar.detach', 'Vom Hintergrund lösen') }}</h3>

    <div class="detach-toggle-row">
      <ToggleSwitch
        id="detach-toggle"
        :model-value="detached"
        :disabled="disabled"
        @update:model-value="$emit('toggle')"
      />
      <label for="detach-toggle" class="detach-toggle-label">
        {{
          detached
            ? $t('editor.detach.on', 'Als freie Ebene aktiv')
            : $t('editor.detach.off', 'Bild vom Hintergrund lösen')
        }}
      </label>
    </div>

    <p class="hint-text">
      <i class="fas fa-info-circle"></i>
      <template v-if="disabled">
        {{ $t('editor.detach.hintDisabled', 'Bild laden um es vom Hintergrund zu lösen') }}
      </template>
      <template v-else-if="detached">
        {{
          $t(
            'editor.detach.hintActive',
            'Das Bild ist jetzt eine frei verschieb-, skalier- und drehbare Ebene.'
          )
        }}
      </template>
      <template v-else>
        {{
          $t('editor.detach.hint', 'Löst das Bild vom Canvas und macht es zu einer eigenen Ebene.')
        }}
      </template>
    </p>
  </div>
</template>

<script setup>
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue';

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
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.detach-toggle-label {
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
}
</style>
