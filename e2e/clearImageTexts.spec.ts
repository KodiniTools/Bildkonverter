import { expect, test } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImages } from './helpers';

test('Bild löschen entfernt auch die Texte; das nächste Bild startet ohne Text', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await prepare(page, 'de');
  await page.goto('./editor');
  await uploadImages(page, [imageFile('a.png')]);
  await expect(page.getByText('120 × 80px')).toBeVisible();

  await page.getByRole('button', { name: 'Text hinzufügen (T)' }).click();
  await expect(page.locator('.text-item')).toHaveCount(1);

  await page.getByRole('button', { name: 'Bild löschen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(page.getByText('120 × 80px')).toBeHidden();

  await uploadImages(page, [imageFile('b.png', 80, 60)]);
  await expect(page.getByText('80 × 60px')).toBeVisible();
  await expect(page.locator('.text-item')).toHaveCount(0);
  expect(errors).toEqual([]);
});
