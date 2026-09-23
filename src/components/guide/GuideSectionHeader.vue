<template>
  <div
    class="section-header"
    :class="{ 'section-header-left': align === 'left', 'section-header-light': light }"
  >
    <div
      class="section-icon"
      :class="{ 'section-icon-small': align === 'left', 'section-icon-light': light }"
    >
      <i :class="icon"></i>
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
.section-header {
  text-align: center;
  margin-bottom: 2.5rem;

  &.section-header-left {
    text-align: left;
    margin-bottom: 1.25rem;
  }

  &.section-header-light {
    h2,
    p {
      color: white;
    }
  }

  h2 {
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: var(--color-text);
  }
}

.section-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
  border-radius: 16px;
  margin: 0 auto 1.25rem;
  box-shadow: 0 8px 24px rgba(1, 79, 153, 0.25);

  i {
    font-size: 1.4rem;
    color: #f5f4d6;
  }

  &.section-icon-small {
    width: 42px;
    height: 42px;
    margin: 0 0 0.75rem 0;
    border-radius: 12px;

    i {
      font-size: 1.1rem;
    }
  }

  &.section-icon-light {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
}

.section-description {
  font-size: 1rem;
  color: var(--color-text-light);
  max-width: 650px;
  margin: 0 auto;
  line-height: 1.6;
}
</style>
