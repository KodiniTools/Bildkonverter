<template>
  <section class="other-conversions">
    <h2>{{ $t('conversion.otherFormats.title') }}</h2>
    <div class="conversion-links">
      <router-link
        v-for="conv in conversions"
        :key="conv.pair"
        :to="{ name: 'format-conversion', params: { pair: conv.pair } }"
        class="conversion-link"
      >
        {{ conv.from }} &rarr; {{ conv.to }}
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ConversionPair } from '@/composables/conversion/useFormatConverter';

defineProps<{
  conversions: readonly ConversionPair[];
}>();
</script>

<style lang="scss" scoped>
@use './conversion-section' as *;

.other-conversions {
  @include conversion-section;
  max-width: 900px;
  margin: 0 auto;
}

.conversion-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: center;
}

.conversion-link {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text);
  text-decoration: none;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  transition: background-color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}
</style>
