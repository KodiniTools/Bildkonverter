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

test('Kurven: Punkt ziehen, Kanal wählen, Preset und Rückgängig', async ({ page }) => {
  const errors = collectPageErrors(page);
  await prepare(page, 'de');
  await page.goto('./editor');
  await uploadImages(page, [solidImageFile('grau.png', 120, 80, [128, 128, 128])]);
  await expect(page.getByText('120 × 80px')).toBeVisible();
  await page.getByRole('heading', { name: 'Kurven' }).click();
  expect(await centerColor(page)).toEqual([128, 128, 128]);

  // Punkt in der Mitte setzen und nach oben ziehen: Gesamtkurve hellt auf
  const graph = page.getByTestId('curve-graph');
  await graph.scrollIntoViewIfNeeded();
  const box = (await graph.boundingBox())!;
  const at = (x: number, y: number) => ({
    x: box.x + ((x + 8) / 271) * box.width,
    y: box.y + ((255 - y + 8) / 271) * box.height,
  });
  const start = at(128, 128);
  const end = at(128, 180);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByTestId('curve-point-1')).toHaveAttribute('aria-valuenow', /^1[78]\d$/);
  await expect.poll(async () => (await centerColor(page))[0]).toBeGreaterThan(160);

  // Blaukanal: Preset „Abdunkeln“ wirkt nur auf Blau
  await page.getByTestId('curve-channel-b').click();
  await page.getByLabel('Kurven-Preset').selectOption('darken');
  await expect
    .poll(async () => {
      const [r, , b] = await centerColor(page);
      return r - b;
    })
    .toBeGreaterThan(10);

  await page.getByRole('button', { name: 'Rückgängig', exact: true }).first().click();
  await expect
    .poll(async () => {
      const [r, , b] = await centerColor(page);
      return r - b;
    })
    .toBe(0);

  await page.getByTestId('curve-reset').click();
  await expect.poll(() => centerColor(page)).toEqual([128, 128, 128]);
  expect(errors).toEqual([]);
});
