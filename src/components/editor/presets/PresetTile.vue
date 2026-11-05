<template>
  <button class="preset-btn" :class="{ active }" :title="preset.description" @click="emit('apply')">
    <span class="preset-icon"><AppIcon :name="presetIconName(preset)" :size="20" /></span>
    <span class="preset-name">{{ $t(`presets.${preset.id}`, preset.name) }}</span>
    <button
      v-if="preset.custom"
      class="delete-btn"
      :title="$t('presets.actions.delete')"
      :aria-label="$t('presets.actions.delete')"
      @click.stop="emit('delete')"
    >
      <AppIcon name="times" />
    </button>
  </button>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { presetIconName, type FilterPreset } from '@/composables/presets/defaultPresets';

defineProps<{
  preset: FilterPreset;
  active: boolean;
}>();

const emit = defineEmits<{
  apply: [];
  delete: [];
}>();
</script>

<style lang="scss" scoped>
/* Preset-Kachel wie StylePresets im Collage Maker: Rahmen border-strong,
   Hover-Rahmen Akzent, ausgewählt = accent-soft + Akzent-Rahmen. */
.preset-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3);
  background: transparent;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  font: inherit;
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-accent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
    color: var(--ds-text);

    .preset-icon {
      color: var(--ds-text);
    }
  }
}

.preset-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--ds-space-12);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  color: var(--ds-text-2);
}

.preset-name {
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-medium);
  text-align: center;
  line-height: var(--ds-leading-tight);
  color: var(--ds-text);
  width: 100%;
  overflow: hidden;
  word-break: break-word;
  hyphens: auto;
}

/* Destruktiv textbasiert: UiIconButton sm mit Danger-Icon auf surface-1 */
.delete-btn {
  position: absolute;
  top: var(--ds-space-1);
  right: var(--ds-space-1);
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border);
  background: var(--ds-surface-1);
  color: var(--ds-danger);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition:
    opacity var(--ds-duration) var(--ds-ease),
    background-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
  }

  &:focus-visible {
    opacity: 1;
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.preset-btn:hover .delete-btn,
.preset-btn:focus-within .delete-btn {
  opacity: 1;
}

@media (hover: none) {
  .delete-btn {
    opacity: 1;
  }
}
</style>
