<template>
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
</template>

<style lang="scss" scoped>
@use './conversion-section' as *;

.steps-section {
  @include conversion-section;
  border-top: var(--ds-border-width) solid var(--ds-border);
}

/* Steps (wie Landing-Page: 64-px-Kreise in Gold) */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ds-space-8);
  max-width: 900px;
  margin: 0 auto;
}

.step {
  text-align: center;

  .step-number {
    width: 64px;
    height: 64px;
    background: var(--ds-accent);
    color: var(--ds-on-accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ds-text-2xl);
    font-weight: var(--ds-weight-bold);
    line-height: 1;
    margin: 0 auto var(--ds-space-4);
  }

  h3 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-2);
  }

  p {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}
</style>
