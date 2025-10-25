<template>
  <div class="home-view">
    <section class="hero-section">
      <div class="hero-content">
        <h1>{{ $t('home.title') }}</h1>
        <p class="hero-subtitle">{{ $t('home.subtitle') }}</p>
        
        <div class="action-buttons">
          <router-link to="/editor" class="btn btn-primary btn-large">
            <i class="fas fa-edit"></i>
            {{ $t('home.startEditing') }}
          </router-link>
        </div>
      </div>
      
      <div class="hero-image">
        <img :src="heroImage" alt="Hero Image" class="hero-img" />
      </div>
    </section>

    <section class="features-section">
      <h2>{{ $t('home.features.title') }}</h2>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-file-image"></i>
          </div>
          <h3>{{ $t('home.features.convert.title') }}</h3>
          <p>{{ $t('home.features.convert.description') }}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-sliders-h"></i>
          </div>
          <h3>{{ $t('home.features.edit.title') }}</h3>
          <p>{{ $t('home.features.edit.description') }}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-compress"></i>
          </div>
          <h3>{{ $t('home.features.compress.title') }}</h3>
          <p>{{ $t('home.features.compress.description') }}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h3>{{ $t('home.features.privacy.title') }}</h3>
          <p>{{ $t('home.features.privacy.description') }}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <h3>{{ $t('home.features.fast.title') }}</h3>
          <p>{{ $t('home.features.fast.description') }}</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-crop"></i>
          </div>
          <h3>{{ $t('home.features.crop.title') }}</h3>
          <p>{{ $t('home.features.crop.description') }}</p>
        </div>
      </div>
    </section>

    <section class="faq-section">
      <h2>{{ $t('home.faq.title') }}</h2>
      <p class="faq-subtitle">{{ $t('home.faq.subtitle') }}</p>
      
      <div class="faq-container">
        <div 
          v-for="(faq, index) in faqs" 
          :key="index" 
          class="faq-item"
          :class="{ 'active': activeFaq === index }"
          @click="toggleFaq(index)"
        >
          <div class="faq-question">
            <h3>{{ $t(`home.faq.items.${faq.key}.question`) }}</h3>
            <i class="fas" :class="activeFaq === index ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </div>
          <div class="faq-answer" v-show="activeFaq === index">
            <p>{{ $t(`home.faq.items.${faq.key}.answer`) }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import heroImage from '@/assets/foto/foto1.jpg'

const { t } = useI18n()

// FAQ State
const activeFaq = ref(null)

const faqs = [
  { key: 'formats' },
  { key: 'privacy' },
  { key: 'filters' },
  { key: 'crop' },
  { key: 'resize' },
  { key: 'download' }
]

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}
</script>

<style lang="scss" scoped>
.home-view {
  min-height: 100vh;
}

.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2xl);
  align-items: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  min-height: 80vh;
  background: linear-gradient(135deg, var(--color-light-blue) 0%, var(--color-bg-primary) 100%);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: var(--spacing-xl) var(--spacing-md);
    text-align: center;
  }
}

.hero-content {
  h1 {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: var(--spacing-lg);
    line-height: 1.2;
    
    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-2xl);
    line-height: 1.6;
  }
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.btn-large {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.1rem;
  
  i {
    margin-right: var(--spacing-sm);
  }
}

.hero-image {
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    display: none;
  }
}

.hero-img {
  width: 100%;
  max-width: 500px;
  height: auto;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  object-fit: cover;
}

.features-section {
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: var(--color-bg-primary);
  
  h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: var(--spacing-2xl);
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
  
  .feature-icon {
    width: 60px;
    height: 60px;
    background: var(--color-light-blue);
    border-radius: var(--border-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-md);
    
    i {
      font-size: 1.8rem;
      color: var(--color-primary);
    }
  }
  
  h3 {
    font-size: 1.3rem;
    margin-bottom: var(--spacing-sm);
  }
  
  p {
    color: var(--color-text-secondary);
    line-height: 1.6;
  }
}

.faq-section {
  margin-top: 4rem;
  padding-top: 5rem;
  padding-bottom: 3rem;
  padding-left: var(--spacing-xl);
  padding-right: var(--spacing-xl);
  background: var(--color-bg-secondary);
  
  h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: var(--spacing-md);
  }
  
  .faq-subtitle {
    text-align: center;
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-2xl);
  }
}

.faq-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.faq-item {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
  
  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
}

.faq-question {
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  
  i {
    font-size: 1rem;
    color: var(--color-primary);
    transition: transform 0.3s ease;
  }
}

.faq-answer {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  animation: fadeIn 0.3s ease;
  
  p {
    color: var(--color-text-secondary);
    line-height: 1.7;
    margin: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .faq-section {
    margin-top: 3rem;
    padding-top: 3.5rem;
    padding-bottom: 2rem;
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
    
    h2 {
      font-size: 2rem;
    }
  }
  
  .faq-question {
    padding: var(--spacing-md);
    
    h3 {
      font-size: 1rem;
    }
  }
}
</style>
