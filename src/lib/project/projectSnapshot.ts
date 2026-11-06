/**
 * Projekt-Snapshot für die lokale Sicherung.
 *
 * Grundlage ist ein Eintrag aus useEditorHistory (Bild, Filter, Texte, Formen,
 * Ebenen …). Für IndexedDB werden alle Bilder darin von Data-/Blob-URLs in
 * Blobs umgewandelt: Blob-URLs gelten nur, solange die Seite offen ist, und
 * Blobs speichert IndexedDB ohne Base64-Aufschlag.
 */

/** Ebene im History-Snapshot (Ergebnis von serializeImageLayers) */
interface SnapshotLayer {
  url?: string;
  thumbnail?: string;
  [key: string]: unknown;
}

/** History-Eintrag von useEditorHistory (nur die hier benötigten Felder typisiert) */
export interface EditorSnapshot {
  imageData?: string | null;
  rawImageSrc?: string | null;
  imageLayers?: SnapshotLayer[];
  [key: string]: unknown;
}

/** Gespeicherte Form des Snapshots: JSON-Daten plus Blobs für die Bilder */
export interface PackedSnapshot {
  state: Record<string, unknown>;
  rawImage: Blob | null;
  layerImages: (Blob | null)[];
  layerThumbnails: (Blob | null)[];
}

/** Data-URL ohne fetch() in einen Blob umwandeln */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) throw new Error('Keine Data-URL');
  const meta = dataUrl.slice(5, comma);
  const payload = dataUrl.slice(comma + 1);
  const type = meta.split(';')[0] || 'application/octet-stream';
  if (meta.includes(';base64')) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type });
  }
  return new Blob([decodeURIComponent(payload)], { type });
}

/** Bildadresse (Data- oder Blob-URL, gleiche Herkunft) als Blob lesen */
export async function urlToBlob(url: string | null | undefined): Promise<Blob | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return dataUrlToBlob(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Bild nicht lesbar (${response.status})`);
  return response.blob();
}

/**
 * Snapshot für IndexedDB vorbereiten. Das gerenderte Vorschaubild (imageData)
 * fällt weg, wenn das Rohbild vorliegt; die Wiederherstellung nutzt ohnehin
 * zuerst rawImageSrc.
 */
export async function packSnapshot(snapshot: EditorSnapshot): Promise<PackedSnapshot> {
  const { imageData, rawImageSrc, imageLayers, ...rest } = snapshot;
  const layers = imageLayers || [];

  const rawImage = await urlToBlob(rawImageSrc || imageData);
  const layerImages = await Promise.all(layers.map((layer) => urlToBlob(layer.url)));
  const layerThumbnails = await Promise.all(
    layers.map((layer) =>
      layer.thumbnail && layer.thumbnail !== layer.url ? urlToBlob(layer.thumbnail) : null
    )
  );

  const state = JSON.parse(
    JSON.stringify({
      ...rest,
      imageLayers: layers.map((layer) => ({ ...layer, url: '', thumbnail: '' })),
    })
  );
  return { state, rawImage, layerImages, layerThumbnails };
}

/**
 * Gespeicherten Snapshot wieder in einen History-Eintrag verwandeln. Bilder
 * bekommen frische Blob-URLs; sie bleiben gültig, solange die Seite offen ist
 * (Ebenen und Historie greifen später erneut darauf zu).
 */
export function unpackSnapshot(
  packed: PackedSnapshot,
  createUrl: (blob: Blob) => string = (blob) => URL.createObjectURL(blob)
): EditorSnapshot {
  const state = JSON.parse(JSON.stringify(packed.state)) as EditorSnapshot;
  const rawImageSrc = packed.rawImage ? createUrl(packed.rawImage) : null;
  const layers = (state.imageLayers || [])
    .map((layer, index) => {
      const image = packed.layerImages[index];
      if (!image) return null;
      const url = createUrl(image);
      const thumb = packed.layerThumbnails[index];
      return { ...layer, url, thumbnail: thumb ? createUrl(thumb) : url };
    })
    .filter((layer): layer is SnapshotLayer & { url: string; thumbnail: string } => !!layer);

  return { ...state, rawImageSrc, imageData: null, imageLayers: layers };
}
