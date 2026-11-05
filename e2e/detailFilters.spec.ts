import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, imageFile, prepare, uploadImages } from './helpers';

/** Prüfsumme der sichtbaren Editor-Leinwand (ändert sich mit jedem Pixel). */
function canvasChecksum(page: Page) {
  return page.locator('canvas.main-canvas').evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum = (sum + data[i] * (i + 1)) % 1_000_000_007;
    return sum;
  });
}

test('Schärfen, Klarheit und Körnung verändern das Bild', async ({ page }) => {
  const errors = collectPageErrors(page);
  await prepare(page, 'de');
  await page.goto('./editor');
  await uploadImages(page, [imageFile('a.png')]);
  await expect(page.getByText('120 × 80px')).toBeVisible();
  await page.getByRole('heading', { name: 'Effekte' }).click();

  let previous = await canvasChecksum(page);
  for (const [name, value] of [
    ['Schärfen', '80'],
    ['Klarheit', '-60'],
    ['Körnung', '40'],
  ] as const) {
    const field = page.getByRole('spinbutton', { name, exact: true });
    await field.fill(value);
    await field.press('Enter');
    await expect(field).toHaveValue(value);
    await expect.poll(() => canvasChecksum(page)).not.toBe(previous);
    previous = await canvasChecksum(page);
  }
  expect(errors).toEqual([]);
});
