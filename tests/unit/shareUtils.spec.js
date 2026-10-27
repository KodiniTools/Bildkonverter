import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  canCopyImage,
  canShareFileType,
  copyImageToClipboard,
  mimeForFormat,
  pickShareStrategy,
  shareFile,
} from '@/utils/shareUtils';

const domError = (name) => Object.assign(new Error(name), { name });

function shareNav({ canShare = true, share = vi.fn().mockResolvedValue(undefined) } = {}) {
  return { share, canShare: vi.fn(() => canShare) };
}

class FakeClipboardItem {
  constructor(items) {
    this.items = items;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mimeForFormat', () => {
  it('bildet Editor-Formate auf MIME-Typen ab', () => {
    expect(mimeForFormat('png')).toBe('image/png');
    expect(mimeForFormat('JPEG')).toBe('image/jpeg');
    expect(mimeForFormat('jpg')).toBe('image/jpeg');
    expect(mimeForFormat('webp')).toBe('image/webp');
    expect(mimeForFormat('pdf')).toBe('application/pdf');
    expect(mimeForFormat('svg')).toBe('image/svg+xml');
  });

  it('liefert für Unbekanntes einen sicheren Default', () => {
    expect(mimeForFormat('xyz')).toBe('application/octet-stream');
    expect(mimeForFormat(undefined)).toBe('application/octet-stream');
  });
});

describe('canShareFileType', () => {
  it('fragt navigator.canShare mit einer Datei des Typs', () => {
    const nav = shareNav();
    expect(canShareFileType('image/png', nav)).toBe(true);
    const [{ files }] = nav.canShare.mock.calls[0];
    expect(files[0].type).toBe('image/png');
    expect(files[0].name).toBe('probe.png');
  });

  it('ist false ohne Web Share API, bei Ablehnung oder Ausnahme', () => {
    expect(canShareFileType('image/png', {})).toBe(false);
    expect(canShareFileType('image/png', undefined)).toBe(false);
    expect(canShareFileType('image/tiff', shareNav({ canShare: false }))).toBe(false);
    const throwing = {
      share: vi.fn(),
      canShare: () => {
        throw new TypeError('nope');
      },
    };
    expect(canShareFileType('image/png', throwing)).toBe(false);
  });
});

describe('canCopyImage', () => {
  it('braucht clipboard.write und ClipboardItem', () => {
    const nav = { clipboard: { write: vi.fn() } };
    vi.stubGlobal('ClipboardItem', undefined);
    expect(canCopyImage(nav)).toBe(false);
    vi.stubGlobal('ClipboardItem', FakeClipboardItem);
    expect(canCopyImage(nav)).toBe(true);
    expect(canCopyImage({})).toBe(false);
  });
});

describe('pickShareStrategy', () => {
  it('bevorzugt Systemdialog, dann Zwischenablage, dann Download', () => {
    vi.stubGlobal('ClipboardItem', FakeClipboardItem);
    const clipboard = { write: vi.fn() };
    expect(pickShareStrategy('image/png', { ...shareNav(), clipboard })).toBe('share');
    expect(pickShareStrategy('image/tiff', { ...shareNav({ canShare: false }), clipboard })).toBe(
      'clipboard'
    );
    expect(pickShareStrategy('image/png', {})).toBe('download');
  });
});

describe('shareFile', () => {
  const file = new File([new Uint8Array(4)], 'bild.png', { type: 'image/png' });

  it('übergibt Datei und Titel an navigator.share', async () => {
    const nav = shareNav();
    await expect(shareFile(file, { title: 'bild.png' }, nav)).resolves.toBe('shared');
    expect(nav.share).toHaveBeenCalledWith({ files: [file], title: 'bild.png' });
  });

  it('behandelt Abbruch durch den Nutzer nicht als Fehler', async () => {
    const nav = shareNav({ share: vi.fn().mockRejectedValue(domError('AbortError')) });
    await expect(shareFile(file, {}, nav)).resolves.toBe('cancelled');
  });

  it('reicht NotAllowedError weiter (zweiter Klick nötig)', async () => {
    const nav = shareNav({ share: vi.fn().mockRejectedValue(domError('NotAllowedError')) });
    await expect(shareFile(file, {}, nav)).rejects.toMatchObject({ name: 'NotAllowedError' });
  });
});

describe('copyImageToClipboard', () => {
  it('schreibt ein PNG-ClipboardItem, auch mit Promise als Inhalt', async () => {
    vi.stubGlobal('ClipboardItem', FakeClipboardItem);
    const write = vi.fn().mockResolvedValue(undefined);
    const blob = new Blob([new Uint8Array(2)], { type: 'image/png' });
    await copyImageToClipboard(Promise.resolve(blob), { clipboard: { write } });
    const [[item]] = write.mock.calls[0];
    await expect(item.items['image/png']).resolves.toBe(blob);
  });

  it('wirft ohne Clipboard API', async () => {
    vi.stubGlobal('ClipboardItem', undefined);
    await expect(copyImageToClipboard(new Blob(), {})).rejects.toThrow();
  });
});
