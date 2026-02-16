<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>{{ $t('notFound.title') }}</h2>
      <p>{{ $t('notFound.description') }}</p>
      <router-link to="/" class="btn btn-primary">
        <i class="fas fa-home"></i>
        {{ $t('notFound.backHome') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>

<style lang="scss" scoped>
.not-found-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: var(--spacing-xl);
}

.not-found-content {
  h1 {
    font-size: 6rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: var(--spacing-sm);
    line-height: 1;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-md);
    color: var(--color-text-primary);
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .btn {
    i {
      margin-right: var(--spacing-sm);
    }
  }
}
</style>
