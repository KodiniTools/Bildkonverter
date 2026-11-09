/**
 * Typen für `route.meta` (src/router/index.js).
 * Die Felder steuern SEO-Texte (useSeoMeta) und `noindex`; alle sind optional,
 * weil `format-conversion` sie erst im beforeEach-Guard setzt.
 */
import 'vue-router';

export interface RouteSeoTexts {
  title?: string;
  description?: string;
}

declare module 'vue-router' {
  interface RouteMeta extends RouteSeoTexts {
    /** Suchbegriffe für das keywords-Meta-Tag. */
    keywords?: string;
    /** Kanonischer Pfad, falls abweichend vom Routenpfad. */
    path?: string;
    /** Englische Texte (Sprache über ?lang=en). */
    en?: RouteSeoTexts;
    /** Seite nicht indexieren (robots: noindex, nofollow). */
    noIndex?: boolean;
    /** Meta wird zur Laufzeit erzeugt (format-conversion). */
    isDynamic?: boolean;
  }
}
