export interface HeroTitleParts {
  /** Einstieg inklusive Gedankenstrich, z. B. „Bilder konvertieren online –“ */
  lead: string;
  /** Produktname nach dem Gedankenstrich; leer, wenn keiner vorkommt */
  brand: string;
}

/**
 * Teilt die Startseiten-Überschrift am ersten Gedankenstrich („ – “) in zwei
 * Teile, damit sie zweifarbig dargestellt werden kann. Der sichtbare Text
 * (und damit die H1 für SEO) bleibt unverändert.
 */
export function splitHeroTitle(title: string): HeroTitleParts {
  const separator = ' – ';
  const index = title.indexOf(separator);
  if (index === -1) return { lead: title, brand: '' };
  return {
    lead: title.slice(0, index + separator.length - 1),
    brand: title.slice(index + separator.length),
  };
}
