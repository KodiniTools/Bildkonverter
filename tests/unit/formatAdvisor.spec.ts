import { describe, expect, it } from 'vitest';
import { recommendFormat, USES, type ImageInfo } from '@/lib/format-advisor/formatRules';
import { recommendFormatDe } from '@/lib/format-advisor/formatRulesDe';
import { classifyPixels } from '@/lib/format-advisor/formatAnalysis';
import { findConversionPair } from '@/lib/format-advisor/conversionTarget';

const photo: ImageInfo = { width: 3000, height: 2400, hasTransparency: false, isPhoto: true };
const transparent: ImageInfo = { ...photo, isPhoto: false, hasTransparency: true };

describe('Preserved KodiniTools recommendations', () => {
  it('recommends WebP for website photos', () =>
    expect(recommendFormat('website', photo).format).toBe('WebP'));
  it('recommends PNG for transparent shop images', () =>
    expect(recommendFormat('shop', transparent).format).toBe('PNG'));
  it('recommends WebP for opaque shop photos', () =>
    expect(recommendFormat('shop', photo).format).toBe('WebP'));
  it('recommends PNG for logos', () =>
    expect(recommendFormat('logo', transparent).format).toBe('PNG'));
  it('recommends JPG for social posts', () =>
    expect(recommendFormat('social', photo).format).toBe('JPG'));
  it('recommends PNG for transparent email images', () =>
    expect(recommendFormat('email', transparent).format).toBe('PNG'));
  it('recommends JPG for opaque email images', () =>
    expect(recommendFormat('email', photo).format).toBe('JPG'));
  it('recommends TIFF for print', () =>
    expect(recommendFormat('print', photo).format).toBe('TIFF'));
  it('recommends TIFF for archiving photos', () =>
    expect(recommendFormat('archive', photo).format).toBe('TIFF'));
  it('recommends PNG for archiving graphics', () =>
    expect(recommendFormat('archive', transparent).format).toBe('PNG'));
  it('makes identical format decisions in both languages', () => {
    for (const { id } of USES)
      for (const image of [photo, transparent]) {
        expect(recommendFormatDe(id, image).format).toBe(recommendFormat(id, image).format);
      }
  });
});

describe('Local image classification', () => {
  it('recognizes transparency', () =>
    expect(classifyPixels(new Uint8ClampedArray([255, 0, 0, 0])).hasTransparency).toBe(true));
  it('recognizes an opaque graphic', () =>
    expect(classifyPixels(new Uint8ClampedArray([255, 0, 0, 255]))).toEqual({
      hasTransparency: false,
      isPhoto: false,
    }));
  it('recognizes many distinct colours as a photo', () => {
    const pixels = new Uint8ClampedArray(1600 * 16);
    for (let i = 0; i < 1600; i++) {
      pixels[i * 16] = ((i >> 10) & 31) << 3;
      pixels[i * 16 + 1] = ((i >> 5) & 31) << 3;
      pixels[i * 16 + 2] = (i & 31) << 3;
      pixels[i * 16 + 3] = 255;
    }
    expect(classifyPixels(pixels).isPhoto).toBe(true);
  });
});
describe('Sprungziel nach der Empfehlung', () => {
  it('findet die Landingpage für PNG → WebP', () =>
    expect(findConversionPair('logo.png', 'WebP')).toBe('png-zu-webp'));
  it('behandelt .jpeg wie JPG', () =>
    expect(findConversionPair('foto.JPEG', 'WebP')).toBe('jpg-zu-webp'));
  it('liefert null ohne passende Landingpage', () =>
    expect(findConversionPair('foto.jpg', 'TIFF')).toBeNull());
  it('liefert null ohne Dateiendung', () => expect(findConversionPair('foto', 'PNG')).toBeNull());
});

describe('Empfohlene Größen', () => {
  it('vergrößert kleine Bilder nie', () => {
    const small: ImageInfo = { width: 800, height: 600, hasTransparency: false, isPhoto: true };
    const size = recommendFormatDe('website', small).settings.find((s) => s.name === 'Größe');
    expect(size?.value).toContain('800 px');
  });
  it('berechnet die Druckgröße bei 300 DPI', () => {
    const print = recommendFormatDe('print', photo).settings.find(
      (s) => s.name === 'Max. Druckgröße'
    );
    expect(print?.value).toBe('25,4 × 20,3 cm bei 300 DPI');
  });
});
