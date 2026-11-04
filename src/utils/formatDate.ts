const DATE_TIME = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Datum mit Uhrzeit, z. B. „04.11.2026, 20:15“ (Galerie-Karten und -Vorschau) */
export function formatDateTime(date: Date | number): string {
  return DATE_TIME.format(date);
}
