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
          <AppIcon name="book-open" />
          <span>{{ $t('guide.badge') || 'Benutzerhandbuch' }}</span>
        </div>
        <h1>{{ $t('guide.title') }}</h1>
        <p class="subtitle">{{ $t('guide.subtitle') }}</p>
        <div class="hero-cta">
          <router-link to="/editor" class="btn-hero-primary">
            <AppIcon name="rocket" />
            {{ $t('guide.cta.button') }}
          </router-link>
          <a href="#quick-start" class="btn-hero-secondary">
            <AppIcon name="arrow-down" />
            {{ $t('guide.quickStart.title') }}
          </a>
        </div>
      </div>
    </section>

    <!-- Quick Start Section -->
    <section id="quick-start" class="section section-white">
      <div class="section-container">
        <GuideSectionHeader
          icon="fas fa-play-circle"
          :title="$t('guide.quickStart.title')"
          :description="
            $t('guide.quickStart.subtitle') || 'In nur drei einfachen Schritten zum perfekten Bild'
          "
        />
        <div class="steps-container">
          <div v-for="(step, index) in 3" :key="index" class="step-card">
            <div class="step-number-wrapper">
              <div class="step-number">{{ index + 1 }}</div>
              <div v-if="index < 2" class="step-line"></div>
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
                <AppIcon name="cloud-upload-alt" :size="32" />
              </div>
              <div class="format-badges-circle">
                <span
                  v-for="format in ['PNG', 'JPEG', 'WebP', 'GIF', 'TIFF', 'HEIF']"
                  :key="format"
                  class="format-badge"
                  >{{ format }}</span
                >
              </div>
            </div>
          </div>
          <div class="section-text">
            <GuideSectionHeader
              icon="fas fa-upload"
              :title="$t('guide.upload.title')"
              align="left"
            />
            <p class="section-intro">{{ $t('guide.upload.description') }}</p>
            <div class="feature-cards">
              <div v-for="(method, key) in uploadMethods" :key="key" class="feature-card">
                <div class="feature-card-icon">
                  <AppIcon :name="method.icon" :size="20" />
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
        <GuideSectionHeader
          icon="fas fa-sliders-h"
          :title="$t('guide.filters.title')"
          :description="$t('guide.filters.description')"
        />
        <div class="filters-grid">
          <div v-for="filter in filters" :key="filter.key" class="filter-card">
            <div class="filter-icon">
              <AppIcon :name="filter.icon" :size="20" />
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
        <GuideSectionHeader
          icon="fas fa-magic"
          :title="$t('guide.presets.title')"
          :description="$t('guide.presets.description')"
          light
        />
        <div class="presets-showcase">
          <div v-for="preset in presets" :key="preset" class="preset-card">
            <div class="preset-icon"><AppIcon :name="getPresetIcon(preset)" :size="20" /></div>
            <span class="preset-name">{{ $t(`guide.presets.list.${preset}`) }}</span>
          </div>
        </div>
        <div class="tip-box tip-box-light">
          <div class="tip-icon">
            <AppIcon name="lightbulb" :size="20" />
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
            <GuideSectionHeader
              icon="fas fa-crop-alt"
              :title="$t('guide.crop.title')"
              align="left"
            />
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
        <GuideSectionHeader
          icon="fas fa-sync-alt"
          :title="$t('guide.transform.title')"
          :description="$t('guide.transform.description')"
        />
        <div class="transform-grid">
          <div v-for="transform in transforms" :key="transform.key" class="transform-card">
            <div class="transform-icon">
              <AppIcon :name="transform.icon" :size="20" />
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
                <span class="text-option"><AppIcon name="bold" /></span>
                <span class="text-option"><AppIcon name="italic" /></span>
                <span class="text-option"><AppIcon name="palette" /></span>
              </div>
            </div>
          </div>
          <div class="section-text">
            <GuideSectionHeader icon="fas fa-font" :title="$t('guide.text.title')" align="left" />
            <p class="section-intro">{{ $t('guide.text.description') }}</p>
            <div class="feature-list-grid">
              <div v-for="feature in textFeatures" :key="feature.key" class="feature-list-item">
                <AppIcon :name="feature.icon" />
                <span>{{ $t(`guide.text.features.${feature.key}`) }}</span>
              </div>
            </div>
            <div class="tip-box">
              <div class="tip-icon">
                <AppIcon name="lightbulb" :size="20" />
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
            <GuideSectionHeader
              icon="fas fa-expand-arrows-alt"
              :title="$t('guide.resize.title')"
              align="left"
            />
            <p class="section-intro">{{ $t('guide.resize.description') }}</p>
            <div class="feature-cards feature-cards-column">
              <div v-for="feature in resizeFeatures" :key="feature.key" class="feature-card">
                <div class="feature-card-icon">
                  <AppIcon :name="feature.icon" :size="20" />
                </div>
                <span>{{ $t(`guide.resize.features.${feature.key}`) }}</span>
              </div>
            </div>
          </div>
          <div class="section-visual">
            <div class="visual-card visual-card-resize">
              <div class="resize-preview">
                <div class="resize-box resize-box-small"></div>
                <div class="resize-arrow"><AppIcon name="arrows-alt" :size="20" /></div>
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
        <GuideSectionHeader
          icon="fas fa-download"
          :title="$t('guide.export.title')"
          :description="$t('guide.export.description')"
        />
        <div class="export-content">
          <div class="export-steps">
            <div v-for="step in 3" :key="step" class="export-step">
              <div class="export-step-number">{{ step }}</div>
              <p>{{ $t(`guide.export.steps.step${step}`) }}</p>
            </div>
          </div>
          <div class="export-formats">
            <h4>{{ $t('guide.export.formatsTitle') }}</h4>
            <div class="format-badges-row">
              <span
                v-for="format in ['PNG', 'JPEG', 'WebP', 'GIF', 'TIFF', 'PDF']"
                :key="format"
                class="format-badge format-badge-large"
              >
                <AppIcon name="file-image" />
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
                <div v-for="n in 4" :key="n" class="gallery-item"></div>
              </div>
            </div>
          </div>
          <div class="section-text">
            <GuideSectionHeader
              icon="fas fa-images"
              :title="$t('guide.gallery.title')"
              align="left"
            />
            <p class="section-intro">{{ $t('guide.gallery.description') }}</p>
            <div class="feature-list-grid">
              <div v-for="feature in galleryFeatures" :key="feature.key" class="feature-list-item">
                <AppIcon :name="feature.icon" />
                <span>{{ $t(`guide.gallery.features.${feature.key}`) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Collage & Layers Section -->
    <section class="section section-white">
      <div class="section-container">
        <div class="section-grid">
          <div class="section-text">
            <GuideSectionHeader
              icon="fas fa-layer-group"
              :title="$t('guide.collage.title')"
              align="left"
            />
            <p class="section-intro">{{ $t('guide.collage.description') }}</p>
            <div class="feature-list-grid">
              <div v-for="feature in collageFeatures" :key="feature.key" class="feature-list-item">
                <AppIcon :name="feature.icon" />
                <span>{{ $t(`guide.collage.features.${feature.key}`) }}</span>
              </div>
            </div>
            <div class="tip-box" style="margin-top: var(--ds-space-5)">
              <div class="tip-icon"><AppIcon name="lightbulb" :size="20" /></div>
              <p>{{ $t('guide.collage.tip') }}</p>
            </div>
          </div>
          <div class="section-visual">
            <div class="visual-card visual-card-collage">
              <div class="collage-preview">
                <div class="collage-layer collage-layer-1"></div>
                <div class="collage-layer collage-layer-2"></div>
                <div class="collage-layer collage-layer-3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile Gestures Section -->
    <section class="section section-gradient">
      <div class="section-container">
        <GuideSectionHeader
          icon="fas fa-mobile-alt"
          :title="$t('guide.mobile.title')"
          :description="$t('guide.mobile.description')"
        />
        <div class="gestures-grid">
          <div v-for="gesture in mobileGestures" :key="gesture.key" class="gesture-card">
            <div class="gesture-icon">
              <AppIcon :name="gesture.icon" :size="20" />
            </div>
            <p>{{ $t(`guide.mobile.gestures.${gesture.key}`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Batch Processing Section -->
    <section class="section section-white">
      <div class="section-container">
        <div class="section-grid section-grid-reverse">
          <div class="section-visual">
            <div class="visual-card visual-card-batch">
              <div class="batch-preview">
                <div v-for="n in 3" :key="n" class="batch-item">
                  <AppIcon name="file-image" :size="20" />
                </div>
                <div class="batch-arrow">
                  <AppIcon name="arrow-right" :size="20" />
                </div>
                <div class="batch-zip">
                  <AppIcon name="file-archive" :size="20" />
                </div>
              </div>
            </div>
          </div>
          <div class="section-text">
            <GuideSectionHeader icon="fas fa-tasks" :title="$t('guide.batch.title')" align="left" />
            <p class="section-intro">{{ $t('guide.batch.description') }}</p>
            <div class="feature-list-grid">
              <div v-for="feature in batchFeatures" :key="feature.key" class="feature-list-item">
                <AppIcon :name="feature.icon" />
                <span>{{ $t(`guide.batch.features.${feature.key}`) }}</span>
              </div>
            </div>
            <router-link to="/batch" class="section-link-btn">
              <AppIcon name="arrow-right" />
              {{ $t('guide.batch.link') }}
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Privacy Section -->
    <section class="section section-dark">
      <div class="section-container">
        <GuideSectionHeader
          icon="fas fa-shield-alt"
          :title="$t('guide.privacy.title')"
          :description="$t('guide.privacy.description')"
          light
        />
        <div class="privacy-grid">
          <div v-for="feature in privacyFeatures" :key="feature.key" class="privacy-card">
            <div class="privacy-icon">
              <AppIcon :name="feature.icon" :size="20" />
            </div>
            <span>{{ $t(`guide.privacy.features.${feature.key}`) }}</span>
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
            <GuideSectionHeader
              icon="fas fa-history"
              :title="$t('guide.history.title')"
              align="left"
            />
            <p class="section-intro">{{ $t('guide.history.description') }}</p>
            <div class="shortcuts-box">
              <div v-for="shortcut in historyShortcuts" :key="shortcut.label" class="shortcut-item">
                <div class="shortcut-keys">
                  <template v-for="(key, i) in shortcut.keys" :key="key">
                    <span v-if="i > 0" class="shortcut-plus">+</span>
                    <kbd>{{ key }}</kbd>
                  </template>
                </div>
                <span class="shortcut-label">{{ $t(shortcut.label) }}</span>
              </div>
            </div>
          </div>
          <!-- Settings -->
          <div class="dual-section-card">
            <GuideSectionHeader
              icon="fas fa-cog"
              :title="$t('guide.settings.title')"
              align="left"
            />
            <p class="section-intro">{{ $t('guide.settings.description') }}</p>
            <div class="settings-options">
              <div v-for="option in settingsOptions" :key="option.key" class="settings-option">
                <div class="settings-option-icon">
                  <AppIcon :name="option.icon" :size="20" />
                </div>
                <span>{{ $t(`guide.settings.features.${option.key}`) }}</span>
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
          <AppIcon name="rocket" />
          {{ $t('guide.cta.button') }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import GuideSectionHeader from '@/components/guide/GuideSectionHeader.vue';
import AppIcon from '@/components/ui/AppIcon.vue';

const presets = [
  'original',
  'vibrant',
  'vintage',
  'blackWhite',
  'dramatic',
  'soft',
  'warm',
  'cool',
];

const uploadMethods = {
  dragDrop: { icon: 'fas fa-mouse-pointer' },
  fileSelect: { icon: 'fas fa-folder-open' },
  url: { icon: 'fas fa-link' },
  demo: { icon: 'fas fa-image' },
};

const filters = [
  { key: 'brightness', icon: 'fas fa-sun' },
  { key: 'contrast', icon: 'fas fa-adjust' },
  { key: 'saturation', icon: 'fas fa-palette' },
  { key: 'grayscale', icon: 'fas fa-circle-half-stroke' },
  { key: 'sepia', icon: 'fas fa-coffee' },
  { key: 'sharpness', icon: 'fas fa-compress-arrows-alt' },
];

const transforms = [
  { key: 'rotate', icon: 'fas fa-redo' },
  { key: 'flip', icon: 'fas fa-arrows-alt-h' },
  { key: 'zoom', icon: 'fas fa-search-plus' },
  { key: 'border', icon: 'fas fa-border-style' },
];

const textFeatures = [
  { key: 'fontSize', icon: 'fas fa-text-height' },
  { key: 'color', icon: 'fas fa-paint-brush' },
  { key: 'fontFamily', icon: 'fas fa-font' },
  { key: 'rotation', icon: 'fas fa-undo' },
  { key: 'opacity', icon: 'fas fa-eye-dropper' },
  { key: 'stroke', icon: 'fas fa-border-all' },
  { key: 'shadow', icon: 'fas fa-cloud' },
];

const resizeFeatures = [
  { key: 'custom', icon: 'fas fa-ruler-combined' },
  { key: 'aspectRatio', icon: 'fas fa-link' },
  { key: 'presets', icon: 'fas fa-th-list' },
];

const galleryFeatures = [
  { key: 'upload', icon: 'fas fa-plus-circle' },
  { key: 'preview', icon: 'fas fa-eye' },
  { key: 'openEditor', icon: 'fas fa-edit' },
  { key: 'download', icon: 'fas fa-download' },
  { key: 'delete', icon: 'fas fa-trash-alt' },
];

const collageFeatures = [
  { key: 'addLayer', icon: 'fas fa-plus-circle' },
  { key: 'drag', icon: 'fas fa-arrows-alt' },
  { key: 'resize', icon: 'fas fa-expand-arrows-alt' },
  { key: 'order', icon: 'fas fa-layer-group' },
  { key: 'background', icon: 'fas fa-palette' },
  { key: 'merge', icon: 'fas fa-object-group' },
];

const mobileGestures = [
  { key: 'pinch', icon: 'fas fa-search-plus' },
  { key: 'drag', icon: 'fas fa-hand-paper' },
  { key: 'doubleTap', icon: 'fas fa-mouse-pointer' },
  { key: 'longPress', icon: 'fas fa-hand-point-up' },
  { key: 'tap', icon: 'fas fa-hand-pointer' },
];

const batchFeatures = [
  { key: 'multiUpload', icon: 'fas fa-images' },
  { key: 'formatConvert', icon: 'fas fa-sync-alt' },
  { key: 'qualitySet', icon: 'fas fa-sliders-h' },
  { key: 'zipDownload', icon: 'fas fa-file-archive' },
];

const privacyFeatures = [
  { key: 'local', icon: 'fas fa-laptop' },
  { key: 'noUpload', icon: 'fas fa-ban' },
  { key: 'noAccount', icon: 'fas fa-user-slash' },
  { key: 'offline', icon: 'fas fa-wifi' },
];

// Tastenkürzel im Abschnitt "Verlauf" (Texte unter guide.history.*)
const historyShortcuts = [
  { keys: ['Ctrl', 'Z'], label: 'guide.history.undo' },
  { keys: ['Ctrl', 'Y'], label: 'guide.history.redo' },
  { keys: ['T'], label: 'guide.history.shortcuts.addText' },
  { keys: ['Esc'], label: 'guide.history.shortcuts.escape' },
  { keys: ['Del'], label: 'guide.history.shortcuts.delete' },
  { keys: ['Ctrl', 'V'], label: 'guide.history.shortcuts.pasteImage' },
];

const settingsOptions = [
  { key: 'language', icon: 'fas fa-language' },
  { key: 'theme', icon: 'fas fa-moon' },
];

function getPresetIcon(preset) {
  const icons = {
    original: 'palette',
    vibrant: 'paint-brush',
    vintage: 'image',
    blackWhite: 'adjust',
    dramatic: 'bolt',
    soft: 'cloud',
    warm: 'sun',
    cool: 'moon',
  };
  return icons[preset] || 'magic';
}
</script>

<style lang="scss" scoped>
// Inhaltsseite im Stil der Collage-Maker-Landing-Page: flache Abschnitte auf
// surface-0, Karten surface-1 mit 1-px-Rahmen, Hover nur Rahmenfarbe.
$content-max-width: 1100px;
$transition-colors:
  background-color var(--ds-duration) var(--ds-ease),
  border-color var(--ds-duration) var(--ds-ease),
  color var(--ds-duration) var(--ds-ease);

// Wiederkehrendes Icon-Feld in Karten (40 px, Icon 20 in --ds-text-2)
@mixin icon-tile {
  width: var(--ds-control-lg);
  height: var(--ds-control-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--ds-surface-2);
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-2);
}

// Karte: surface-1, 1-px-Rahmen, Hover nur Rahmen
@mixin content-card($radius: var(--ds-radius-lg)) {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: $radius;
  transition: border-color var(--ds-duration) var(--ds-ease);
}

// ===== GUIDE VIEW CONTAINER =====
.guide-view {
  min-height: 100vh;
  overflow-x: hidden;
  background: var(--ds-surface-0);
  color: var(--ds-text);
}

// ===== HERO SECTION =====
.hero-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-16) var(--ds-space-12) var(--ds-space-12);
  background: var(--ds-surface-0);

  @media (max-width: 768px) {
    padding: var(--ds-space-8) var(--ds-space-4);
  }

  // Dekorative Verlaufs-Ebenen entfallen im flachen Design
  .hero-background {
    display: none;
  }

  .hero-content {
    position: relative;
    text-align: center;
    max-width: 700px;
    color: var(--ds-text);
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-sm);
    padding: 0 var(--ds-space-3);
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-full);
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    line-height: 1;
    margin-bottom: var(--ds-space-5);
  }

  h1 {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    letter-spacing: var(--ds-tracking-tight);
    line-height: var(--ds-leading-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-4);

    @media (max-width: 768px) {
      font-size: var(--ds-text-2xl);
    }
  }

  .subtitle {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    max-width: 550px;
    margin: 0 auto var(--ds-space-8);
  }

  .hero-cta {
    display: flex;
    gap: var(--ds-space-3);
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-hero-primary,
  .btn-hero-secondary {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-lg);
    padding: 0 var(--ds-space-5);
    border: var(--ds-border-width) solid transparent;
    border-radius: var(--ds-radius-md);
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-medium);
    line-height: 1;
    text-decoration: none;
    transition: $transition-colors;

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
    }
  }

  .btn-hero-primary {
    background: var(--ds-accent);
    color: var(--ds-on-accent);
    font-weight: var(--ds-weight-semibold);

    &:hover {
      background: var(--ds-accent-hover);
      color: var(--ds-on-accent);
    }
  }

  .btn-hero-secondary {
    background: var(--ds-surface-2);
    color: var(--ds-text);
    border-color: var(--ds-border-strong);

    &:hover {
      background: var(--ds-surface-3);
      color: var(--ds-text);
    }
  }
}

// ===== SECTIONS =====
.section {
  padding: var(--ds-space-16) var(--ds-space-12);
  position: relative;
  background: var(--ds-surface-0);
  border-top: var(--ds-border-width) solid var(--ds-border);

  @media (max-width: 768px) {
    padding: var(--ds-space-10) var(--ds-space-4);
  }
}

// Frühere Wechsel-Hintergründe (weiß/Verlauf/dunkel) sind eine flache Seite
.section-white,
.section-gradient,
.section-dark {
  background: var(--ds-surface-0);
  color: var(--ds-text);
}

.section-container {
  max-width: $content-max-width;
  margin: 0 auto;
}

// ===== SECTION GRID =====
.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-12);
  align-items: center;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: var(--ds-space-8);
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
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin-bottom: var(--ds-space-6);
  }
}

// ===== VISUAL CARDS =====
.section-visual {
  display: flex;
  justify-content: center;
}

.visual-card {
  @include content-card;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-8);
  position: relative;
  overflow: hidden;

  .visual-icon-large {
    width: var(--ds-space-16);
    height: var(--ds-space-16);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-6);
  }
}

.format-badges-circle {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--ds-space-2);
  max-width: 280px;
}

.format-badge {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-3);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-full);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  line-height: 1;
}

// ===== STEPS =====
.steps-container {
  display: flex;
  flex-direction: column;
  max-width: 700px;
  margin: 0 auto;
}

.step-card {
  display: flex;
  gap: var(--ds-space-6);
  position: relative;
}

.step-number-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-number {
  width: var(--ds-space-16);
  height: var(--ds-space-16);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-accent);
  color: var(--ds-on-accent);
  font-size: var(--ds-text-2xl);
  font-weight: var(--ds-weight-bold);
  line-height: 1;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step-line {
  width: var(--ds-border-width);
  flex: 1;
  min-height: var(--ds-space-10);
  background: var(--ds-border);
  margin: var(--ds-space-2) 0;
}

.step-content {
  padding: var(--ds-space-3) 0 var(--ds-space-8);
  flex: 1;

  h3 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    margin-bottom: var(--ds-space-2);
    color: var(--ds-text);
  }

  p {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}

// ===== FEATURE CARDS =====
.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ds-space-4);

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }

  &.feature-cards-column {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  @include content-card(var(--ds-radius-md));
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4) var(--ds-space-5);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .feature-card-icon {
    @include icon-tile;
  }

  span {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text);
  }
}

// ===== FILTERS GRID =====
.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ds-space-6);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.filter-card {
  @include content-card;
  padding: var(--ds-space-6);
  text-align: center;

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .filter-icon {
    @include icon-tile;
    margin: 0 auto var(--ds-space-4);
  }

  h4 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    margin-bottom: var(--ds-space-2);
    color: var(--ds-text);
  }

  p {
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    margin: 0;
    line-height: var(--ds-leading);
  }
}

// ===== PRESETS SHOWCASE =====
.presets-showcase {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-8);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.preset-card {
  @include content-card;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-5) var(--ds-space-3);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .preset-icon {
    @include icon-tile;
  }

  .preset-name {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text);
  }
}

// ===== TIP BOX (Callout: surface-2, Info nur im Icon) =====
.tip-box {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  background: var(--ds-surface-2);
  border-radius: var(--ds-radius-md);
  margin-top: var(--ds-space-6);

  .tip-icon {
    display: flex;
    flex-shrink: 0;
    color: var(--ds-info);
  }

  p {
    margin: 0;
    font-size: var(--ds-text-md);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
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
    gap: var(--ds-space-4);
    padding: var(--ds-space-4) 0;
    border-bottom: var(--ds-border-width) solid var(--ds-border);
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);

    &:last-child {
      border-bottom: none;
    }

    .step-marker {
      width: var(--ds-control-sm);
      height: var(--ds-control-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ds-surface-2);
      border: var(--ds-border-width) solid var(--ds-border-strong);
      color: var(--ds-text);
      font-size: var(--ds-text-sm);
      font-weight: var(--ds-weight-semibold);
      line-height: 1;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }
}

// ===== TRANSFORM GRID =====
.transform-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-6);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.transform-card {
  @include content-card;
  padding: var(--ds-space-6) var(--ds-space-5);
  text-align: center;

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .transform-icon {
    @include icon-tile;
    margin: 0 auto var(--ds-space-3);
  }

  h4 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    margin-bottom: var(--ds-space-2);
    color: var(--ds-text);
  }

  p {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin: 0;
    line-height: var(--ds-leading);
  }
}

// ===== FEATURE LIST GRID =====
.feature-list-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ds-space-3);

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.feature-list-item {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .app-icon {
    color: var(--ds-text-2);
  }

  span {
    font-size: var(--ds-text-md);
    color: var(--ds-text);
  }
}

// ===== VISUAL CARD VARIANTS =====
.visual-card-crop {
  .crop-preview {
    width: 200px;
    height: 152px;
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .crop-frame {
    width: 120px;
    height: 88px;
    border: var(--ds-border-width) dashed var(--ds-accent);
    position: relative;
  }

  .crop-corner {
    position: absolute;
    width: var(--ds-space-2);
    height: var(--ds-space-2);
    background: var(--ds-accent);

    &-tl {
      top: calc(var(--ds-space-1) * -1);
      left: calc(var(--ds-space-1) * -1);
    }
    &-tr {
      top: calc(var(--ds-space-1) * -1);
      right: calc(var(--ds-space-1) * -1);
    }
    &-bl {
      bottom: calc(var(--ds-space-1) * -1);
      left: calc(var(--ds-space-1) * -1);
    }
    &-br {
      bottom: calc(var(--ds-space-1) * -1);
      right: calc(var(--ds-space-1) * -1);
    }
  }
}

.visual-card-text {
  .text-preview {
    width: 152px;
    height: 152px;
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--ds-space-6);

    .preview-text {
      font-size: var(--ds-text-3xl);
      font-weight: var(--ds-weight-bold);
      line-height: var(--ds-leading-tight);
      color: var(--ds-text);
    }
  }

  .text-options {
    display: flex;
    gap: var(--ds-space-2);

    .text-option {
      width: var(--ds-control-md);
      height: var(--ds-control-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ds-surface-2);
      border: var(--ds-border-width) solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      color: var(--ds-text-2);
    }
  }
}

.visual-card-resize {
  .resize-preview {
    display: flex;
    align-items: center;
    gap: var(--ds-space-6);

    .resize-box {
      background: var(--ds-surface-2);
      border: var(--ds-border-width) solid var(--ds-border-strong);
      border-radius: var(--ds-radius-sm);

      &-small {
        width: 60px;
        height: 60px;
      }

      &-large {
        width: 120px;
        height: 120px;
        background: var(--ds-accent-soft);
        border-color: var(--ds-accent);
      }
    }

    .resize-arrow {
      display: flex;
      color: var(--ds-text-2);
    }
  }
}

.visual-card-gallery {
  .gallery-preview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--ds-space-4);
    width: 100%;
    max-width: 280px;

    .gallery-item {
      aspect-ratio: 1;
      background: var(--ds-surface-2);
      border: var(--ds-border-width) solid var(--ds-border);
      border-radius: var(--ds-radius-md);
    }
  }
}

// ===== EXPORT SECTION =====
.export-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--ds-space-12);
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--ds-space-8);
  }
}

.export-steps {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-6);
}

.export-step {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-5);

  .export-step-number {
    width: var(--ds-control-md);
    height: var(--ds-control-md);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-bold);
    line-height: 1;
    border-radius: 50%;
    flex-shrink: 0;
  }

  p {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
    padding-top: var(--ds-space-1);
  }
}

.export-formats {
  @include content-card;
  padding: var(--ds-space-6);

  h4 {
    margin-bottom: var(--ds-space-4);
    color: var(--ds-text);
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
  }
}

.format-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
}

.format-badge-large {
  gap: var(--ds-space-2);
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  font-size: var(--ds-text-sm);
}

// ===== DUAL SECTION GRID =====
.dual-section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--ds-space-8);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.dual-section-card {
  @include content-card;
  padding: var(--ds-space-8);

  @media (max-width: 768px) {
    padding: var(--ds-space-5);
  }
}

// ===== SHORTCUTS BOX =====
.shortcuts-box {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-6);
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-2);
  border-radius: var(--ds-radius-md);

  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
  }

  // Wie UiKbd: surface-2, 2-px-Unterkante
  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 22px;
    padding: 0 calc(var(--ds-space-1) + 2px);
    box-sizing: border-box;
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-bottom-width: 2px;
    border-radius: var(--ds-radius-sm);
    color: var(--ds-text);
    font-family: inherit;
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    line-height: 1;
    white-space: nowrap;
  }

  .shortcut-plus {
    color: var(--ds-text-3);
    font-size: var(--ds-text-xs);
  }

  .shortcut-label {
    color: var(--ds-text-2);
    font-size: var(--ds-text-md);
  }
}

// ===== SETTINGS OPTIONS =====
.settings-options {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-6);
}

.settings-option {
  display: flex;
  align-items: center;
  gap: var(--ds-space-4);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .settings-option-icon {
    @include icon-tile;
    background: var(--ds-surface-1);
  }

  span {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text);
  }
}

// ===== CTA SECTION =====
.cta-section {
  position: relative;
  padding: var(--ds-space-16) var(--ds-space-4);
  background: var(--ds-surface-0);
  border-top: var(--ds-border-width) solid var(--ds-border);

  @media (max-width: 768px) {
    padding: var(--ds-space-10) var(--ds-space-4);
  }

  .cta-background {
    display: none;
  }

  .cta-content {
    @include content-card;
    position: relative;
    text-align: center;
    max-width: 672px;
    margin: 0 auto;
    padding: var(--ds-space-12);
    color: var(--ds-text);

    @media (max-width: 768px) {
      padding: var(--ds-space-5);
    }

    h2 {
      font-size: var(--ds-text-2xl);
      font-weight: var(--ds-weight-bold);
      line-height: var(--ds-leading-tight);
      color: var(--ds-text);
      margin-bottom: var(--ds-space-4);
    }

    p {
      font-size: var(--ds-text-lg);
      color: var(--ds-text-2);
      line-height: var(--ds-leading);
      margin-bottom: var(--ds-space-8);
    }
  }

  .cta-button {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-lg);
    padding: 0 var(--ds-space-5);
    background: var(--ds-accent);
    color: var(--ds-on-accent);
    text-decoration: none;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: 1;
    border-radius: var(--ds-radius-md);
    transition: $transition-colors;

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

// ===== COLLAGE VISUAL =====
.visual-card-collage {
  .collage-preview {
    position: relative;
    width: 200px;
    height: 180px;
  }

  .collage-layer {
    position: absolute;
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-md);

    &-1 {
      width: 140px;
      height: 140px;
      background: var(--ds-surface-2);
      top: 0;
      left: 0;
    }

    &-2 {
      width: 112px;
      height: 112px;
      background: var(--ds-surface-3);
      top: 32px;
      left: 48px;
    }

    &-3 {
      width: 88px;
      height: 88px;
      background: var(--ds-surface-1);
      border-color: var(--ds-accent);
      top: 60px;
      left: 96px;
    }
  }
}

// ===== GESTURES GRID =====
.gestures-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--ds-space-4);

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.gesture-card {
  @include content-card;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-6) var(--ds-space-4);
  text-align: center;

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .gesture-icon {
    @include icon-tile;
  }

  p {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin: 0;
    line-height: var(--ds-leading);
  }
}

// ===== BATCH VISUAL =====
.visual-card-batch {
  .batch-preview {
    display: flex;
    align-items: center;
    gap: var(--ds-space-4);
    flex-wrap: wrap;
    justify-content: center;

    .batch-item {
      width: var(--ds-space-12);
      height: var(--ds-space-16);
      background: var(--ds-surface-2);
      border: var(--ds-border-width) solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ds-text-2);
    }

    .batch-arrow {
      display: flex;
      color: var(--ds-text-3);
    }

    .batch-zip {
      width: var(--ds-space-16);
      height: var(--ds-space-16);
      background: var(--ds-accent-soft);
      border: var(--ds-border-width) solid var(--ds-accent);
      border-radius: var(--ds-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ds-text);
    }
  }
}

// ===== SECTION LINK BUTTON (Sekundär, wie .btn-secondary) =====
.section-link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  height: var(--ds-control-md);
  margin-top: var(--ds-space-6);
  padding: 0 var(--ds-space-4);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  color: var(--ds-text);
  text-decoration: none;
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  transition: $transition-colors;

  &:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

// ===== PRIVACY GRID =====
.privacy-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--ds-space-4);

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.privacy-card {
  @include content-card;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-6) var(--ds-space-4);
  text-align: center;

  &:hover {
    border-color: var(--ds-border-strong);
  }

  .privacy-icon {
    @include icon-tile;
  }

  span {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text);
    line-height: var(--ds-leading);
  }
}
</style>
