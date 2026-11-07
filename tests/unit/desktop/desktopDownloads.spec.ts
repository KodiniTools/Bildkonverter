import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import de from '@/i18n/de';
import en from '@/i18n/en';
import DownloadView from '@/views/DownloadView.vue';
import { DESKTOP_DOWNLOADS, downloadUrl } from '@/lib/core/desktopDownloads';

const root = resolve(__dirname, '../../..');
const workflow = readFileSync(resolve(root, '.github/workflows/desktop-windows.yml'), 'utf8');
const serverScript = readFileSync(resolve(root, 'deploy-downloads.sh'), 'utf8');
const deployScript = readFileSync(resolve(root, 'deploy.sh'), 'utf8');

describe('Download-Dateien der Windows-App', () => {
  it('der Release-Workflow erzeugt genau die verlinkten Dateinamen', () => {
    for (const { file } of DESKTOP_DOWNLOADS) {
      expect(workflow).toContain(`dl/${file}`);
    }
    expect(workflow).toContain('--latest');
  });

  it('das Server-Skript legt genau die verlinkten Dateien ab', () => {
    for (const { file } of DESKTOP_DOWNLOADS) {
      expect(serverScript).toContain(`  ${file}\n`);
    }
  });

  it('deploy.sh löscht den Ordner downloads/ nicht', () => {
    expect(deployScript).toMatch(/RSYNC_EXCLUDES="\$\{RSYNC_EXCLUDES:-[^}]*\bdownloads\/[^}]*\}"/);
  });

  it('verlinkt auf den eigenen Server (<Basis>/downloads/, live /bildkonverter/downloads/)', () => {
    expect(downloadUrl('Bildkonverter-Pro-Setup-x64.exe')).toBe(
      `${import.meta.env.BASE_URL}downloads/Bildkonverter-Pro-Setup-x64.exe`
    );
  });

  it.each(['de', 'en'] as const)('Seite zeigt alle Dateien mit Link (%s)', (locale) => {
    const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
    const wrapper = mount(DownloadView, { global: { plugins: [i18n] } });

    const links = wrapper.findAll('.file-card a').map((a) => a.attributes('href'));
    expect(links).toEqual(DESKTOP_DOWNLOADS.map(({ file }) => downloadUrl(file)));
    expect(wrapper.find('.file-card--recommended h2').text()).toBe('Installer (.exe)');
    expect(wrapper.find('h1').text()).toBe(
      locale === 'de' ? 'Bildkonverter Pro für Windows' : 'Image Converter Pro for Windows'
    );
  });
});
