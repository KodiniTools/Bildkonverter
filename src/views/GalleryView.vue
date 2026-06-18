<template>
  <div class="gallery-view">
    <!-- Page Header -->
    <header class="page-header">
      <div class="page-header__title">
        <i class="fas fa-images"></i>
        <div>
          <h1>{{ $t('gallery.title', 'Galerie') }}</h1>
          <p>{{ $t('gallery.subtitle', 'Verwalten Sie Ihre Bilder') }}</p>
        </div>
      </div>
      <span v-if="galleryStore.images.length > 0" class="image-count-badge">
        {{ galleryStore.images.length }}
        {{
          galleryStore.images.length === 1
            ? $t('gallery.imageCount.single')
            : $t('gallery.imageCount.plural')
        }}
      </span>
    </header>

    <!-- Handoff Banner -->
    <HandoffReceiver @accept="handleHandoffAccept" @dismiss="handleHandoffDismiss" />

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar__group">
        <button class="tb-btn tb-btn--primary" @click="triggerFileInput">
          <i class="fas fa-upload"></i>
          <span>{{ $t('gallery.buttons.upload') }}</span>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="handleFileSelect"
        />
        <button class="tb-btn" @click="triggerFolderInput">
          <i class="fas fa-folder-open"></i>
          <span>{{ $t('gallery.buttons.uploadFolder') }}</span>
        </button>
        <input
          ref="folderInput"
          type="file"
          accept="image/*"
          multiple
          webkitdirectory
          style="display: none"
          @change="handleFolderSelect"
        />

        <div v-if="galleryStore.images.length > 1" class="toolbar__separator"></div>

        <button
          v-if="galleryStore.images.length > 1"
          class="tb-btn"
          :class="{ 'tb-btn--active': isMultiSelectMode }"
          @click="toggleMultiSelectMode"
        >
          <i class="fas" :class="isMultiSelectMode ? 'fa-times' : 'fa-object-group'"></i>
          <span>{{
            isMultiSelectMode
              ? $t('gallery.buttons.cancelSelection', 'Abbrechen')
              : $t('gallery.buttons.selectMultiple', 'Mehrfachauswahl')
          }}</span>
        </button>

        <template v-if="isMultiSelectMode">
          <button
            class="tb-btn"
            @click="
              galleryStore.selectedImageIds.length === galleryStore.images.length
                ? galleryStore.deselectAllImages()
                : galleryStore.selectAllImages()
            "
          >
            <i
              class="fas"
              :class="
                galleryStore.selectedImageIds.length === galleryStore.images.length
                  ? 'fa-square'
                  : 'fa-check-square'
              "
            ></i>
            <span>{{
              galleryStore.selectedImageIds.length === galleryStore.images.length
                ? $t('gallery.buttons.deselectAll', 'Alle abwählen')
                : $t('gallery.buttons.selectAll', 'Alle auswählen')
            }}</span>
          </button>
          <button
            v-if="galleryStore.hasMultipleSelected"
            class="tb-btn tb-btn--accent"
            @click="createCollage"
          >
            <i class="fas fa-layer-group"></i>
            <span>{{ $t('gallery.buttons.createCollage', 'Collage') }} ({{ galleryStore.selectedImageIds.length }})</span>
          </button>
        </template>
      </div>

      <div class="toolbar__group">
        <template v-if="galleryStore.selectedImage() && !isMultiSelectMode">
          <button class="tb-btn tb-btn--primary" @click="openInEditor">
            <i class="fas fa-edit"></i>
            <span>{{ $t('gallery.buttons.addToEditor') }}</span>
          </button>
          <button class="tb-btn tb-btn--danger" @click="deleteSelected">
            <i class="fas fa-trash"></i>
          </button>
        </template>
        <button
          v-if="galleryStore.images.length > 0"
          class="tb-btn tb-btn--danger-ghost"
          :title="$t('gallery.tooltips.deleteAll')"
          @click="deleteAllImages"
        >
          <i class="fas fa-trash-alt"></i>
          <span>{{ $t('gallery.buttons.deleteAll') }}</span>
        </button>
      </div>
    </div>

    <!-- Paste Hint -->
    <div v-if="galleryStore.images.length === 0 || true" class="paste-hint">
      <i class="fas fa-clipboard"></i>
      <span>{{ $t('gallery.pasteHint', 'Bilder direkt per') }}</span>
      <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd>
      <span>{{ $t('gallery.pasteHint2', 'einfügen') }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="galleryStore.images.length === 0" class="empty-state">
      <div class="empty-state__icon">
        <i class="fas fa-images"></i>
      </div>
      <h3>{{ $t('gallery.empty.title') }}</h3>
      <p>{{ $t('gallery.empty.description') }}</p>
      <div class="empty-state__actions">
        <button class="btn btn-primary" @click="triggerFileInput">
          <i class="fas fa-upload"></i>
          {{ $t('gallery.buttons.upload') }}
        </button>
      </div>
      <div class="empty-state__shortcut">
        <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd>
        <span>{{ $t('gallery.pasteShortcutHint', 'aus Zwischenablage einfügen') }}</span>
      </div>
    </div>

    <!-- Gallery Grid -->
    <div v-else class="gallery-grid">
      <div
        v-for="image in galleryStore.images"
        :key="image.id"
        class="gallery-card"
        :class="{
          selected: !isMultiSelectMode && galleryStore.selectedImageId === image.id,
          'multi-selected': isMultiSelectMode && galleryStore.isImageSelected(image.id),
        }"
        @click="handleImageClick(image.id)"
      >
        <!-- Thumbnail -->
        <div class="gallery-card__thumb">
          <img :src="image.thumbnail" :alt="image.name" />

          <div
            v-if="isMultiSelectMode"
            class="gallery-card__checkbox"
            @click.stop="galleryStore.toggleImageSelection(image.id)"
          >
            <i
              class="fas"
              :class="galleryStore.isImageSelected(image.id) ? 'fa-check-square' : 'fa-square'"
            ></i>
          </div>
          <div v-else class="gallery-card__select-dot">
            <i
              class="fas"
              :class="galleryStore.selectedImageId === image.id ? 'fa-check-circle' : 'fa-circle'"
            ></i>
          </div>

          <button
            class="gallery-card__preview-btn"
            :title="$t('gallery.buttons.preview')"
            @click.stop="openPreview(image)"
          >
            <i class="fas fa-search-plus"></i>
          </button>
        </div>

        <!-- Image Info -->
        <div class="gallery-card__info">
          <div class="gallery-card__name" :title="image.name">{{ image.name }}</div>
          <div class="gallery-card__meta">
            <span><i class="fas fa-expand-arrows-alt"></i> {{ image.width }} × {{ image.height }}</span>
            <span><i class="fas fa-file"></i> {{ formatSize(image.size) }}</span>
          </div>
          <div class="gallery-card__date">
            <i class="fas fa-clock"></i> {{ formatDate(image.uploadedAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Overlay -->
    <Teleport to="body">
      <div v-if="previewImage" class="preview-overlay" @click="closePreview">
        <div class="preview-modal" @click.stop>
          <button class="preview-modal__close" @click="closePreview">
            <i class="fas fa-times"></i>
          </button>

          <div class="preview-modal__image">
            <img :src="previewImage.url" :alt="previewImage.name" />
          </div>

          <div class="preview-modal__footer">
            <div class="preview-modal__info">
              <h3>{{ previewImage.name }}</h3>
              <div class="preview-modal__meta">
                <span><i class="fas fa-ruler-combined"></i> {{ previewImage.width }} × {{ previewImage.height }}px</span>
                <span><i class="fas fa-file"></i> {{ formatSize(previewImage.size) }}</span>
                <span><i class="fas fa-calendar"></i> {{ formatDate(previewImage.uploadedAt) }}</span>
              </div>
            </div>
            <div class="preview-modal__actions">
              <button class="btn btn-primary" @click="openPreviewInEditor">
                <i class="fas fa-edit"></i>
                {{ $t('gallery.buttons.addToEditor', 'Im Editor öffnen') }}
              </button>
              <button class="btn btn-secondary" @click="downloadImage(previewImage)">
                <i class="fas fa-download"></i>
                {{ $t('gallery.buttons.download', 'Herunterladen') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGalleryStore } from '@/stores/galleryStore';
import { useImageStore } from '@/stores/imageStore';
import HandoffReceiver from '@/components/features/HandoffReceiver.vue';
import { handoffImageToCanvas } from '@/lib/core/handoff';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const galleryStore = useGalleryStore();
const imageStore = useImageStore();

const fileInput = ref(null);
const folderInput = ref(null);
const previewImage = ref(null);
const isMultiSelectMode = ref(false);

// ===== CLIPBOARD PASTE =====

function handlePaste(e) {
  const isInputFocused =
    document.activeElement?.tagName === 'INPUT' ||
    document.activeElement?.tagName === 'TEXTAREA' ||
    document.activeElement?.isContentEditable;
  if (isInputFocused) return;

  const items = e.clipboardData?.items;
  if (!items) return;

  let added = 0;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        const name = `clipboard-${Date.now()}.${item.type.split('/')[1] || 'png'}`;
        const namedFile = new File([file], name, { type: item.type });
        addImageToGallery(namedFile)
          .then(() => {
            added++;
            if (window.$toast) window.$toast.success(t('toast.gallery.pasted', 'Bild aus Zwischenablage hinzugefügt'));
          })
          .catch((err) => console.error('Paste error:', err));
      }
    }
  }
}

onMounted(() => window.addEventListener('paste', handlePaste));
onUnmounted(() => window.removeEventListener('paste', handlePaste));

// ===== HANDOFF =====

async function handleHandoffAccept(images) {
  for (const img of images) {
    try {
      const canvas = await handoffImageToCanvas(img);
      const thumbnailUrl = createThumbnail(canvas, 300, 300);
      galleryStore.addImage({
        id: Date.now() + Math.random(),
        name: img.name,
        url: img.dataUrl,
        thumbnail: thumbnailUrl,
        width: img.width,
        height: img.height,
        size: Math.round(img.dataUrl.length * 0.75),
        uploadedAt: new Date(),
        file: null,
      });
    } catch (error) {
      console.error(`[Handoff] Fehler beim Import von ${img.name}:`, error);
    }
  }
}

function handleHandoffDismiss() {}

// ===== UPLOAD =====

function triggerFileInput() { fileInput.value?.click(); }
function triggerFolderInput() { folderInput.value?.click(); }

async function handleFolderSelect(event) {
  const files = Array.from(event.target.files).filter((f) => f.type.startsWith('image/'));
  for (const file of files) {
    try { await addImageToGallery(file); } catch (err) { console.error(err); }
  }
  event.target.value = '';
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  for (const file of files) {
    try {
      await addImageToGallery(file);
    } catch (error) {
      console.error(`Fehler beim Laden von ${file.name}:`, error);
      alert(t('gallery.uploadError', { name: file.name }) + ': ' + error.message);
    }
  }
  event.target.value = '';
}

async function addImageToGallery(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Datei ist kein Bild'));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      reject(new Error('Datei zu groß (max. 50MB)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        galleryStore.addImage({
          id: Date.now() + Math.random(),
          name: file.name,
          url: e.target.result,
          thumbnail: createThumbnail(img, 300, 300),
          width: img.width,
          height: img.height,
          size: file.size,
          uploadedAt: new Date(),
          file,
        });
        resolve();
      };
      img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
    reader.readAsDataURL(file);
  });
}

function createThumbnail(img, maxWidth, maxHeight) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

// ===== PREVIEW =====

function openPreview(image) { previewImage.value = image; }
function closePreview() { previewImage.value = null; }

async function openInEditor() {
  const selected = galleryStore.selectedImage();
  if (!selected) return;
  await router.push({ path: '/editor', query: { galleryImageId: selected.id } });
}

async function openPreviewInEditor() {
  if (!previewImage.value) return;
  await router.push({ path: '/editor', query: { galleryImageId: previewImage.value.id } });
  closePreview();
}

// ===== DELETE =====

function deleteSelected() {
  const selected = galleryStore.selectedImage();
  if (!selected) return;
  if (!confirm(t('gallery.confirmDelete', { name: selected.name }))) return;
  galleryStore.removeImage(selected.id);
}

function deleteAllImages() {
  const count = galleryStore.images.length;
  if (count === 0) return;
  const imageWord = count === 1 ? t('gallery.imageCount.single') : t('gallery.imageCount.plural');
  if (!confirm(t('gallery.confirmDeleteAll', { count, images: imageWord }))) return;
  galleryStore.images.map((img) => img.id).forEach((id) => galleryStore.removeImage(id));
}

function downloadImage(image) {
  const link = document.createElement('a');
  link.href = image.url;
  link.download = image.name;
  link.click();
}

// ===== UTILS =====

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toggleMultiSelectMode() {
  isMultiSelectMode.value = !isMultiSelectMode.value;
  if (!isMultiSelectMode.value) galleryStore.deselectAllImages();
}

function handleImageClick(imageId) {
  if (isMultiSelectMode.value) {
    galleryStore.toggleImageSelection(imageId);
  } else {
    galleryStore.selectImage(imageId);
  }
}

async function createCollage() {
  const selectedImages = galleryStore.selectedImages;
  if (selectedImages.length < 2) {
    alert(t('gallery.errors.minTwoImages', 'Bitte wählen Sie mindestens 2 Bilder aus'));
    return;
  }
  try {
    await imageStore.addImageLayersFromGallery(selectedImages);
    isMultiSelectMode.value = false;
    galleryStore.deselectAllImages();
    await router.push({ path: '/editor', query: { collageMode: 'true' } });
  } catch (error) {
    console.error('Fehler beim Erstellen der Collage:', error);
    alert(t('gallery.errors.collageError', 'Fehler beim Erstellen der Collage') + ': ' + error.message);
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

// ===== PAGE LAYOUT =====

.gallery-view {
  padding: 2rem;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
}

// ===== PAGE HEADER =====

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  &__title {
    display: flex;
    align-items: center;
    gap: 1rem;

    i {
      font-size: 2rem;
      color: var(--color-primary);
      opacity: 0.85;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.15rem 0;
      line-height: 1.2;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }
  }
}

.image-count-badge {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 0.35rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

// ===== TOOLBAR =====

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.875rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  margin-bottom: 0.875rem;
  flex-wrap: wrap;

  &__group {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  &__separator {
    width: 1px;
    height: 20px;
    background: var(--color-border);
    margin: 0 0.25rem;
  }
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  i { font-size: 0.85rem; }

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &--primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    &:hover { background: var(--color-primary-dark, #003971); border-color: var(--color-primary-dark, #003971); color: white; }
  }

  &--accent {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
    &:hover { opacity: 0.88; color: white; }
  }

  &--danger {
    background: var(--color-danger, #dc2626);
    border-color: var(--color-danger, #dc2626);
    color: white;
    &:hover { opacity: 0.85; color: white; }
  }

  &--danger-ghost {
    background: transparent;
    border-color: var(--color-danger, #dc2626);
    color: var(--color-danger, #dc2626);
    &:hover { background: var(--color-danger, #dc2626); color: white; }
  }

  &--active {
    background: rgba(1, 79, 153, 0.1);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

// ===== PASTE HINT =====

.paste-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.25rem;
  padding: 0 0.25rem;

  i { opacity: 0.6; }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.15rem 0.45rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 0.72rem;
    font-family: inherit;
    font-weight: 600;
    color: var(--color-text);
    box-shadow: 0 1px 0 var(--color-border);
  }
}

// ===== EMPTY STATE =====

.empty-state {
  text-align: center;
  padding: 5rem 2rem 4rem;

  &__icon {
    width: 72px;
    height: 72px;
    background: rgba(1, 79, 153, 0.07);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;

    i {
      font-size: 2rem;
      color: var(--color-primary);
      opacity: 0.7;
    }
  }

  h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: 1.75rem;
  }

  &__actions {
    margin-bottom: 1.5rem;
  }

  &__shortcut {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 0.4rem 1rem;

    kbd {
      display: inline-flex;
      align-items: center;
      padding: 0.1rem 0.4rem;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: inherit;
      box-shadow: 0 1px 0 var(--color-border);
    }
  }
}

// ===== GALLERY GRID =====

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;

  /* Slim scrollbar */
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
    &:hover { background: var(--color-primary); }
  }
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

// ===== GALLERY CARD =====

.gallery-card {
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    border-color: var(--color-primary);
  }

  &.selected {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(201, 152, 77, 0.2);

    .gallery-card__select-dot i {
      color: var(--color-accent);
    }
  }

  &.multi-selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(1, 79, 153, 0.2);

    .gallery-card__checkbox i {
      color: var(--color-primary);
    }
  }

  // Thumbnail area
  &__thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: var(--color-bg-secondary);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:hover img { transform: scale(1.04); }
  }

  &__select-dot {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    width: 28px;
    height: 28px;
    background: rgba(0, 0, 0, 0.55);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);

    i { color: rgba(255,255,255,0.75); font-size: 1.1rem; }
  }

  &__checkbox {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    width: 30px;
    height: 30px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    backdrop-filter: blur(4px);
    cursor: pointer;

    i { color: white; font-size: 1.2rem; }

    &:hover { background: var(--color-primary); transform: scale(1.08); }
  }

  &__preview-btn {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.55);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);

    &:hover { background: var(--color-primary); transform: scale(1.1); }
  }

  &__thumb:hover &__preview-btn { opacity: 1; }

  // Info section
  &__info {
    padding: 0.75rem 0.875rem 0.875rem;
    border-top: 1px solid var(--color-border);
  }

  &__name {
    font-size: 0.85rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 0.35rem;
  }

  &__meta {
    display: flex;
    gap: 0.875rem;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.2rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      i { opacity: 0.6; font-size: 0.7rem; }
    }
  }

  &__date {
    font-size: 0.72rem;
    color: var(--color-text-secondary);
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    i { font-size: 0.68rem; opacity: 0.6; }
  }

  @media (max-width: 768px) {
    &__thumb { aspect-ratio: 1; }
    &__preview-btn { opacity: 1; }
    &__select-dot, &__checkbox { width: 36px; height: 36px; }
  }
}

// ===== PREVIEW MODAL =====

.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;

  @media (max-width: 768px) { padding: 0.5rem; }
}

.preview-modal {
  position: relative;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  max-width: 90vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);

  &__close {
    position: absolute;
    top: 0.875rem;
    right: 0.875rem;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);

    &:hover { background: var(--color-danger, #dc2626); transform: scale(1.1); }
  }

  &__image {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    overflow: auto;
    background: var(--color-bg-secondary);
    min-height: 300px;

    img {
      max-width: 100%;
      max-height: 60vh;
      object-fit: contain;
      border-radius: 6px;
    }

    @media (max-width: 768px) {
      padding: 1rem;
      img { max-height: 40vh; }
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-top: 1px solid var(--color-border);
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
      padding: 1rem;
    }
  }

  &__info {
    h3 { font-size: 1rem; font-weight: 700; margin: 0 0 0.5rem 0; }
  }

  &__meta {
    display: flex;
    gap: 1.5rem;
    font-size: 0.82rem;
    color: var(--color-text-secondary);
    flex-wrap: wrap;

    span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      i { opacity: 0.65; }
    }
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      .btn { flex: 1; justify-content: center; }
    }
  }
}
</style>
