import { expect, test } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImages } from './helpers';

test('Projekt speichern: Bearbeitung übersteht ein Neuladen und lässt sich fortsetzen', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await prepare(page, 'de');
  await page.goto('./editor');
  await uploadImages(page, [imageFile('urlaub.png', 120, 80, [70, 150])]);
  await expect(page.getByText('120 × 80px')).toBeVisible();

  const contrast = page.getByRole('spinbutton', { name: 'Kontrast' });
  await page.getByTestId('auto-enhance').click();
  await expect.poll(async () => Number(await contrast.inputValue())).toBeGreaterThan(100);
  const enhanced = await contrast.inputValue();
  await expect(page.getByText('Lokal gesichert')).toBeVisible();

  await page.reload();
  const card = page.getByRole('region', { name: 'Letzte Bearbeitung fortsetzen' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('urlaub');

  await card.getByRole('button', { name: 'Fortsetzen' }).click();
  await expect(page.getByText('120 × 80px')).toBeVisible();
  await expect(contrast).toHaveValue(enhanced);
  await expect(card).toBeHidden();
  expect(errors).toEqual([]);
});

test('Projekt speichern: Verwerfen löscht die Sicherung', async ({ page }) => {
  await prepare(page, 'en');
  await page.goto('./editor');
  await uploadImages(page, [imageFile('foto.png', 100, 60)]);
  await expect(page.getByText('Saved locally')).toBeVisible();

  await page.reload();
  const card = page.getByRole('region', { name: 'Continue where you left off' });
  await card.getByRole('button', { name: 'Discard' }).click();
  await expect(card).toBeHidden();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'No Image Loaded' })).toBeVisible();
  await expect(card).toBeHidden();
});
