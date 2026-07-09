<template>
  <div class="sidebar-section" :class="{ 'disabled-section': disabled }">
    <h3>{{ $t('editor.sidebar.detach', 'Vom Hintergrund lösen') }}</h3>

    <div class="detach-toggle-row">
      <label class="switch">
        <input
          type="checkbox"
          :checked="detached"
          :disabled="disabled"
          @change="$emit('toggle')"
        />
        <span class="switch-slider"></span>
      </label>
      <span class="detach-toggle-label">
        {{
          detached
            ? $t('editor.detach.on', 'Als freie Ebene aktiv')
            : $t('editor.detach.off', 'Bild vom Hintergrund lösen')
        }}
      </span>
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
          $t(
            'editor.detach.hint',
            'Löst das Bild vom Canvas und macht es zu einer eigenen Ebene.'
          )
        }}
      </template>
    </p>
  </div>
</template>

<script setup>
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
}

.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .switch-slider {
      background-color: var(--color-primary);
    }

    &:checked + .switch-slider::before {
      transform: translateX(18px);
    }

    &:disabled + .switch-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--color-border);
  border-radius: 24px;
  transition: background-color 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
  }
}
</style>
