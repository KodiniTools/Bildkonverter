<template>
  <div class="download-view">
    <section class="hero-section">
      <span class="eyebrow">
        <AppIcon name="laptop" :size="16" />
        {{ $t('download.eyebrow') }}
      </span>
      <h1>{{ $t('download.title') }}</h1>
      <p class="subtitle">{{ $t('download.subtitle') }}</p>
      <p class="requirements">{{ $t('download.requirements') }}</p>
    </section>

    <section class="files-section" :aria-label="$t('download.filesLabel')">
      <div class="files-grid">
        <article
          v-for="item in DESKTOP_DOWNLOADS"
          :key="item.key"
          class="file-card"
          :class="{ 'file-card--recommended': item.recommended }"
        >
          <span v-if="item.recommended" class="badge">{{ $t('download.recommended') }}</span>
          <div class="card-icon">
            <AppIcon :name="item.recommended ? 'download' : 'file-archive'" :size="28" />
          </div>
          <h2>{{ $t(`download.files.${item.key}.title`) }}</h2>
          <p>{{ $t(`download.files.${item.key}.description`) }}</p>
          <p class="file-name">{{ item.file }}</p>
          <UiButton
            :href="downloadUrl(item.file)"
            :variant="item.recommended ? 'primary' : 'secondary'"
            block
          >
            <template #icon><AppIcon name="download" :size="16" /></template>
            {{ $t('download.button', { ext: extension(item.file) }) }}
          </UiButton>
        </article>
      </div>
      <p class="size-note">{{ $t('download.sizeNote') }}</p>
    </section>

    <section class="notes-section">
      <h2>{{ $t('download.notes.title') }}</h2>
      <div class="notes-list">
        <div v-for="note in notes" :key="note.key" class="note-item">
          <AppIcon :name="note.icon" :size="20" />
          <div>
            <h3>{{ $t(`download.notes.${note.key}.title`) }}</h3>
            <p>{{ $t(`download.notes.${note.key}.description`) }}</p>
          </div>
        </div>
      </div>
      <p class="releases-link">
        <a :href="RELEASES_PAGE" target="_blank" rel="noopener noreferrer">
          {{ $t('download.allReleases') }}
        </a>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import UiButton from '@/components/ui/UiButton.vue';
import { DESKTOP_DOWNLOADS, RELEASES_PAGE, downloadUrl } from '@/lib/core/desktopDownloads';

/** Hinweise unter download.notes.<key> */
const notes = [
  { key: 'smartscreen', icon: 'shield-alt' },
  { key: 'offline', icon: 'check-circle' },
  { key: 'internet', icon: 'wifi' },
  { key: 'webview', icon: 'info-circle' },
] as const;

/** Endung in Großbuchstaben für die Button-Beschriftung (EXE, MSI) */
function extension(file: string): string {
  return (file.split('.').pop() ?? '').toUpperCase();
}
</script>

<style lang="scss" scoped>
.download-view {
  background: var(--ds-surface-0);
}

.hero-section {
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-8) var(--ds-space-10);

  @media (max-width: 768px) {
    padding: var(--ds-space-8) var(--ds-space-4);
  }

  h1 {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text);
    margin: var(--ds-space-4) 0;

    @media (max-width: 768px) {
      font-size: var(--ds-text-2xl);
    }
  }

  .subtitle {
    font-size: var(--ds-text-lg);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
    max-width: 640px;
    margin: 0 auto var(--ds-space-3);
  }

  .requirements {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-3);
    margin: 0;
  }
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-1) var(--ds-space-3);
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-full);
}

.files-section,
.notes-section {
  padding: var(--ds-space-10) var(--ds-space-8);

  @media (max-width: 768px) {
    padding: var(--ds-space-8) var(--ds-space-4);
  }
}

.notes-section {
  border-top: var(--ds-border-width) solid var(--ds-border);

  > h2 {
    text-align: center;
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-bold);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-8);
  }
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--ds-space-6);
  max-width: 1100px;
  margin: 0 auto;
}

.file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--ds-space-8) var(--ds-space-6) var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  &--recommended {
    border-color: var(--ds-accent);

    &:hover {
      border-color: var(--ds-accent-hover);
    }
  }

  .card-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--ds-space-4);
    color: var(--ds-text-2);
    background: var(--ds-surface-2);
    border-radius: var(--ds-radius-full);
  }

  &--recommended .card-icon {
    color: var(--ds-accent);
    background: var(--ds-accent-soft);
  }

  h2 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-bold);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-2);
  }

  p {
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0 0 var(--ds-space-3);
  }

  .file-name {
    font-family: var(--ds-font-mono);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-3);
    word-break: break-all;
    margin-top: auto;
    margin-bottom: var(--ds-space-4);
  }
}

.badge {
  position: absolute;
  top: calc(-1 * var(--ds-space-3));
  left: 50%;
  transform: translateX(-50%);
  padding: var(--ds-space-1) var(--ds-space-3);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-bold);
  color: var(--ds-on-accent);
  background: var(--ds-accent);
  border-radius: var(--ds-radius-full);
  white-space: nowrap;
}

.size-note {
  text-align: center;
  font-size: var(--ds-text-sm);
  color: var(--ds-text-3);
  margin: var(--ds-space-6) auto 0;
  max-width: 640px;
}

.notes-list {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.note-item {
  display: flex;
  gap: var(--ds-space-4);
  align-items: flex-start;
  padding: var(--ds-space-5) var(--ds-space-6);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);

  > :first-child {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--ds-text-2);
  }

  h3 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-bold);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-1);
  }

  p {
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
  }
}

.releases-link {
  text-align: center;
  margin-top: var(--ds-space-8);

  a {
    color: var(--ds-text-2);
    text-decoration: underline;

    &:hover {
      color: var(--ds-text);
    }
  }
}
</style>
