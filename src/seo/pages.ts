/**
 * SEO-Texte aller Seiten – eine Quelle für zwei Verbraucher:
 * - den Router (setzt die Tags zur Laufzeit, src/composables/useSeoMeta.ts),
 * - den Build (schreibt pro Seite und Sprache ein fertiges HTML, src/seo/prerender.ts),
 *   damit Crawler ohne JavaScript unter ?lang=en schon englische Tags sehen.
 *
 * Bewusst ohne Vue-/DOM-Abhängigkeiten und ohne '@/'-Alias, weil vite.config.ts
 * diese Datei beim Build direkt lädt.
 */
import type { Locale } from '../utils/localeSeo';

export const SEO_BASE_URL = 'https://kodinitools.com/bildkonverter';
const SITE_NAME = 'KodiniTools';
const PRODUCT_NAME: Record<Locale, string> = {
  de: 'Bildkonverter Pro',
  en: 'Image Converter Pro',
};

/** Titel und Beschreibung einer Seite in einer Sprache. */
export interface SeoTexts {
  title?: string;
  description?: string;
}

/** SEO-Daten einer Seite (Deutsch auf oberster Ebene, Englisch unter `en`). */
export interface PageSeo extends SeoTexts {
  /** Suchbegriffe (nur Deutsch). */
  keywords?: string;
  /** Kanonischer Pfad ab /bildkonverter, z. B. '/editor'. */
  path: string;
  /** Englische Texte (Sprache über ?lang=en). */
  en?: SeoTexts;
  /** Seite nicht indexieren (robots: noindex, nofollow). */
  noIndex?: boolean;
}

/** Konvertierungs-Paar einer Landingpage (z. B. heic-zu-jpg) */
export interface FormatConversion {
  pair: string;
  from: string;
  to: string;
}

/**
 * Unterstützte Konvertierungs-Kombinationen für format-spezifische Landingpages.
 * Jeder Eintrag erzeugt eine eigene Route unter /konvertieren/:pair.
 */
export const formatConversions: readonly FormatConversion[] = [
  { pair: 'heic-zu-jpg', from: 'HEIC', to: 'JPG' },
  { pair: 'png-zu-webp', from: 'PNG', to: 'WebP' },
  { pair: 'jpg-zu-webp', from: 'JPG', to: 'WebP' },
  { pair: 'webp-zu-png', from: 'WebP', to: 'PNG' },
  { pair: 'jpg-zu-png', from: 'JPG', to: 'PNG' },
  { pair: 'png-zu-jpg', from: 'PNG', to: 'JPG' },
  { pair: 'tiff-zu-jpg', from: 'TIFF', to: 'JPG' },
  { pair: 'bmp-zu-webp', from: 'BMP', to: 'WebP' },
  { pair: 'gif-zu-webp', from: 'GIF', to: 'WebP' },
  { pair: 'heic-zu-png', from: 'HEIC', to: 'PNG' },
  { pair: 'webp-zu-jpg', from: 'WebP', to: 'JPG' },
  { pair: 'svg-zu-png', from: 'SVG', to: 'PNG' },
  { pair: 'jpg-zu-pdf', from: 'JPG', to: 'PDF' },
  { pair: 'png-zu-svg', from: 'PNG', to: 'SVG' },
];

/** SEO-Texte der statischen Routen, Schlüssel = Routenname. */
export const routeSeo = {
  home: {
    title: 'Bilder konvertieren online',
    description:
      'Bilder konvertieren online und kostenlos: JPG zu WebP, WebP in JPG, HEIC in JPG, PNG in JPG. Bildformat ändern, komprimieren und zuschneiden direkt im Browser.',
    keywords:
      'Bilder konvertieren online, Bildkonverter, JPG zu WebP, WebP in JPG, HEIC in JPG, PNG in JPG, Bildformat ändern, Batch Bildkonverter, Bilder komprimieren',
    path: '/',
    en: {
      title: 'Convert Images Online',
      description:
        'Free image converter online: JPG to WebP, WebP to JPG, HEIC to JPG, PNG to JPG. Change image format, compress and crop images right in your browser.',
    },
  },
  editor: {
    title: 'Bild-Editor',
    description:
      'Online Bild-Editor: Bilder bearbeiten mit Filtern, Effekten, Helligkeit, Kontrast und Sättigung. Formate konvertieren zwischen JPG, PNG, WebP, TIFF, GIF und PDF. Kostenlos im Browser.',
    keywords: 'Bild bearbeiten online, Bildeditor, Filter anwenden, Bild zuschneiden, Bild drehen',
    path: '/editor',
    en: {
      title: 'Image Editor',
      description:
        'Online image editor: edit images with filters, effects, brightness, contrast and saturation. Convert between JPG, PNG, WebP, TIFF, GIF and PDF. Free in your browser.',
    },
  },
  batch: {
    title: 'Mehrere Bilder umwandeln',
    description:
      'Hunderte Bilder gleichzeitig konvertieren: Wählen Sie Zielformat, Qualität und Größe. Batch-Verarbeitung für PNG, JPG, WebP und mehr – schnell und kostenlos.',
    keywords:
      'Batch Bildkonverter, mehrere Bilder konvertieren, Massenkonvertierung, Bilder gleichzeitig umwandeln',
    path: '/batch',
    en: {
      title: 'Batch Convert Images',
      description:
        'Convert hundreds of images at once: choose target format, quality and size. Batch processing for PNG, JPG, WebP and more – fast and free.',
    },
  },
  gallery: {
    title: 'Galerie',
    description:
      'Bildergalerie mit bearbeiteten Bildern. Verwalten und vergleichen Sie Ihre konvertierten und bearbeiteten Bilder im Bildkonverter Pro.',
    keywords: 'Bildergalerie, Bilder verwalten, Fotocollage erstellen, Bilder herunterladen',
    path: '/gallery',
    en: {
      title: 'Gallery',
      description:
        'Gallery of your edited images. Manage and compare your converted and edited images in Image Converter Pro.',
    },
  },
  guide: {
    title: 'Anleitung',
    description:
      'Schritt-für-Schritt-Anleitung zum Bildkonverter Pro: Bilder hochladen, bearbeiten, konvertieren und exportieren. Tipps zu Filtern, Zuschneiden und Formatwahl.',
    keywords:
      'Bildkonverter Anleitung, Bilder konvertieren Anleitung, WebP Anleitung, Bildbearbeitung Tutorial',
    path: '/guide',
    en: {
      title: 'Guide',
      description:
        'Step-by-step guide to Image Converter Pro: upload, edit, convert and export images. Tips on filters, cropping and choosing a format.',
    },
  },
  about: {
    title: 'Über uns',
    description:
      'Über Bildkonverter Pro von KodiniTools: Datenschutz-fokussierte Bildbearbeitung mit lokaler Verarbeitung im Browser. Server in Deutschland, DSGVO-konform.',
    keywords: 'Kodini Bildkonverter, KodiniTools, Über uns, Datenschutz Bildkonverter',
    path: '/about',
    en: {
      title: 'About Us',
      description:
        'About Image Converter Pro by KodiniTools: privacy-focused image editing with local processing in your browser. Servers in Germany, GDPR-compliant.',
    },
  },
  faq: {
    title: 'Häufige Fragen (FAQ)',
    description:
      'Antworten auf häufig gestellte Fragen zum Bildkonverter Pro: Unterstützte Formate, Datenschutz, Filter, Zuschneiden, Drehen und Download.',
    keywords: 'FAQ Bildkonverter, häufig gestellte Fragen, Bildkonverter Hilfe, Bildformate FAQ',
    path: '/faq',
    en: {
      title: 'FAQ',
      description:
        'Answers to frequently asked questions about Image Converter Pro: supported formats, privacy, filters, cropping, rotating and download.',
    },
  },
  formatAdvisor: {
    title: 'Formatberater für Bilder',
    description:
      'Welches Bildformat passt? Bild hochladen, Verwendungszweck wählen und eine Empfehlung mit Einstellungen für Website, Shop, Druck und mehr erhalten – direkt im Browser.',
    keywords:
      'Formatberater, welches Bildformat, JPG oder PNG, WebP oder JPG, Bildformat Website, Bildformat Druck',
    path: '/formatberater',
    en: {
      title: 'Image format advisor',
      description:
        'Which image format fits? Upload an image, choose its use and get a recommendation with settings for websites, shops, print and more – right in your browser.',
    },
  },
  download: {
    title: 'Für Windows herunterladen',
    description:
      'Bildkonverter Pro als kostenlose Windows-App: Installer (.exe) oder MSI-Paket für Windows 10 und 11. Bilder bearbeiten, konvertieren und Hintergründe entfernen – lokal auf dem PC.',
    keywords:
      'Bildkonverter Windows, Bildkonverter Download, Bildkonverter App, Bildbearbeitung offline, MSI, EXE',
    path: '/download',
    en: {
      title: 'Download for Windows',
      description:
        'Image Converter Pro as a free Windows app: installer (.exe) or MSI package for Windows 10 and 11. Edit and convert images and remove backgrounds – locally on your PC.',
    },
  },
  notFound: {
    title: 'Seite nicht gefunden',
    description: 'Die angeforderte Seite wurde nicht gefunden.',
    noIndex: true,
    path: '/404',
  },
} satisfies Record<string, PageSeo>;

/** SEO-Daten einer Format-Landingpage (/konvertieren/:pair). */
export function formatConversionSeo({ pair, from, to }: FormatConversion): PageSeo {
  return {
    title: `${from} in ${to} umwandeln`,
    description: `${from} Dateien kostenlos in ${to} konvertieren. Schnelle Umwandlung direkt im Browser, ohne Upload. Perfekt für Web-Optimierung und Kompatibilität.`,
    keywords: `${from} zu ${to}, ${from} in ${to} umwandeln, ${from} konvertieren, ${pair} Konverter, Bildformat ändern`,
    path: `/konvertieren/${pair}`,
    en: {
      title: `Convert ${from} to ${to}`,
      description: `Convert ${from} files to ${to} for free. Fast conversion right in your browser, no upload. Perfect for web optimization and compatibility.`,
    },
  };
}

/** Texte einer Seite in der gewünschten Sprache (ohne englische Texte: Deutsch). */
export function seoTexts(page: SeoTexts & { en?: SeoTexts }, locale: Locale): SeoTexts {
  return locale === 'en' && page.en ? page.en : page;
}

/** Vollständiger Dokumenttitel, z. B. "Galerie - Bildkonverter Pro | KodiniTools". */
export function seoFullTitle(title: string | undefined, locale: Locale): string {
  const product = PRODUCT_NAME[locale];
  return title ? `${title} - ${product} | ${SITE_NAME}` : `${product} | ${SITE_NAME}`;
}

/** Alle indexierbaren Seiten (statische Routen + Format-Landingpages). */
export function indexablePages(): PageSeo[] {
  const pages: PageSeo[] = Object.values(routeSeo);
  return [...pages, ...formatConversions.map(formatConversionSeo)].filter((p) => !p.noIndex);
}
