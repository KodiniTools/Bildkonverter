import { expect, test } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImages } from './helpers';

test.describe('Editor (Smoke)', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = collectPageErrors(page);
    await prepare(page, 'de');
    await page.goto('./editor');
    await uploadImages(page, [imageFile('a.png')]);
    await expect(page.getByText('120 × 80px')).toBeVisible();
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test('Bild laden zeigt Leinwand und Bildinfo', async ({ page }) => {
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bild ersetzen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rückgängig' }).first()).toBeDisabled();
  });

  test('Regler ändern macht den Schritt rückgängig-fähig', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Helligkeit' });
    await expect(slider).toHaveValue('100');
    await slider.fill('130');
    await expect(slider).toHaveValue('130');
    await expect(page.getByRole('button', { name: 'Rückgängig' }).first()).toBeEnabled();

    await page.getByRole('button', { name: 'Rückgängig' }).first().click();
    await expect(slider).toHaveValue('100');
  });

  test('Download fragt den Dateinamen ab und lädt die Datei herunter', async ({ page }) => {
    await page.getByRole('button', { name: 'Download' }).click();
    const overlay = page.locator('#overlay-root');
    await expect(overlay.getByRole('button', { name: 'Abbrechen' })).toBeVisible();

    const download = page.waitForEvent('download');
    await overlay.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.png$/);
  });
});

test.describe('Bestätigung und Toast', () => {
  test('Bild löschen fragt nach; Abbrechen behält das Bild, Löschen meldet per Toast', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await page.goto('./editor');
    await uploadImages(page, [imageFile('a.png')]);
    await expect(page.getByText('120 × 80px')).toBeVisible();

    await page.getByRole('button', { name: 'Bild löschen' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('120 × 80px')).toBeVisible();

    await page.getByRole('button', { name: 'Bild löschen' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Bild löschen' }).click();
    await dialog.getByRole('button', { name: 'Löschen' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('120 × 80px')).toBeHidden();
    await expect(page.locator('#overlay-root').getByRole('status')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Batch (Smoke)', () => {
  test('zwei Bilder konvertieren und herunterladen', async ({ page }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await page.goto('./batch');
    await uploadImages(page, [imageFile('a.png'), imageFile('b.png', 80, 60)]);

    await expect(page.getByText('a.png')).toBeVisible();
    await expect(page.getByText('b.png')).toBeVisible();
    const downloadAll = page.getByRole('button', { name: 'Alle herunterladen' });
    await expect(downloadAll).toBeDisabled();

    await page.getByRole('button', { name: 'Konvertierung starten' }).click();
    await expect(downloadAll).toBeEnabled({ timeout: 15000 });
    expect(errors).toEqual([]);
  });
});

test.describe('Formatseite (Smoke)', () => {
  test('PNG in WebP umwandeln, herunterladen und zurücksetzen', async ({ page }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await page.goto('./konvertieren/png-zu-webp');
    await uploadImages(page, [imageFile('bild.png')]);

    const download = page.getByRole('button', { name: 'Herunterladen (WebP)' });
    await expect(download).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.result-state img')).toHaveCount(2);

    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    expect(file.suggestedFilename()).toBe('bild.webp');

    await page.getByRole('button', { name: 'Weiteres Bild konvertieren' }).click();
    await expect(page.locator('.upload-zone')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
