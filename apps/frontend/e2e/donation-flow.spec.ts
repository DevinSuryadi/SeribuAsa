import { test, expect } from '@playwright/test';

test.describe('Donation Flow', () => {
  test('donation page accessible', async ({ page }) => {
    await page.goto('/masuk');
    await expect(page.locator('h2', { hasText: /Masuk/i })).toBeVisible({ timeout: 10000 });
  });
});
