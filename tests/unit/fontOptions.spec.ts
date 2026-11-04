import { describe, expect, it } from 'vitest';
import { fontOptions } from '@/utils/fontOptions';

describe('fontOptions', () => {
  it('liefert je Schrift Wert, Label und Schriftvorschau', () => {
    expect(fontOptions(['Arial', 'Georgia'])).toEqual([
      { value: 'Arial', label: 'Arial', style: { fontFamily: 'Arial' } },
      { value: 'Georgia', label: 'Georgia', style: { fontFamily: 'Georgia' } },
    ]);
  });

  it('setzt die Gruppe für alle Optionen', () => {
    const options = fontOptions(['Arial'], 'System');
    expect(options[0].group).toBe('System');
  });

  it('liefert für eine leere Liste ein leeres Array', () => {
    expect(fontOptions([])).toEqual([]);
  });
});
