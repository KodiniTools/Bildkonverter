/** Bild in der Galerie (siehe galleryStore.addImage) */
export interface GalleryImage {
  id: number;
  name: string;
  /** Data-URL des Originals */
  url: string;
  /** JPEG-Data-URL, max. 300×300 */
  thumbnail: string;
  width: number;
  height: number;
  /** Bytes */
  size: number;
  uploadedAt: Date;
  file: File | null;
}
