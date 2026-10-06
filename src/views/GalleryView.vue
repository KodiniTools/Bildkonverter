<template>
  <div class="gallery-view">
    <!-- Page Header -->
    <header class="page-header">
      <div class="page-header__title">
        <AppIcon name="images" :size="32" />
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
        <button class="tb-btn" @click="triggerFileInput">
          <AppIcon name="upload" />
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
          <AppIcon name="folder-open" />
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
          <AppIcon :name="isMultiSelectMode ? 'times' : 'object-group'" />
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
            <AppIcon
              :name="
                galleryStore.selectedImageIds.length === galleryStore.images.length
                  ? 'square'
                  : 'check-square'
              "
            />
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
            <AppIcon name="layer-group" />
            <span
              >{{ $t('gallery.buttons.createCollage', 'Collage') }} ({{
                galleryStore.selectedImageIds.length
              }})</span
            >
          </button>
        </template>
      </div>

      <div class="toolbar__group">
        <template v-if="galleryStore.selectedImage() && !isMultiSelectMode">
          <button class="tb-btn tb-btn--primary" @click="openInEditor">
            <AppIcon name="edit" />
            <span>{{ $t('gallery.buttons.addToEditor') }}</span>
          </button>
          <button
            class="tb-btn tb-btn--danger"
            :aria-label="$t('confirm.delete', 'Löschen')"
            :title="$t('confirm.delete', 'Löschen')"
            @click="deleteSelected"
          >
            <AppIcon name="trash" />
          </button>
        </template>
        <button
          v-if="galleryStore.images.length > 0"
          class="tb-btn tb-btn--danger-ghost"
          :title="$t('gallery.tooltips.deleteAll')"
          @click="deleteAllImages"
        >
          <AppIcon name="trash-alt" />
          <span>{{ $t('gallery.buttons.deleteAll') }}</span>
        </button>
      </div>
    </div>

    <!-- Paste Hint -->
    <div v-if="galleryStore.images.length === 0 || true" class="paste-hint">
      <AppIcon name="clipboard" />
      <span>{{ $t('gallery.pasteHint', 'Bilder direkt per') }}</span>
      <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd>
      <span>{{ $t('gallery.pasteHint2', 'einfügen') }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="galleryStore.images.length === 0" class="empty-state">
      <div class="empty-state__icon">
        <AppIcon name="images" :size="40" />
      </div>
      <h3>{{ $t('gallery.empty.title') }}</h3>
      <p>{{ $t('gallery.empty.description') }}</p>
      <div class="empty-state__actions">
        <button class="btn btn-primary" @click="triggerFileInput">
          <AppIcon name="upload" />
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
            <AppIcon
              :name="galleryStore.isImageSelected(image.id) ? 'check-square' : 'square'"
              :size="20"
            />
          </div>
          <div v-else class="gallery-card__select-dot">
            <AppIcon
              :name="galleryStore.selectedImageId === image.id ? 'check-circle' : 'circle'"
              :size="20"
            />
          </div>

          <button
            class="gallery-card__preview-btn"
            :title="$t('gallery.buttons.preview')"
            :aria-label="$t('gallery.buttons.preview')"
            @click.stop="openPreview(image)"
          >
            <AppIcon name="search-plus" />
          </button>
        </div>

        <!-- Image Info -->
        <div class="gallery-card__info">
          <div class="gallery-card__name-row">
            <div
              v-if="editingImageId !== image.id"
              class="gallery-card__name"
              :title="image.name"
              @dblclick.stop="startRename(image)"
            >
              {{ image.name }}
            </div>
            <input
              v-else
              v-model="editingName"
              :data-rename-id="image.id"
              class="gallery-card__name-input"
              @keydown.enter.stop="confirmRename(image)"
              @keydown.escape.stop="cancelRename()"
              @blur="confirmRename(image)"
              @click.stop
            />
            <button
              v-if="editingImageId !== image.id"
              class="gallery-card__rename-btn"
              :title="$t('gallery.buttons.rename', 'Umbenennen')"
              :aria-label="$t('gallery.buttons.rename', 'Umbenennen')"
              @click.stop="startRename(image)"
            >
              <AppIcon name="pen" />
            </button>
          </div>
          <div class="gallery-card__meta">
            <span><AppIcon name="expand-arrows-alt" /> {{ image.width }} × {{ image.height }}</span>
            <span><AppIcon name="file" /> {{ formatSize(image.size) }}</span>
          </div>
          <div class="gallery-card__date">
            <AppIcon name="clock" /> {{ formatDate(image.uploadedAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Overlay -->
    <Teleport to="body">
      <div v-if="previewImage" class="preview-overlay" @click="closePreview">
        <div class="preview-modal" @click.stop>
          <button
            class="preview-modal__close"
            :aria-label="$t('common.close', 'Schließen')"
            :title="$t('common.close', 'Schließen')"
            @click="closePreview"
          >
            <AppIcon name="times" />
          </button>

          <div class="preview-modal__image">
            <img :src="previewImage.url" :alt="previewImage.name" />
          </div>

          <div class="preview-modal__footer">
            <div class="preview-modal__info">
              <h3>{{ previewImage.name }}</h3>
              <div class="preview-modal__meta">
                <span
                  ><AppIcon name="ruler-combined" /> {{ previewImage.width }} ×
                  {{ previewImage.height }}px</span
                >
                <span><AppIcon name="file" /> {{ formatSize(previewImage.size) }}</span>
                <span><AppIcon name="calendar" /> {{ formatDate(previewImage.uploadedAt) }}</span>
              </div>
            </div>
            <div class="preview-modal__actions">
              <button class="btn btn-primary" @click="openPreviewInEditor">
                <AppIcon name="edit" />
                {{ $t('gallery.buttons.addToEditor', 'Im Editor öffnen') }}
              </button>
              <button class="btn btn-secondary" @click="downloadImage(previewImage)">
                <AppIcon name="download" />
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
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGalleryStore } from '@/stores/galleryStore';
import { useImageStore } from '@/stores/imageStore';
import { useConfirm } from '@/composables/useConfirm';
import AppIcon from '@/components/ui/AppIcon.vue';
import HandoffReceiver from '@/components/features/HandoffReceiver.vue';
import { handoffImageToCanvas } from '@/lib/core/handoff';
import { formatSize } from '@/utils/fileUtils';
import { logger } from '@/utils/logger';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const galleryStore = useGalleryStore();
const imageStore = useImageStore();
const { confirm: confirmDialog } = useConfirm();

const fileInput = ref(null);
const folderInput = ref(null);
const previewImage = ref(null);
const isMultiSelectMode = ref(false);
const editingImageId = ref(null);
const editingName = ref('');

// ===== CLIPBOARD PASTE =====

function handlePaste(e) {
  const isInputFocused =
    document.activeElement?.tagName === 'INPUT' ||
    document.activeElement?.tagName === 'TEXTAREA' ||
    document.activeElement?.isContentEditable;
  if (isInputFocused) return;

  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        const name = `clipboard-${Date.now()}.${item.type.split('/')[1] || 'png'}`;
        const namedFile = new File([file], name, { type: item.type });
        addImageToGallery(namedFile)
          .then(() => {
            if (window.$toast)
              window.$toast.success(
                t('toast.gallery.pasted', 'Bild aus Zwischenablage hinzugefügt')
              );
          })
          .catch((err) => logger.error('Paste error:', err));
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
      logger.error(`[Handoff] Fehler beim Import von ${img.name}:`, error);
    }
  }
}

function handleHandoffDismiss() {}

// ===== UPLOAD =====

function triggerFileInput() {
  fileInput.value?.click();
}
function triggerFolderInput() {
  folderInput.value?.click();
}

async function handleFolderSelect(event) {
  const files = Array.from(event.target.files).filter((f) => f.type.startsWith('image/'));
  for (const file of files) {
    try {
      await addImageToGallery(file);
    } catch (err) {
      logger.error(err);
    }
  }
  event.target.value = '';
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  for (const file of files) {
    try {
      await addImageToGallery(file);
    } catch (error) {
      logger.error(`Fehler beim Laden von ${file.name}:`, error);
      if (window.$toast) {
        window.$toast.error(t('gallery.uploadError', { name: file.name }) + ': ' + error.message);
      }
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

function openPreview(image) {
  previewImage.value = image;
}
function closePreview() {
  previewImage.value = null;
}

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

// ===== RENAME =====

async function startRename(image) {
  editingImageId.value = image.id;
  editingName.value = image.name;
  await nextTick();
  const input = document.querySelector(`[data-rename-id="${image.id}"]`);
  if (input) {
    input.focus();
    input.select();
  }
}

function confirmRename(image) {
  const trimmed = editingName.value.trim();
  if (trimmed && trimmed !== image.name) {
    galleryStore.renameImage(image.id, trimmed);
  }
  editingImageId.value = null;
  editingName.value = '';
}

function cancelRename() {
  editingImageId.value = null;
  editingName.value = '';
}

// ===== DELETE =====

async function deleteSelected() {
  const selected = galleryStore.selectedImage();
  if (!selected) return;
  const confirmed = await confirmDialog(t('gallery.confirmDelete', { name: selected.name }), {
    title: t('gallery.deleteTitle', 'Bild löschen?'),
    confirmText: t('confirm.delete', 'Löschen'),
    cancelText: t('confirm.cancel', 'Abbrechen'),
    variant: 'danger',
  });
  if (!confirmed) return;
  galleryStore.removeImage(selected.id);
}

async function deleteAllImages() {
  const count = galleryStore.images.length;
  if (count === 0) return;
  const imageWord = count === 1 ? t('gallery.imageCount.single') : t('gallery.imageCount.plural');
  const confirmed = await confirmDialog(
    t('gallery.confirmDeleteAll', { count, images: imageWord }),
    {
      title: t('gallery.deleteAllTitle', 'Alle Bilder löschen?'),
      confirmText: t('confirm.delete', 'Löschen'),
      cancelText: t('confirm.cancel', 'Abbrechen'),
      variant: 'danger',
    }
  );
  if (!confirmed) return;
  galleryStore.images.map((img) => img.id).forEach((id) => galleryStore.removeImage(id));
}

function downloadImage(image) {
  const link = document.createElement('a');
  link.href = image.url;
  link.download = image.name;
  link.click();
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
    if (window.$toast) {
      window.$toast.warning(
        t('gallery.errors.minTwoImages', 'Bitte wählen Sie mindestens 2 Bilder aus')
      );
    }
    return;
  }
  try {
    await imageStore.addImageLayersFromGallery(selectedImages);
    isMultiSelectMode.value = false;
    galleryStore.deselectAllImages();
    await router.push({ path: '/editor', query: { collageMode: 'true' } });
  } catch (error) {
    logger.error('Fehler beim Erstellen der Collage:', error);
    if (window.$toast) {
      window.$toast.error(
        t('gallery.errors.collageError', 'Fehler beim Erstellen der Collage') + ': ' + error.message
      );
    }
  }
}
</script>

<style lang="scss" scoped>
// ===== PAGE LAYOUT =====

.gallery-view {
  padding: var(--ds-space-8);
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: var(--ds-space-4);
  }
}

// ===== PAGE HEADER =====

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  margin-bottom: var(--ds-space-6);

  &__title {
    display: flex;
    align-items: center;
    gap: var(--ds-space-4);

    .app-icon {
      color: var(--ds-text-2);
    }

    h1 {
      font-size: var(--ds-text-2xl);
      font-weight: var(--ds-weight-bold);
      letter-spacing: var(--ds-tracking-tight);
      line-height: var(--ds-leading-tight);
      margin: 0 0 var(--ds-space-1) 0;
    }

    p {
      margin: 0;
      font-size: var(--ds-text-md);
      color: var(--ds-text-2);
    }
  }
}

.image-count-badge {
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-full);
  padding: var(--ds-space-1) var(--ds-space-3);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  color: var(--ds-text-2);
  white-space: nowrap;
}

// ===== TOOLBAR =====

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  margin-bottom: var(--ds-space-3);
  flex-wrap: wrap;

  &__group {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    flex-wrap: wrap;
  }

  &__separator {
    width: var(--ds-border-width);
    height: var(--ds-space-5);
    background: var(--ds-border);
    margin: 0 var(--ds-space-1);
  }
}

// Wie UiButton (md): Sekundär-Fläche, Primär in Gold, Danger als Text
.tb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  height: var(--ds-control-md);
  padding: 0 var(--ds-space-4);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-md);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font: inherit;
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-3);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &--primary,
  &--accent {
    background: var(--ds-accent);
    border-color: transparent;
    color: var(--ds-on-accent);
    font-weight: var(--ds-weight-semibold);

    &:hover {
      background: var(--ds-accent-hover);
      color: var(--ds-on-accent);
    }
  }

  &--danger,
  &--danger-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--ds-danger);

    &:hover {
      background: var(--ds-surface-2);
      color: var(--ds-danger);
    }
  }

  &--danger {
    width: var(--ds-control-md);
    padding: 0;
  }

  &--active {
    background: var(--ds-accent-soft);
    border-color: var(--ds-accent);
    color: var(--ds-text);

    &:hover {
      background: var(--ds-accent-soft);
    }
  }
}

// ===== PASTE HINT =====

.paste-hint {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-text-sm);
  color: var(--ds-text-2);
  margin-bottom: var(--ds-space-5);
  padding: 0 var(--ds-space-1);

  .app-icon {
    color: var(--ds-text-3);
  }
}

// Wie UiKbd
.paste-hint kbd,
.empty-state__shortcut kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 calc(var(--ds-space-1) + 2px);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-bottom-width: 2px;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-surface-2);
  color: var(--ds-text);
  font-family: inherit;
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  line-height: 1;
  white-space: nowrap;
}

// ===== EMPTY STATE =====

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-4);
  color: var(--ds-text-2);

  &__icon {
    display: inline-flex;
    margin-bottom: var(--ds-space-1);
    color: var(--ds-text-3);
  }

  h3 {
    margin: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
  }

  p {
    margin: 0;
    max-width: 40ch;
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }

  &__actions {
    margin-top: var(--ds-space-2);
  }

  &__shortcut {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-1);
    margin-top: var(--ds-space-2);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }
}

// ===== GALLERY GRID =====

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--ds-space-5);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--ds-border-strong);
    border-radius: var(--ds-radius-full);
    &:hover {
      background: var(--ds-text-3);
    }
  }
  scrollbar-width: thin;
  scrollbar-color: var(--ds-border-strong) transparent;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--ds-space-4);
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--ds-space-3);
  }
}

// ===== GALLERY CARD =====
// Wie TemplateCard: surface-1, 1-px-Rahmen, radius-md, flach.
// Auswahl wie Thumbnail-Ring: 2 px Akzent mit 2 px Abstand.

.gallery-card {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  &.selected,
  &.multi-selected {
    border-color: var(--ds-accent);
    outline-color: var(--ds-accent);
  }

  // Thumbnail area
  &__thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: var(--ds-surface-2);
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  // Auswahl-Marker über dem Bild: kleine surface-1-Chips, ausgewählt in Gold
  &__select-dot,
  &__checkbox {
    position: absolute;
    top: var(--ds-space-2);
    left: var(--ds-space-2);
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    color: var(--ds-text-2);
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);

    .app-icon {
      width: var(--ds-icon-sm);
      height: var(--ds-icon-sm);
    }
  }

  &__select-dot {
    border-radius: 50%;
  }

  &__checkbox {
    border-radius: var(--ds-radius-sm);
    cursor: pointer;

    &:hover {
      background: var(--ds-surface-3);
      color: var(--ds-text);
    }
  }

  &.selected &__select-dot,
  &.multi-selected &__checkbox {
    background: var(--ds-accent);
    border-color: var(--ds-accent);
    color: var(--ds-on-accent);
  }

  &__preview-btn {
    position: absolute;
    top: var(--ds-space-2);
    right: var(--ds-space-2);
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: 50%;
    color: var(--ds-text-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease),
      opacity var(--ds-duration) var(--ds-ease);

    &:hover {
      background: var(--ds-surface-3);
      color: var(--ds-text);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
      opacity: 1;
    }
  }

  &__thumb:hover &__preview-btn {
    opacity: 1;
  }

  // Info section
  &__info {
    padding: var(--ds-space-3) var(--ds-space-4) var(--ds-space-4);
    border-top: var(--ds-border-width) solid var(--ds-border);
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
    margin-bottom: var(--ds-space-1);
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: text;
  }

  &__name-input {
    flex: 1;
    min-width: 0;
    height: var(--ds-control-sm);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-accent);
    border-radius: var(--ds-radius-sm);
    padding: 0 var(--ds-space-2);
    outline: none;

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
    }
  }

  &__rename-btn {
    flex-shrink: 0;
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    border: none;
    background: none;
    cursor: pointer;
    color: var(--ds-text-2);
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ds-radius-sm);
    opacity: 0;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease),
      opacity var(--ds-duration) var(--ds-ease);

    &:hover {
      color: var(--ds-text);
      background: var(--ds-surface-2);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
      opacity: 1;
    }
  }

  &:hover &__rename-btn {
    opacity: 1;
  }

  &__meta {
    display: flex;
    gap: var(--ds-space-3);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-2);
    margin-bottom: var(--ds-space-1);

    span {
      display: flex;
      align-items: center;
      gap: var(--ds-space-1);

      .app-icon {
        color: var(--ds-text-3);
      }
    }
  }

  &__date {
    font-size: var(--ds-text-xs);
    color: var(--ds-text-3);
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
  }

  @media (max-width: 768px) {
    &__thumb {
      aspect-ratio: 1;
    }
    &__preview-btn,
    &__rename-btn {
      opacity: 1;
    }
    &__select-dot,
    &__checkbox,
    &__preview-btn {
      width: var(--ds-control-md);
      height: var(--ds-control-md);
    }
  }
}

// ===== PREVIEW MODAL =====
// Wie die Bildvorschau im Collage Maker (ImageList): Backdrop 50 %, surface-1,
// radius-lg, shadow-overlay.

.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--ds-space-4);
  animation: fadeIn var(--ds-duration-slow) var(--ds-ease);
}

.preview-modal {
  position: relative;
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--ds-shadow-overlay);

  &__close {
    position: absolute;
    top: var(--ds-space-3);
    right: var(--ds-space-3);
    width: var(--ds-control-md);
    height: var(--ds-control-md);
    border: var(--ds-border-width) solid var(--ds-border);
    background: var(--ds-surface-1);
    color: var(--ds-text-2);
    border-radius: var(--ds-radius-md);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);

    &:hover {
      background: var(--ds-surface-3);
      color: var(--ds-text);
    }

    &:focus-visible {
      outline: none;
      box-shadow: var(--ds-focus-ring);
    }
  }

  &__image {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ds-space-4);
    overflow: auto;
    background: var(--ds-surface-2);
    min-height: 300px;

    img {
      max-width: 100%;
      max-height: 60vh;
      object-fit: contain;
      border-radius: var(--ds-radius-md);
    }

    @media (max-width: 768px) {
      padding: var(--ds-space-2);
      img {
        max-height: 40vh;
      }
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-4);
    padding: var(--ds-space-4) var(--ds-space-5);
    border-top: var(--ds-border-width) solid var(--ds-border);
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
      padding: var(--ds-space-3);
    }
  }

  &__info {
    min-width: 0;

    h3 {
      font-size: var(--ds-text-lg);
      font-weight: var(--ds-weight-semibold);
      line-height: var(--ds-leading);
      color: var(--ds-text);
      margin: 0 0 var(--ds-space-2) 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__meta {
    display: flex;
    gap: var(--ds-space-4);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    flex-wrap: wrap;

    span {
      display: flex;
      align-items: center;
      gap: var(--ds-space-1);

      .app-icon {
        color: var(--ds-text-3);
      }
    }
  }

  &__actions {
    display: flex;
    gap: var(--ds-space-2);
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      .btn {
        flex: 1;
      }
    }
  }
}
</style>
