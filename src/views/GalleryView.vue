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
      <span v-if="images.length > 0" class="image-count-badge">
        {{ images.length }}
        {{
          images.length === 1 ? $t('gallery.imageCount.single') : $t('gallery.imageCount.plural')
        }}
      </span>
    </header>

    <!-- Handoff Banner -->
    <HandoffReceiver @accept="handleHandoffAccept" @dismiss="handleHandoffDismiss" />

    <!-- Toolbar -->
    <GalleryToolbar
      :image-count="images.length"
      :multi-select="isMultiSelectMode"
      :all-selected="allSelected"
      :selected-count="galleryStore.selectedImageIds.length"
      :has-selection="!!galleryStore.selectedImage()"
      @upload="triggerFileInput"
      @upload-folder="triggerFolderInput"
      @toggle-multi-select="toggleMultiSelectMode"
      @toggle-select-all="toggleSelectAll"
      @create-collage="createCollage"
      @open-editor="openInEditor"
      @delete-selected="deleteSelected"
      @delete-all="deleteAllImages"
    >
      <template #file-input>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          style="display: none"
          @change="handleFileSelect"
        />
      </template>
      <template #folder-input>
        <input
          ref="folderInput"
          type="file"
          accept="image/*"
          multiple
          webkitdirectory
          style="display: none"
          @change="handleFolderSelect"
        />
      </template>
    </GalleryToolbar>

    <!-- Paste Hint -->
    <div v-if="images.length === 0 || true" class="paste-hint">
      <AppIcon name="clipboard" />
      <span>{{ $t('gallery.pasteHint', 'Bilder direkt per') }}</span>
      <kbd>Ctrl</kbd><span>+</span><kbd>V</kbd>
      <span>{{ $t('gallery.pasteHint2', 'einfügen') }}</span>
    </div>

    <!-- Empty State -->
    <GalleryEmptyState v-if="images.length === 0" @upload="triggerFileInput" />

    <!-- Gallery Grid -->
    <div v-else class="gallery-grid">
      <GalleryCard
        v-for="image in images"
        :key="image.id"
        v-model:edit-name="editingName"
        :image="image"
        :multi-select="isMultiSelectMode"
        :selected="galleryStore.selectedImageId === image.id"
        :checked="galleryStore.isImageSelected(image.id)"
        :editing="editingImageId === image.id"
        @select="handleImageClick(image.id)"
        @toggle="galleryStore.toggleImageSelection(image.id)"
        @preview="openPreview(image)"
        @start-rename="startRename(image)"
        @confirm-rename="confirmRename(image)"
        @cancel-rename="cancelRename"
      />
    </div>

    <!-- Preview Overlay -->
    <GalleryPreviewDialog
      :image="previewImage"
      @close="closePreview"
      @open-editor="openPreviewInEditor"
      @download="previewImage && downloadImage(previewImage)"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Galerie: Container für Werkzeugleiste, Karten-Raster und Vorschau. Upload,
 * Einfügen und Handoff liegen in useGalleryUpload, Umbenennen in
 * useGalleryRename; hier bleiben Auswahl, Löschen, Collage und Navigation.
 */
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGalleryStore } from '@/stores/galleryStore';
import { useImageStore } from '@/stores/imageStore';
import { useConfirm } from '@/composables/useConfirm';
import { useGalleryRename } from '@/composables/gallery/useGalleryRename';
import { useGalleryUpload } from '@/composables/gallery/useGalleryUpload';
import type { GalleryImage } from '@/composables/gallery/types';
import AppIcon from '@/components/ui/AppIcon.vue';
import HandoffReceiver from '@/components/features/HandoffReceiver.vue';
import GalleryCard from '@/components/gallery/GalleryCard.vue';
import GalleryEmptyState from '@/components/gallery/GalleryEmptyState.vue';
import GalleryPreviewDialog from '@/components/gallery/GalleryPreviewDialog.vue';
import GalleryToolbar from '@/components/gallery/GalleryToolbar.vue';
import { logger } from '@/utils/logger';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();
const galleryStore = useGalleryStore();
const imageStore = useImageStore();
const { confirm: confirmDialog } = useConfirm();

/** Store ist JS: Bildliste hier typisiert */
const images = computed(() => galleryStore.images as GalleryImage[]);
const selectedImage = () => galleryStore.selectedImage() as GalleryImage | null | undefined;
const allSelected = computed(
  () => galleryStore.selectedImageIds.length === galleryStore.images.length
);

const fileInput = ref<HTMLInputElement | null>(null);
const folderInput = ref<HTMLInputElement | null>(null);
const previewImage = ref<GalleryImage | null>(null);
const isMultiSelectMode = ref(false);

const { handleFileSelect, handleFolderSelect, handleHandoffAccept } = useGalleryUpload({
  addImage: (image) => galleryStore.addImage(image),
  t,
});
const { editingImageId, editingName, startRename, confirmRename, cancelRename } = useGalleryRename(
  (id, name) => galleryStore.renameImage(id, name)
);

function handleHandoffDismiss() {}

// ===== UPLOAD =====

function triggerFileInput() {
  fileInput.value?.click();
}
function triggerFolderInput() {
  folderInput.value?.click();
}

// ===== PREVIEW =====

function openPreview(image: GalleryImage) {
  previewImage.value = image;
}
function closePreview() {
  previewImage.value = null;
}

async function openInEditor() {
  const selected = selectedImage();
  if (!selected) return;
  await router.push({ path: '/editor', query: { galleryImageId: selected.id } });
}

async function openPreviewInEditor() {
  if (!previewImage.value) return;
  await router.push({ path: '/editor', query: { galleryImageId: previewImage.value.id } });
  closePreview();
}

// ===== DELETE =====

async function deleteSelected() {
  const selected = selectedImage();
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
  const count = images.value.length;
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
  images.value.map((img) => img.id).forEach((id) => galleryStore.removeImage(id));
}

function downloadImage(image: GalleryImage) {
  const link = document.createElement('a');
  link.href = image.url;
  link.download = image.name;
  link.click();
}

// ===== AUSWAHL =====

function toggleMultiSelectMode() {
  isMultiSelectMode.value = !isMultiSelectMode.value;
  if (!isMultiSelectMode.value) galleryStore.deselectAllImages();
}

function toggleSelectAll() {
  if (allSelected.value) galleryStore.deselectAllImages();
  else galleryStore.selectAllImages();
}

function handleImageClick(imageId: number) {
  if (isMultiSelectMode.value) {
    galleryStore.toggleImageSelection(imageId);
  } else {
    galleryStore.selectImage(imageId);
  }
}

async function createCollage() {
  const selectedImages = galleryStore.selectedImages;
  if (selectedImages.length < 2) {
    window.$toast?.warning(
      t('gallery.errors.minTwoImages', 'Bitte wählen Sie mindestens 2 Bilder aus')
    );
    return;
  }
  try {
    await imageStore.addImageLayersFromGallery(selectedImages);
    isMultiSelectMode.value = false;
    galleryStore.deselectAllImages();
    await router.push({ path: '/editor', query: { collageMode: 'true' } });
  } catch (error) {
    logger.error('Fehler beim Erstellen der Collage:', error);
    window.$toast?.error(
      t('gallery.errors.collageError', 'Fehler beim Erstellen der Collage') +
        ': ' +
        (error as Error).message
    );
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
.paste-hint kbd {
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
</style>
