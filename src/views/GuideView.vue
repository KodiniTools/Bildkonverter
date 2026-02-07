<template>
  <div class="guide-view">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-gradient"></div>
        <div class="hero-pattern"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <i class="fas fa-book-open"></i>
          <span>{{ $t('guide.badge') || 'Benutzerhandbuch' }}</span>
        </div>
        <h1>{{ $t('guide.title') }}</h1>
        <p class="subtitle">{{ $t('guide.subtitle') }}</p>
        <div class="hero-cta">
          <router-link to="/editor" class="btn-hero-primary">
            <i class="fas fa-rocket"></i>
            {{ $t('guide.cta.button') }}
          </router-link>
          <a href="#quick-start" class="btn-hero-secondary">
            <i class="fas fa-arrow-down"></i>
            {{ $t('guide.quickStart.title') }}
          </a>
        </div>
      </div>
    </section>

    <!-- Quick Start Section -->
    <section id="quick-start" class="section section-white">
      <div class="section-container">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-play-circle"></i>
          </div>
          <h2>{{ $t('guide.quickStart.title') }}</h2>
          <p class="section-description">{{ $t('guide.quickStart.subtitle') || 'In nur drei einfachen Schritten zum perfekten Bild' }}</p>
        </div>
        <div class="steps-container">
          <div class="step-card" v-for="(step, index) in 3" :key="index">
            <div class="step-number-wrapper">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-line" v-if="index < 2"></div>
            </div>
            <div class="step-content">
              <h3>{{ $t(`guide.quickStart.step${index + 1}.title`) }}</h3>
              <p>{{ $t(`guide.quickStart.step${index + 1}.description`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Upload Section -->
    <section class="section section-gradient">
      <div class="section-container">
        <div class="section-grid section-grid-reverse">
          <div class="section-visual">
            <div class="visual-card">
              <div class="visual-icon-large">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div class="format-badges-circle">
                <span class="format-badge" v-for="format in ['PNG', 'JPEG', 'WebP', 'GIF', 'TIFF', 'HEIF']" :key="format">{{ format }}</span>
              </div>
            </div>
          </div>
          <div class="section-text">
            <div class="section-header section-header-left">
              <div class="section-icon section-icon-small">
                <i class="fas fa-upload"></i>
              </div>
              <h2>{{ $t('guide.upload.title') }}</h2>
            </div>
            <p class="section-intro">{{ $t('guide.upload.description') }}</p>
            <div class="feature-cards">
              <div class="feature-card" v-for="(method, key) in uploadMethods" :key="key">
                <div class="feature-card-icon">
                  <i :class="method.icon"></i>
                </div>
                <span>{{ $t(`guide.upload.methods.${key}`) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters Section -->
    <section class="section section-white">
      <div class="section-container">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-sliders-h"></i>
          </div>
          <h2>{{ $t('guide.filters.title') }}</h2>
          <p class="section-description">{{ $t('guide.filters.description') }}</p>
        </div>
        <div class="filters-grid">
          <div class="filter-card" v-for="filter in filters" :key="filter.key">
            <div class="filter-icon">
              <i :class="filter.icon"></i>
            </div>
            <h4>{{ $t(`guide.filters.${filter.key}.title`) }}</h4>
            <p>{{ $t(`guide.filters.${filter.key}.description`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Presets Section -->
    <section class="section section-dark">
      <div class="section-container">
        <div class="section-header section-header-light">
          <div class="section-icon section-icon-light">
            <i class="fas fa-magic"></i>
          </div>
          <h2>{{ $t('guide.presets.title') }}</h2>
          <p class="section-description">{{ $t('guide.presets.description') }}</p>
        </div>
        <div class="presets-showcase">
          <div class="preset-card" v-for="preset in presets" :key="preset">
            <div class="preset-icon">{{ getPresetIcon(preset) }}</div>
            <span class="preset-name">{{ $t(`guide.presets.list.${preset}`) }}</span>
          </div>
        </div>
        <div class="tip-box tip-box-light">
          <div class="tip-icon">
            <i class="fas fa-lightbulb"></i>
          </div>
          <p>{{ $t('guide.presets.tip') }}</p>
        </div>
      </div>
    </section>

    <!-- Crop Section -->
    <section class="section section-white">
      <div class="section-container">
        <div class="section-grid">
          <div class="section-text">
            <div class="section-header section-header-left">
              <div class="section-icon section-icon-small">
                <i class="fas fa-crop-alt"></i>
              </div>
              <h2>{{ $t('guide.crop.title') }}</h2>
            </div>
            <p class="section-intro">{{ $t('guide.crop.description') }}</p>
            <ol class="numbered-steps">
              <li v-for="step in 4" :key="step">
                <span class="step-marker">{{ step }}</span>
                <span>{{ $t(`guide.crop.steps.step${step}`) }}</span>
              </li>
            </ol>
          </div>
          <div class="section-visual">
            <div class="visual-card visual-card-crop">
              <div class="crop-preview">
                <div class="crop-frame">
                  <div class="crop-corner crop-corner-tl"></div>
                  <div class="crop-corner crop-corner-tr"></div>
                  <div class="crop-corner crop-corner-bl"></div>
                  <div class="crop-corner crop-corner-br"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Transform Section -->
    <section class="section section-gradient">
      <div class="section-container">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-sync-alt"></i>
          </div>
          <h2>{{ $t('guide.transform.title') }}</h2>
          <p class="section-description">{{ $t('guide.transform.description') }}</p>
        </div>
        <div class="transform-grid">
          <div class="transform-card" v-for="transform in transforms" :key="transform.key">
            <div class="transform-icon">
              <i :class="transform.icon"></i>
            </div>
            <h4>{{ $t(`guide.transform.${transform.key}.title`) }}</h4>
            <p>{{ $t(`guide.transform.${transform.key}.description`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Text Section -->
    <section class="section section-white">
      <div class="section-container">
        <div class="section-grid section-grid-reverse">
          <div class="section-visual">
            <div class="visual-card visual-card-text">
              <div class="text-preview">
                <span class="preview-text">Aa</span>
              </div>
              <div class="text-options">
                <span class="text-option"><i class="fas fa-bold"></i></span>
                <span class="text-option"><i class="fas fa-italic"></i></span>
                <span class="text-option"><i class="fas fa-palette"></i></span>
              </div>
            </div>
          </div>
          <div class="section-text">
            <div class="section-header section-header-left">
              <div class="section-icon section-icon-small">
                <i class="fas fa-font"></i>
              </div>
              <h2>{{ $t('guide.text.title') }}</h2>
            </div>
            <p class="section-intro">{{ $t('guide.text.description') }}</p>
            <div class="feature-list-grid">
              <div class="feature-list-item" v-for="feature in textFeatures" :key="feature.key">
                <i :class="feature.icon"></i>
                <span>{{ $t(`guide.text.features.${feature.key}`) }}</span>
              </div>
            </div>
            <div class="tip-box">
              <div class="tip-icon">
                <i class="fas fa-lightbulb"></i>
              </div>
              <p>{{ $t('guide.text.tip') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Resize Section -->
    <section class="section section-gradient">
      <div class="section-container">
        <div class="section-grid">
          <div class="section-text">
            <div class="section-header section-header-left">
              <div class="section-icon section-icon-small">
                <i class="fas fa-expand-arrows-alt"></i>
              </div>
              <h2>{{ $t('guide.resize.title') }}</h2>
            </div>
            <p class="section-intro">{{ $t('guide.resize.description') }}</p>
            <div class="feature-cards feature-cards-column">
              <div class="feature-card" v-for="feature in resizeFeatures" :key="feature.key">
                <div class="feature-card-icon">
                  <i :class="feature.icon"></i>
                </div>
                <span>{{ $t(`guide.resize.features.${feature.key}`) }}</span>
              </div>
            </div>
          </div>
          <div class="section-visual">
            <div class="visual-card visual-card-resize">
              <div class="resize-preview">
                <div class="resize-box resize-box-small"></div>
                <div class="resize-arrow"><i class="fas fa-arrows-alt"></i></div>
                <div class="resize-box resize-box-large"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Export Section -->
    <section class="section section-white">
      <div class="section-container">
        <div class="section-header">
          <div class="section-icon">
            <i class="fas fa-download"></i>
          </div>
          <h2>{{ $t('guide.export.title') }}</h2>
          <p class="section-description">{{ $t('guide.export.description') }}</p>
        </div>
        <div class="export-content">
          <div class="export-steps">
            <div class="export-step" v-for="step in 3" :key="step">
              <div class="export-step-number">{{ step }}</div>
              <p>{{ $t(`guide.export.steps.step${step}`) }}</p>
            </div>
          </div>
          <div class="export-formats">
            <h4>{{ $t('guide.export.formatsTitle') }}</h4>
            <div class="format-badges-row">
              <span class="format-badge format-badge-large" v-for="format in ['PNG', 'JPEG', 'WebP', 'GIF', 'TIFF', 'PDF']" :key="format">
                <i class="fas fa-file-image"></i>
                {{ format }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Section -->
    <section class="section section-gradient">
      <div class="section-container">
        <div class="section-grid section-grid-reverse">
          <div class="section-visual">
            <div class="visual-card visual-card-gallery">
              <div class="gallery-preview">
                <div class="gallery-item" v-for="n in 4" :key="n"></div>
              </div>
            </div>
          </div>
          <div class="section-text">
            <div class="section-header section-header-left">
              <div class="section-icon section-icon-small">
                <i class="fas fa-images"></i>
              </div>
              <h2>{{ $t('guide.gallery.title') }}</h2>
            </div>
            <p class="section-intro">{{ $t('guide.gallery.description') }}</p>
            <div class="feature-list-grid">
              <div class="feature-list-item" v-for="feature in galleryFeatures" :key="feature.key">
                <i :class="feature.icon"></i>
                <span>{{ $t(`guide.gallery.features.${feature.key}`) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- History & Settings Combined Section -->
    <section class="section section-white">
      <div class="section-container">
        <div class="dual-section-grid">
          <!-- History -->
          <div class="dual-section-card">
            <div class="section-header section-header-left">
              <div class="section-icon section-icon-small">
                <i class="fas fa-history"></i>
              </div>
              <h2>{{ $t('guide.history.title') }}</h2>
            </div>
            <p class="section-intro">{{ $t('guide.history.description') }}</p>
            <div class="shortcuts-box">
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>Ctrl</kbd>
                  <span class="shortcut-plus">+</span>
                  <kbd>Z</kbd>
                </div>
                <span class="shortcut-label">{{ $t('guide.history.undo') }}</span>
              </div>
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>Ctrl</kbd>
                  <span class="shortcut-plus">+</span>
                  <kbd>Y</kbd>
                </div>
                <span class="shortcut-label">{{ $t('guide.history.redo') }}</span>
              </div>
            </div>
          </div>
          <!-- Settings -->
          <div class="dual-section-card">
            <div class="section-header section-header-left">
              <div class="section-icon section-icon-small">
                <i class="fas fa-cog"></i>
              </div>
              <h2>{{ $t('guide.settings.title') }}</h2>
            </div>
            <p class="section-intro">{{ $t('guide.settings.description') }}</p>
            <div class="settings-options">
              <div class="settings-option">
                <div class="settings-option-icon">
                  <i class="fas fa-language"></i>
                </div>
                <span>{{ $t('guide.settings.features.language') }}</span>
              </div>
              <div class="settings-option">
                <div class="settings-option-icon">
                  <i class="fas fa-moon"></i>
                </div>
                <span>{{ $t('guide.settings.features.theme') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-background">
        <div class="cta-gradient"></div>
        <div class="cta-pattern"></div>
      </div>
      <div class="cta-content">
        <h2>{{ $t('guide.cta.title') }}</h2>
        <p>{{ $t('guide.cta.description') }}</p>
        <router-link to="/editor" class="cta-button">
          <i class="fas fa-rocket"></i>
          {{ $t('guide.cta.button') }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const presets = ['original', 'vibrant', 'vintage', 'blackWhite', 'dramatic', 'soft', 'warm', 'cool']

const uploadMethods = {
  dragDrop: { icon: 'fas fa-mouse-pointer' },
  fileSelect: { icon: 'fas fa-folder-open' },
  url: { icon: 'fas fa-link' },
  demo: { icon: 'fas fa-image' }
}

const filters = [
  { key: 'brightness', icon: 'fas fa-sun' },
  { key: 'contrast', icon: 'fas fa-adjust' },
  { key: 'saturation', icon: 'fas fa-palette' },
  { key: 'grayscale', icon: 'fas fa-circle-half-stroke' },
  { key: 'sepia', icon: 'fas fa-coffee' },
  { key: 'sharpness', icon: 'fas fa-compress-arrows-alt' }
]

const transforms = [
  { key: 'rotate', icon: 'fas fa-redo' },
  { key: 'flip', icon: 'fas fa-arrows-alt-h' },
  { key: 'zoom', icon: 'fas fa-search-plus' },
  { key: 'border', icon: 'fas fa-border-style' }
]

const textFeatures = [
  { key: 'fontSize', icon: 'fas fa-text-height' },
  { key: 'color', icon: 'fas fa-paint-brush' },
  { key: 'fontFamily', icon: 'fas fa-font' },
  { key: 'rotation', icon: 'fas fa-undo' },
  { key: 'opacity', icon: 'fas fa-eye-dropper' },
  { key: 'stroke', icon: 'fas fa-border-all' },
  { key: 'shadow', icon: 'fas fa-cloud' }
]

const resizeFeatures = [
  { key: 'custom', icon: 'fas fa-ruler-combined' },
  { key: 'aspectRatio', icon: 'fas fa-link' },
  { key: 'presets', icon: 'fas fa-th-list' }
]

const galleryFeatures = [
  { key: 'upload', icon: 'fas fa-plus-circle' },
  { key: 'preview', icon: 'fas fa-eye' },
  { key: 'openEditor', icon: 'fas fa-edit' },
  { key: 'download', icon: 'fas fa-download' },
  { key: 'delete', icon: 'fas fa-trash-alt' }
]

function getPresetIcon(preset) {
  const icons = {
    original: '🎨',
    vibrant: '🌈',
    vintage: '📷',
    blackWhite: '⬛',
    dramatic: '🎭',
    soft: '☁️',
    warm: '🔥',
    cool: '❄️'
  }
  return icons[preset] || '✨'
}
</script>

<style lang="scss" scoped>
// ===== VARIABLES =====
$section-spacing: 6rem;
$section-spacing-mobile: 4rem;
$content-max-width: 1200px;
$card-border-radius: 20px;
$transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1);

// ===== GUIDE VIEW CONTAINER =====
.guide-view {
  min-height: 100vh;
  overflow-x: hidden;
}

// ===== HERO SECTION =====
.hero-section {
  position: relative;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  overflow: hidden;

  .hero-background {
    position: absolute;
    inset: 0;
    z-index: 0;

    .hero-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg,
        var(--color-primary) 0%,
        #003971 50%,
        #c9984d 100%
      );
    }

    .hero-pattern {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
      opacity: 0.6;
    }
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 800px;
    color: #F5F4D6;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 50px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);

    i {
      font-size: 0.9rem;
    }
  }

  h1 {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    margin-bottom: 1.5rem;
    line-height: 1.1;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .subtitle {
    font-size: clamp(1.1rem, 2.5vw, 1.35rem);
    opacity: 0.9;
    margin-bottom: 2.5rem;
    line-height: 1.6;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-hero-primary,
  .btn-hero-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    text-decoration: none;
    transition: all $transition-smooth;
  }

  .btn-hero-primary {
    background: white;
    color: var(--color-primary);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
    }
  }

  .btn-hero-secondary {
    background: rgba(255, 255, 255, 0.15);
    color: #F5F4D6;
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}

// ===== SECTIONS =====
.section {
  padding: $section-spacing 2rem;
  position: relative;

  @media (max-width: 768px) {
    padding: $section-spacing-mobile 1.5rem;
  }
}

.section-white {
  background: var(--color-bg);
}

.section-gradient {
  background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
}

.section-dark {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
}

.section-container {
  max-width: $content-max-width;
  margin: 0 auto;
}

// ===== SECTION HEADER =====
.section-header {
  text-align: center;
  margin-bottom: 3.5rem;

  &.section-header-left {
    text-align: left;
    margin-bottom: 1.5rem;
  }

  &.section-header-light {
    h2, p {
      color: white;
    }
  }

  h2 {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--color-text);
  }
}

.section-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
  border-radius: 20px;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 30px rgba(1, 79, 153, 0.3);

  i {
    font-size: 1.75rem;
    color: #F5F4D6;
  }

  &.section-icon-small {
    width: 50px;
    height: 50px;
    margin: 0 0 1rem 0;
    border-radius: 14px;

    i {
      font-size: 1.25rem;
    }
  }

  &.section-icon-light {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
}

.section-description {
  font-size: 1.15rem;
  color: var(--color-text-light);
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.7;
}

// ===== SECTION GRID =====
.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  &.section-grid-reverse {
    @media (min-width: 969px) {
      .section-visual {
        order: -1;
      }
    }
  }
}

.section-text {
  .section-intro {
    font-size: 1.1rem;
    color: var(--color-text-light);
    line-height: 1.8;
    margin-bottom: 2rem;
  }
}

// ===== VISUAL CARDS =====
.section-visual {
  display: flex;
  justify-content: center;
}

.visual-card {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  border-radius: $card-border-radius;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;

  .visual-icon-large {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
    border-radius: 30px;
    margin-bottom: 2rem;
    box-shadow: 0 15px 40px rgba(1, 79, 153, 0.35);

    i {
      font-size: 2.5rem;
      color: #F5F4D6;
    }
  }
}

.format-badges-circle {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  max-width: 280px;
}

.format-badge {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: #F5F4D6;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(1, 79, 153, 0.3);
}

// ===== STEPS =====
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 700px;
  margin: 0 auto;
}

.step-card {
  display: flex;
  gap: 1.5rem;
  position: relative;
}

.step-number-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
  color: #F5F4D6;
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 8px 25px rgba(1, 79, 153, 0.35);
  position: relative;
  z-index: 1;
}

.step-line {
  width: 3px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-border) 100%);
  margin: 0.5rem 0;
}

.step-content {
  padding: 0.5rem 0 2.5rem 0;
  flex: 1;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text);
  }

  p {
    color: var(--color-text-light);
    line-height: 1.6;
    margin: 0;
  }
}

// ===== FEATURE CARDS =====
.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }

  &.feature-cards-column {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: all $transition-smooth;

  &:hover {
    border-color: var(--color-primary);
    transform: translateX(5px);
    box-shadow: 0 5px 20px rgba(1, 79, 153, 0.15);
  }

  .feature-card-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-light-blue);
    border-radius: 10px;
    flex-shrink: 0;

    i {
      font-size: 1.1rem;
      color: var(--color-primary);
    }
  }

  span {
    font-weight: 500;
    color: var(--color-text);
  }
}

// ===== FILTERS GRID =====
.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.filter-card {
  padding: 2rem;
  background: var(--color-bg);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  text-align: center;
  transition: all $transition-smooth;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
    border-color: var(--color-primary);

    .filter-icon {
      transform: scale(1.1);
    }
  }

  .filter-icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-light-blue) 0%, var(--color-medium-blue) 100%);
    border-radius: 16px;
    margin: 0 auto 1.25rem;
    transition: transform $transition-smooth;

    i {
      font-size: 1.5rem;
      color: var(--color-primary);
    }
  }

  h4 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text);
  }

  p {
    font-size: 0.9rem;
    color: var(--color-text-light);
    margin: 0;
    line-height: 1.5;
  }
}

// ===== PRESETS SHOWCASE =====
.presets-showcase {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2.5rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all $transition-smooth;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .preset-icon {
    font-size: 2rem;
  }

  .preset-name {
    font-weight: 500;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
  }
}

// ===== TIP BOX =====
.tip-box {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(1, 79, 153, 0.08) 0%, rgba(201, 152, 77, 0.08) 100%);
  border-radius: 14px;
  border-left: 4px solid var(--color-primary);
  margin-top: 1.5rem;

  .tip-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    border-radius: 50%;
    flex-shrink: 0;

    i {
      font-size: 0.9rem;
      color: #F5F4D6;
    }
  }

  p {
    margin: 0;
    color: var(--color-text-light);
    line-height: 1.6;
    padding-top: 0.4rem;
  }

  &.tip-box-light {
    background: rgba(255, 255, 255, 0.08);
    border-left-color: rgba(255, 255, 255, 0.5);

    .tip-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    p {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

// ===== NUMBERED STEPS =====
.numbered-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: step;

  li {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-light);
    line-height: 1.6;

    &:last-child {
      border-bottom: none;
    }

    .step-marker {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary);
      color: #F5F4D6;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }
}

// ===== TRANSFORM GRID =====
.transform-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.transform-card {
  padding: 2rem 1.5rem;
  background: var(--color-bg);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  text-align: center;
  transition: all $transition-smooth;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);

    .transform-icon {
      transform: rotate(10deg) scale(1.1);
    }
  }

  .transform-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
    border-radius: 14px;
    margin: 0 auto 1rem;
    transition: transform $transition-smooth;

    i {
      font-size: 1.3rem;
      color: #F5F4D6;
    }
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text);
  }

  p {
    font-size: 0.85rem;
    color: var(--color-text-light);
    margin: 0;
    line-height: 1.5;
  }
}

// ===== FEATURE LIST GRID =====
.feature-list-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.feature-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border-radius: 10px;
  transition: all $transition-smooth;

  &:hover {
    background: var(--color-light-blue);
  }

  i {
    color: var(--color-primary);
    font-size: 1rem;
    width: 20px;
    text-align: center;
  }

  span {
    font-size: 0.95rem;
    color: var(--color-text);
  }
}

// ===== VISUAL CARD VARIANTS =====
.visual-card-crop {
  .crop-preview {
    width: 200px;
    height: 150px;
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    border-radius: 12px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .crop-frame {
    width: 120px;
    height: 90px;
    border: 3px dashed var(--color-primary);
    border-radius: 8px;
    position: relative;
    animation: pulse-border 2s ease-in-out infinite;
  }

  .crop-corner {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--color-primary);
    border-radius: 2px;

    &-tl { top: -6px; left: -6px; }
    &-tr { top: -6px; right: -6px; }
    &-bl { bottom: -6px; left: -6px; }
    &-br { bottom: -6px; right: -6px; }
  }
}

.visual-card-text {
  .text-preview {
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;

    .preview-text {
      font-size: 4rem;
      font-weight: 700;
      color: #92400e;
      font-family: Georgia, serif;
    }
  }

  .text-options {
    display: flex;
    gap: 1rem;

    .text-option {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 10px;

      i {
        color: var(--color-text-light);
      }
    }
  }
}

.visual-card-resize {
  .resize-preview {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .resize-box {
      background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
      border-radius: 8px;

      &-small {
        width: 60px;
        height: 60px;
      }

      &-large {
        width: 120px;
        height: 120px;
      }
    }

    .resize-arrow {
      color: var(--color-text-light);
      font-size: 1.5rem;
    }
  }
}

.visual-card-gallery {
  .gallery-preview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    width: 100%;
    max-width: 280px;

    .gallery-item {
      aspect-ratio: 1;
      background: linear-gradient(135deg, var(--color-light-blue) 0%, var(--color-medium-blue) 100%);
      border-radius: 12px;
      border: 2px solid var(--color-border);
    }
  }
}

// ===== EXPORT SECTION =====
.export-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.export-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.export-step {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;

  .export-step-number {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--color-primary) 0%, #003971 100%);
    color: #F5F4D6;
    font-weight: 700;
    border-radius: 50%;
    flex-shrink: 0;
  }

  p {
    color: var(--color-text-light);
    line-height: 1.6;
    margin: 0;
    padding-top: 0.5rem;
  }
}

.export-formats {
  padding: 2rem;
  background: var(--color-bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--color-border);

  h4 {
    margin-bottom: 1.25rem;
    color: var(--color-text);
    font-size: 1.1rem;
  }
}

.format-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.format-badge-large {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;

  i {
    font-size: 1rem;
  }
}

// ===== DUAL SECTION GRID =====
.dual-section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.dual-section-card {
  padding: 2.5rem;
  background: var(--color-bg-secondary);
  border-radius: $card-border-radius;
  border: 1px solid var(--color-border);
}

// ===== SHORTCUTS BOX =====
.shortcuts-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border-radius: 12px;
  border: 1px solid var(--color-border);

  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  kbd {
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-family: monospace;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 2px 0 var(--color-border);
  }

  .shortcut-plus {
    color: var(--color-text-light);
    font-weight: 500;
  }

  .shortcut-label {
    color: var(--color-text-light);
    font-weight: 500;
  }
}

// ===== SETTINGS OPTIONS =====
.settings-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.settings-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: all $transition-smooth;

  &:hover {
    border-color: var(--color-primary);
  }

  .settings-option-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-light-blue);
    border-radius: 10px;

    i {
      font-size: 1.1rem;
      color: var(--color-primary);
    }
  }

  span {
    font-weight: 500;
    color: var(--color-text);
  }
}

// ===== CTA SECTION =====
.cta-section {
  position: relative;
  padding: 6rem 2rem;
  overflow: hidden;

  .cta-background {
    position: absolute;
    inset: 0;
    z-index: 0;

    .cta-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg,
        var(--color-primary) 0%,
        #003971 50%,
        #c9984d 100%
      );
    }

    .cta-pattern {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    }
  }

  .cta-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
    color: #F5F4D6;

    h2 {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 700;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.15rem;
      opacity: 0.9;
      margin-bottom: 2rem;
      line-height: 1.7;
    }
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 2.5rem;
    background: white;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 1.15rem;
    font-weight: 600;
    border-radius: 50px;
    transition: all $transition-smooth;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
    }
  }
}

// ===== ANIMATIONS =====
@keyframes pulse-border {
  0%, 100% {
    border-color: var(--color-primary);
  }
  50% {
    border-color: rgba(1, 79, 153, 0.4);
  }
}

// ===== DARK MODE ADJUSTMENTS =====
:root[data-theme="dark"] {
  .visual-card {
    background: linear-gradient(135deg, var(--color-bg-secondary) 0%, #1a1a2e 100%);
  }

  .filter-card,
  .transform-card,
  .feature-card,
  .dual-section-card {
    background: var(--color-bg-secondary);
  }

  .visual-card-crop .crop-preview,
  .visual-card-text .text-preview {
    background: linear-gradient(135deg, #2d2d4a 0%, #1a1a2e 100%);
  }

  .visual-card-text .text-preview .preview-text {
    color: #fbbf24;
  }

  .export-formats {
    background: var(--color-bg);
  }
}
</style>
