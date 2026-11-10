/**
 * Gemeinsame Typen der Editor-Composables (src/composables/editor).
 */

/** Bildquelle des Editors: geladenes Bild oder bereits gerenderter Canvas */
export type EditorImage = HTMLImageElement | HTMLCanvasElement;

/** i18n-Übersetzung, wie sie die Composables aufrufen (Schlüssel plus Werte oder Standardtext) */
export type Translate = (key: string, arg?: Record<string, unknown> | string) => string;
