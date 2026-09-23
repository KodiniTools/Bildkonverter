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
            <i :class="card.icon"></i>
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
          <i class="fas fa-check-circle"></i>
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
          <i :class="tech.icon"></i>
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
.about-view {
  min-height: 100vh;
}

.hero-section {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: linear-gradient(
    135deg,
    var(--color-accent-lighter) 0%,
    var(--color-bg-gradient) 50%,
    var(--color-bg) 100%
  );
  margin-bottom: 5rem;

  h1 {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  .subtitle {
    font-size: 1.2rem;
    color: var(--color-text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }
}

.content-section {
  padding: var(--spacing-3xl) var(--spacing-xl);
  margin-bottom: 4rem;
  background: var(--color-bg-primary);

  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.content-card {
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  text-align: center;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }

  .card-icon {
    width: 80px;
    height: 80px;
    background: var(--color-light-blue);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);

    i {
      font-size: 2.5rem;
      color: var(--color-primary);
    }
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-md);
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}

.features-section {
  padding: var(--spacing-3xl) var(--spacing-xl);
  margin-bottom: 4rem;
  background: var(--color-bg-secondary);

  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }

  h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: var(--spacing-2xl);
  }
}

.features-list {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-2xl);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  &:last-child {
    margin-bottom: 3rem;

    @media (max-width: 768px) {
      margin-bottom: 2rem;
    }
  }

  > i {
    font-size: 2.5rem;
    color: var(--color-success);
    margin-bottom: var(--spacing-md);
  }

  h3 {
    font-size: 1.4rem;
    margin-bottom: var(--spacing-sm);
    font-weight: 600;
  }

  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
    max-width: 700px;
  }
}

.tech-stack-section {
  padding: var(--spacing-3xl) var(--spacing-xl);
  margin-bottom: 4rem;
  background: var(--color-bg-primary);

  @media (max-width: 768px) {
    margin-bottom: 3rem;
  }

  h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: var(--spacing-2xl);
  }
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
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
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }

  i {
    font-size: 3rem;
    color: var(--color-primary);
    margin-bottom: var(--spacing-md);
  }

  h3 {
    font-size: 1.2rem;
    margin-bottom: var(--spacing-sm);
  }

  p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}

.version-section {
  padding-top: 5rem;
  padding-bottom: 5rem;
  padding-left: var(--spacing-xl);
  padding-right: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
  color: #f5f4d6;
  text-align: center;

  @media (max-width: 768px) {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
  }

  .version-info {
    h3 {
      font-size: 1.5rem;
      margin-bottom: var(--spacing-sm);
    }

    .version-number {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: var(--spacing-xs);
    }

    .version-date {
      opacity: 0.9;
      margin-bottom: var(--spacing-md);
    }

    .website-link {
      display: inline-block;
      color: #f5f4d6;
      text-decoration: none;
      font-size: 1.1rem;
      font-weight: 500;
      padding: var(--spacing-sm) var(--spacing-lg);
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--border-radius-md);
      transition: all 0.3s ease;
      margin-top: var(--spacing-sm);

      &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }
  }
}
</style>
