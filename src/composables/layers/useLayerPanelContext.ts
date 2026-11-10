import { inject, type ComputedRef } from 'vue';
import { LAYER_PANEL_KEY, type useLayerPanel } from '@/composables/useLayerPanel';
import type { ImageLayer as StoreImageLayer } from '@/stores/image/types';

/** Felder einer Bild-Ebene (stores/image/types), die die Ebenen-Ansicht liest */
export type ImageLayer = Pick<
  StoreImageLayer,
  | 'id'
  | 'url'
  | 'thumbnail'
  | 'name'
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'opacity'
  | 'visible'
  | 'flipX'
  | 'flipY'
  | 'filters'
>;

/**
 * Rückgabe von useLayerPanel; die Ebenen-Listen auf die Felder eingeschränkt,
 * die die Ebenen-Ansicht liest (Tests liefern dafür Teilobjekte).
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
