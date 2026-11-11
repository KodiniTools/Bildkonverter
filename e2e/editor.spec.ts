import { expect, test } from '@playwright/test';
import {
  collectPageErrors,
  imageFile,
  prepare,
  savedFiles,
  stubSavePickers,
  uploadImages,
} from './helpers';

test.describe('Editor (Smoke)', () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = collectPageErrors(page);
    await prepare(page, 'de');
    await stubSavePickers(page, 'fake');
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

  test('Zuschneiden: Bestätigen und Abbrechen sind Symbol-Buttons ohne Text', async ({ page }) => {
    await page.getByRole('button', { name: 'Zuschneiden', exact: true }).click();
    const confirm = page.getByRole('button', { name: 'Bestätigen', exact: true });
    const cancel = page.getByRole('button', { name: 'Abbrechen', exact: true });
    await expect(confirm).toBeVisible();
    await expect(confirm).toHaveText('');
    await expect(cancel).toHaveText('');
    await cancel.click();
    await expect(confirm).toBeHidden();
  });

  test('Download: Dateiname im Export-Dialog, dann Speichern-unter-Dialog des Systems', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Download' }).click();
    const overlay = page.locator('#overlay-root');
    await expect(overlay.getByText('Im nächsten Schritt wählst du Speicherort')).toBeVisible();
    await overlay.locator('input[type="text"]').fill('mein-bild');
    await overlay.getByRole('button', { name: 'Download' }).click();

    await expect
      .poll(() => savedFiles(page))
      .toEqual([expect.objectContaining({ name: 'mein-bild.png', type: 'image/png' })]);
  });
});

test.describe('Editor ohne Speichern-Dialog (Firefox/Safari)', () => {
  test('Download lädt die Datei mit dem Namen aus dem Export-Dialog herunter', async ({ page }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await stubSavePickers(page, 'none');
    await page.goto('./editor');
    await uploadImages(page, [imageFile('a.png')]);
    await expect(page.getByText('120 × 80px')).toBeVisible();

    await page.getByRole('button', { name: 'Download' }).click();
    const overlay = page.locator('#overlay-root');
    await expect(overlay.getByText('Den Speicherort legt dein Browser fest')).toBeVisible();
    await overlay.locator('input[type="text"]').fill('mein-bild');

    const download = page.waitForEvent('download');
    await overlay.getByRole('button', { name: 'Download' }).click();
    expect((await download).suggestedFilename()).toBe('mein-bild.png');
    expect(errors).toEqual([]);
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
    await stubSavePickers(page, 'fake');
    await page.goto('./batch');
    await uploadImages(page, [imageFile('a.png'), imageFile('b.png', 80, 60)]);

    await expect(page.getByText('a.png')).toBeVisible();
    await expect(page.getByText('b.png')).toBeVisible();
    const downloadAll = page.getByRole('button', { name: 'Alle herunterladen' });
    await expect(downloadAll).toBeDisabled();

    await page.getByRole('button', { name: 'Konvertierung starten' }).click();
    await expect(downloadAll).toBeEnabled({ timeout: 15000 });

    // Ein Ordnerdialog für alle Dateien
    await downloadAll.click();
    await expect
      .poll(async () => (await savedFiles(page)).map((f) => f.name).sort())
      .toEqual(['a.jpg', 'b.jpg']);
    expect(errors).toEqual([]);
  });
});

test.describe('Formatseite (Smoke)', () => {
  test('PNG in WebP umwandeln, herunterladen und zurücksetzen', async ({ page }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await stubSavePickers(page, 'none');
    await page.goto('./konvertieren/png-zu-webp');
    await uploadImages(page, [imageFile('bild.png')]);

    const download = page.getByRole('button', { name: 'Herunterladen (WebP)' });
    await expect(download).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.result-state img')).toHaveCount(2);

    // Ohne Speichern-Dialog (Firefox/Safari): Dateiname in der App, dann Download
    await download.click();
    const dialog = page.getByRole('dialog', { name: 'Speichern unter' });
    await expect(dialog.getByLabel('Dateiname')).toHaveValue('bild');
    await dialog.getByLabel('Dateiname').fill('urlaub');
    const [file] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'Speichern' }).click(),
    ]);
    expect(file.suggestedFilename()).toBe('urlaub.webp');

    await page.getByRole('button', { name: 'Weiteres Bild konvertieren' }).click();
    await expect(page.locator('.upload-zone')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Editor: Social-Media-Presets im Zuschneiden', () => {
  test('Preset schneidet zu und verkleinert auf die Zielgröße', async ({ page }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await page.goto('./editor');
    await uploadImages(page, [imageFile('gross.png', 1600, 1600)]);
    await expect(page.getByText('1600 × 1600px')).toBeVisible();

    await page.getByRole('button', { name: 'Zuschneiden', exact: true }).click();
    await page.getByRole('combobox', { name: 'Plattform' }).selectOption('instagram');
    await page.getByRole('button', { name: /Beitrag Hochformat/ }).click();
    await page.getByRole('button', { name: 'Bestätigen', exact: true }).click();

    await expect(page.getByText('1080 × 1350px')).toBeVisible();

    // Zuschnitt + Verkleinern sind ein einziger Rückgängig-Schritt
    await page.getByRole('button', { name: 'Rückgängig' }).first().click();
    await expect(page.getByText('1600 × 1600px')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
