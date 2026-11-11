<template>
  <div class="crop-overlay" :class="{ dragging, resizing }" :style="overlayStyle">
    <!-- Resize Handles -->
    <div class="resize-handle handle-nw"></div>
    <div class="resize-handle handle-n"></div>
    <div class="resize-handle handle-ne"></div>
    <div class="resize-handle handle-e"></div>
    <div class="resize-handle handle-se"></div>
    <div class="resize-handle handle-s"></div>
    <div class="resize-handle handle-sw"></div>
    <div class="resize-handle handle-w"></div>
    <!-- Center Move Indicator -->
    <div class="move-indicator">
      <AppIcon name="arrows-alt" />
    </div>
    <!-- Live-Anzeige der Zuschnittabmessungen (Breite × Höhe in Pixel) -->
    <div
      class="crop-dimensions"
      :class="{ 'crop-dimensions--inside': labelInside }"
      :title="$t('transform.crop.dimensionsTooltip')"
    >
      <AppIcon name="vector-square" />
      <span v-if="output">
        {{ width }} × {{ height }} → {{ output.width }} × {{ output.height }} px
      </span>
      <span v-else>{{ width }} × {{ height }} px</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Zuschnitt-Rahmen über der Leinwand (aus EditorView ausgelagert): Griffe,
 * Verschiebe-Symbol und Live-Abmessungen. Die Maus-/Touch-Logik bleibt beim
 * Canvas (useCanvasInteraction), hier wird nur dargestellt.
 */
import type { CropBoxStyle } from '@/composables/editor/useCropOverlay';
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{
  /** Position und Größe in Anzeige-Pixeln (siehe useCropOverlay) */
  overlayStyle: CropBoxStyle;
  dragging: boolean;
  resizing: boolean;
  /** Abmessungs-Label nach innen klappen (Rahmen klebt oben) */
  labelInside: boolean;
  width: number;
  height: number;
  /** Endgröße nach dem Bestätigen (Social-Preset verkleinert), sonst null */
  output?: { width: number; height: number } | null;
}>();
</script>

<style scoped lang="scss">
/* Crop Overlay: Auswahlrahmen wie im Collage Maker (2 px Akzent) */
.crop-overlay {
  /* Rein optische Größe der Griffe. Die Trefferfläche steckt in
     getHandleAtPoint() (useCrop.ts) und ist davon unabhängig. */
  --handle-size: 8px;

  position: absolute;
  border: 2px solid var(--ds-accent);
  background: transparent;
  pointer-events: none;
  z-index: 100;
  /* Abdunkeln außerhalb des Ausschnitts (Backdrop-Wert) */
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);

  &.dragging {
    cursor: move;
    border-style: solid;
  }

  &.resizing {
    border-style: solid;
  }
}

/* Resize Handles - rein visuell, Canvas handled alle Events.
   Die Griffe sitzen über --handle-offset exakt mittig auf der Kante,
   damit die Ecke unabhängig von der Griffgröße genau ablesbar bleibt.
   Weiße Griffe mit Akzent-Rand wie die Skalierungspunkte im Collage Maker. */
.resize-handle {
  --handle-offset: calc(var(--handle-size) / -2);

  position: absolute;
  width: var(--handle-size);
  height: var(--handle-size);
  background: #fff;
  border: var(--ds-border-width) solid var(--ds-accent);
  pointer-events: none;
  z-index: 101;

  &.handle-nw {
    top: var(--handle-offset);
    left: var(--handle-offset);
  }

  &.handle-n {
    top: var(--handle-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  &.handle-ne {
    top: var(--handle-offset);
    right: var(--handle-offset);
  }

  &.handle-e {
    top: 50%;
    right: var(--handle-offset);
    transform: translateY(-50%);
  }

  &.handle-se {
    bottom: var(--handle-offset);
    right: var(--handle-offset);
  }

  &.handle-s {
    bottom: var(--handle-offset);
    left: 50%;
    transform: translateX(-50%);
  }

  &.handle-sw {
    bottom: var(--handle-offset);
    left: var(--handle-offset);
  }

  &.handle-w {
    top: 50%;
    left: var(--handle-offset);
    transform: translateY(-50%);
  }
}

/* Auf Touch-Geräten etwas größer, damit die Griffe unter dem Finger
   sichtbar bleiben. Die Trefferfläche ändert sich dadurch nicht. */
@media (pointer: coarse) {
  .crop-overlay {
    --handle-size: 12px;
  }
}

/* Live-Anzeige der Zuschnittabmessungen: schwebende Pille auf der Leinwand */
.crop-dimensions {
  position: absolute;
  bottom: calc(100% + var(--ds-space-2));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-3);
  background: var(--ds-surface-1);
  color: var(--ds-text);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-sm);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  z-index: 102;
  box-shadow: var(--ds-shadow-overlay);

  .app-icon {
    color: var(--ds-text-2);
  }

  /* Kein Platz oberhalb der Box -> Label nach innen klappen */
  &.crop-dimensions--inside {
    bottom: auto;
    top: var(--ds-space-2);
  }
}

/* Move Indicator in der Mitte: schwebender runder Knopf */
.move-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-text);
  pointer-events: none;
  box-shadow: var(--ds-shadow-overlay);

  .app-icon {
    pointer-events: none;
  }
}
</style>
