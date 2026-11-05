<template>
  <section class="info-section">
    <div class="info-grid">
      <div class="info-card">
        <div class="info-icon"><AppIcon name="bolt" :size="20" /></div>
        <h3>{{ $t('conversion.benefits.fast.title') }}</h3>
        <p>{{ $t('conversion.benefits.fast.description') }}</p>
      </div>
      <div class="info-card">
        <div class="info-icon"><AppIcon name="shield-alt" :size="20" /></div>
        <h3>{{ $t('conversion.benefits.privacy.title') }}</h3>
        <p>{{ $t('conversion.benefits.privacy.description') }}</p>
      </div>
      <div class="info-card">
        <div class="info-icon"><AppIcon name="check-circle" :size="20" /></div>
        <h3>{{ $t('conversion.benefits.quality.title') }}</h3>
        <p>{{ $t('conversion.benefits.quality.description') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
</script>

<style lang="scss" scoped>
@use './conversion-section' as *;

.info-section {
  @include conversion-section;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--ds-space-6);
  max-width: 1000px;
  margin: 0 auto;
}

.info-card {
  padding: var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  text-align: center;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .info-icon {
    width: var(--ds-control-lg);
    height: var(--ds-control-lg);
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    border-radius: var(--ds-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--ds-space-4);
  }

  h3 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-2);
  }

  p {
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}
</style>
