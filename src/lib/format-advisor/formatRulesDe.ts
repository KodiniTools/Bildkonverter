import type { FormatAdvice, ImageInfo, Use } from './formatRules';

// Deutsche Fassung von format-rules.ts – gleiche Entscheidungen, deutsche Texte.
export const USES_DE: { id: Use; label: string }[] = [
  { id: 'website', label: 'Website / Blog' },
  { id: 'shop', label: 'Produktfoto für einen Onlineshop' },
  { id: 'logo', label: 'Logo, Icon oder Grafik' },
  { id: 'social', label: 'Soziale Netzwerke' },
  { id: 'email', label: 'Per E-Mail / Messenger senden' },
  { id: 'print', label: 'Druck (Poster, Flyer, Foto)' },
  { id: 'archive', label: 'Original archivieren' },
];

const maxW = (w: number, cap: number) => `${Math.min(w, cap)} px breit (nicht vergrößern)`;

export function recommendFormatDe(use: Use, img: ImageInfo): FormatAdvice {
  const t = img.hasTransparency;
  const kind = img.isPhoto ? 'ein Foto' : 'eine Grafik';
  switch (use) {
    case 'website':
      return {
        format: 'WebP',
        summary: `WebP liefert für ${kind} auf einer Website die kleinste Datei und läuft in allen modernen Browsern.`,
        settings: [
          { name: 'Qualität', value: img.isPhoto ? '80 %' : 'Verlustfrei' },
          { name: 'Größe', value: maxW(img.width, 1920) },
          { name: 'Transparenz', value: t ? 'Beibehalten (WebP unterstützt sie)' : 'Nicht nötig' },
          { name: 'Metadaten', value: 'Entfernen' },
        ],
        reasons: [
          'Meist 25–35 % kleiner als JPG bei gleicher Qualität',
          'Schnellere Seiten helfen beim Google-Ranking',
        ],
        alternative: t
          ? 'PNG, falls ein älteres System kein WebP kann.'
          : 'JPG mit 80 %, falls ein älteres System kein WebP kann.',
      };
    case 'shop':
      return {
        format: t ? 'PNG' : 'WebP',
        summary: t
          ? 'Ihr Bild ist transparent – PNG hält die Kanten auf jedem Shop-Hintergrund sauber.'
          : 'WebP hält Produktfotos scharf und lädt trotzdem schnell.',
        settings: [
          { name: 'Qualität', value: t ? 'Verlustfrei' : '85 %' },
          {
            name: 'Größe',
            value:
              maxW(img.width, 2000) + ', quadratisch zuschneiden, falls Ihr Shop dies verwendet',
          },
          { name: 'Farbprofil', value: 'sRGB' },
          { name: 'Metadaten', value: 'Entfernen' },
        ],
        reasons: [
          '2000 px erlauben Zoom ohne riesige Dateien',
          'sRGB zeigt Farben auf jedem Bildschirm gleich',
        ],
        alternative: 'JPG mit 85 %, falls Ihr Shopsystem kein WebP annimmt.',
      };
    case 'logo':
      return {
        format: 'PNG',
        summary: 'PNG hält Kanten, Schrift und Transparenz scharf – ohne Unschärfe oder Artefakte.',
        settings: [
          { name: 'Kompression', value: 'Verlustfrei' },
          { name: 'Größe', value: maxW(img.width, 1024) },
          { name: 'Transparenz', value: t ? 'Beibehalten' : 'Hintergrund eventuell entfernen' },
        ],
        reasons: [
          'JPG verwischt Kanten und kann nicht transparent sein',
          'Verlustfrei hält Farbflächen sauber',
        ],
        alternative:
          'SVG, wenn Sie das Logo als Vektordatei haben – es bleibt in jeder Größe scharf.',
      };
    case 'social':
      return {
        format: 'JPG',
        summary:
          'Soziale Netzwerke komprimieren jeden Upload neu; ein hochwertiges JPG übersteht das am besten.',
        settings: [
          { name: 'Qualität', value: '90 %' },
          { name: 'Größe', value: '1080 × 1080 px (quadratisch) oder 1080 × 1350 px (hochkant)' },
          { name: 'Farbprofil', value: 'sRGB' },
          { name: 'Transparenz', value: t ? 'Mit einer Hintergrundfarbe füllen' : 'Nicht nötig' },
        ],
        reasons: [
          'Die exakte Zielgröße vermeidet zusätzliches Skalieren',
          'Plattformen behalten keine Transparenz',
        ],
        alternative: 'PNG für Screenshots oder Grafiken mit viel Text.',
      };
    case 'email':
      return {
        format: t ? 'PNG' : 'JPG',
        summary: 'Öffnet sich auf jedem Gerät und bleibt klein genug für E-Mail und Messenger.',
        settings: [
          { name: 'Qualität', value: t ? 'Verlustfrei' : '80 %' },
          { name: 'Größe', value: maxW(img.width, 1600) },
          { name: 'Metadaten', value: 'Entfernen (entfernt auch Standortdaten)' },
        ],
        reasons: [
          'Jedes Handy und Mailprogramm zeigt JPG/PNG an',
          '1600 px reichen für jeden Bildschirm',
        ],
        alternative: 'PDF, wenn Sie mehrere Bilder als ein Dokument verschicken.',
      };
    case 'print': {
      const cm = (px: number) => ((px / 300) * 2.54).toFixed(1).replace('.', ',');
      return {
        format: 'TIFF',
        summary: 'TIFF behält die volle Qualität für Druckereien – ohne Kompressionsverluste.',
        settings: [
          { name: 'Auflösung', value: '300 DPI' },
          { name: 'Max. Druckgröße', value: `${cm(img.width)} × ${cm(img.height)} cm bei 300 DPI` },
          { name: 'Kompression', value: 'Keine oder LZW (verlustfrei)' },
          { name: 'Farbe', value: 'Bei der Druckerei nach CMYK fragen' },
        ],
        reasons: [
          'Verlustfreies Format, das Druckereien annehmen',
          '300 DPI sind der Standard für scharfe Drucke',
        ],
        alternative: 'JPG mit 100 %, falls die Druckerei JPG verlangt.',
      };
    }
    case 'archive':
      return {
        format: img.isPhoto ? 'TIFF' : 'PNG',
        summary:
          'Bewahren Sie eine verlustfreie Originalkopie auf und erstellen Sie bei Bedarf kleinere Kopien daraus.',
        settings: [
          { name: 'Kompression', value: 'Verlustfrei' },
          { name: 'Größe', value: 'Originalgröße' },
          { name: 'Metadaten', value: 'Behalten' },
        ],
        reasons: [
          'Verlustbehaftete Formate verlieren bei jedem Speichern Qualität',
          'Metadaten bewahren Datum und Kamerainfos',
        ],
        alternative: img.isPhoto
          ? 'PNG, wenn Sie kleinere verlustfreie Dateien benötigen.'
          : 'TIFF für Druck-Workflows.',
      };
  }
}
