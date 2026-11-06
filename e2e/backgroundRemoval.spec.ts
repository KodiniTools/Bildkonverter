import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, prepare, splitImageFile, uploadImages } from './helpers';

// Mini-Modell statt des 90-MB-Modells: Maske = Mittelwert der Farbkanäle
const MASK_MODEL = readFileSync(new URL('../tests/fixtures/mask-mean.onnx', import.meta.url));

/** Alpha links und rechts in der Mitte der Leinwand */
function alphaLeftRight(page: Page) {
  return page.locator('canvas.main-canvas').evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    const y = c.height >> 1;
    return [
      ctx.getImageData(Math.round(c.width * 0.2), y, 1, 1).data[3],
      ctx.getImageData(Math.round(c.width * 0.8), y, 1, 1).data[3],
    ];
  });
}

test('Hintergrund entfernen: transparentes Ergebnis, PNG-Export und Rückgängig', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  let modelRequests = 0;
  await page.route('**/models/isnet-general-use-fp16.onnx', (route) => {
    modelRequests++;
    return route.fulfill({ body: MASK_MODEL, contentType: 'application/octet-stream' });
  });
  await prepare(page, 'de');
  await page.goto('./editor');
  await uploadImages(page, [splitImageFile('halb.png', 200, 120, [255, 255, 255], [0, 0, 0])]);
  await expect(page.getByText('200 × 120px')).toBeVisible();
  expect(await alphaLeftRight(page)).toEqual([255, 255]);

  await page.getByTestId('remove-background').click();
  await expect(page.getByText('Hintergrund entfernt')).toBeVisible({ timeout: 30000 });
  expect(modelRequests).toBe(1);
  await expect.poll(() => alphaLeftRight(page)).toEqual([255, 0]);
  await expect(page.locator('canvas.main-canvas')).toHaveClass(/main-canvas--transparent/);

  await page.getByRole('button', { name: 'Rückgängig', exact: true }).first().click();
  await expect.poll(() => alphaLeftRight(page)).toEqual([255, 255]);
  expect(errors).toEqual([]);
});

test('Hintergrund entfernen läuft auf einer per COEP isolierten Seite (wie live)', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  // Live liefert der Server die Seite mit COOP/COEP aus. Eine separate
  // Worker-Datei ohne eigenen COEP-Header würde dann blockiert.
  await page.route('**/bildkonverter/editor', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-embedder-policy': 'require-corp',
      },
    });
  });
  await page.route('**/models/isnet-general-use-fp16.onnx', (route) =>
    route.fulfill({ body: MASK_MODEL, contentType: 'application/octet-stream' })
  );
  await prepare(page, 'de');
  await page.goto('./editor');
  expect(await page.evaluate(() => self.crossOriginIsolated)).toBe(true);
  await uploadImages(page, [splitImageFile('halb.png', 200, 120, [255, 255, 255], [0, 0, 0])]);
  await expect(page.getByText('200 × 120px')).toBeVisible();

  await page.getByTestId('remove-background').click();
  await expect(page.getByText('Hintergrund entfernt')).toBeVisible({ timeout: 30000 });
  await expect.poll(() => alphaLeftRight(page)).toEqual([255, 0]);
  expect(errors).toEqual([]);
});
