<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
  isOpen: boolean
  mode: 'pdf-all' | 'pdf-selected' | 'zip' | 'save' | null
  imageCount: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  confirm: [settings: any]
}>()

// PDF-Einstellungen
const title = ref('Bilder')
const author = ref('')
const includeTitlePage = ref(false)
const includeCommentPage = ref(false)
const commentText = ref('')
const commentImage = ref<File | null>(null)
const includeFileName = ref(false)
const optimizeSize = ref(true)
const orientation = ref<'portrait' | 'landscape'>('portrait')

// ZIP-Einstellungen
const zipName = ref('bilder')

// Allgemeine Export-Einstellungen
const format = ref('png')
const quality = ref(92)

const modalTitle = computed(() => {
  if (props.mode === 'pdf-all') return 'exportModal.title.pdfAll'
  if (props.mode === 'pdf-selected') return 'exportModal.title.pdfSelected'
  if (props.mode === 'zip') return 'exportModal.title.zip'
  if (props.mode === 'save') return 'exportModal.title.save'
  return 'exportModal.title.export'
})

const showPdfOptions = computed(() => 
  props.mode === 'pdf-all' || props.mode === 'pdf-selected'
)

const showFormatOptions = computed(() => 
  props.mode === 'zip' || props.mode === 'save'
)

function handleCommentImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    commentImage.value = target.files[0]
  }
}

function handleConfirm() {
  const settings: any = {}
  
  if (showPdfOptions.value) {
    settings.title = title.value
    settings.author = author.value
    settings.includeTitlePage = includeTitlePage.value
    settings.includeCommentPage = includeCommentPage.value
    settings.commentText = commentText.value
    settings.commentImage = commentImage.value
    settings.includeFileName = includeFileName.value
    settings.optimizeSize = optimizeSize.value
    settings.orientation = orientation.value
  }
  
  if (props.mode === 'zip') {
    settings.zipName = zipName.value
  }
  
  if (showFormatOptions.value) {
    settings.format = format.value
    settings.quality = quality.value
  }
  
  emit('confirm', settings)
}

function handleClose() {
  emit('close')
}

// Reset bei Modal-Öffnung
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Zurücksetzen auf Standardwerte
    title.value = 'Bilder'
    author.value = ''
    includeTitlePage.value = false
    includeCommentPage.value = false
    commentText.value = ''
    commentImage.value = null
    includeFileName.value = false
    optimizeSize.value = true
    orientation.value = 'portrait'
    zipName.value = 'bilder'
    format.value = 'png'
    quality.value = 92
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="handleClose">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>{{ $t(modalTitle) }}</h2>
            <button class="close-btn" @click="handleClose" :title="$t('exportModal.close')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="info-badge">
              <i class="fa-solid fa-images"></i>
              <span>{{ imageCount }} {{ imageCount === 1 ? $t('exportModal.imageCount.singular') : $t('exportModal.imageCount.plural') }}</span>
            </div>

            <!-- PDF-spezifische Optionen -->
            <div v-if="showPdfOptions" class="settings-section">
              <h3>
                <i class="fa-solid fa-file-pdf"></i> 
                {{ $t('exportModal.pdf.title') }}
              </h3>
              
              <div class="form-group">
                <label for="title">{{ $t('exportModal.pdf.documentTitle') }}</label>
                <input 
                  id="title"
                  v-model="title" 
                  type="text" 
                  :placeholder="$t('exportModal.pdf.documentTitlePlaceholder')"
                  class="input-field"
                />
              </div>

              <div class="form-group">
                <label for="author">{{ $t('exportModal.pdf.author') }}</label>
                <input 
                  id="author"
                  v-model="author" 
                  type="text" 
                  :placeholder="$t('exportModal.pdf.authorPlaceholder')"
                  class="input-field"
                />
              </div>

              <div class="form-group">
                <label for="orientation">{{ $t('exportModal.pdf.orientation.label') }}</label>
                <select id="orientation" v-model="orientation" class="select-field">
                  <option value="portrait">{{ $t('exportModal.pdf.orientation.portrait') }}</option>
                  <option value="landscape">{{ $t('exportModal.pdf.orientation.landscape') }}</option>
                </select>
              </div>

              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="includeTitlePage" />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">
                    <strong>{{ $t('exportModal.pdf.titlePage.label') }}</strong>
                    <small>{{ $t('exportModal.pdf.titlePage.description') }}</small>
                  </span>
                </label>

                <label class="checkbox-label">
                  <input type="checkbox" v-model="includeFileName" />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">
                    <strong>{{ $t('exportModal.pdf.showFileName.label') }}</strong>
                    <small>{{ $t('exportModal.pdf.showFileName.description') }}</small>
                  </span>
                </label>

                <label class="checkbox-label">
                  <input type="checkbox" v-model="optimizeSize" />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">
                    <strong>{{ $t('exportModal.pdf.optimizeSize.label') }}</strong>
                    <small>{{ $t('exportModal.pdf.optimizeSize.description') }}</small>
                  </span>
                </label>

                <label class="checkbox-label">
                  <input type="checkbox" v-model="includeCommentPage" />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">
                    <strong>{{ $t('exportModal.pdf.commentPage.label') }}</strong>
                    <small>{{ $t('exportModal.pdf.commentPage.description') }}</small>
                  </span>
                </label>
              </div>

              <Transition name="slide-fade">
                <div v-if="includeCommentPage" class="nested-section">
                  <div class="form-group">
                    <label for="commentText">{{ $t('exportModal.pdf.commentText.label') }}</label>
                    <textarea 
                      id="commentText"
                      v-model="commentText" 
                      :placeholder="$t('exportModal.pdf.commentText.placeholder')"
                      rows="4"
                      class="textarea-field"
                    ></textarea>
                  </div>

                  <div class="form-group">
                    <label for="commentImage" class="file-label">
                      <i class="fa-solid fa-image"></i>
                      {{ $t('exportModal.pdf.commentImage.label') }}
                    </label>
                    <input 
                      id="commentImage"
                      type="file" 
                      accept="image/*"
                      @change="handleCommentImageChange"
                      class="file-input"
                    />
                    <div v-if="commentImage" class="file-preview">
                      <i class="fa-solid fa-check-circle"></i>
                      {{ commentImage.name }}
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- ZIP-spezifische Optionen -->
            <div v-if="mode === 'zip'" class="settings-section">
              <h3>
                <i class="fa-solid fa-file-zipper"></i> 
                {{ $t('exportModal.zip.title') }}
              </h3>
              
              <div class="form-group">
                <label for="zipName">{{ $t('exportModal.zip.fileName') }}</label>
                <input 
                  id="zipName"
                  v-model="zipName" 
                  type="text" 
                  :placeholder="$t('exportModal.zip.fileNamePlaceholder')"
                  class="input-field"
                />
                <small class="hint">{{ $t('exportModal.zip.fileNameHint', { name: zipName }) }}</small>
              </div>
            </div>

            <!-- Format-Optionen für ZIP und Einzelspeicherung -->
            <div v-if="showFormatOptions" class="settings-section">
              <h3>
                <i class="fa-solid fa-image"></i> 
                {{ $t('exportModal.format.title') }}
              </h3>
              
              <div class="format-selector">
                <label class="format-option" :class="{ active: format === 'png' }">
                  <input type="radio" value="png" v-model="format" />
                  <div class="format-card">
                    <i class="fa-solid fa-file-image"></i>
                    <strong>PNG</strong>
                    <small>{{ $t('exportModal.format.png') }}</small>
                  </div>
                </label>

                <label class="format-option" :class="{ active: format === 'jpg' }">
                  <input type="radio" value="jpg" v-model="format" />
                  <div class="format-card">
                    <i class="fa-solid fa-file-image"></i>
                    <strong>JPG</strong>
                    <small>{{ $t('exportModal.format.jpg') }}</small>
                  </div>
                </label>

                <label class="format-option" :class="{ active: format === 'webp' }">
                  <input type="radio" value="webp" v-model="format" />
                  <div class="format-card">
                    <i class="fa-solid fa-file-image"></i>
                    <strong>WebP</strong>
                    <small>{{ $t('exportModal.format.webp') }}</small>
                  </div>
                </label>
              </div>

              <div v-if="format !== 'png'" class="form-group">
                <label for="quality">
                  {{ $t('exportModal.format.quality.label') }}: <strong>{{ quality }}%</strong>
                </label>
                <input 
                  id="quality"
                  type="range" 
                  v-model.number="quality" 
                  min="50" 
                  max="100" 
                  step="5"
                  class="range-slider"
                />
                <div class="range-labels">
                  <span>{{ $t('exportModal.format.quality.smaller') }}</span>
                  <span>{{ $t('exportModal.format.quality.better') }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleClose">
              <i class="fa-solid fa-xmark"></i>
              {{ $t('exportModal.buttons.cancel') }}
            </button>
            <button class="btn btn-primary" @click="handleConfirm">
              <i class="fa-solid fa-download"></i>
              {{ $t('exportModal.buttons.export') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: var(--space-4);
  overflow-y: auto;
}

/* Modal Container */
.modal-container {
  background: var(--bg);
  border-radius: var(--radius-2xl);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px color-mix(in oklab, var(--border-color) 50%, transparent);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: modalSlideUp 0.3s var(--ease-spring);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5);
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--accent) 5%, transparent) 0%,
    transparent 100%);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: color-mix(in oklab, var(--text) 8%, transparent);
  color: var(--text);
  border-radius: var(--radius-lg);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  transition: all 0.2s var(--ease-smooth);
}

.close-btn:hover {
  background: color-mix(in oklab, var(--text) 15%, transparent);
  transform: scale(1.1);
}

/* Body */
.modal-body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}

/* Info Badge */
.info-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, 
    color-mix(in oklab, var(--accent) 15%, transparent),
    color-mix(in oklab, var(--accent) 8%, transparent));
  border: 1px solid color-mix(in oklab, var(--accent) 30%, transparent);
  border-radius: var(--radius-lg);
  color: var(--text);
  font-weight: 600;
  margin-bottom: var(--space-5);
}

.info-badge i {
  color: var(--accent);
  font-size: 1.1rem;
}

/* Settings Section */
.settings-section {
  margin-bottom: var(--space-6);
  padding: var(--space-5);
  background: color-mix(in oklab, var(--panel) 60%, transparent);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}

.settings-section h3 {
  margin: 0 0 var(--space-4) 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.settings-section h3 i {
  color: var(--accent);
}

/* Form Groups */
.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: 600;
  color: var(--text);
  font-size: 0.95rem;
}

.input-field,
.select-field,
.textarea-field {
  width: 100%;
  padding: var(--space-3);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--panel);
  color: var(--text);
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s var(--ease-smooth);
}

.input-field:focus,
.select-field:focus,
.textarea-field:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 15%, transparent);
}

.textarea-field {
  resize: vertical;
  min-height: 100px;
}

.hint {
  display: block;
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: 0.85rem;
}

/* Checkbox Group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s var(--ease-smooth);
  position: relative;
}

.checkbox-label:hover {
  background: color-mix(in oklab, var(--accent) 8%, transparent);
}

.checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-custom {
  width: 22px;
  height: 22px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--panel);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all 0.2s var(--ease-smooth);
  margin-top: 2px;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
}

.checkbox-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.checkbox-text strong {
  color: var(--text);
  font-weight: 600;
  font-size: 0.95rem;
}

.checkbox-text small {
  color: var(--muted);
  font-size: 0.85rem;
}

/* Nested Section */
.nested-section {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border-left: 3px solid var(--accent);
  background: color-mix(in oklab, var(--accent) 5%, transparent);
  border-radius: var(--radius-md);
}

/* File Input */
.file-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--accent);
  color: white;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s var(--ease-smooth);
  margin-bottom: var(--space-3);
}

.file-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in oklab, var(--accent) 30%, transparent);
}

.file-input {
  display: none;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: color-mix(in oklab, var(--green) 10%, transparent);
  border: 1px solid color-mix(in oklab, var(--green) 30%, transparent);
  border-radius: var(--radius-md);
  color: var(--text);
  font-size: 0.9rem;
}

.file-preview i {
  color: var(--green);
}

/* Format Selector */
.format-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.format-option {
  cursor: pointer;
}

.format-option input[type="radio"] {
  display: none;
}

.format-card {
  padding: var(--space-4);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--panel);
  text-align: center;
  transition: all 0.2s var(--ease-smooth);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.format-card i {
  font-size: 1.8rem;
  color: var(--muted);
  transition: all 0.2s var(--ease-smooth);
}

.format-card strong {
  color: var(--text);
  font-size: 1rem;
}

.format-card small {
  color: var(--muted);
  font-size: 0.85rem;
}

.format-option:hover .format-card {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 8%, transparent);
}

.format-option.active .format-card {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 15%, transparent);
  box-shadow: 0 4px 12px color-mix(in oklab, var(--accent) 20%, transparent);
}

.format-option.active .format-card i {
  color: var(--accent);
}

/* Range Slider */
.range-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: color-mix(in oklab, var(--border-color) 50%, transparent);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s var(--ease-smooth);
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s var(--ease-smooth);
}

.range-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-2);
  font-size: 0.85rem;
  color: var(--muted);
}

/* Footer */
.modal-footer {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-5);
  border-top: 1px solid var(--border-color);
  background: color-mix(in oklab, var(--panel) 40%, transparent);
}

.btn {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: all 0.2s var(--ease-smooth);
}

.btn-secondary {
  background: color-mix(in oklab, var(--text) 10%, transparent);
  color: var(--text);
}

.btn-secondary:hover {
  background: color-mix(in oklab, var(--text) 20%, transparent);
}

.btn-primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 12px color-mix(in oklab, var(--accent) 30%, transparent);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px color-mix(in oklab, var(--accent) 40%, transparent);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s var(--ease-smooth);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container {
  animation: modalSlideUp 0.3s var(--ease-spring);
}

.modal-leave-active .modal-container {
  animation: modalSlideUp 0.3s var(--ease-spring) reverse;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s var(--ease-smooth);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    max-height: 95vh;
    margin: var(--space-2);
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--space-4);
  }

  .format-selector {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }
}

/* Dark Mode Optimierung */
[data-theme="dark"] .modal-overlay {
  background: rgba(0, 0, 0, 0.85);
}

[data-theme="dark"] .modal-container {
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .settings-section {
  background: color-mix(in oklab, var(--panel) 80%, transparent);
}

[data-theme="dark"] .input-field,
[data-theme="dark"] .select-field,
[data-theme="dark"] .textarea-field {
  background: color-mix(in oklab, var(--bg) 80%, transparent);
}
</style>
