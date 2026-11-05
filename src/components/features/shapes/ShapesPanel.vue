<template>
  <div class="shapes-panel">
    <!-- Galerie -->
    <div class="panel-section shapes-gallery-section">
      <div class="section-header">
        <h3>
          <AppIcon name="shapes" />
          {{ $t('shapes.title') }}
        </h3>
      </div>

      <ShapeCategoryGrid />

      <!-- Zeichenwerkzeuge: Stift / Textmarker -->
      <ShapeDrawSettings v-if="activeCategory === 'draw'" />

      <!-- Eingefügte Formen -->
      <ShapeList v-if="shapes.length" />
    </div>

    <!-- Bearbeiten -->
    <div v-if="selectedShape" class="panel-section shape-edit-section">
      <div class="section-header">
        <h3>
          <AppIcon name="edit" />
          {{ $t('shapes.edit.title') }}
        </h3>
      </div>

      <p class="control-hint shape-hint">{{ $t('shapes.edit.hint') }}</p>

      <ShapeStyleControls />
      <ShapeGeometryControls />
      <ShapeActions />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ShapesPanel – Galerie „Formen & Symbole“ plus Bearbeitung der ausgewählten
 * Form. Container: Zustand und Aktionen liegen in useShapeEditor und werden per
 * provide an die Teil-Bausteine gereicht.
 *
 * Wird im Einzelbild-Modus (TransformPanel) und im Ebenen-Modus
 * (LayerControlPanel, Reiter „Formen“) verwendet.
 */
import { getCurrentInstance } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { provideShapeEditor, useShapeEditor } from '@/composables/shapes/useShapeEditor';
import ShapeActions from './ShapeActions.vue';
import ShapeCategoryGrid from './ShapeCategoryGrid.vue';
import ShapeDrawSettings from './ShapeDrawSettings.vue';
import ShapeGeometryControls from './ShapeGeometryControls.vue';
import ShapeList from './ShapeList.vue';
import ShapeStyleControls from './ShapeStyleControls.vue';

const props = withDefaults(
  defineProps<{
    /** Canvas-Größe in px (Startgröße/-position neuer Formen, Reglerbereiche) */
    canvasWidth?: number;
    canvasHeight?: number;
    disabled?: boolean;
  }>(),
  { canvasWidth: 0, canvasHeight: 0, disabled: false }
);

const instance = getCurrentInstance();
/** Übersetzung über das globale $t (ohne useI18n, damit Tests $t mocken können) */
function t(key: string): string {
  return instance?.proxy?.$t ? instance.proxy.$t(key) : key;
}

const editor = useShapeEditor({
  canvasWidth: () => props.canvasWidth,
  canvasHeight: () => props.canvasHeight,
  disabled: () => props.disabled,
  t,
});
provideShapeEditor(editor);

const { activeCategory, shapes, selectedShape } = editor;
</script>

<style scoped lang="scss">
@use '../transform/shared' as *;

.shape-hint {
  margin: 0 0 var(--ds-space-4);
}
</style>
