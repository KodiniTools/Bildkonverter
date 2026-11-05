import { expect, test } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImages } from './helpers';

test('Auto-Verbessern spreizt ein flaues Bild und lässt sich rückgängig machen', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await prepare(page, 'de');
  await page.goto('./editor');
  await uploadImages(page, [imageFile('flau.png', 120, 80, [70, 150])]);
  await expect(page.getByText('120 × 80px')).toBeVisible();

  const contrast = page.getByRole('spinbutton', { name: 'Kontrast' });
  await expect(contrast).toHaveValue('100');

  await page.getByTestId('auto-enhance').click();
  await expect(page.getByText('Automatisch verbessert')).toBeVisible();
  await expect.poll(async () => Number(await contrast.inputValue())).toBeGreaterThan(100);

  await page.getByRole('button', { name: 'Rückgängig', exact: true }).first().click();
  await expect(contrast).toHaveValue('100');
  expect(errors).toEqual([]);
});
