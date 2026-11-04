import type { SelectOption } from '@/components/ui/types';

/**
 * Baut aus einer Schriftliste die Optionen für UiSelect. Jede Option zeigt sich
 * in ihrer eigenen Schrift (Vorschau wie bisher bei den nativen Selects);
 * `group` legt sie in eine gemeinsame <optgroup>.
 */
export function fontOptions(fonts: readonly string[], group?: string): SelectOption[] {
  return fonts.map((font) => ({
    value: font,
    label: font,
    ...(group === undefined ? {} : { group }),
    style: { fontFamily: font },
  }));
}
