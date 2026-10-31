/**
 * SVG-Pfad-Parser/-Skalierer (src/utils/svgPath.js) und die Social-Media-Symbole.
 */
import { describe, it, expect } from 'vitest';
import { parseSvgPath, scaleSvgPath } from '@/utils/svgPath';
import { SOCIAL_ICONS } from '@/utils/socialIcons';
import { SHAPE_GALLERY, createShape, getShapePathData } from '@/utils/shapes';
import de from '@/i18n/de';
import en from '@/i18n/en';

describe('parseSvgPath', () => {
  it('liest implizite Wiederholungen, kompakte Zahlen und Bogen-Flags', () => {
    expect(parseSvgPath('M15 5.88 14 10h5.83')).toEqual([
      { cmd: 'M', args: [15, 5.88] },
      { cmd: 'L', args: [14, 10] },
      { cmd: 'h', args: [5.83] },
    ]);
    expect(parseSvgPath('m2 9 3-3')).toEqual([
      { cmd: 'm', args: [2, 9] },
      { cmd: 'l', args: [3, -3] },
    ]);
    expect(parseSvgPath('a10 10 0 1 0-4.777-4.719')[0].args).toEqual([
      10, 10, 0, 1, 0, -4.777, -4.719,
    ]);
    expect(parseSvgPath('a2 2 0 011.5.5')[0].args).toEqual([2, 2, 0, 0, 1, 1.5, 0.5]);
    expect(() => parseSvgPath('M 1')).toThrow();
    expect(() => parseSvgPath('1 2')).toThrow();
  });
});

describe('scaleSvgPath', () => {
  it('macht relative Befehle absolut und skaliert/verschiebt', () => {
    expect(scaleSvgPath('m1 1 h2 v2 z', 10, 10)).toBe('M 10 10 L 30 10 L 30 30 Z');
    expect(scaleSvgPath('M0 0 L10 10', 2, 3, 5, -5)).toBe('M 5 -5 L 25 25');
  });

  it('S/T spiegeln den letzten Kontrollpunkt, Bögen skalieren ihre Radien', () => {
    expect(scaleSvgPath('M0 0 C0 10 10 10 10 0 S20 -10 20 0', 1, 1)).toBe(
      'M 0 0 C 0 10 10 10 10 0 C 10 -10 20 -10 20 0'
    );
    expect(scaleSvgPath('M0 0 Q5 5 10 0 T20 0', 1, 1)).toBe('M 0 0 Q 5 5 10 0 Q 15 -5 20 0');
    expect(scaleSvgPath('M0 0 a5 5 0 0 1 10 0', 2, 1)).toBe('M 0 0 A 10 5 0 0 1 20 0');
    // Spiegelung kehrt die Bogenrichtung um
    expect(scaleSvgPath('M0 0 A5 5 0 0 1 10 0', -1, 1)).toBe('M 0 0 A 5 5 0 0 0 -10 0');
  });

  it('nach z gilt wieder der Startpunkt des Teilpfads', () => {
    expect(scaleSvgPath('M5 5 l5 0 z l0 5', 1, 1)).toBe('M 5 5 L 10 5 Z L 5 10');
  });
});

describe('Social-Media-Symbole', () => {
  const ids = Object.keys(SOCIAL_ICONS);

  it('20 Symbole in „Symbole“, übersetzt in DE und EN', () => {
    expect(ids).toHaveLength(20);
    for (const id of ids) {
      expect(SHAPE_GALLERY.find((g) => g.id === id)?.category, id).toBe('symbols');
      expect(de.shapes.items[id], id).toBeTruthy();
      expect(en.shapes.items[id], id).toBeTruthy();
    }
  });

  it.each(Object.keys(SOCIAL_ICONS))('%s skaliert in den Rahmen', (id) => {
    const d = getShapePathData(id, 200, 100);
    expect(d).not.toMatch(/NaN|Infinity/);
    // Endpunkte liegen im Rahmen (±12 % Rand für Strichenden)
    const coords = d
      .replace(/A [^A-Z]*?(?= [A-Z]|$)/g, (arc) => arc.split(' ').slice(-2).join(' '))
      .match(/-?\d+(\.\d+)?/g)
      .map(Number);
    for (let i = 0; i + 1 < coords.length; i += 2) {
      expect(Math.abs(coords[i])).toBeLessThanOrEqual(112);
      expect(Math.abs(coords[i + 1])).toBeLessThanOrEqual(56);
    }
  });

  it('starten als Umriss mit Linienstärke, Füllung zuschaltbar', () => {
    const shape = createShape('socialLike', 1000, 1000);
    expect(shape).toMatchObject({ type: 'socialLike', filled: false });
    expect(shape.strokeWidth).toBeGreaterThan(0);
  });
});
