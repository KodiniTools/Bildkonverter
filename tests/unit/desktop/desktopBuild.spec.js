import { describe, expect, it } from 'vitest';
import { getBaseURL } from '@/api/api';
import { IS_DESKTOP } from '@/lib/core/desktop';

describe('Desktop-Build (Windows-App)', () => {
  it('ist im normalen Build/Test nicht aktiv', () => {
    expect(IS_DESKTOP).toBe(false);
  });

  it('nutzt VITE_API_BASE_URL, falls gesetzt (ohne Schrägstrich am Ende)', () => {
    expect(
      getBaseURL({ PROD: true, VITE_API_BASE_URL: 'https://kodinitools.com/bildkonverter/api/' })
    ).toBe('https://kodinitools.com/bildkonverter/api');
  });

  it('bleibt ohne Override beim bisherigen Verhalten', () => {
    expect(getBaseURL({ PROD: true })).toBe('/bildkonverter/api');
    expect(getBaseURL({ PROD: false })).toBe('http://localhost:3000/api');
    expect(getBaseURL({ PROD: true, VITE_API_BASE_URL: '' })).toBe('/bildkonverter/api');
  });
});
