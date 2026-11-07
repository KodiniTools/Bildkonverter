/**
 * Download-Dateien der Windows-App. Sie liegen als Assets am neuesten
 * GitHub-Release; der Workflow .github/workflows/desktop-windows.yml benennt
 * sie beim Release auf genau diese festen Namen um, damit die Links über
 * „releases/latest/download“ bei jeder neuen Version gültig bleiben.
 */
export const RELEASE_DOWNLOAD_BASE =
  'https://github.com/KodiniTools/Bildkonverter/releases/latest/download';

/** Alle Releases (ältere Versionen, Änderungen) */
export const RELEASES_PAGE = 'https://github.com/KodiniTools/Bildkonverter/releases';

export type DesktopDownloadKey = 'exe' | 'msiDe' | 'msiEn';

export interface DesktopDownload {
  /** i18n-Schlüssel unter download.files.<key> */
  key: DesktopDownloadKey;
  /** Fester Dateiname des Release-Assets */
  file: string;
  /** Hervorgehobene Empfehlung (für die meisten Nutzer) */
  recommended: boolean;
}

export const DESKTOP_DOWNLOADS: readonly DesktopDownload[] = [
  { key: 'exe', file: 'Bildkonverter-Pro-Setup-x64.exe', recommended: true },
  { key: 'msiDe', file: 'Bildkonverter-Pro-x64-de-DE.msi', recommended: false },
  { key: 'msiEn', file: 'Bildkonverter-Pro-x64-en-US.msi', recommended: false },
];

/** Direkter Download-Link zur Datei im neuesten Release */
export function downloadUrl(file: string): string {
  return `${RELEASE_DOWNLOAD_BASE}/${encodeURIComponent(file)}`;
}
