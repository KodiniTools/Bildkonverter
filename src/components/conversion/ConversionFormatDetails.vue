<template>
  <section class="format-details">
    <h2>{{ $t(`conversion.${pair}.whyTitle`) }}</h2>
    <div class="format-comparison">
      <div class="format-box source">
        <h3>{{ conversion.from }}</h3>
        <p>{{ $t(`conversion.formats.${conversion.from.toLowerCase()}.info`) }}</p>
      </div>
      <div class="conversion-arrow">
        <AppIcon name="arrow-right" :size="20" />
      </div>
      <div class="format-box target">
        <h3>{{ conversion.to }}</h3>
        <p>{{ $t(`conversion.formats.${conversion.to.toLowerCase()}.info`) }}</p>
      </div>
    </div>
    <p class="advantage-text">{{ $t(`conversion.${pair}.advantage`) }}</p>
  </section>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ConversionPair } from '@/composables/conversion/useFormatConverter';

defineProps<{
  pair: string;
  conversion: ConversionPair;
}>();
</script>

<style lang="scss" scoped>
@use './conversion-section' as *;

.format-details {
  @include conversion-section;
  max-width: 900px;
  margin: 0 auto;
}

.format-comparison {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  justify-content: center;
  margin-bottom: var(--ds-space-6);

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.format-box {
  flex: 1;
  max-width: 300px;
  padding: var(--ds-space-5);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  text-align: center;

  h3 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-2);
  }

  p {
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }

  &.target {
    border-color: var(--ds-border-strong);
  }
}

.conversion-arrow {
  display: flex;
  color: var(--ds-text-3);

  @media (max-width: 600px) {
    transform: rotate(90deg);
  }
}

.advantage-text {
  text-align: center;
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  line-height: var(--ds-leading);
  margin: 0;
}
</style>
