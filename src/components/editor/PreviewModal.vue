<template>
  <Teleport to="body">
    <div v-if="show" class="preview-modal-overlay" @click="$emit('close')">
      <div class="preview-modal-content" @click.stop>
        <button class="preview-close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
        <div class="preview-comparison">
          <div class="preview-item">
            <h3>{{ $t('editor.preview.before', 'Before (Original)') }}</h3>
            <img v-if="originalSrc" :src="originalSrc" alt="Original" />
            <div v-else class="preview-placeholder">
              {{ $t('editor.preview.noOriginal', 'No original available') }}
            </div>
          </div>
          <div class="preview-divider"></div>
          <div class="preview-item">
            <h3>{{ $t('editor.preview.after', 'After (Edited)') }}</h3>
            <img v-if="editedSrc" :src="editedSrc" alt="Edited" />
            <div v-else class="preview-placeholder">
              {{ $t('editor.preview.noEdited', 'No edits available') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  originalSrc: String,
  editedSrc: String,
});
defineEmits(['close']);
</script>

<style lang="scss" scoped>
.preview-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
}

.preview-modal-content {
  position: relative;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  max-width: 95vw;
  max-height: 90vh;
  overflow: auto;
}

.preview-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: var(--color-danger);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: #c82333;
    transform: scale(1.1);
  }
}

.preview-comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;

    .preview-divider {
      display: none;
    }
  }
}

.preview-item {
  text-align: center;

  h3 {
    margin-bottom: 1rem;
    color: var(--color-text-secondary);
    font-size: 1.1rem;
  }

  img {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    object-fit: contain;
  }

  .preview-placeholder {
    padding: 3rem;
    background: var(--color-bg);
    border-radius: 8px;
    color: var(--color-text-secondary);
    font-style: italic;
  }
}

.preview-divider {
  width: 2px;
  height: 400px;
  background: var(--color-border);
}
</style>
