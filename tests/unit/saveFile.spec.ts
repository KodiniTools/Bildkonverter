import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extensionOf,
  pickSaveFolder,
  pickerTypes,
  sanitizeFilename,
  saveFile,
  supportsFolderPicker,
  supportsSavePicker,
  uniqueNameInFolder,
  writeFileToFolder,
} from '@/utils/saveFile';
import { useSavePrompt } from '@/composables/useSavePrompt';

const domError = (name: string) => Object.assign(new Error(name), { name });

function fakeWritable() {
  return {
    write: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    abort: vi.fn(async () => {}),
  };
}

function fakeHandle(name: string, writable = fakeWritable()) {
  return { name, createWritable: vi.fn(async () => writable), writable };
}

/** Ordner im Speicher: getFileHandle wie die echte API (NotFoundError ohne create) */
function fakeFolder(existing: string[] = []) {
  const files = new Map<string, ReturnType<typeof fakeHandle>>();
  existing.forEach((n) => files.set(n, fakeHandle(n)));
  const dir = {
    files,
    getFileHandle: vi.fn(async (name: string, opts?: { create?: boolean }) => {
      const found = files.get(name);
      if (found) return found;
      if (!opts?.create) throw domError('NotFoundError');
      const created = fakeHandle(name);
      files.set(name, created);
      return created;
    }),
  };
  return dir as typeof dir & FileSystemDirectoryHandle;
}

const blob = new Blob(['inhalt'], { type: 'image/png' });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  const { state, respond } = useSavePrompt();
  if (state.value.visible) respond(null);
});

describe('Hilfsfunktionen', () => {
  it('erkennt Endungen', () => {
    expect(extensionOf('bild.PNG')).toBe('png');
    expect(extensionOf('archiv.tar.zip')).toBe('zip');
    expect(extensionOf('ohne-endung')).toBe('');
    expect(extensionOf(undefined)).toBe('');
  });

  it('bereinigt Dateinamen und ergänzt die fehlende Endung', () => {
    expect(sanitizeFilename('urlaub', 'bild.jpg')).toBe('urlaub.jpg');
    expect(sanitizeFilename('urlaub.jpg', 'bild.jpg')).toBe('urlaub.jpg');
    expect(sanitizeFilename('a/b:c*?.png', 'bild.png')).toBe('a_b_c__.png');
    expect(sanitizeFilename('  ..versteckt.. ', 'bild.png')).toBe('versteckt.png');
    expect(sanitizeFilename('   ', 'bild.png')).toBe('bild.png');
    expect(sanitizeFilename(null, 'bild.png')).toBe('bild.png');
    expect(sanitizeFilename('')).toBe('datei');
  });

  it('baut den Typ-Filter des Systemdialogs aus Endung und MIME-Typ', () => {
    expect(pickerTypes('a.jpg')).toEqual([
      { description: 'JPG', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } },
    ]);
    expect(pickerTypes('a.zip', 'application/zip')).toEqual([
      { description: 'ZIP', accept: { 'application/zip': ['.zip'] } },
    ]);
    expect(pickerTypes('a.xyz')).toEqual([]);
    expect(pickerTypes('ohne')).toEqual([]);
  });

  it('meldet die Unterstützung der Dialoge', () => {
    expect(supportsSavePicker()).toBe(false);
    expect(supportsFolderPicker()).toBe(false);
    vi.stubGlobal('showSaveFilePicker', vi.fn());
    vi.stubGlobal('showDirectoryPicker', vi.fn());
    expect(supportsSavePicker()).toBe(true);
    expect(supportsFolderPicker()).toBe(true);
  });
});

describe('saveFile mit Systemdialog', () => {
  it('öffnet den Dialog synchron, erzeugt die Datei erst danach und schreibt sie', async () => {
    const handle = fakeHandle('mein-bild.png');
    const picker = vi.fn(async () => handle);
    vi.stubGlobal('showSaveFilePicker', picker);
    const getBlob = vi.fn(async () => blob);

    const pending = saveFile({ suggestedName: 'bild.png', getBlob });
    // Noch vor dem ersten await geöffnet (Nutzergeste), Datei noch nicht erzeugt
    expect(picker).toHaveBeenCalledWith({
      suggestedName: 'bild.png',
      types: [{ description: 'PNG', accept: { 'image/png': ['.png'] } }],
    });
    expect(getBlob).not.toHaveBeenCalled();

    await expect(pending).resolves.toEqual({
      outcome: 'saved',
      filename: 'mein-bild.png',
      blob,
    });
    expect(handle.writable.write).toHaveBeenCalledWith(blob);
    expect(handle.writable.close).toHaveBeenCalled();
  });

  it('Abbruch im Dialog: keine Datei, kein Download', async () => {
    vi.stubGlobal(
      'showSaveFilePicker',
      vi.fn(async () => {
        throw domError('AbortError');
      })
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const getBlob = vi.fn(async () => blob);

    const result = await saveFile({ suggestedName: 'bild.png', getBlob });

    expect(result.outcome).toBe('cancelled');
    expect(getBlob).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });

  it('wiederholt ohne Typ-Filter, wenn der Browser den Filter ablehnt', async () => {
    const handle = fakeHandle('a.heic');
    const picker = vi
      .fn()
      .mockRejectedValueOnce(domError('TypeError'))
      .mockResolvedValueOnce(handle);
    vi.stubGlobal('showSaveFilePicker', picker);

    const result = await saveFile({ suggestedName: 'a.heic', getBlob: () => blob });

    expect(result.outcome).toBe('saved');
    expect(picker).toHaveBeenLastCalledWith({ suggestedName: 'a.heic' });
  });

  it('weicht bei SecurityError (z. B. Geste abgelaufen) auf den Download aus', async () => {
    vi.stubGlobal(
      'showSaveFilePicker',
      vi.fn(() => {
        throw domError('SecurityError');
      })
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const result = await saveFile({ suggestedName: 'bild.png', getBlob: () => blob });

    expect(result.outcome).toBe('downloaded');
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.contexts[0]).toMatchObject({ download: 'bild.png' });
  });

  it('weicht auf den Download aus, wenn das Schreiben scheitert', async () => {
    const writable = fakeWritable();
    writable.write.mockRejectedValueOnce(domError('NoModificationAllowedError'));
    vi.stubGlobal(
      'showSaveFilePicker',
      vi.fn(async () => fakeHandle('x.png', writable))
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const result = await saveFile({ suggestedName: 'bild.png', getBlob: () => blob });

    expect(writable.abort).toHaveBeenCalled();
    expect(result).toMatchObject({ outcome: 'downloaded', filename: 'x.png' });
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('gibt Fehler beim Erzeugen der Datei weiter', async () => {
    vi.stubGlobal(
      'showSaveFilePicker',
      vi.fn(async () => fakeHandle('x.png'))
    );
    await expect(
      saveFile({
        suggestedName: 'bild.png',
        getBlob: async () => {
          throw new Error('Kodieren fehlgeschlagen');
        },
      })
    ).rejects.toThrow('Kodieren fehlgeschlagen');
  });
});

describe('saveFile ohne Systemdialog (Firefox, Safari)', () => {
  it('fragt den Dateinamen ab und lädt unter diesem Namen herunter', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { state, respond } = useSavePrompt();

    const pending = saveFile({ suggestedName: 'bild.jpg', getBlob: () => blob });
    expect(state.value).toMatchObject({ visible: true, filename: 'bild.jpg' });
    respond('ferien/1');

    await expect(pending).resolves.toMatchObject({
      outcome: 'downloaded',
      filename: 'ferien_1.jpg',
    });
    expect(click.mock.contexts[0]).toMatchObject({ download: 'ferien_1.jpg' });
    expect(state.value.visible).toBe(false);
  });

  it('Abbruch der Abfrage lädt nichts herunter', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const getBlob = vi.fn(() => blob);

    const pending = saveFile({ suggestedName: 'bild.jpg', getBlob });
    useSavePrompt().respond(null);

    await expect(pending).resolves.toMatchObject({ outcome: 'cancelled' });
    expect(getBlob).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });

  it('askName false lädt direkt mit dem vorgeschlagenen Namen herunter', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const result = await saveFile({
      suggestedName: 'export.webp',
      getBlob: () => blob,
      askName: false,
    });

    expect(result.outcome).toBe('downloaded');
    expect(useSavePrompt().state.value.visible).toBe(false);
    expect(click.mock.contexts[0]).toMatchObject({ download: 'export.webp' });
  });

  it('eine neue Abfrage bricht eine noch offene ab', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const first = saveFile({ suggestedName: 'a.png', getBlob: () => blob });
    const second = saveFile({ suggestedName: 'b.png', getBlob: () => blob });

    await expect(first).resolves.toMatchObject({ outcome: 'cancelled' });
    useSavePrompt().respond('b');
    await expect(second).resolves.toMatchObject({ outcome: 'downloaded', filename: 'b.png' });
  });
});

describe('Ordner für mehrere Dateien', () => {
  it('pickSaveFolder: Ordner, Abbruch oder nicht verfügbar', async () => {
    expect(await pickSaveFolder()).toBeUndefined();

    const dir = fakeFolder();
    const picker = vi.fn(async () => dir);
    vi.stubGlobal('showDirectoryPicker', picker);
    expect(await pickSaveFolder()).toBe(dir);
    expect(picker).toHaveBeenCalledWith({ id: 'bildkonverter-save', mode: 'readwrite' });

    picker.mockRejectedValueOnce(domError('AbortError'));
    expect(await pickSaveFolder()).toBeNull();

    picker.mockRejectedValueOnce(domError('SecurityError'));
    expect(await pickSaveFolder()).toBeUndefined();
  });

  it('überschreibt keine vorhandenen Dateien und vergibt Namen nur einmal', async () => {
    const dir = fakeFolder(['bild.png', 'bild (1).png']);
    const taken = new Set<string>();

    expect(await uniqueNameInFolder(dir, 'bild.png', taken)).toBe('bild (2).png');
    expect(await uniqueNameInFolder(dir, 'bild.png', taken)).toBe('bild (3).png');
    expect(await uniqueNameInFolder(dir, 'neu.png', taken)).toBe('neu.png');
    expect(await uniqueNameInFolder(dir, 'NEU.png', taken)).toBe('NEU (1).png');
    expect(await uniqueNameInFolder(dir, 'ohne', taken)).toBe('ohne');
  });

  it('wertet einen gleichnamigen Unterordner als belegt', async () => {
    const dir = fakeFolder();
    dir.getFileHandle.mockRejectedValueOnce(domError('TypeMismatchError'));
    expect(await uniqueNameInFolder(dir, 'fotos.zip')).toBe('fotos (1).zip');
  });

  it('writeFileToFolder legt die Datei an und schreibt den Inhalt', async () => {
    const dir = fakeFolder(['a.png']);
    const name = await writeFileToFolder(dir, 'a.png', blob);
    expect(name).toBe('a (1).png');
    expect(dir.files.get('a (1).png')?.writable.write).toHaveBeenCalledWith(blob);
    expect(dir.files.get('a.png')?.writable.write).not.toHaveBeenCalled();
  });
});
