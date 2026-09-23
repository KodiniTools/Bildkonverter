import { describe, it, expect } from 'vitest';
import {
  RAW_EXTENSIONS,
  IMAGE_EXTENSIONS,
  isImageFile,
  needsBackendPreview,
  formatSize,
} from '@/utils/fileUtils';

const file = (name, type = '') => new File([''], name, { type });

describe('fileUtils', () => {
  it('führt alle RAW-Endungen in der Bildliste', () => {
    for (const ext of RAW_EXTENSIONS) expect(IMAGE_EXTENSIONS).toContain(ext);
    expect(IMAGE_EXTENSIONS).toEqual(
      expect.arrayContaining(['jpg', 'jpeg', 'png', 'webp', 'tiff', 'heic'])
    );
  });

  describe('isImageFile', () => {
    it('akzeptiert Bilder per MIME-Typ', () => {
      expect(isImageFile(file('x.bin', 'image/png'))).toBe(true);
    });
    it('akzeptiert RAW und TIFF auch ohne MIME-Typ (Fallback auf Endung, groß/klein)', () => {
      expect(isImageFile(file('IMG_0001.CR2'))).toBe(true);
      expect(isImageFile(file('scan.tif'))).toBe(true);
      expect(isImageFile(file('photo.HEIC', 'application/octet-stream'))).toBe(true);
    });
    it('lehnt Nicht-Bilder ab', () => {
      expect(isImageFile(file('notes.txt', 'text/plain'))).toBe(false);
      expect(isImageFile(file('archive.zip'))).toBe(false);
    });
  });

  describe('needsBackendPreview', () => {
    it('erkennt Formate, die der Browser nicht anzeigen kann', () => {
      expect(needsBackendPreview(file('x', 'image/tiff'))).toBe(true);
      expect(needsBackendPreview(file('a.heif'))).toBe(true);
      expect(needsBackendPreview(file('a.nef'))).toBe(true);
    });
    it('lässt Browser-Formate durch', () => {
      expect(needsBackendPreview(file('a.png', 'image/png'))).toBe(false);
      expect(needsBackendPreview(file('a.webp', 'image/webp'))).toBe(false);
    });
  });

  describe('formatSize', () => {
    it.each([
      [0, '0 B'],
      [512, '512 B'],
      [1536, '1.5 KB'],
      [2.5 * 1024 * 1024, '2.5 MB'],
      [1.2 * 1024 ** 3, '1.2 GB'],
    ])('formatiert %d Bytes als %s', (bytes, expected) => {
      expect(formatSize(bytes)).toBe(expected);
    });
    it('behandelt undefined wie 0', () => {
      expect(formatSize(undefined)).toBe('0 B');
    });
  });
});
