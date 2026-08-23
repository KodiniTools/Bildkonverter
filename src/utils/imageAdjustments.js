/**
 * imageAdjustments.js
 *
 * Echte, pixelbasierte Bildanpassungen anstelle der bisherigen
 * CSS-Filter-Näherungen. Belichtung, Lichter und Schatten wurden
 * zuvor nur über `brightness()`/`contrast()` "gefälscht" – das
 * veränderte immer das gesamte Bild statt gezielt Tonwertbereiche.
 *
 * Diese Datei berechnet die Anpassungen direkt auf den Pixeldaten:
 *
 *  Tonwert-Anpassungen (echt, per Pixel):
 *   - exposure   (Belichtung)  – linearer Licht-Gain in stops
 *   - brightness (Helligkeit)  – linearer Faktor
 *   - contrast   (Kontrast)    – um den Mittelwert 0.5
 *   - highlights (Lichter)     – nur helle Tonwerte (Luminanz-Maske)
 *   - shadows    (Schatten)    – nur dunkle Tonwerte (Luminanz-Maske)
 *   - saturation (Sättigung)   – luminanzerhaltend
 *
 *  Effekt-Filter (weiterhin als CSS-Filter beim Zeichnen, da nativ
 *  schneller/qualitativ gleichwertig):
 *   - blur, hue-rotate, sepia, grayscale, invert
 */

// Standardwerte der Tonwert-Anpassungen (kein Effekt)
const TONAL_DEFAULTS = {
  exposure: 0,
  brightness: 100,
  contrast: 100,
  highlights: 0,
  shadows: 0,
  saturation: 100,
};

// Luminanz-Gewichte (Rec. 709)
const LUM_R = 0.2126;
const LUM_G = 0.7152;
const LUM_B = 0.0722;

// Einfacher Ein-Eintrag-Cache, damit renderImage() und
// renderImageForExport() (bzw. Crop) denselben Puffer wiederverwenden.
let _cache = { key: null, canvas: null };

/**
 * Prüft, ob mindestens eine echte Tonwert-Anpassung aktiv ist.
 * @param {Object} f - Filter-Objekt
 * @returns {boolean}
 */
export function hasTonalAdjustments(f) {
  return (
    (f.exposure ?? 0) !== TONAL_DEFAULTS.exposure ||
    (f.brightness ?? 100) !== TONAL_DEFAULTS.brightness ||
    (f.contrast ?? 100) !== TONAL_DEFAULTS.contrast ||
    (f.highlights ?? 0) !== TONAL_DEFAULTS.highlights ||
    (f.shadows ?? 0) !== TONAL_DEFAULTS.shadows ||
    (f.saturation ?? 100) !== TONAL_DEFAULTS.saturation
  );
}

/**
 * Baut den CSS-Filter-String für die reinen Effekt-Filter.
 * Diese werden beim Zeichnen auf dem Ziel-Canvas angewendet.
 * @param {Object} f - Filter-Objekt
 * @returns {string} CSS-Filter-String ('none' wenn keiner aktiv)
 */
export function buildEffectFilterString(f) {
  const parts = [];
  if ((f.blur ?? 0) > 0) parts.push(`blur(${f.blur}px)`);
  if ((f.hue ?? 0) !== 0) parts.push(`hue-rotate(${f.hue}deg)`);
  if ((f.sepia ?? 0) > 0) parts.push(`sepia(${f.sepia}%)`);
  if ((f.grayscale ?? 0) > 0) parts.push(`grayscale(${f.grayscale}%)`);
  if ((f.invert ?? 0) > 0) parts.push(`invert(${f.invert}%)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Fallback-Filter-String (CSS-Näherung inkl. Tonwerte).
 * Wird nur genutzt, wenn die Pixelverarbeitung nicht möglich ist
 * (z. B. "tainted canvas" bei Cross-Origin-Bildern).
 * @param {Object} f - Filter-Objekt
 * @returns {string}
 */
export function buildApproxFilterString(f) {
  const exposureAdjust = 100 + (f.exposure ?? 0);
  const highlightsAdjust = 100 + (f.highlights ?? 0) * 0.5;
  const shadowsAdjust = 100 + (f.shadows ?? 0) * 0.3;
  const parts = [
    `brightness(${(f.brightness ?? 100) * (exposureAdjust / 100) * (highlightsAdjust / 100)}%)`,
    `contrast(${(f.contrast ?? 100) * (shadowsAdjust / 100)}%)`,
    `saturate(${f.saturation ?? 100}%)`,
  ];
  const effect = buildEffectFilterString(f);
  if (effect !== 'none') parts.push(effect);
  return parts.join(' ');
}

// sRGB <-> lineares Licht (für physikalisch korrekte Belichtung)
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Erzeugt eine Lookup-Tabelle (0..255 -> 0..1) für die
 * kanalunabhängigen Tonwert-Operationen: Belichtung -> Helligkeit
 * -> Kontrast. Das spart teure Berechnungen im Pixel-Loop.
 * @param {Object} f
 * @returns {Float32Array} Länge 256, Werte 0..1
 */
function buildToneLUT(f) {
  const exposure = f.exposure ?? 0;
  const brightness = (f.brightness ?? 100) / 100;
  const contrast = (f.contrast ?? 100) / 100;
  // Belichtung als Blenden-Gain: ±50 entspricht ±2 Blendenstufen
  const gain = Math.pow(2, exposure / 25);

  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i / 255;

    // Belichtung im linearen Lichtraum (echte Belichtung)
    if (exposure !== 0) {
      let lin = srgbToLinear(v) * gain;
      lin = clamp01(lin);
      v = linearToSrgb(lin);
    }

    // Helligkeit: linearer Faktor
    if (brightness !== 1) {
      v *= brightness;
    }

    // Kontrast: Spreizung um den Mittelwert
    if (contrast !== 1) {
      v = (v - 0.5) * contrast + 0.5;
    }

    lut[i] = clamp01(v);
  }
  return lut;
}

/**
 * Wendet alle Tonwert-Anpassungen direkt auf ein ImageData-Array an.
 * @param {Uint8ClampedArray} data - RGBA-Pixeldaten (wird in-place verändert)
 * @param {Object} f - Filter-Objekt
 */
export function applyTonalAdjustments(data, f) {
  const lut = buildToneLUT(f);
  const hi = (f.highlights ?? 0) / 100; // -1..1
  const sh = (f.shadows ?? 0) / 100; // -1..1
  const sat = (f.saturation ?? 100) / 100;
  const STRENGTH = 0.5; // maximale Verschiebung für Lichter/Schatten

  const doToneRange = hi !== 0 || sh !== 0;
  const doSaturation = sat !== 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = lut[data[i]];
    let g = lut[data[i + 1]];
    let b = lut[data[i + 2]];

    // Lichter / Schatten: nur den jeweiligen Tonwertbereich anheben/absenken
    if (doToneRange) {
      const lum = LUM_R * r + LUM_G * g + LUM_B * b;
      const wHi = lum * lum; // betont helle Bereiche
      const wLo = (1 - lum) * (1 - lum); // betont dunkle Bereiche
      const delta = (hi * wHi + sh * wLo) * STRENGTH;
      r = clamp01(r + delta);
      g = clamp01(g + delta);
      b = clamp01(b + delta);
    }

    // Sättigung: luminanzerhaltend Richtung/weg von Graustufe
    if (doSaturation) {
      const lum = LUM_R * r + LUM_G * g + LUM_B * b;
      r = clamp01(lum + (r - lum) * sat);
      g = clamp01(lum + (g - lum) * sat);
      b = clamp01(lum + (b - lum) * sat);
    }

    data[i] = Math.round(r * 255);
    data[i + 1] = Math.round(g * 255);
    data[i + 2] = Math.round(b * 255);
    // Alpha (data[i + 3]) bleibt unverändert
  }
}

function tonalSignature(f) {
  return [
    f.exposure ?? 0,
    f.brightness ?? 100,
    f.contrast ?? 100,
    f.highlights ?? 0,
    f.shadows ?? 0,
    f.saturation ?? 100,
  ].join(',');
}

/**
 * Liefert eine Zeichenquelle mit gebackenen Tonwert-Anpassungen sowie
 * den CSS-Filter-String für die verbleibenden Effekt-Filter.
 *
 * - Ohne aktive Tonwert-Anpassung wird das Originalbild zurückgegeben
 *   (schneller Pfad, kein getImageData).
 * - Bei Erfolg ist `el` ein Offscreen-Canvas in Bild-Auflösung.
 * - Schlägt die Pixelverarbeitung fehl (tainted canvas), wird auf die
 *   CSS-Näherung zurückgefallen, damit nichts kaputtgeht.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} image
 * @param {Object} filters
 * @returns {{ el: HTMLImageElement|HTMLCanvasElement, cssFilter: string }}
 */
export function getAdjustedImage(image, filters) {
  const effect = buildEffectFilterString(filters);

  if (!image || !hasTonalAdjustments(filters)) {
    return { el: image, cssFilter: effect };
  }

  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  if (!w || !h) {
    return { el: image, cssFilter: effect };
  }

  const key = `${image.src || image._adjKey || ''}|${w}x${h}|${tonalSignature(filters)}`;
  if (_cache.key === key && _cache.canvas) {
    return { el: _cache.canvas, cssFilter: effect };
  }

  try {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(image, 0, 0, w, h);
    const imgData = octx.getImageData(0, 0, w, h);
    applyTonalAdjustments(imgData.data, filters);
    octx.putImageData(imgData, 0, 0);

    _cache = { key, canvas: off };
    return { el: off, cssFilter: effect };
  } catch (e) {
    // z. B. SecurityError bei Cross-Origin-Bildern → CSS-Näherung
    console.warn('Pixelbasierte Anpassung nicht möglich, nutze CSS-Näherung:', e);
    return { el: image, cssFilter: buildApproxFilterString(filters) };
  }
}

/**
 * Invalidiert den internen Cache (z. B. wenn ein neues Bild geladen wird).
 */
export function clearAdjustmentCache() {
  _cache = { key: null, canvas: null };
}

export default {
  hasTonalAdjustments,
  buildEffectFilterString,
  buildApproxFilterString,
  applyTonalAdjustments,
  getAdjustedImage,
  clearAdjustmentCache,
};
