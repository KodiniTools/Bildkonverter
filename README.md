# Bildkonverter Pro – Schnelle Bildbearbeitung im Browser

Eine leistungsstarke, moderne Bildbearbeitungs-Anwendung für den Browser. Bearbeiten, optimieren, konvertieren und verwalten Sie Ihre Bilder direkt im Browser – ohne Installation, ohne Upload zu externen Servern.

## Inhaltsverzeichnis

- [Features](#features)
- [Editor](#editor)
- [Galerie](#galerie)
- [Collage-Modus](#collage-modus)
- [Stapelverarbeitung](#stapelverarbeitung)
- [Format-Konvertierung](#format-konvertierung)
- [Unterstützte Formate](#unterstützte-formate)
- [Tastaturkürzel](#tastaturkürzel)
- [Installation & Setup](#installation--setup)
- [Technologie](#technologie)
- [Roadmap](#roadmap)

---

## Features

| Funktion | Beschreibung |
|---|---|
| Editor | Vollständige Bildbearbeitung mit Filtern, Transformationen, Text |
| Galerie | Lokale Bildverwaltung mit Multi-Select |
| Collage-Modus | Mehrere Bilder als Ebenen kombinieren |
| Stapelverarbeitung | Mehrere Bilder gleichzeitig konvertieren |
| Format-Konvertierung | Dedizierte Seiten für Format-Paare (z.B. JPG → WebP) |
| Datenschutz | Alle Bilder bleiben lokal – kein Cloud-Upload |
| Mehrsprachig | Deutsch und Englisch |
| Dark/Light Mode | Systemabhängig oder manuell wählbar |

---

## Editor

Der Editor ist das Herzstück der Anwendung. Bilder können per Datei-Dialog, Drag & Drop oder Zwischenablage (Ctrl+V) geladen werden.

### Eingabeformate

| Format | Verarbeitung |
|---|---|
| JPEG, PNG, WebP, GIF, BMP, SVG | Direkt im Browser |
| TIFF, HEIC, HEIF | Via Backend-API (serverseitige Konvertierung) |

### Filter & Anpassungen

Der Editor bietet 13 unabhängig einstellbare Filter:

| Filter | Bereich | Beschreibung |
|---|---|---|
| Helligkeit | 0–200 % | Bild aufhellen oder abdunkeln |
| Kontrast | 0–200 % | Kontrast verstärken oder abschwächen |
| Sättigung | 0–200 % | Farbintensität von grau bis kräftig |
| Belichtung | –100 bis +100 | Globale Belichtungskorrektur |
| Lichter | –100 bis +100 | Helle Bildbereiche gezielt anpassen |
| Schatten | –100 bis +100 | Dunkle Bildbereiche gezielt anpassen |
| Farbton | –180 bis +180° | Gesamten Farbkreis verschieben |
| Schärfe | 0–100 % | Bilddetails schärfen |
| Weichzeichner | 0–20 px | Künstlerische Unschärfe |
| Sepia / Wärme | 0–100 % | Warmton-Effekt |
| Graustufen | 0–100 % | Teilweise oder vollständige Entsättigung |
| Invertieren | 0–100 % | Farben umkehren |
| Vignette | 0–100 % | Dunkle Randabschattung |

### Presets

Sechs vordefinierte Filter-Presets für schnelle Ergebnisse:

- **Normal** – Alle Filter zurückgesetzt
- **Vintage** – Retro-Look mit reduzierten Farben
- **Schwarz/Weiß** – Neutrales Graustufenbild
- **Lebendig** – Verstärkte Sättigung und Kontrast
- **Kalt** – Kühle, bläuliche Farbgebung
- **Warm** – Warme, orange-rötliche Töne

### Transformationen

- **Zuschneiden** – Frei oder mit festem Seitenverhältnis (1:1, 4:3, 16:9, 3:2, Kreis)
- **Drehen** – 90° links/rechts sowie freie Gradzahl
- **Spiegeln** – Horizontal oder vertikal
- **Skalieren** – Breite/Höhe in Pixel mit optionalem Seitenverhältnis-Lock

### Text

- Beliebig viele Textelemente hinzufügen
- Schriftart, Schriftgröße, Farbe, Deckkraft, Drehung
- Textkontur (Breite und Farbe)
- Textschatten (Unschärfe, Versatz, Farbe)
- Freie Positionierung per Drag auf dem Canvas

### Export (Editor)

Ausgabeformate: **JPEG, PNG, WebP, AVIF**

- Qualität einstellbar (0–100 %)
- PNG: Transparenter Hintergrund optional
- Dateiname wird automatisch generiert

---

## Galerie

Die Galerie ermöglicht die lokale Verwaltung von Bildern innerhalb der Sitzung.

### Funktionen

- Bilder per Datei-Dialog oder Drag & Drop hochladen
- Vorschau-Thumbnails für alle Bilder
- Einzelbild in den Editor öffnen (Handoff)
- **Multi-Select**: Mehrere Bilder gleichzeitig auswählen
- Ausgewählte Bilder als Collage in den Editor übergeben
- Bilder einzeln herunterladen oder löschen

> Die Galerie ist sitzungsbasiert – Bilder werden nicht dauerhaft gespeichert.

---

## Collage-Modus

Der Collage-Modus wird aktiviert, wenn aus der Galerie mehrere Bilder ausgewählt und als Collage geöffnet werden.

### Ebenen-Panel (rechte Sidebar)

Jede importierte Bilddatei wird als eigene Ebene geladen:

- **Thumbnail-Vorschau** jeder Ebene mit Name und Abmessungen
- **Sichtbarkeit** ein-/ausschalten
- **Ebenen-Reihenfolge** per Auf/Ab-Buttons ändern
- **Ebene duplizieren**
- **Ebene löschen**

### Pro Ebene einstellbar

| Eigenschaft | Optionen |
|---|---|
| Position | X/Y in Pixel |
| Größe | Breite/Höhe mit optionalem Seitenverhältnis-Lock |
| Rotation | –180° bis +180° |
| Spiegelung | Horizontal, vertikal |
| Deckkraft | 0–100 % |
| Filter | Helligkeit, Kontrast, Sättigung, Graustufen |
| Umrandung | Breite, Farbe, Radius |
| Schlagschatten | Aktivierbar mit Versatz, Unschärfe, Farbe, Deckkraft |

### Canvas-Hintergrund

Hintergrundfarbe frei wählbar (inkl. Transparenz).

### Text im Collage-Modus

Texte können auch im Collage-Modus hinzugefügt werden (Tab „Text" im Ebenen-Panel).

### Export

Collage wird als flaches Bild exportiert – identisch zum normalen Editor-Export.

---

## Stapelverarbeitung

Unter `/batch` können mehrere Bilder gleichzeitig in ein Zielformat konvertiert werden.

### Eingabe

Bilder per Datei-Dialog oder Drag & Drop hinzufügen (JPEG, PNG, WebP, GIF, BMP, SVG, TIFF, HEIC/HEIF).

### Ausgabeformate

| Format | Anmerkung |
|---|---|
| JPG | Qualität einstellbar |
| PNG | Verlustfrei |
| WebP | Qualität einstellbar |
| GIF | |
| BMP | |
| TIFF | Via Backend-API |
| PDF | Einzelne PDFs oder zusammengeführtes Dokument |
| SVG | Via Backend-API |

### Einstellungen

- **Format** – Zielformat für alle Bilder
- **Qualität** – 1–100 % (wo anwendbar)
- **Größe ändern** – Optional: maximale Breite/Höhe
- **PDF-Modus** – Einzelne PDFs oder ein zusammengeführtes PDF-Dokument

### Verarbeitung

Bilder werden sequenziell verarbeitet und einzeln oder als ZIP-Archiv heruntergeladen.

---

## Format-Konvertierung

Unter `/konvertieren/:format-paar` (z.B. `/konvertieren/jpg-to-webp`) gibt es dedizierte Seiten für häufige Format-Konvertierungen. Diese Seiten sind SEO-optimiert und bieten eine vereinfachte Benutzeroberfläche für ein spezifisches Konvertierungspaar.

---

## Unterstützte Formate

### Eingabe

| Format | Editor | Batch | Konvertierung |
|---|---|---|---|
| JPEG / JPG | ✅ | ✅ | ✅ |
| PNG | ✅ | ✅ | ✅ |
| WebP | ✅ | ✅ | ✅ |
| GIF | ✅ | ✅ | ✅ |
| BMP | ✅ | ✅ | ✅ |
| SVG | ✅ | ✅ | ✅ |
| TIFF | ✅ (API) | ✅ (API) | ✅ (API) |
| HEIC / HEIF | ✅ (API) | ✅ (API) | – |

### Ausgabe

| Format | Editor | Batch |
|---|---|---|
| JPEG | ✅ | ✅ |
| PNG | ✅ | ✅ |
| WebP | ✅ | ✅ |
| AVIF | ✅ | – |
| GIF | – | ✅ |
| BMP | – | ✅ |
| TIFF | – | ✅ (API) |
| PDF | – | ✅ |
| SVG | – | ✅ (API) |

> **API** = Konvertierung erfolgt serverseitig über die Backend-API. Erfordert aktive Serververbindung.

---

## Tastaturkürzel

### Editor

| Kürzel | Aktion |
|---|---|
| `Ctrl + Z` | Rückgängig (Undo) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Wiederholen (Redo) |
| `Ctrl + V` | Bild aus Zwischenablage einfügen |
| `T` | Text hinzufügen |
| `Esc` | Zuschneiden abbrechen / Dialog schließen |

---

## Installation & Setup

### Online-Nutzung

Die App kann direkt im Browser genutzt werden – keine Installation erforderlich.

### Lokale Installation

```bash
# Repository klonen
git clone https://github.com/KodiniTools/Bildkonverter.git
cd Bildkonverter

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build
```

Die Anwendung läuft standardmäßig auf `http://localhost:5173`.

### Backend-API (optional)

Für die Verarbeitung von TIFF, HEIC/HEIF, SVG und TIFF-Export wird eine Backend-API benötigt. Ohne aktive API-Verbindung sind diese Formate nicht verfügbar – alle anderen Funktionen bleiben vollständig nutzbar.

---

## Technologie

### Frontend

| Technologie | Zweck |
|---|---|
| Vue 3 | Reaktives UI-Framework (Composition API) |
| Vite | Build-Tool und Dev-Server |
| Pinia | State Management |
| Vue Router | Client-seitiges Routing mit SEO-Metadaten |
| Vue i18n | Mehrsprachigkeit (DE / EN) |
| SCSS | Strukturiertes CSS mit Variablen und Verschachtelung |

### Browser-APIs

| API | Verwendung |
|---|---|
| Canvas API | Bildverarbeitung und Rendering |
| File API | Lokales Lesen von Bilddateien |
| FileReader API | Base64-Konvertierung für Galerie |
| Clipboard API | Einfügen aus Zwischenablage |
| URL.createObjectURL | Effizientes Laden von Bildern |

### Browser-Kompatibilität

| Browser | Mindestversion |
|---|---|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Opera | 76+ |

---

## Roadmap

- Histogramm-Anzeige
- Freihand-Zuschnitt und Formen
- Farbpaletten-Extraktion aus Bildern
- Undo/Redo History-Vorschau
- KI-gestützte Filter und Bildverbesserungen
- Progressive Web App (PWA) für Offline-Nutzung
- RAW-Format-Unterstützung (CR2, NEF, ARW)

---

## Autor

**Dinko Ramić** – [KodiniTools](https://kodinitools.com)

## Lizenz

MIT License – Siehe `LICENSE` für Details.
