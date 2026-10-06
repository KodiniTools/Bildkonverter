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
      <AppIcon name="info-circle" />
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
import AppIcon from '@/components/ui/AppIcon.vue';
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
  gap: var(--ds-space-3);
  margin-bottom: var(--ds-space-2);
}

.detach-toggle-label {
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: var(--ds-leading);
  color: var(--ds-text);
  cursor: pointer;
}
</style>
