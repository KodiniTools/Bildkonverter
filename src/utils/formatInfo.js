/**
 * formatInfo - Beschreibung aller unterstützten Export-Formate
 * (Anzeige, MIME-Typ, Endung, Client- oder Backend-Konvertierung)
 */

/**
 * Format-Informationen
 */
export const FORMAT_INFO = {
  png: {
    name: 'PNG',
    description: 'Lossless, with transparency',
    extension: 'png',
    mimeType: 'image/png',
    supportsQuality: false,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Logos, UI, Screenshots',
    icon: '🖼️',
  },
  jpeg: {
    name: 'JPEG',
    description: 'Lossy, small file size',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    supportsQuality: true,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Photos, Images',
    icon: '📷',
  },
  jpg: {
    name: 'JPG',
    description: 'Lossy, small file size',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    supportsQuality: true,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Photos, Images',
    icon: '📷',
  },
  webp: {
    name: 'WebP',
    description: 'Modern, efficient, small',
    extension: 'webp',
    mimeType: 'image/webp',
    supportsQuality: true,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Web, modern browsers',
    icon: '🌐',
  },
  tiff: {
    name: 'TIFF',
    description: 'Professional format',
    extension: 'tiff',
    mimeType: 'image/tiff',
    supportsQuality: false,
    requiresBackend: true,
    maxSize: '1GB',
    recommended: 'Print, Archiving',
    icon: '📄',
  },
  tif: {
    name: 'TIF',
    description: 'Professional format',
    extension: 'tif',
    mimeType: 'image/tiff',
    supportsQuality: false,
    requiresBackend: true,
    maxSize: '1GB',
    recommended: 'Print, Archiving',
    icon: '📄',
  },
  heif: {
    name: 'HEIF',
    description: 'Modern, high efficiency',
    extension: 'heif',
    mimeType: 'image/heif',
    supportsQuality: true,
    requiresBackend: true,
    maxSize: '500MB',
    recommended: 'Photos (newer devices)',
    icon: '📱',
  },
  heic: {
    name: 'HEIC',
    description: 'Modern, high efficiency (Apple)',
    extension: 'heic',
    mimeType: 'image/heic',
    supportsQuality: true,
    requiresBackend: true,
    maxSize: '500MB',
    recommended: 'iOS, macOS',
    icon: '🍎',
  },
  gif: {
    name: 'GIF',
    description: 'Single-frame GIF',
    extension: 'gif',
    mimeType: 'image/gif',
    supportsQuality: false,
    requiresBackend: true,
    maxSize: '500MB',
    recommended: 'Compatibility, Retro',
    icon: '🎨',
  },
  pdf: {
    name: 'PDF',
    description: 'Document, A4 format',
    extension: 'pdf',
    mimeType: 'application/pdf',
    supportsQuality: false,
    requiresBackend: false,
    maxSize: '500MB',
    recommended: 'Documents, Print',
    icon: '📑',
  },
  svg: {
    name: 'SVG',
    description: 'Scalable Vector Graphics',
    extension: 'svg',
    mimeType: 'image/svg+xml',
    supportsQuality: false,
    requiresBackend: true,
    clientFallback: true,
    maxSize: '100MB',
    recommended: 'Logos, Icons, Web Graphics',
    icon: '✏️',
  },
};

/**
 * Alle unterstützten Formate
 */
export const SUPPORTED_FORMATS = Object.keys(FORMAT_INFO);

/**
 * Client-side Formate (ohne Backend)
 */
export const CLIENT_FORMATS = SUPPORTED_FORMATS.filter(
  (format) => !FORMAT_INFO[format].requiresBackend
);

/**
 * Backend-Formate (benötigen API-Call)
 */
export const BACKEND_FORMATS = SUPPORTED_FORMATS.filter(
  (format) => FORMAT_INFO[format].requiresBackend
);

/**
 * Export Manager Class
 */
