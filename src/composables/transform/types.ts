/** Bild-Transformationen des Editors (siehe DEFAULT_TRANSFORMS in useTransform.ts) */
export interface ImageTransforms {
  opacity: number;
  rotation: number;
  scale: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  panX?: number;
  panY?: number;
  shadowEnabled: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOpacity: number;
  skewX: number;
  skewY: number;
  distortEnabled?: boolean;
}
