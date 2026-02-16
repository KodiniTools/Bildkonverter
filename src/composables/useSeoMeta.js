/**
 * SEO Meta-Tag Management Composable
 *
 * Aktualisiert dynamisch <title>, <meta> und <link rel="canonical">
 * bei jedem Routenwechsel. Da die App eine CSR-SPA ist, werden die
 * Tags per DOM-Manipulation gesetzt – für Crawler ohne JS-Ausführung
 * bleiben die statischen Werte aus index.html bestehen.
 */

const BASE_URL = 'https://www.kodinitools.com/bildkonverter'
const SITE_NAME = 'KodiniTools'
const DEFAULT_TITLE_SUFFIX = 'Bildkonverter Pro'

/**
 * Setzt oder aktualisiert ein <meta>-Tag im <head>
 */
function setMetaTag(attribute, key, content) {
  if (!content) return
  let element = document.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/**
 * Setzt oder aktualisiert <link rel="canonical">
 */
function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

/**
 * Aktualisiert alle SEO-relevanten Meta-Tags für die aktuelle Route
 *
 * @param {object} meta - Route-Meta-Objekt mit SEO-Feldern
 * @param {string} meta.title - Seitentitel (wird mit Suffix kombiniert)
 * @param {string} meta.description - Meta-Description
 * @param {string} meta.path - URL-Pfad der Route (z.B. '/editor')
 */
export function updateSeoMeta(meta) {
  const { title, description, path = '' } = meta

  // Title
  const fullTitle = title
    ? `${title} - ${DEFAULT_TITLE_SUFFIX} | ${SITE_NAME}`
    : `${DEFAULT_TITLE_SUFFIX} | ${SITE_NAME}`
  document.title = fullTitle

  // Canonical URL
  const canonicalUrl = `${BASE_URL}${path}`
  setCanonical(canonicalUrl)

  // Meta Description
  if (description) {
    setMetaTag('name', 'description', description)
  }

  // Open Graph
  setMetaTag('property', 'og:title', fullTitle)
  setMetaTag('property', 'og:url', canonicalUrl)
  if (description) {
    setMetaTag('property', 'og:description', description)
  }

  // Twitter Card
  setMetaTag('name', 'twitter:title', fullTitle)
  if (description) {
    setMetaTag('name', 'twitter:description', description)
  }
}

/**
 * Setzt die hreflang-Tags basierend auf der aktuellen Sprache
 */
export function updateHreflang(locale) {
  setMetaTag('property', 'og:locale', locale === 'en' ? 'en_US' : 'de_DE')
  document.documentElement.setAttribute('lang', locale)
}
