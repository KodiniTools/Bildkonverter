import { expect, test } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImages } from './helpers';

// Schritt 3: UiSwitch (role="switch") und UiSelect (beschriftetes <select>)
// statt nativer Checkboxen und Selects
test.describe('Schalter und Auswahllisten', () => {
  test('Editor: Format wählen und Schalter umschalten', async ({ page }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await page.goto('./editor');
    await uploadImages(page, [imageFile('a.png')]);
    await expect(page.getByText('120 × 80px')).toBeVisible();

    const format = page.getByRole('combobox', { name: 'Format', exact: true });
    await format.selectOption('png');
    await expect(format).toHaveValue('png');

    const transparent = page.getByRole('switch', { name: 'Transparenter Hintergrund' });
    await expect(transparent).toHaveAttribute('aria-checked', 'false');
    await transparent.click();
    await expect(transparent).toHaveAttribute('aria-checked', 'true');
    // Klick auf das Label schaltet ebenfalls
    await page.getByText('Transparenter Hintergrund', { exact: true }).click();
    await expect(transparent).toHaveAttribute('aria-checked', 'false');
    expect(errors).toEqual([]);
  });

  test('Batch: Zielformat und Schalter', async ({ page }) => {
    const errors = collectPageErrors(page);
    await prepare(page, 'de');
    await page.goto('./batch');
    await uploadImages(page, [imageFile('a.png')]);
    await expect(page.getByText('a.png')).toBeVisible();

    const format = page.getByRole('combobox', { name: 'Zielformat' });
    await format.selectOption('png');
    await expect(format).toHaveValue('png');

    const keepExif = page.getByTestId('batch-keep-exif').getByRole('switch');
    await expect(keepExif).toHaveAttribute('aria-checked', 'false');
    await keepExif.click();
    await expect(keepExif).toHaveAttribute('aria-checked', 'true');

    const aspect = page.getByRole('switch', { name: 'Seitenverhältnis beibehalten' });
    await expect(aspect).toHaveAttribute('aria-checked', 'true');
    await aspect.click();
    await expect(aspect).toHaveAttribute('aria-checked', 'false');
    expect(errors).toEqual([]);
  });
});
