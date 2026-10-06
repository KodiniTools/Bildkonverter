<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>{{ $t('notFound.title') }}</h2>
      <p>{{ $t('notFound.description') }}</p>
      <router-link to="/" class="btn btn-primary">
        <AppIcon name="home" />
        {{ $t('notFound.backHome') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';
</script>

<style lang="scss" scoped>
.not-found-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: var(--ds-space-8);
  background: var(--ds-surface-0);
}

.not-found-content {
  h1 {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text-3);
    margin-bottom: var(--ds-space-2);
    line-height: var(--ds-leading-tight);
  }

  h2 {
    font-size: var(--ds-text-2xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    margin-bottom: var(--ds-space-4);
    color: var(--ds-text);
  }

  p {
    font-size: var(--ds-text-lg);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-8);
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
