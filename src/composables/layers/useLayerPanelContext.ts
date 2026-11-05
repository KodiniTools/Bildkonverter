import { inject, type ComputedRef } from 'vue';
import { LAYER_PANEL_KEY, type useLayerPanel } from '@/composables/useLayerPanel';

/** Bild-Ebene im imageStore (siehe addImageLayer), soweit die Ebenen-Ansicht sie liest */
export interface ImageLayer {
  id: string | number;
  url: string;
  thumbnail?: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  flipX: boolean;
  flipY: boolean;
  filters: Record<'brightness' | 'contrast' | 'saturation' | 'grayscale', number> &
    Record<string, number>;
}

/**
 * Rückgabe von useLayerPanel; die Ebenen-Listen typisiert, weil der JS-Store
 * sie als `never[]` ableitet.
 */
export type LayerPanelContext = Omit<
  ReturnType<typeof useLayerPanel>,
  'selectedLayer' | 'reversedLayers'
> & {
  selectedLayer: ComputedRef<ImageLayer | null>;
  reversedLayers: ComputedRef<ImageLayer[]>;
};

/** Zustand und Aktionen des LayerControlPanel (provide in LayerControlPanel.vue) */
export function useLayerPanelContext(): LayerPanelContext {
  const ctx = inject<LayerPanelContext>(LAYER_PANEL_KEY);
  if (!ctx) throw new Error('useLayerPanelContext: LayerControlPanel fehlt');
  return ctx;
}
