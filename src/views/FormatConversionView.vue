<template>
  <div class="format-conversion-view">
    <section class="conversion-hero">
      <h1>{{ $t(`conversion.${pair}.title`) }}</h1>
      <p class="hero-description">{{ $t(`conversion.${pair}.description`) }}</p>

      <div class="action-buttons">
        <router-link :to="{ name: 'editor' }" class="btn btn-primary btn-large btn-glow">
          <i class="fas fa-exchange-alt"></i>
          {{ $t(`conversion.${pair}.cta`) }}
        </router-link>
        <router-link :to="{ name: 'batch' }" class="btn btn-secondary btn-large">
          <i class="fas fa-images"></i>
          {{ $t('conversion.batchCta') }}
        </router-link>
      </div>
    </section>

    <section class="info-section">
      <div class="info-grid">
        <div class="info-card">
          <div class="info-icon"><i class="fas fa-bolt"></i></div>
          <h3>{{ $t('conversion.benefits.fast.title') }}</h3>
          <p>{{ $t('conversion.benefits.fast.description') }}</p>
        </div>
        <div class="info-card">
          <div class="info-icon"><i class="fas fa-shield-alt"></i></div>
          <h3>{{ $t('conversion.benefits.privacy.title') }}</h3>
          <p>{{ $t('conversion.benefits.privacy.description') }}</p>
        </div>
        <div class="info-card">
          <div class="info-icon"><i class="fas fa-check-circle"></i></div>
          <h3>{{ $t('conversion.benefits.quality.title') }}</h3>
          <p>{{ $t('conversion.benefits.quality.description') }}</p>
        </div>
      </div>
    </section>

    <section class="format-details">
      <h2>{{ $t(`conversion.${pair}.whyTitle`) }}</h2>
      <div class="format-comparison">
        <div class="format-box source">
          <h3>{{ conversionData.from }}</h3>
          <p>{{ $t(`conversion.formats.${conversionData.from.toLowerCase()}.info`) }}</p>
        </div>
        <div class="conversion-arrow">
          <i class="fas fa-arrow-right"></i>
        </div>
        <div class="format-box target">
          <h3>{{ conversionData.to }}</h3>
          <p>{{ $t(`conversion.formats.${conversionData.to.toLowerCase()}.info`) }}</p>
        </div>
      </div>
      <p class="advantage-text">{{ $t(`conversion.${pair}.advantage`) }}</p>
    </section>

    <section class="steps-section">
      <h2>{{ $t('conversion.howTo.title') }}</h2>
      <div class="steps-grid">
        <div class="step">
          <div class="step-number">1</div>
          <h3>{{ $t('conversion.howTo.step1.title') }}</h3>
          <p>{{ $t('conversion.howTo.step1.description') }}</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>{{ $t('conversion.howTo.step2.title') }}</h3>
          <p>{{ $t('conversion.howTo.step2.description') }}</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>{{ $t('conversion.howTo.step3.title') }}</h3>
          <p>{{ $t('conversion.howTo.step3.description') }}</p>
        </div>
      </div>
    </section>

    <section class="other-conversions">
      <h2>{{ $t('conversion.otherFormats.title') }}</h2>
      <div class="conversion-links">
        <router-link
          v-for="conv in otherConversions"
          :key="conv.pair"
          :to="{ name: 'format-conversion', params: { pair: conv.pair } }"
          class="conversion-link"
        >
          {{ conv.from }} &rarr; {{ conv.to }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatConversions } from '@/router/index.js'

const props = defineProps({
  pair: {
    type: String,
    required: true
  }
})

const conversionData = computed(() => {
  return formatConversions.find(f => f.pair === props.pair) || { from: '', to: '' }
})

const otherConversions = computed(() => {
  return formatConversions.filter(f => f.pair !== props.pair).slice(0, 6)
})
</script>

<style lang="scss" scoped>
.format-conversion-view {
  min-height: 100vh;
}

.conversion-hero {
  text-align: center;
  padding: 4rem 2rem 3rem;
  max-width: 800px;
  margin: 0 auto;

  h1 {
    font-size: 2.4rem;
    font-weight: 700;
    margin-bottom: var(--spacing-lg);
    line-height: 1.3;
  }

  .hero-description {
    font-size: 1.15rem;
    color: var(--color-text-secondary);
    line-height: 1.7;
    margin-bottom: var(--spacing-2xl);
  }
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.btn-large {
  padding: 0.75rem 1.75rem;
  font-size: 1rem;

  i {
    margin-right: var(--spacing-sm);
  }
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;

  &:hover {
    background: var(--color-bg-tertiary, var(--color-bg-primary));
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.btn-glow {
  position: relative;
  box-shadow: 0 0 20px rgba(1, 79, 153, 0.3);
  color: #F5F4D6;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  border-radius: var(--border-radius-md);

  &:hover {
    background: #003971;
    box-shadow: 0 0 30px rgba(1, 79, 153, 0.5), 0 0 60px rgba(1, 79, 153, 0.3);
    transform: translateY(-3px) scale(1.02);
  }
}

.info-section {
  padding: 3rem 2rem;
  background: var(--color-bg-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.info-card {
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .info-icon {
    width: 50px;
    height: 50px;
    background: var(--color-light-blue);
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-md);

    i {
      font-size: 1.5rem;
      color: var(--color-primary);
    }
  }

  h3 {
    font-size: 1.15rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

.format-details {
  padding: 3rem 2rem;
  max-width: 900px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: var(--spacing-xl);
  }
}

.format-comparison {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  justify-content: center;
  margin-bottom: var(--spacing-xl);

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.format-box {
  flex: 1;
  max-width: 300px;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  text-align: center;

  h3 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  &.source {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
  }

  &.target {
    background: var(--color-light-blue, rgba(1, 79, 153, 0.08));
    border: 1px solid var(--color-primary);
  }
}

.conversion-arrow {
  font-size: 1.5rem;
  color: var(--color-primary);

  @media (max-width: 600px) {
    transform: rotate(90deg);
  }
}

.advantage-text {
  text-align: center;
  color: var(--color-text-secondary);
  line-height: 1.7;
  font-size: 1.05rem;
}

.steps-section {
  padding: 3rem 2rem;
  background: var(--color-bg-primary);

  h2 {
    text-align: center;
    font-size: 1.8rem;
    margin-bottom: var(--spacing-xl);
  }
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-xl);
  max-width: 900px;
  margin: 0 auto;
}

.step {
  text-align: center;
  padding: var(--spacing-lg);

  .step-number {
    width: 45px;
    height: 45px;
    background: var(--color-primary);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 auto var(--spacing-md);
  }

  h3 {
    font-size: 1.1rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

.other-conversions {
  padding: 3rem 2rem;
  max-width: 900px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.6rem;
    margin-bottom: var(--spacing-xl);
  }
}

.conversion-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
}

.conversion-link {
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-light-blue, rgba(1, 79, 153, 0.08));
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

@media (max-width: 768px) {
  .conversion-hero {
    padding: 2.5rem 1.5rem 2rem;

    h1 {
      font-size: 1.8rem;
    }
  }

  .format-details h2,
  .steps-section h2,
  .other-conversions h2 {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .conversion-hero h1 {
    font-size: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
