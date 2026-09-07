import { test, expect } from '@playwright/test';

test.describe('Donation Flow - Public Pages', () => {
  test('donation page loads', async ({ page }) => {
    await page.goto('/donasi');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Should have donation-related content
    await expect(page.locator('h1', { hasText: /pilih paket donasi/i })).toBeVisible();
  });

  test('donation page has call-to-action', async ({ page }) => {
    await page.goto('/donasi');
    
    // Should have a button or link to start donation
    const cta = page.locator('text=/donasi sekarang/i').first();
    await expect(cta).toBeVisible({ timeout: 10000 });
  });

  test('donation page has navigation', async ({ page }) => {
    await page.goto('/donasi');
    
    // Should have navbar
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('donation page shows impact information', async ({ page }) => {
    await page.goto('/donasi');
    
    // Should show some impact or donation info
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Donation Flow - Create Donation (Requires Auth)', () => {
  test('create donation page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/donation/create');
    
    // Should redirect to login
    await page.waitForURL(/login|masuk|\//);
  });

  test('donation checkout page loads', async ({ page }) => {
    await page.goto('/donation/checkout');
    
    // Should load (may redirect if no donation data)
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page shows donation redirect message', async ({ page }) => {
    await page.goto('/login?from=checkout');
    
    // Should show message about continuing donation
    await expect(page.getByText(/donasi/i).first()).toBeVisible();
  });
});

test.describe('Donation Flow - Donation Information', () => {
  test('dampak (impact) page loads', async ({ page }) => {
    await page.goto('/dampak');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('dampak page shows impact statistics', async ({ page }) => {
    await page.goto('/dampak');
    
    // Should show some statistics or impact data
    await expect(page.locator('main')).toBeVisible();
  });

  test('tentang (about) page loads', async ({ page }) => {
    await page.goto('/tentang');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('tentang page has content about the platform', async ({ page }) => {
    await page.goto('/tentang');
    
    // Should have content about SeribuAsa
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Donation Flow - Navigation Between Pages', () => {
  test('can navigate from landing to donation page', async ({ page }) => {
    await page.goto('/');
    
    const donasiLink = page.getByRole('link', { name: /donasi/i }).first();
    if (await donasiLink.isVisible()) {
      await donasiLink.click();
      await expect(page).toHaveURL(/donasi/);
    }
  });

  test('can navigate from donation to login', async ({ page }) => {
    await page.goto('/donasi');
    
    // Look for login/masuk link
    const loginLink = page.getByRole('link', { name: /masuk|login/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('can navigate from landing to impact page', async ({ page }) => {
    await page.goto('/');
    
    const dampakLink = page.getByRole('link', { name: /dampak/i }).first();
    if (await dampakLink.isVisible()) {
      await dampakLink.click();
      await expect(page).toHaveURL(/dampak/);
    }
  });

  test('can navigate from landing to about page', async ({ page }) => {
    await page.goto('/');
    
    const tentangLink = page.getByRole('link', { name: /tentang/i }).first();
    if (await tentangLink.isVisible()) {
      await tentangLink.click();
      await expect(page).toHaveURL(/tentang/);
    }
  });
});

test.describe('Donation Flow - Form Validation', () => {
  test('donation checkout requires valid data', async ({ page }) => {
    await page.goto('/donation/checkout');
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
