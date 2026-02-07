<template>
  <div class="about-view">
    <section class="hero-section">
      <h1>{{ $t('about.title') }}</h1>
      <p class="subtitle">{{ $t('about.subtitle') }}</p>
    </section>

    <section class="content-section">
      <div class="content-grid">
        <div class="content-card">
          <div class="card-icon">
            <i class="fas fa-rocket"></i>
          </div>
          <h2>{{ $t('about.mission.title') }}</h2>
          <p>{{ $t('about.mission.description') }}</p>
        </div>

        <div class="content-card">
          <div class="card-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h2>{{ $t('about.privacy.title') }}</h2>
          <p>{{ $t('about.privacy.description') }}</p>
        </div>

        <div class="content-card">
          <div class="card-icon">
            <i class="fas fa-code"></i>
          </div>
          <h2>{{ $t('about.technology.title') }}</h2>
          <p>{{ $t('about.technology.description') }}</p>
        </div>
      </div>
    </section>

    <section class="features-section">
      <h2>{{ $t('about.features.title') }}</h2>
      
      <div class="features-list">
        <div class="feature-item">
          <i class="fas fa-check-circle"></i>
          <div>
            <h3>{{ $t('about.features.formats.title') }}</h3>
            <p>{{ $t('about.features.formats.description') }}</p>
          </div>
        </div>

        <div class="feature-item">
          <i class="fas fa-check-circle"></i>
          <div>
            <h3>{{ $t('about.features.quality.title') }}</h3>
            <p>{{ $t('about.features.quality.description') }}</p>
          </div>
        </div>

        <div class="feature-item">
          <i class="fas fa-check-circle"></i>
          <div>
            <h3>{{ $t('about.features.editor.title') }}</h3>
            <p>{{ $t('about.features.editor.description') }}</p>
          </div>
        </div>

        <div class="feature-item">
          <i class="fas fa-check-circle"></i>
          <div>
            <h3>{{ $t('about.features.free.title') }}</h3>
            <p>{{ $t('about.features.free.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="tech-stack-section">
      <h2>{{ $t('about.techStack.title') }}</h2>
      
      <div class="tech-grid">
        <div class="tech-card">
          <i class="fab fa-vuejs"></i>
          <h3>Vue 3</h3>
          <p>{{ $t('about.techStack.vue') }}</p>
        </div>

        <div class="tech-card">
          <i class="fas fa-language"></i>
          <h3>Vue I18n</h3>
          <p>{{ $t('about.techStack.i18n') }}</p>
        </div>

        <div class="tech-card">
          <i class="fas fa-database"></i>
          <h3>Pinia</h3>
          <p>{{ $t('about.techStack.pinia') }}</p>
        </div>

        <div class="tech-card">
          <i class="fas fa-bolt"></i>
          <h3>Vite</h3>
          <p>{{ $t('about.techStack.vite') }}</p>
        </div>

        <div class="tech-card">
          <i class="fas fa-palette"></i>
          <h3>SCSS</h3>
          <p>{{ $t('about.techStack.scss') }}</p>
        </div>

        <div class="tech-card">
          <i class="fas fa-image"></i>
          <h3>Canvas API</h3>
          <p>{{ $t('about.techStack.canvas') }}</p>
        </div>
      </div>
    </section>

    <section class="version-section">
      <div class="version-info">
        <h3>{{ $t('about.version.title') }}</h3>
        <p class="version-number">v3.0.0</p>
        <p class="version-date">{{ $t('about.version.releaseDate') }}: {{ new Date().toLocaleDateString() }}</p>
        <a href="https://kodinitools.com/" target="_blank" rel="noopener noreferrer" class="website-link">
          kodinitools.com
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>

<style lang="scss" scoped>
.about-view {
  min-height: 100vh;
}

.hero-section {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-accent-lighter) 0%, var(--color-bg-gradient) 50%, var(--color-bg) 100%);
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
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
  color: #F5F4D6;
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
      color: #F5F4D6;
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
