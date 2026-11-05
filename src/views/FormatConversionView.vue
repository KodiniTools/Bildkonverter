<template>
  <div class="format-conversion-view">
    <section class="conversion-hero">
      <h1>{{ $t(`conversion.${pair}.title`) }}</h1>
      <p class="hero-description">{{ $t(`conversion.${pair}.description`) }}</p>
    </section>

    <ConversionWidget :pair="pair" :conversion="conversionData" />
    <ConversionBenefits />
    <ConversionFormatDetails :pair="pair" :conversion="conversionData" />
    <ConversionSteps />
    <ConversionOtherLinks :conversions="otherConversions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatConversions } from '@/router/index.js';
import ConversionWidget from '@/components/conversion/ConversionWidget.vue';
import ConversionBenefits from '@/components/conversion/ConversionBenefits.vue';
import ConversionFormatDetails from '@/components/conversion/ConversionFormatDetails.vue';
import ConversionSteps from '@/components/conversion/ConversionSteps.vue';
import ConversionOtherLinks from '@/components/conversion/ConversionOtherLinks.vue';
import type { ConversionPair } from '@/composables/conversion/useFormatConverter';

const props = defineProps<{
  pair: string;
}>();

const conversions = formatConversions as ConversionPair[];

const conversionData = computed<ConversionPair>(() => {
  return conversions.find((f) => f.pair === props.pair) || { from: '', to: '' };
});

const otherConversions = computed(() => {
  return conversions.filter((f) => f.pair !== props.pair).slice(0, 6);
});
</script>

<style lang="scss" scoped>
// Konvertierungsseite: Inhaltsseite wie die Landing-Page des Collage Makers,
// Widget als Panel (surface-1), Dropzone wie dessen ImageUploader.

.format-conversion-view {
  min-height: 100vh;
  background: var(--ds-surface-0);
}

.conversion-hero {
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-8) var(--ds-space-8);
  max-width: 800px;
  margin: 0 auto;

  h1 {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-4);
  }

  .hero-description {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}

@media (max-width: 768px) {
  .conversion-hero {
    padding: var(--ds-space-10) var(--ds-space-4) var(--ds-space-6);

    h1 {
      font-size: var(--ds-text-2xl);
    }
  }
}
</style>
