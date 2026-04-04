import { test, expect } from '@playwright/test';

test.describe('Beneficiary Flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/masuk');
    await expect(page.locator('h2', { hasText: /Masuk/i })).toBeVisible({ timeout: 10000 });
  });

  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
  });
});
