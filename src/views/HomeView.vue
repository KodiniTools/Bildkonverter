<template>
  <div class="home-view">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="animate-title">{{ $t('home.title') }}</h1>
        <p class="hero-subtitle animate-subtitle">{{ $t('home.subtitle') }}</p>

        <div class="action-buttons animate-button">
          <router-link to="/editor" class="btn btn-primary btn-large btn-glow">
            <AppIcon name="edit" />
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
        <div
          v-for="(feature, index) in features"
          :key="feature.key"
          class="feature-card"
          :style="{ '--card-index': index }"
        >
          <div class="feature-icon">
            <AppIcon :name="feature.icon" :size="20" />
          </div>
          <h3>{{ $t(`home.features.${feature.key}.title`) }}</h3>
          <p>{{ $t(`home.features.${feature.key}.description`) }}</p>
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
          <AppIcon name="arrow-right" class="conversion-arrow" />
          <span class="format-badge target">{{ conv.to }}</span>
        </router-link>
      </div>

      <div class="batch-link-wrapper">
        <router-link to="/batch" class="batch-link">
          <AppIcon name="images" />
          {{ $t('home.batchLink') }}
          <AppIcon name="arrow-right" />
        </router-link>
      </div>
    </section>

    <!-- Weitere Tools von KodiniTools -->
    <section class="more-tools-section">
      <h2>{{ $t('home.moreTools.title') }}</h2>
      <p class="more-tools-subtitle">{{ $t('home.moreTools.subtitle') }}</p>

      <div class="tools-grid">
        <a
          v-for="tool in moreTools"
          :key="tool.key"
          :href="tool.href"
          class="tool-card"
          target="_blank"
          rel="noopener"
        >
          <div class="tool-icon">
            <AppIcon :name="tool.icon" :size="20" />
          </div>
          <h3>{{ $t(`home.moreTools.${tool.key}.title`) }}</h3>
          <p>{{ $t(`home.moreTools.${tool.key}.description`) }}</p>
          <span class="tool-cta">{{ $t('home.moreTools.cta') }} &rarr;</span>
        </a>
      </div>
    </section>

    <!-- WebP Info-Banner (SEO + Nutzer-Aufklärung) -->
    <section class="webp-promo-section">
      <div class="webp-promo-content">
        <div class="webp-icon"><AppIcon name="tachometer-alt" :size="20" /></div>
        <div>
          <h3>{{ $t('home.webpPromo.title') }}</h3>
          <p>{{ $t('home.webpPromo.description') }}</p>
          <router-link
            :to="{ name: 'format-conversion', params: { pair: 'png-zu-webp' } }"
            class="webp-link"
          >
            {{ $t('home.webpPromo.cta') }} &rarr;
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import heroImage from '@/assets/foto/foto1.jpg';
import AppIcon from '@/components/ui/AppIcon.vue';
import { formatConversions } from '@/router/index.js';

// Feature-Karten (Texte unter home.features.<key>)
const features = [
  { key: 'convert', icon: 'fas fa-file-image' },
  { key: 'edit', icon: 'fas fa-sliders-h' },
  { key: 'compress', icon: 'fas fa-compress' },
  { key: 'privacy', icon: 'fas fa-shield-alt' },
  { key: 'fast', icon: 'fas fa-bolt' },
  { key: 'crop', icon: 'fas fa-crop' },
];

// Beliebte Konvertierungs-Paare (Long-Tail SEO), in Anzeige-Reihenfolge;
// Bezeichnungen kommen aus der zentralen Liste im Router
const popularPairs = [
  'heic-zu-jpg',
  'png-zu-webp',
  'jpg-zu-webp',
  'webp-zu-jpg',
  'tiff-zu-jpg',
  'svg-zu-png',
  'jpg-zu-pdf',
  'png-zu-svg',
  'jpg-zu-png',
  'png-zu-jpg',
  'gif-zu-webp',
  'heic-zu-png',
];
const popularConversions = popularPairs
  .map((pair) => formatConversions.find((f) => f.pair === pair))
  .filter(Boolean);

// Weitere KodiniTools (Texte unter home.moreTools.<key>)
const moreTools = [
  {
    key: 'batchEditor',
    href: 'https://kodinitools.com/bilderseriebearbeiten/',
    icon: 'fas fa-layer-group',
  },
  { key: 'collageMaker', href: 'https://kodinitools.com/collagemaker/', icon: 'fas fa-th-large' },
  {
    key: 'colorExtractor',
    href: 'https://kodinitools.com/kodini-color-extractor/',
    icon: 'fas fa-palette',
  },
];
</script>

<style lang="scss" scoped>
// Startseite wie die Landing-Page des Collage Makers: flache Sektionen auf
// surface-0, Karten surface-1 mit 1-px-Rahmen (Hover nur border-strong),
// Hero max. 32 px, section-title 20 px, eine Goldfläche (Haupt-CTA).

.home-view {
  min-height: 100vh;
  background: var(--ds-surface-0);
}

.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-12);
  align-items: center;
  padding: var(--ds-space-16) var(--ds-space-16) var(--ds-space-12);
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    padding: var(--ds-space-12) var(--ds-space-12) var(--ds-space-10);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--ds-space-8);
    padding: var(--ds-space-10) var(--ds-space-4) var(--ds-space-8);
    text-align: center;
  }
}

.hero-content {
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

  .hero-subtitle {
    font-size: var(--ds-text-lg);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-8);
  }
}

// Eingang: nur Einblenden + 8 px
.animate-title,
.animate-subtitle,
.animate-button,
.animate-image,
.animate-section-title {
  animation: homeFadeIn var(--ds-duration-slow) var(--ds-ease) backwards;
}

@keyframes homeFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-buttons {
  display: flex;
  gap: var(--ds-space-4);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

// Haupt-CTA = einzige Goldfläche (Stil aus .btn-primary .btn-large global)

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
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  object-fit: cover;
}

// Sektionen
.features-section,
.conversions-section,
.more-tools-section {
  padding: var(--ds-space-12) var(--ds-space-16);
  border-top: var(--ds-border-width) solid var(--ds-border);

  @media (max-width: 1024px) {
    padding: var(--ds-space-10) var(--ds-space-12);
  }

  @media (max-width: 768px) {
    padding: var(--ds-space-10) var(--ds-space-4);
  }

  h2 {
    text-align: center;
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-4);
  }
}

.features-section h2 {
  margin-bottom: var(--ds-space-8);
}

.conversions-subtitle,
.more-tools-subtitle {
  text-align: center;
  font-size: var(--ds-text-lg);
  color: var(--ds-text-2);
  max-width: 640px;
  margin: 0 auto var(--ds-space-8);
}

// Feature-Karten
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--ds-space-6);
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--ds-space-4);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  padding: var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  transition: border-color var(--ds-duration) var(--ds-ease);
  animation: homeFadeIn var(--ds-duration-slow) var(--ds-ease) backwards;
  animation-delay: calc(var(--card-index, 0) * 50ms);

  @media (max-width: 768px) {
    padding: var(--ds-space-5);
  }

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .feature-icon {
    width: var(--ds-control-lg);
    height: var(--ds-control-lg);
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    border-radius: var(--ds-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--ds-space-4);
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
    margin: 0;
  }
}

// Beliebte Konvertierungen
.conversions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--ds-space-3);
  max-width: 900px;
  margin: 0 auto;
}

.conversion-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  text-decoration: none;
  color: var(--ds-text);
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  .app-icon {
    color: var(--ds-text-3);
  }
}

.batch-link-wrapper {
  text-align: center;
  margin-top: var(--ds-space-6);
}

.batch-link {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-3);
  color: var(--ds-link);
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  text-decoration: none;
  border-radius: var(--ds-radius-md);
  transition: color var(--ds-duration) var(--ds-ease);

  &:hover {
    color: var(--ds-accent);
  }
}

.format-badge {
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);

  &.source {
    color: var(--ds-text-2);
  }

  &.target {
    color: var(--ds-text);
  }
}

// WebP-Hinweis (Callout)
.webp-promo-section {
  padding: var(--ds-space-12) var(--ds-space-16);
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    padding: var(--ds-space-10) var(--ds-space-12);
  }

  @media (max-width: 768px) {
    padding: var(--ds-space-8) var(--ds-space-4);
  }
}

.webp-promo-content {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-4);
  padding: var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    padding: var(--ds-space-5);
    text-align: center;
  }

  .webp-icon {
    flex-shrink: 0;
    width: var(--ds-control-lg);
    height: var(--ds-control-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ds-surface-2);
    color: var(--ds-link);
    border-radius: var(--ds-radius-md);
  }

  h3 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-1);
  }

  p {
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin-bottom: var(--ds-space-2);
  }

  .webp-link {
    color: var(--ds-link);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    text-decoration: none;

    &:hover {
      color: var(--ds-accent);
    }
  }
}

// Weitere Tools
.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-6);
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    max-width: 500px;
    gap: var(--ds-space-4);
  }
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  text-decoration: none;
  color: var(--ds-text);
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
    color: var(--ds-text);

    .tool-cta {
      color: var(--ds-accent);
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  .tool-icon {
    width: var(--ds-control-lg);
    height: var(--ds-control-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    border-radius: var(--ds-radius-md);
    margin-bottom: var(--ds-space-4);
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
    margin-bottom: var(--ds-space-4);
    flex-grow: 1;
  }

  .tool-cta {
    color: var(--ds-link);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    transition: color var(--ds-duration) var(--ds-ease);
  }
}
</style>
