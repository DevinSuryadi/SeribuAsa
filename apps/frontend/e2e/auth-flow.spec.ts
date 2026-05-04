import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/masuk');
    // Check that the page loaded (no 404)
    await expect(page.locator('h2', { hasText: /Masuk/i })).toBeVisible({ timeout: 10000 });
  });

  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'SeribuAsa' }).first()).toBeVisible();
  });
});
