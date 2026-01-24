<template>
  <div class="guide-view">
    <!-- Hero Section -->
    <section class="hero-section">
      <h1>{{ $t('guide.title') }}</h1>
      <p class="subtitle">{{ $t('guide.subtitle') }}</p>
    </section>

    <!-- Quick Start Section -->
    <section class="content-section">
      <h2 class="section-title">
        <i class="fas fa-play-circle"></i>
        {{ $t('guide.quickStart.title') }}
      </h2>
      <div class="quick-start-steps">
        <div class="step-card" v-for="(step, index) in 3" :key="index">
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <h3>{{ $t(`guide.quickStart.step${index + 1}.title`) }}</h3>
            <p>{{ $t(`guide.quickStart.step${index + 1}.description`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Upload Section -->
    <section class="content-section alt-bg">
      <h2 class="section-title">
        <i class="fas fa-upload"></i>
        {{ $t('guide.upload.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.upload.description') }}</p>
        <ul class="feature-list">
          <li>
            <i class="fas fa-mouse-pointer"></i>
            <span>{{ $t('guide.upload.methods.dragDrop') }}</span>
          </li>
          <li>
            <i class="fas fa-folder-open"></i>
            <span>{{ $t('guide.upload.methods.fileSelect') }}</span>
          </li>
          <li>
            <i class="fas fa-link"></i>
            <span>{{ $t('guide.upload.methods.url') }}</span>
          </li>
          <li>
            <i class="fas fa-image"></i>
            <span>{{ $t('guide.upload.methods.demo') }}</span>
          </li>
        </ul>
        <div class="formats-info">
          <h4>{{ $t('guide.upload.formatsTitle') }}</h4>
          <div class="format-badges">
            <span class="format-badge">PNG</span>
            <span class="format-badge">JPEG</span>
            <span class="format-badge">WebP</span>
            <span class="format-badge">GIF</span>
            <span class="format-badge">TIFF</span>
            <span class="format-badge">HEIF</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters Section -->
    <section class="content-section">
      <h2 class="section-title">
        <i class="fas fa-sliders-h"></i>
        {{ $t('guide.filters.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.filters.description') }}</p>
        <div class="filters-grid">
          <div class="filter-item">
            <i class="fas fa-sun"></i>
            <h4>{{ $t('guide.filters.brightness.title') }}</h4>
            <p>{{ $t('guide.filters.brightness.description') }}</p>
          </div>
          <div class="filter-item">
            <i class="fas fa-adjust"></i>
            <h4>{{ $t('guide.filters.contrast.title') }}</h4>
            <p>{{ $t('guide.filters.contrast.description') }}</p>
          </div>
          <div class="filter-item">
            <i class="fas fa-palette"></i>
            <h4>{{ $t('guide.filters.saturation.title') }}</h4>
            <p>{{ $t('guide.filters.saturation.description') }}</p>
          </div>
          <div class="filter-item">
            <i class="fas fa-circle-half-stroke"></i>
            <h4>{{ $t('guide.filters.grayscale.title') }}</h4>
            <p>{{ $t('guide.filters.grayscale.description') }}</p>
          </div>
          <div class="filter-item">
            <i class="fas fa-coffee"></i>
            <h4>{{ $t('guide.filters.sepia.title') }}</h4>
            <p>{{ $t('guide.filters.sepia.description') }}</p>
          </div>
          <div class="filter-item">
            <i class="fas fa-compress-arrows-alt"></i>
            <h4>{{ $t('guide.filters.sharpness.title') }}</h4>
            <p>{{ $t('guide.filters.sharpness.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Presets Section -->
    <section class="content-section alt-bg">
      <h2 class="section-title">
        <i class="fas fa-magic"></i>
        {{ $t('guide.presets.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.presets.description') }}</p>
        <div class="presets-showcase">
          <div class="preset-item" v-for="preset in presets" :key="preset">
            <span class="preset-icon">{{ getPresetIcon(preset) }}</span>
            <span class="preset-name">{{ $t(`guide.presets.list.${preset}`) }}</span>
          </div>
        </div>
        <div class="tip-box">
          <i class="fas fa-lightbulb"></i>
          <p>{{ $t('guide.presets.tip') }}</p>
        </div>
      </div>
    </section>

    <!-- Crop Section -->
    <section class="content-section">
      <h2 class="section-title">
        <i class="fas fa-crop-alt"></i>
        {{ $t('guide.crop.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.crop.description') }}</p>
        <ol class="numbered-list">
          <li>{{ $t('guide.crop.steps.step1') }}</li>
          <li>{{ $t('guide.crop.steps.step2') }}</li>
          <li>{{ $t('guide.crop.steps.step3') }}</li>
          <li>{{ $t('guide.crop.steps.step4') }}</li>
        </ol>
      </div>
    </section>

    <!-- Transform Section -->
    <section class="content-section alt-bg">
      <h2 class="section-title">
        <i class="fas fa-sync-alt"></i>
        {{ $t('guide.transform.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.transform.description') }}</p>
        <div class="transform-grid">
          <div class="transform-item">
            <i class="fas fa-redo"></i>
            <h4>{{ $t('guide.transform.rotate.title') }}</h4>
            <p>{{ $t('guide.transform.rotate.description') }}</p>
          </div>
          <div class="transform-item">
            <i class="fas fa-arrows-alt-h"></i>
            <h4>{{ $t('guide.transform.flip.title') }}</h4>
            <p>{{ $t('guide.transform.flip.description') }}</p>
          </div>
          <div class="transform-item">
            <i class="fas fa-search-plus"></i>
            <h4>{{ $t('guide.transform.zoom.title') }}</h4>
            <p>{{ $t('guide.transform.zoom.description') }}</p>
          </div>
          <div class="transform-item">
            <i class="fas fa-border-style"></i>
            <h4>{{ $t('guide.transform.border.title') }}</h4>
            <p>{{ $t('guide.transform.border.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Text Section -->
    <section class="content-section">
      <h2 class="section-title">
        <i class="fas fa-font"></i>
        {{ $t('guide.text.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.text.description') }}</p>
        <ul class="feature-list icon-list">
          <li>
            <i class="fas fa-text-height"></i>
            <span>{{ $t('guide.text.features.fontSize') }}</span>
          </li>
          <li>
            <i class="fas fa-paint-brush"></i>
            <span>{{ $t('guide.text.features.color') }}</span>
          </li>
          <li>
            <i class="fas fa-font"></i>
            <span>{{ $t('guide.text.features.fontFamily') }}</span>
          </li>
          <li>
            <i class="fas fa-undo"></i>
            <span>{{ $t('guide.text.features.rotation') }}</span>
          </li>
          <li>
            <i class="fas fa-eye-dropper"></i>
            <span>{{ $t('guide.text.features.opacity') }}</span>
          </li>
          <li>
            <i class="fas fa-border-all"></i>
            <span>{{ $t('guide.text.features.stroke') }}</span>
          </li>
          <li>
            <i class="fas fa-cloud"></i>
            <span>{{ $t('guide.text.features.shadow') }}</span>
          </li>
        </ul>
        <div class="tip-box">
          <i class="fas fa-lightbulb"></i>
          <p>{{ $t('guide.text.tip') }}</p>
        </div>
      </div>
    </section>

    <!-- Resize Section -->
    <section class="content-section alt-bg">
      <h2 class="section-title">
        <i class="fas fa-expand-arrows-alt"></i>
        {{ $t('guide.resize.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.resize.description') }}</p>
        <ul class="feature-list">
          <li>
            <i class="fas fa-ruler-combined"></i>
            <span>{{ $t('guide.resize.features.custom') }}</span>
          </li>
          <li>
            <i class="fas fa-link"></i>
            <span>{{ $t('guide.resize.features.aspectRatio') }}</span>
          </li>
          <li>
            <i class="fas fa-th-list"></i>
            <span>{{ $t('guide.resize.features.presets') }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Export Section -->
    <section class="content-section">
      <h2 class="section-title">
        <i class="fas fa-download"></i>
        {{ $t('guide.export.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.export.description') }}</p>
        <ol class="numbered-list">
          <li>{{ $t('guide.export.steps.step1') }}</li>
          <li>{{ $t('guide.export.steps.step2') }}</li>
          <li>{{ $t('guide.export.steps.step3') }}</li>
        </ol>
        <div class="formats-info">
          <h4>{{ $t('guide.export.formatsTitle') }}</h4>
          <div class="format-badges">
            <span class="format-badge">PNG</span>
            <span class="format-badge">JPEG</span>
            <span class="format-badge">WebP</span>
            <span class="format-badge">GIF</span>
            <span class="format-badge">TIFF</span>
            <span class="format-badge">PDF</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Section -->
    <section class="content-section alt-bg">
      <h2 class="section-title">
        <i class="fas fa-images"></i>
        {{ $t('guide.gallery.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.gallery.description') }}</p>
        <ul class="feature-list">
          <li>
            <i class="fas fa-plus-circle"></i>
            <span>{{ $t('guide.gallery.features.upload') }}</span>
          </li>
          <li>
            <i class="fas fa-eye"></i>
            <span>{{ $t('guide.gallery.features.preview') }}</span>
          </li>
          <li>
            <i class="fas fa-edit"></i>
            <span>{{ $t('guide.gallery.features.openEditor') }}</span>
          </li>
          <li>
            <i class="fas fa-download"></i>
            <span>{{ $t('guide.gallery.features.download') }}</span>
          </li>
          <li>
            <i class="fas fa-trash-alt"></i>
            <span>{{ $t('guide.gallery.features.delete') }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Undo/Redo Section -->
    <section class="content-section">
      <h2 class="section-title">
        <i class="fas fa-history"></i>
        {{ $t('guide.history.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.history.description') }}</p>
        <div class="shortcuts-box">
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Z</kbd>
            <span>{{ $t('guide.history.undo') }}</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Y</kbd>
            <span>{{ $t('guide.history.redo') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Settings Section -->
    <section class="content-section alt-bg">
      <h2 class="section-title">
        <i class="fas fa-cog"></i>
        {{ $t('guide.settings.title') }}
      </h2>
      <div class="feature-description">
        <p>{{ $t('guide.settings.description') }}</p>
        <ul class="feature-list">
          <li>
            <i class="fas fa-language"></i>
            <span>{{ $t('guide.settings.features.language') }}</span>
          </li>
          <li>
            <i class="fas fa-moon"></i>
            <span>{{ $t('guide.settings.features.theme') }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <h2>{{ $t('guide.cta.title') }}</h2>
      <p>{{ $t('guide.cta.description') }}</p>
      <router-link to="/editor" class="cta-button">
        <i class="fas fa-rocket"></i>
        {{ $t('guide.cta.button') }}
      </router-link>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const presets = ['original', 'vibrant', 'vintage', 'blackWhite', 'dramatic', 'soft', 'warm', 'cool']

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
.guide-view {
  min-height: 100vh;
}

.hero-section {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-light-blue) 0%, var(--color-bg-primary) 100%);

  h1 {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
    color: var(--color-text-primary);

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
  max-width: 1000px;
  margin: 0 auto;

  &.alt-bg {
    max-width: 100%;
    background: var(--color-bg-secondary);

    > * {
      max-width: 1000px;
      margin-left: auto;
      margin-right: auto;
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: 1.8rem;
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);

  i {
    color: var(--color-primary);
    font-size: 1.5rem;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.quick-start-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
  }

  .step-number {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    border-radius: 50%;
  }

  .step-content {
    h3 {
      font-size: 1.2rem;
      margin-bottom: var(--spacing-sm);
    }

    p {
      color: var(--color-text-secondary);
      line-height: 1.6;
    }
  }
}

.feature-description {
  p {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    line-height: 1.7;
    margin-bottom: var(--spacing-lg);
  }
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-lg) 0;

  li {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
    font-size: 1.05rem;

    i {
      color: var(--color-primary);
      width: 24px;
      text-align: center;
    }
  }

  &.icon-list li {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
    margin-bottom: var(--spacing-sm);
  }
}

.numbered-list {
  padding-left: var(--spacing-xl);
  margin: 0 0 var(--spacing-lg) 0;

  li {
    padding: var(--spacing-sm) 0;
    font-size: 1.05rem;
    color: var(--color-text-secondary);
    line-height: 1.6;

    &::marker {
      color: var(--color-primary);
      font-weight: 600;
    }
  }
}

.formats-info {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);

  h4 {
    margin-bottom: var(--spacing-md);
    color: var(--color-text-primary);
  }
}

.format-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.format-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.filters-grid,
.transform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.filter-item,
.transform-item {
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-3px);
  }

  i {
    font-size: 2rem;
    color: var(--color-primary);
    margin-bottom: var(--spacing-md);
  }

  h4 {
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-primary);
  }

  p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.presets-showcase {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.preset-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .preset-icon {
    font-size: 1.5rem;
  }

  .preset-name {
    font-weight: 500;
  }
}

.tip-box {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary);

  i {
    color: var(--color-primary);
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
}

.shortcuts-box {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-lg);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  kbd {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    font-family: monospace;
    font-size: var(--font-size-sm);
    box-shadow: 0 2px 0 var(--color-border);
  }

  span {
    margin-left: var(--spacing-sm);
    color: var(--color-text-secondary);
  }
}

.cta-section {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, #0056b3 100%);
  color: white;

  h2 {
    font-size: 2rem;
    margin-bottom: var(--spacing-md);
  }

  p {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: var(--spacing-xl);
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-2xl);
    background: white;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: var(--border-radius-full);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
