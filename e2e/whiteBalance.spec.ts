import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, prepare, solidImageFile, uploadImages } from './helpers';

/** Farbe in der Mitte der Leinwand (R, G, B). */
function centerColor(page: Page) {
  return page.locator('canvas.main-canvas').evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const d = c.getContext('2d')!.getImageData(c.width >> 1, c.height >> 1, 1, 1).data;
    return [d[0], d[1], d[2]];
  });
}

const spread = (c: number[]) => Math.max(...c) - Math.min(...c);

test('Pipette entfernt einen Farbstich über Temperatur und Tönung', async ({ page }) => {
  const errors = collectPageErrors(page);
  await prepare(page, 'de');
  await page.goto('./editor');
  await uploadImages(page, [solidImageFile('stich.png', 120, 80, [200, 175, 130])]);
  await expect(page.getByText('120 × 80px')).toBeVisible();
  await page.getByRole('heading', { name: 'Licht & Farbe' }).click();

  const temperature = page.getByRole('spinbutton', { name: 'Temperatur', exact: true });
  const tint = page.getByRole('spinbutton', { name: 'Tönung', exact: true });
  await expect(temperature).toHaveValue('0');
  expect(spread(await centerColor(page))).toBeGreaterThan(50);

  const pick = page.getByTestId('pick-white');
  await pick.click();
  await expect(pick).toHaveAttribute('aria-pressed', 'true');
  // Aktiv nur per Hervorhebung, ohne Hinweistext im Button oder als Toast
  await expect(pick).toHaveText('Graupunkt wählen');
  await expect(page.locator('#overlay-root').getByRole('status')).toHaveCount(0);
  await page.locator('canvas.main-canvas').click();

  await expect(page.getByText('Weißabgleich gesetzt')).toBeVisible();
  await expect(pick).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => Number(await temperature.inputValue())).toBeLessThan(0);
  expect(Number(await tint.inputValue())).not.toBeNaN();
  await expect.poll(async () => spread(await centerColor(page))).toBeLessThan(8);

  await page.getByRole('button', { name: 'Rückgängig', exact: true }).first().click();
  await expect(temperature).toHaveValue('0');
  expect(errors).toEqual([]);
});
