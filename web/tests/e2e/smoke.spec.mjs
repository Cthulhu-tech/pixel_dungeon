import { test, expect } from '@playwright/test';
test('Phaser 4 + rex + XState + Zustand, original asset, restart and cleanup', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const failures = [];
  page.on('response', (response) => { if (response.status() >= 400) failures.push(response.url()); });
  await page.goto('./');
  await expect(page.getByRole('status')).toHaveText('ready');
  const canvas = page.locator('canvas'); await expect(canvas).toBeVisible();
  await canvas.click({ position: { x: 160, y: 150 } });
  await expect(page.getByRole('status')).toHaveText('paused');
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Restart renderer' }).click();
    await page.waitForTimeout(100);
    await canvas.click({ position: { x: 160, y: 150 } });
    await expect(page.getByRole('status')).toHaveText(i % 2 === 0 ? 'ready' : 'paused');
  }
  await expect(canvas).toHaveCount(1);
  expect(failures).toEqual([]); expect(errors).toEqual([]);
});
