/**
 * tonalKernel.ts
 *
 * Reine Pixel-Berechnung der Tonwert-Anpassungen (Weißabgleich, Belichtung,
 * Helligkeit, Kontrast, Lichter, Schatten, Sättigung, zuletzt Kurven). Ohne
 * DOM-Zugriff und nur mit ebenso reinen Kernen als Import, damit sie identisch
 * im Hauptthread und im Web Worker laufen kann.
 */
import type { FilterValues, PixelData } from '@/types/filters';
import { curveLUTs } from './curveKernel';

// Luminanz-Gewichte (Rec. 709)
const LUM_R = 0.2126;
const LUM_G = 0.7152;
const LUM_B = 0.0722;

// sRGB <-> lineares Licht (für physikalisch korrekte Belichtung)
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Stärke des Weißabgleichs: bei ±100 ändern sich die Kanal-Gains um ±50 %. */
export const WHITE_BALANCE_STRENGTH = 0.5;

/**
 * Kanal-Gains des Weißabgleichs (im linearen Licht).
 * temperature −100 (kühl, blau) … 100 (warm, gelb): Rot hoch, Blau runter
 * tint        −100 (grün)       … 100 (magenta):    Grün runter
 */
export function whiteBalanceGains(f: FilterValues): { r: number; g: number; b: number } {
  const t = (f.temperature ?? 0) / 100;
  const m = (f.tint ?? 0) / 100;
  return {
    r: 1 + WHITE_BALANCE_STRENGTH * t,
    g: 1 - WHITE_BALANCE_STRENGTH * m,
    b: 1 - WHITE_BALANCE_STRENGTH * t,
  };
}

/**
 * Erzeugt eine Lookup-Tabelle (0..255 -> 0..1) für die Tonwert-Operationen
 * je Kanal: Weißabgleich-Gain und Belichtung (linear) -> Helligkeit
 * -> Kontrast. Das spart teure Berechnungen im Pixel-Loop.
 * @param channelGain Weißabgleich-Gain dieses Kanals
 * @returns Länge 256, Werte 0..1
 */
function buildToneLUT(f: FilterValues, channelGain = 1): Float32Array {
  const exposure = f.exposure ?? 0;
  const brightness = (f.brightness ?? 100) / 100;
  const contrast = (f.contrast ?? 100) / 100;
  // Belichtung als Blenden-Gain: ±50 entspricht ±2 Blendenstufen
  const gain = Math.pow(2, exposure / 25);

  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    let v = i / 255;

    // Weißabgleich und Belichtung im linearen Lichtraum (echte Belichtung)
    if (exposure !== 0 || channelGain !== 1) {
      let lin = srgbToLinear(v) * channelGain * gain;
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
 * @param data - RGBA-Pixeldaten (wird in-place verändert)
 * @param f - Filter-Objekt
 */
export function applyTonalAdjustments(data: PixelData, f: FilterValues): void {
  // Ohne Weißabgleich teilen sich alle Kanäle eine Tabelle
  const wb = whiteBalanceGains(f);
  const lutR = buildToneLUT(f, wb.r);
  const lutG = wb.g === wb.r ? lutR : buildToneLUT(f, wb.g);
  const lutB = wb.b === wb.r ? lutR : buildToneLUT(f, wb.b);
  const hi = (f.highlights ?? 0) / 100; // -1..1
  const sh = (f.shadows ?? 0) / 100; // -1..1
  const sat = (f.saturation ?? 100) / 100;
  const STRENGTH = 0.5; // maximale Verschiebung für Lichter/Schatten

  // Kurven zuletzt, als Tabelle je Kanal (null ohne aktive Kurve)
  const curves = curveLUTs(f);

  const doToneRange = hi !== 0 || sh !== 0;
  const doSaturation = sat !== 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = lutR[data[i]];
    let g = lutG[data[i + 1]];
    let b = lutB[data[i + 2]];

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

    if (curves) {
      data[i] = curves.r[Math.round(r * 255)];
      data[i + 1] = curves.g[Math.round(g * 255)];
      data[i + 2] = curves.b[Math.round(b * 255)];
    } else {
      data[i] = Math.round(r * 255);
      data[i + 1] = Math.round(g * 255);
      data[i + 2] = Math.round(b * 255);
    }
    // Alpha (data[i + 3]) bleibt unverändert
  }
}
