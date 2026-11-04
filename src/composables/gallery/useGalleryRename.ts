import { nextTick, ref } from 'vue';
import type { GalleryImage } from './types';

/**
 * Umbenennen eines Galerie-Bildes direkt in der Karte. Es wird immer nur ein
 * Bild bearbeitet; leere oder unveränderte Namen werden verworfen.
 */
export function useGalleryRename(rename: (id: number, name: string) => void) {
  const editingImageId = ref<number | null>(null);
  const editingName = ref('');

  async function startRename(image: GalleryImage) {
    editingImageId.value = image.id;
    editingName.value = image.name;
    await nextTick();
    const input = document.querySelector<HTMLInputElement>(`[data-rename-id="${image.id}"]`);
    if (input) {
      input.focus();
      input.select();
    }
  }

  function confirmRename(image: GalleryImage) {
    const trimmed = editingName.value.trim();
    if (trimmed && trimmed !== image.name) rename(image.id, trimmed);
    editingImageId.value = null;
    editingName.value = '';
  }

  function cancelRename() {
    editingImageId.value = null;
    editingName.value = '';
  }

  return { editingImageId, editingName, startRename, confirmRename, cancelRename };
}
