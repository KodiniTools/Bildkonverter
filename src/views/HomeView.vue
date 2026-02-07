<template>
  <div class="home-view">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="animate-title">{{ $t('home.title') }}</h1>
        <p class="hero-subtitle animate-subtitle">{{ $t('home.subtitle') }}</p>

        <div class="action-buttons animate-button">
          <router-link to="/editor" class="btn btn-primary btn-large btn-glow">
            <i class="fas fa-edit"></i>
            {{ $t('home.startEditing') }}
          </router-link>
        </div>
      </div>

      <div class="hero-image animate-image">
        <img :src="heroImage" alt="Hero Image" class="hero-img floating" />
      </div>
    </section>

    <section class="features-section">
      <h2 class="animate-section-title">{{ $t('home.features.title') }}</h2>

      <div class="features-grid">
        <div class="feature-card" style="--card-index: 0">
          <div class="feature-icon">
            <i class="fas fa-file-image"></i>
          </div>
          <h3>{{ $t('home.features.convert.title') }}</h3>
          <p>{{ $t('home.features.convert.description') }}</p>
        </div>

        <div class="feature-card" style="--card-index: 1">
          <div class="feature-icon">
            <i class="fas fa-sliders-h"></i>
          </div>
          <h3>{{ $t('home.features.edit.title') }}</h3>
          <p>{{ $t('home.features.edit.description') }}</p>
        </div>

        <div class="feature-card" style="--card-index: 2">
          <div class="feature-icon">
            <i class="fas fa-compress"></i>
          </div>
          <h3>{{ $t('home.features.compress.title') }}</h3>
          <p>{{ $t('home.features.compress.description') }}</p>
        </div>

        <div class="feature-card" style="--card-index: 3">
          <div class="feature-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h3>{{ $t('home.features.privacy.title') }}</h3>
          <p>{{ $t('home.features.privacy.description') }}</p>
        </div>

        <div class="feature-card" style="--card-index: 4">
          <div class="feature-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <h3>{{ $t('home.features.fast.title') }}</h3>
          <p>{{ $t('home.features.fast.description') }}</p>
        </div>

        <div class="feature-card" style="--card-index: 5">
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

const { t } = useI18n({ useScope: 'global' })

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
  background: linear-gradient(135deg, var(--color-accent-lighter) 0%, var(--color-bg-gradient) 50%, var(--color-bg) 100%);
  
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

// Hero Animations
.animate-title {
  animation: slideInFromLeft 0.8s ease-out;
}

.animate-subtitle {
  animation: slideInFromLeft 0.8s ease-out 0.2s backwards;
}

.animate-button {
  animation: slideInFromLeft 0.8s ease-out 0.4s backwards;
}

.animate-image {
  animation: slideInFromRight 0.8s ease-out 0.3s backwards;
}

.animate-section-title {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

// Button Glow Effect
.btn-glow {
  position: relative;
  box-shadow: 0 0 20px rgba(1, 79, 153, 0.3);
  animation: pulse-glow 2s ease-in-out infinite;
  color: #F5F4D6;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

  &:hover {
    background: #003971;
    box-shadow: 0 0 30px rgba(1, 79, 153, 0.5), 0 0 60px rgba(1, 79, 153, 0.3);
    transform: translateY(-3px) scale(1.02);
    color: #F5F4D6;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
    background: #002a54;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(1, 79, 153, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(1, 79, 153, 0.5), 0 0 50px rgba(1, 79, 153, 0.2);
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &.floating {
    animation: floating 3s ease-in-out infinite;
  }

  &:hover {
    transform: scale(1.03) translateY(-5px);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }
}

@keyframes floating {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
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
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;

  // Gestaffelte Einblendung
  opacity: 0;
  animation: cardFadeIn 0.6s ease-out forwards;
  animation-delay: calc(var(--card-index, 0) * 0.1s);

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: var(--shadow-lg), 0 20px 40px rgba(1, 79, 153, 0.1);

    .feature-icon {
      transform: scale(1.1) rotate(5deg);

      i {
        animation: iconBounce 0.5s ease;
      }
    }
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
    transition: transform 0.3s ease, background 0.3s ease;

    i {
      font-size: 1.8rem;
      color: var(--color-primary);
      transition: transform 0.3s ease;
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

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes iconBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
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
    box-shadow: 0 4px 12px rgba(1, 79, 153, 0.15);
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
