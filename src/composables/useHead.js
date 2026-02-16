/**
 * useHead – Composable für dynamisches Management von SEO Meta-Tags.
 *
 * Aktualisiert document.title sowie <meta>-Tags (name, property)
 * und den <link rel="canonical">-Tag bei jedem Routenwechsel.
 */

const BASE_URL = 'https://kodinitools.de/bildkonverter'

/**
 * Setzt oder aktualisiert ein <meta>-Tag im <head>.
 * @param {string} attr  – 'name' oder 'property'
 * @param {string} key   – Attribut-Wert (z.B. 'description', 'og:title')
 * @param {string} value – Content-Wert
 */
function setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

/**
 * Setzt oder aktualisiert den <link rel="canonical">-Tag.
 * @param {string} href – Die kanonische URL
 */
function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Aktualisiert alle SEO-relevanten Tags basierend auf der Route-Meta-Konfiguration.
 *
 * @param {object} meta – Das meta-Objekt der aktuellen Route
 * @param {string} meta.title       – Seitentitel
 * @param {string} meta.description – Meta-Beschreibung
 * @param {string} [meta.keywords]  – Meta-Keywords (optional)
 * @param {string} [meta.canonical] – Kanonische URL (optional, wird aus path generiert)
 * @param {string} path             – Der aktuelle Route-Pfad
 */
export function useHead(meta, path) {
  if (!meta) return

  // Title
  const title = meta.title || 'Kodini Bildkonverter'
  document.title = title

  // Description
  if (meta.description) {
    setMeta('name', 'description', meta.description)
    setMeta('property', 'og:description', meta.description)
    setMeta('name', 'twitter:description', meta.description)
  }

  // Keywords
  if (meta.keywords) {
    setMeta('name', 'keywords', meta.keywords)
  }

  // OG Title
  setMeta('property', 'og:title', title)
  setMeta('name', 'twitter:title', title)

  // Canonical & OG URL
  const canonicalUrl = meta.canonical || `${BASE_URL}${path === '/' ? '/' : path}`
  setCanonical(canonicalUrl)
  setMeta('property', 'og:url', canonicalUrl)
}

export default useHead
