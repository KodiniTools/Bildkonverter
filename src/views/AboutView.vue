<template>
  <div class="about-view">
    <section class="hero-section">
      <h1>{{ $t('about.title') }}</h1>
      <p class="subtitle">{{ $t('about.subtitle') }}</p>
    </section>

    <section class="content-section">
      <div class="content-grid">
        <div v-for="card in contentCards" :key="card.key" class="content-card">
          <div class="card-icon">
            <AppIcon :name="card.icon" :size="32" />
          </div>
          <h2>{{ $t(`about.${card.key}.title`) }}</h2>
          <p>{{ $t(`about.${card.key}.description`) }}</p>
        </div>
      </div>
    </section>

    <section class="features-section">
      <h2>{{ $t('about.features.title') }}</h2>

      <div class="features-list">
        <div v-for="key in featureKeys" :key="key" class="feature-item">
          <AppIcon name="check-circle" :size="20" />
          <div>
            <h3>{{ $t(`about.features.${key}.title`) }}</h3>
            <p>{{ $t(`about.features.${key}.description`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="tech-stack-section">
      <h2>{{ $t('about.techStack.title') }}</h2>

      <div class="tech-grid">
        <div v-for="tech in techStack" :key="tech.key" class="tech-card">
          <AppIcon :name="tech.icon" :size="20" />
          <h3>{{ tech.name }}</h3>
          <p>{{ $t(`about.techStack.${tech.key}`) }}</p>
        </div>
      </div>
    </section>

    <section class="version-section">
      <div class="version-info">
        <h3>{{ $t('about.version.title') }}</h3>
        <p class="version-number">v3.0.0</p>
        <p class="version-date">
          {{ $t('about.version.releaseDate') }}: {{ new Date().toLocaleDateString() }}
        </p>
        <a
          href="https://kodinitools.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="website-link"
        >
          kodinitools.com
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue';

// Texte unter about.<key>.title / .description
const contentCards = [
  { key: 'mission', icon: 'fas fa-rocket' },
  { key: 'privacy', icon: 'fas fa-shield-alt' },
  { key: 'technology', icon: 'fas fa-code' },
];

// Texte unter about.features.<key>
const featureKeys = ['formats', 'quality', 'editor', 'free'];

// Texte unter about.techStack.<key>
const techStack = [
  { key: 'vue', name: 'Vue 3', icon: 'fab fa-vuejs' },
  { key: 'i18n', name: 'Vue I18n', icon: 'fas fa-language' },
  { key: 'pinia', name: 'Pinia', icon: 'fas fa-database' },
  { key: 'vite', name: 'Vite', icon: 'fas fa-bolt' },
  { key: 'scss', name: 'SCSS', icon: 'fas fa-palette' },
  { key: 'canvas', name: 'Canvas API', icon: 'fas fa-image' },
];
</script>

<style lang="scss" scoped>
// Inhaltsseite wie die Landing-Page des Collage Makers: flache Sektionen auf
// surface-0, Karten surface-1 mit 1-px-Rahmen (Hover nur Rahmen), eine Goldfläche.

.about-view {
  min-height: 100vh;
  background: var(--ds-surface-0);
}

.hero-section {
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-8) var(--ds-space-12);

  h1 {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-4);

    @media (max-width: 768px) {
      font-size: var(--ds-text-2xl);
    }
  }

  .subtitle {
    font-size: var(--ds-text-lg);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
    max-width: 600px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    padding: var(--ds-space-8) var(--ds-space-4) var(--ds-space-8);
  }
}

.content-section,
.features-section,
.tech-stack-section {
  padding: var(--ds-space-12) var(--ds-space-8);
  background: var(--ds-surface-0);

  @media (max-width: 768px) {
    padding: var(--ds-space-10) var(--ds-space-4);
  }

  > h2 {
    text-align: center;
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-8);
  }
}

.features-section,
.tech-stack-section {
  border-top: var(--ds-border-width) solid var(--ds-border);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--ds-space-6);
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.content-card {
  padding: var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  text-align: center;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .card-icon {
    width: 64px;
    height: 64px;
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--ds-space-4);
  }

  h2 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
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

.features-list {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--ds-space-6) var(--ds-space-8);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  @media (max-width: 768px) {
    padding: var(--ds-space-5) var(--ds-space-4);
  }

  > .app-icon {
    color: var(--ds-success);
    margin-bottom: var(--ds-space-3);
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
    max-width: 700px;
    margin: 0;
  }
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-4);
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
}

.tech-card {
  padding: var(--ds-space-5);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  text-align: center;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .app-icon {
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-3);
  }

  h3 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-1);
  }

  p {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin: 0;
  }
}

.version-section {
  padding: var(--ds-space-12) var(--ds-space-8) var(--ds-space-16);
  background: var(--ds-surface-0);
  text-align: center;

  @media (max-width: 768px) {
    padding: var(--ds-space-10) var(--ds-space-4);
  }

  .version-info {
    max-width: 640px;
    margin: 0 auto;
    padding: var(--ds-space-8);
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);

    @media (max-width: 768px) {
      padding: var(--ds-space-5);
    }

    h3 {
      font-size: var(--ds-text-lg);
      font-weight: var(--ds-weight-semibold);
      color: var(--ds-text-2);
      margin-bottom: var(--ds-space-2);
    }

    .version-number {
      font-size: var(--ds-text-3xl);
      font-weight: var(--ds-weight-bold);
      line-height: var(--ds-leading-tight);
      color: var(--ds-text);
      margin-bottom: var(--ds-space-1);
    }

    .version-date {
      font-size: var(--ds-text-sm);
      color: var(--ds-text-2);
      margin-bottom: var(--ds-space-4);
    }

    // Einzige Goldfläche der Ansicht (wie .btn-primary .btn-large)
    .website-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--ds-control-lg);
      padding: 0 var(--ds-space-5);
      border-radius: var(--ds-radius-md);
      background: var(--ds-accent);
      color: var(--ds-on-accent);
      font-size: var(--ds-text-lg);
      font-weight: var(--ds-weight-semibold);
      line-height: 1;
      text-decoration: none;
      transition: background-color var(--ds-duration) var(--ds-ease);

      &:hover {
        background: var(--ds-accent-hover);
        color: var(--ds-on-accent);
      }

      &:focus-visible {
        outline: none;
        box-shadow: var(--ds-focus-ring);
      }
    }
  }
}
</style>
