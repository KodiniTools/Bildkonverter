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
        <img
          :src="heroImage"
          :alt="$t('home.heroAlt')"
          class="hero-img floating"
          width="500"
          height="333"
        />
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

    <!-- Beliebte Konvertierungen (SEO Long-Tail Keywords) -->
    <section class="conversions-section">
      <h2>{{ $t('home.conversions.title') }}</h2>
      <p class="conversions-subtitle">{{ $t('home.conversions.subtitle') }}</p>

      <div class="conversions-grid">
        <router-link
          v-for="conv in popularConversions"
          :key="conv.pair"
          :to="{ name: 'format-conversion', params: { pair: conv.pair } }"
          class="conversion-card"
        >
          <span class="format-badge source">{{ conv.from }}</span>
          <i class="fas fa-arrow-right"></i>
          <span class="format-badge target">{{ conv.to }}</span>
        </router-link>
      </div>
    </section>

    <!-- Weitere Tools von KodiniTools -->
    <section class="more-tools-section">
      <h2>{{ $t('home.moreTools.title') }}</h2>
      <p class="more-tools-subtitle">{{ $t('home.moreTools.subtitle') }}</p>

      <div class="tools-grid">
        <a href="https://kodinitools.com/bilderseriebearbeiten/" class="tool-card" target="_blank" rel="noopener">
          <div class="tool-icon">
            <i class="fas fa-layer-group"></i>
          </div>
          <h3>{{ $t('home.moreTools.batchEditor.title') }}</h3>
          <p>{{ $t('home.moreTools.batchEditor.description') }}</p>
          <span class="tool-cta">{{ $t('home.moreTools.cta') }} &rarr;</span>
        </a>

        <a href="https://kodinitools.com/collagemaker/" class="tool-card" target="_blank" rel="noopener">
          <div class="tool-icon">
            <i class="fas fa-th-large"></i>
          </div>
          <h3>{{ $t('home.moreTools.collageMaker.title') }}</h3>
          <p>{{ $t('home.moreTools.collageMaker.description') }}</p>
          <span class="tool-cta">{{ $t('home.moreTools.cta') }} &rarr;</span>
        </a>

        <a href="https://kodinitools.com/kodini-color-extractor/" class="tool-card" target="_blank" rel="noopener">
          <div class="tool-icon">
            <i class="fas fa-palette"></i>
          </div>
          <h3>{{ $t('home.moreTools.colorExtractor.title') }}</h3>
          <p>{{ $t('home.moreTools.colorExtractor.description') }}</p>
          <span class="tool-cta">{{ $t('home.moreTools.cta') }} &rarr;</span>
        </a>
      </div>
    </section>

    <!-- WebP Info-Banner (SEO + Nutzer-Aufklärung) -->
    <section class="webp-promo-section">
      <div class="webp-promo-content">
        <div class="webp-icon"><i class="fas fa-tachometer-alt"></i></div>
        <div>
          <h3>{{ $t('home.webpPromo.title') }}</h3>
          <p>{{ $t('home.webpPromo.description') }}</p>
          <router-link :to="{ name: 'format-conversion', params: { pair: 'png-zu-webp' } }" class="webp-link">
            {{ $t('home.webpPromo.cta') }} &rarr;
          </router-link>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import heroImage from '@/assets/foto/foto1.jpg'

// Beliebte Konvertierungs-Paare (Long-Tail SEO)
const popularConversions = [
  { pair: 'heic-zu-jpg', from: 'HEIC', to: 'JPG' },
  { pair: 'png-zu-webp', from: 'PNG', to: 'WebP' },
  { pair: 'jpg-zu-webp', from: 'JPG', to: 'WebP' },
  { pair: 'webp-zu-jpg', from: 'WebP', to: 'JPG' },
  { pair: 'tiff-zu-jpg', from: 'TIFF', to: 'JPG' },
  { pair: 'svg-zu-png', from: 'SVG', to: 'PNG' },
  { pair: 'jpg-zu-pdf', from: 'JPG', to: 'PDF' },
  { pair: 'png-zu-svg', from: 'PNG', to: 'SVG' },
  { pair: 'jpg-zu-png', from: 'JPG', to: 'PNG' },
  { pair: 'png-zu-jpg', from: 'PNG', to: 'JPG' },
  { pair: 'gif-zu-webp', from: 'GIF', to: 'WebP' },
  { pair: 'heic-zu-png', from: 'HEIC', to: 'PNG' }
]
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
  padding: 5rem 4rem 6rem;
  min-height: 80vh;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, var(--color-accent-lighter) 0%, var(--color-bg-gradient) 50%, var(--color-bg) 100%);

  @media (max-width: 1024px) {
    padding: 4rem 3rem 5rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 3rem 1.5rem 4rem;
    text-align: center;
  }
}

.hero-content {
  h1 {
    font-size: 2.8rem;
    font-weight: 700;
    margin-bottom: var(--spacing-lg);
    line-height: 1.25;

    @media (max-width: 1024px) {
      font-size: 2.4rem;
    }

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  .hero-subtitle {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-2xl);
    line-height: 1.7;
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
  padding: 0.75rem 1.75rem;
  font-size: 1rem;

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
  padding: 5rem 4rem;
  background: var(--color-bg-primary);

  @media (max-width: 1024px) {
    padding: 4rem 3rem;
  }

  @media (max-width: 768px) {
    padding: 3rem 1.5rem;
  }

  h2 {
    text-align: center;
    font-size: 2.2rem;
    margin-bottom: var(--spacing-2xl);

    @media (max-width: 768px) {
      font-size: 1.8rem;
    }
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

// Beliebte Konvertierungen
.conversions-section {
  padding: 3rem 4rem;

  @media (max-width: 1024px) {
    padding: 3rem;
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }

  h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: var(--spacing-md);

    @media (max-width: 768px) {
      font-size: 1.6rem;
    }
  }

  .conversions-subtitle {
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 1.05rem;
    margin-bottom: var(--spacing-xl);
  }
}

.conversions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
  max-width: 900px;
  margin: 0 auto;
}

.conversion-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: all 0.25s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-3px);
  }

  i {
    color: var(--color-primary);
    font-size: 0.85rem;
  }
}

.format-badge {
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--border-radius-sm, 4px);

  &.source {
    background: var(--color-bg-primary);
  }

  &.target {
    background: var(--color-light-blue, rgba(1, 79, 153, 0.1));
    color: var(--color-primary);
  }
}

// WebP Promo Banner
.webp-promo-section {
  padding: 0 4rem 2rem;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 0 1.5rem 2rem;
  }
}

.webp-promo-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--color-light-blue, rgba(1, 79, 153, 0.06));
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-lg);

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .webp-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: #fff;
    border-radius: var(--border-radius-md);
    font-size: 1.3rem;
  }

  h3 {
    font-size: 1.15rem;
    margin-bottom: var(--spacing-xs, 0.25rem);
  }

  p {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: var(--spacing-sm);
  }

  .webp-link {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
    font-size: 0.95rem;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Weitere Tools
.more-tools-section {
  padding: 4rem 4rem 2rem;

  @media (max-width: 1024px) {
    padding: 3rem;
  }

  @media (max-width: 768px) {
    padding: 2.5rem 1.5rem;
  }

  h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: var(--spacing-md);

    @media (max-width: 768px) {
      font-size: 1.6rem;
    }
  }

  .more-tools-subtitle {
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 1.05rem;
    margin-bottom: var(--spacing-xl);
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xl);
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    max-width: 500px;
    gap: var(--spacing-lg);
  }
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-lg), 0 10px 30px rgba(1, 79, 153, 0.1);
    transform: translateY(-6px);

    .tool-icon {
      transform: scale(1.1);
      background: var(--color-primary);
      color: #fff;
    }
  }

  .tool-icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-light-blue);
    border-radius: var(--border-radius-md);
    margin-bottom: var(--spacing-md);
    transition: all 0.3s ease;

    i {
      font-size: 1.6rem;
      color: var(--color-primary);
    }

    &:hover i,
    .tool-card:hover & i {
      color: #fff;
    }
  }

  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: var(--spacing-md);
    flex-grow: 1;
  }

  .tool-cta {
    color: var(--color-primary);
    font-weight: 600;
    font-size: 0.95rem;
    transition: gap 0.2s ease;
  }
}


@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--spacing-lg);
  }

  .feature-card {
    padding: var(--spacing-lg);

    &:hover {
      transform: translateY(-4px) scale(1.01);
    }
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 2rem 1rem 3rem;
    min-height: auto;
  }

  .hero-content h1 {
    font-size: 1.7rem;
  }

  .hero-content .hero-subtitle {
    font-size: 0.95rem;
  }

  .features-section {
    padding: 2.5rem 1rem;

    h2 {
      font-size: 1.5rem;
    }
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .feature-card {
    .feature-icon {
      width: 50px;
      height: 50px;

      i {
        font-size: 1.5rem;
      }
    }

    h3 {
      font-size: 1.1rem;
    }
  }

}
</style>
