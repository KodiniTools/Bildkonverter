// @vitest-environment node
/**
 * Gefüllte Gold-Buttons: dunkelgold mit weisser Schrift und dreistufigem
 * Verlauf nach Equalizer-19-Muster (bildkonverter-layout.css, kodini-controls-stage3.css).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');
const tokens = read('src/design-system/bildkonverter-layout.css');
const controls = read('src/styles/kodini-controls-stage3.css');
const globalScss = read('src/styles/global.scss');

function luminance(hex: string): number {
  const channel = (i: number): number => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

describe('Button-Verlauf', () => {
  it.each(['--bild-layout-gold-gradient', '--bild-layout-gold-gradient-hover'])(
    '%s: dreistufig, jeder Stopp erreicht mit weisser Schrift 4,5:1',
    (token) => {
      const value = tokens.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1] ?? '';
      expect(value).toMatch(/^linear-gradient\(180deg,/);
      const stops = value.match(/#[0-9a-f]{6}/gi) ?? [];
      expect(stops).toHaveLength(3);
      for (const stop of stops) expect(1.05 / (luminance(stop) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  );

  it('alle gefüllten Buttons von App, Dialogen und Seiten nutzen den Verlauf', () => {
    for (const selector of [
      '.ui-button--primary',
      '.ui-icon-button--primary',
      '.btn.btn-success',
      '.export-dialog__btn--confirm',
      '.tb-btn--success',
      '.tb-btn--primary',
      '.transform-btn.crop-confirm-btn',
      '.distort-btn.primary',
      '.website-link',
      '.btn-hero-primary',
      '.cta-button',
    ])
      expect(controls).toContain(selector);
    expect(controls).toContain('background-image: var(--bild-layout-gold-gradient);');
    expect(controls).toContain('background-image: var(--bild-layout-gold-gradient-hover);');
  });

  it('aktive Sprache der SSI-Navigation trägt den Verlauf', () => {
    expect(globalScss).toContain('background-image: var(--bild-layout-gold-gradient) !important;');
    expect(globalScss).toContain(
      'background-image: var(--bild-layout-gold-gradient-hover) !important;'
    );
  });
});
