import { formatConversions } from '@/seo/pages';

/** Dateiendung als Formatname, wie er in formatConversions steht (JPEG → JPG, TIF → TIFF). */
function formatFromFileName(fileName: string): string | null {
  const dot = fileName.lastIndexOf('.');
  if (dot === -1 || dot === fileName.length - 1) return null;
  const ext = fileName.slice(dot + 1).toUpperCase();
  if (ext === 'JPEG') return 'JPG';
  if (ext === 'TIF') return 'TIFF';
  return ext;
}

/**
 * Sucht die Landingpage für „Ausgangsformat → empfohlenes Format“, z. B. png-zu-webp.
 * Gibt null zurück, wenn es dafür keine Seite gibt oder beide Formate gleich sind.
 */
export function findConversionPair(fileName: string, targetFormat: string): string | null {
  const from = formatFromFileName(fileName);
  if (!from) return null;
  const to = targetFormat.toUpperCase();
  const match = formatConversions.find(
    (c) => c.from.toUpperCase() === from && c.to.toUpperCase() === to
  );
  return match?.pair ?? null;
}
