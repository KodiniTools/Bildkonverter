/**
 * Download-Dateien der Windows-App. Sie liegen auf dem eigenen Server unter
 * /bildkonverter/downloads/ (abgelegt von deploy-downloads.sh, das sie aus dem
 * GitHub-Release holt). Der Release-Workflow und das Skript verwenden genau
 * diese festen Namen, damit die Links bei jeder neuen Version gültig bleiben.
 */
export const DOWNLOAD_BASE = `${import.meta.env.BASE_URL}downloads`;

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

/** Download-Link zur Datei auf dem eigenen Server */
export function downloadUrl(file: string): string {
  return `${DOWNLOAD_BASE}/${encodeURIComponent(file)}`;
}
