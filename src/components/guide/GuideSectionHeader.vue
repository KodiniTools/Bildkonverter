<template>
  <div
    class="section-header"
    :class="{ 'section-header-left': align === 'left', 'section-header-light': light }"
  >
    <div
      class="section-icon"
      :class="{ 'section-icon-small': align === 'left', 'section-icon-light': light }"
    >
      <AppIcon :name="icon" :size="20" />
    </div>
    <h2>{{ title }}</h2>
    <p
      v-if="description"
      class="section-description"
      :style="descriptionColor ? { color: descriptionColor } : null"
    >
      {{ description }}
    </p>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';

/**
 * Überschrift eines Guide-Abschnitts: Icon, Titel, optionale Beschreibung.
 * align="left" ergibt die kompakte linksbündige Variante neben Visuals,
 * light die helle Variante auf dunklem Hintergrund.
 */
defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  align: { type: String, default: 'center' },
  light: { type: Boolean, default: false },
  descriptionColor: { type: String, default: '' },
});
</script>

<style lang="scss" scoped>
// Abschnittstitel nach Design-System v2: section-title 20/700, Icon-Feld flach
// auf surface-2, Icon 20 in --ds-text-2. Die helle Variante (früher auf
// dunklem Verlauf) braucht keine eigenen Farben mehr, Klasse bleibt erhalten.
.section-header {
  text-align: center;
  margin-bottom: var(--ds-space-10);

  &.section-header-left {
    text-align: left;
    margin-bottom: var(--ds-space-5);
  }

  h2 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    margin-bottom: var(--ds-space-3);
    color: var(--ds-text);
  }
}

.section-icon {
  width: var(--ds-control-lg);
  height: var(--ds-control-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-2);
  margin: 0 auto var(--ds-space-4);

  &.section-icon-small {
    width: var(--ds-control-md);
    height: var(--ds-control-md);
    margin: 0 0 var(--ds-space-3);
  }
}

.section-description {
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  max-width: 650px;
  margin: 0 auto;
  line-height: var(--ds-leading);
}
</style>
