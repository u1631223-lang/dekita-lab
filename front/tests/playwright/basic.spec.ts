import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

test.describe('Dekita Lab smoke', () => {
  test('loads hub screen', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByRole('heading', { name: /どの ゲーム/i })).toBeVisible();
  });
});
