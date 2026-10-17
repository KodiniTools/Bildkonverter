/**
 * tonalKernel.js
 *
 * Reine Pixel-Berechnung der Tonwert-Anpassungen (Belichtung, Helligkeit,
 * Kontrast, Lichter, Schatten, Sättigung). Ohne Imports und DOM-Zugriff,
 * damit sie identisch im Hauptthread und im Web Worker laufen kann.
 */

// Luminanz-Gewichte (Rec. 709)
const LUM_R = 0.2126;
const LUM_G = 0.7152;
const LUM_B = 0.0722;

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
