<template>
  <div class="filter-presets">
    <div class="presets-header">
      <h3>{{ $t('presets.title') }}</h3>
      <div class="presets-actions">
        <button 
          @click="showSaveDialog" 
          class="action-btn"
          :title="$t('presets.actions.save')"
        >
          <i class="fas fa-save"></i>
        </button>
        <button 
          @click="importPresets" 
          class="action-btn"
          :title="$t('presets.actions.import')"
        >
          <i class="fas fa-file-import"></i>
        </button>
        <button 
          @click="exportPresets" 
          class="action-btn"
          :title="$t('presets.actions.export')"
        >
          <i class="fas fa-file-export"></i>
        </button>
      </div>
    </div>

    <div class="presets-grid">
      <button
        v-for="preset in allPresets"
        :key="preset.id"
        class="preset-btn"
        :class="{ active: activePreset === preset.id }"
        @click="applyPreset(preset)"
        :title="preset.description"
      >
        <span class="preset-icon">{{ preset.icon }}</span>
        <span class="preset-name">{{ $t(`presets.${preset.id}`, preset.name) }}</span>
        <button 
          v-if="preset.custom"
          @click.stop="deletePreset(preset.id)"
          class="delete-btn"
          :title="$t('presets.actions.delete')"
        >
          <i class="fas fa-times"></i>
        </button>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props
const props = defineProps({
  filters: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['apply-preset', 'filters-changed'])

// State
const activePreset = ref(null)
const customPresets = ref([])

// Standard-Presets mit allen Foto-Effekten (inkl. neue Filter)
const defaultPresets = [
  {
    id: 'normal',
    name: 'Normal',
    icon: '📷',
    description: 'Original',
    filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, hue: 0, sepia: 0, grayscale: 0, vignette: 0 }
  },
  {
    id: 'vintage',
    name: 'Vintage',
    icon: '📸',
    description: 'Retro-Look',
    filters: { brightness: 110, contrast: 90, saturation: 70, blur: 0, hue: 0, sepia: 40, vignette: 30 }
  },
  {
    id: 'bw',
    name: 'Schwarz/Weiß',
    icon: '⚫',
    description: 'Klassisch',
    filters: { brightness: 100, contrast: 120, saturation: 0, blur: 0, hue: 0, grayscale: 100 }
  },
  {
    id: 'vivid',
    name: 'Lebendig',
    icon: '🌈',
    description: 'Kräftige Farben',
    filters: { brightness: 105, contrast: 120, saturation: 150, blur: 0, hue: 0, exposure: 5 }
  },
  {
    id: 'sepia',
    name: 'Sepia',
    icon: '📜',
    description: 'Nostalgischer Braun-Ton',
    filters: { brightness: 105, contrast: 95, saturation: 80, blur: 0, hue: 0, sepia: 70, vignette: 20 }
  },
  {
    id: 'dramatic',
    name: 'Dramatisch',
    icon: '🎭',
    description: 'Hoher Kontrast',
    filters: { brightness: 95, contrast: 150, saturation: 120, blur: 0, hue: 0, shadows: -20, highlights: 20, vignette: 25 }
  },
  {
    id: 'soft',
    name: 'Soft',
    icon: '🌸',
    description: 'Weiche Töne',
    filters: { brightness: 110, contrast: 85, saturation: 90, blur: 0.5, hue: 0, highlights: 15, exposure: 5 }
  },
  {
    id: 'hdr',
    name: 'HDR',
    icon: '💎',
    description: 'Sehr hohe Dynamik',
    filters: { brightness: 105, contrast: 130, saturation: 140, blur: 0, hue: 0, highlights: 30, shadows: 30 }
  },
  {
    id: 'cold',
    name: 'Kalt',
    icon: '❄️',
    description: 'Kühle Töne',
    filters: { brightness: 100, contrast: 105, saturation: 90, blur: 0, hue: 200, sepia: 0, exposure: -5 }
  },
  {
    id: 'warm',
    name: 'Warm',
    icon: '🔥',
    description: 'Warme Töne',
    filters: { brightness: 105, contrast: 100, saturation: 110, blur: 0, hue: 15, sepia: 25, exposure: 5 }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    description: 'Orange/Rosa Sonnenuntergang',
    filters: { brightness: 110, contrast: 105, saturation: 120, blur: 0, hue: 10, sepia: 30, vignette: 20 }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    description: 'Blaue Meer-Stimmung',
    filters: { brightness: 100, contrast: 110, saturation: 115, blur: 0, hue: 195, exposure: -5 }
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    icon: '🎬',
    description: 'Film-Look',
    filters: { brightness: 95, contrast: 120, saturation: 95, blur: 0, hue: 5, vignette: 35, shadows: -15 }
  },
  {
    id: 'faded',
    name: 'Faded',
    icon: '👻',
    description: 'Verblasst',
    filters: { brightness: 115, contrast: 75, saturation: 70, blur: 0, hue: 0, exposure: 10 }
  },
  {
    id: 'noir',
    name: 'Noir',
    icon: '🖤',
    description: 'Film Noir Stil',
    filters: { brightness: 95, contrast: 140, saturation: 0, blur: 0, hue: 0, grayscale: 100, vignette: 45 }
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    icon: '✨',
    description: 'Verträumt',
    filters: { brightness: 115, contrast: 80, saturation: 85, blur: 1, hue: 0, highlights: 25, vignette: 15 }
  }
]

// Computed
const allPresets = computed(() => {
  return [...defaultPresets, ...customPresets.value]
})

// Methods
function applyPreset(preset) {
  activePreset.value = preset.id
  emit('apply-preset', preset)
  
  if (window.$toast) {
    window.$toast.success(t('toast.presets.applied', { name: preset.name }))
  }
}

function showSaveDialog() {
  const name = prompt(t('presets.dialogs.saveName'), t('presets.dialogs.defaultName'))
  if (!name) return
  
  const description = prompt(t('presets.dialogs.saveDescription'), '')
  
  const newPreset = {
    id: 'custom_' + Date.now(),
    name: name.trim(),
    icon: '⭐',
    description: description?.trim() || t('presets.custom'),
    filters: { ...props.filters },
    custom: true
  }
  
  customPresets.value.push(newPreset)
  savePresetsToStorage()
  
  if (window.$toast) {
    window.$toast.success(t('toast.presets.saved', { name: name.trim() }))
  }
}

function deletePreset(presetId) {
  if (!confirm(t('presets.dialogs.confirmDelete'))) return
  
  const index = customPresets.value.findIndex(p => p.id === presetId)
  if (index !== -1) {
    const preset = customPresets.value[index]
    customPresets.value.splice(index, 1)
    savePresetsToStorage()
    
    if (activePreset.value === presetId) {
      activePreset.value = null
    }
    
    if (window.$toast) {
      window.$toast.success(t('toast.presets.deleted', { name: preset.name }))
    }
  }
}

function exportPresets() {
  if (customPresets.value.length === 0) {
    if (window.$toast) {
      window.$toast.warning(t('toast.presets.noCustomPresets'))
    }
    return
  }
  
  const json = JSON.stringify(customPresets.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = 'filter-presets.json'
  a.click()
  
  URL.revokeObjectURL(url)
  
  if (window.$toast) {
    window.$toast.success(t('toast.presets.exported', { count: customPresets.value.length }))
  }
}

function importPresets() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const imported = JSON.parse(text)
      
      if (!Array.isArray(imported)) {
        throw new Error(t('presets.errors.invalidFormat'))
      }
      
      // Füge importierte Presets hinzu
      customPresets.value = [...customPresets.value, ...imported]
      savePresetsToStorage()
      
      if (window.$toast) {
        window.$toast.success(t('toast.presets.imported', { count: imported.length }))
      }
    } catch (error) {
      console.error('Import-Fehler:', error)
      if (window.$toast) {
        window.$toast.error(t('toast.presets.importError'), error.message)
      }
    }
  }
  
  input.click()
}

function savePresetsToStorage() {
  try {
    localStorage.setItem('bildkonverter_filterPresets', JSON.stringify(customPresets.value))
  } catch (error) {
    console.error('Fehler beim Speichern:', error)
  }
}

function loadPresetsFromStorage() {
  try {
    const stored = localStorage.getItem('bildkonverter_filterPresets')
    if (stored) {
      customPresets.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Fehler beim Laden:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadPresetsFromStorage()
})

// Public method to reset active preset
function resetActivePreset() {
  activePreset.value = null
}

defineExpose({
  resetActivePreset
})
</script>

<style lang="scss" scoped>
.filter-presets {
  margin-top: var(--spacing-md);
}

.presets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  
  h3 {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.presets-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--color-primary);
    color: white;
    transform: translateY(-1px);
  }
  
  i {
    font-size: 14px;
  }
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: var(--spacing-sm);
  max-height: 300px;
  overflow-y: auto;
  padding: var(--spacing-xs);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.preset-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
  
  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  &.active {
    border-color: var(--color-primary);
    background: var(--color-light-blue);
    
    .preset-icon {
      transform: scale(1.1);
    }
  }
}

.preset-icon {
  font-size: 24px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.preset-name {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  color: var(--color-text-primary);
}

.delete-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  background: var(--color-danger);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  i {
    font-size: 10px;
  }
  
  &:hover {
    background: darkred;
  }
}

.preset-btn:hover .delete-btn {
  opacity: 1;
}
</style>
