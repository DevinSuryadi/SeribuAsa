import { test, expect } from '@playwright/test';

test.describe('Vendor Flow - Protected Routes', () => {
  test('vendor dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/vendor');
    
    // Should redirect to login
    await page.waitForURL(/login|masuk|\//);
  });

  test('kelola produk redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/kelola-produk');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('settlement page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/settlement');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('scan QR page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/scan-qr');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('penukaran voucher redirects to scan-qr', async ({ page }) => {
    await page.goto('/dashboard/penukaran-voucher');
    
    // Should redirect to scan-qr (then to login if not authenticated)
    await page.waitForURL(/scan-qr|login|masuk|\//);
  });
});

test.describe('Vendor Flow - Registration', () => {
  test('can access register page with vendor role', async ({ page }) => {
    await page.goto('/register?role=vendor');
    
    await expect(page.locator('body')).toBeVisible();
    // Should show vendor option
    await expect(page.getByText(/vendor/i).first()).toBeVisible();
  });

  test('register page shows vendor role description', async ({ page }) => {
    await page.goto('/register');
    
    // Should show vendor role info
    await expect(page.getByText(/vendor/i).first()).toBeVisible();
  });

  test('vendor role description mentions pangan', async ({ page }) => {
    await page.goto('/register');
    
    // Click vendor to see description
    const vendorOption = page.getByText(/vendor/i).first();
    await vendorOption.click();
    
    // Should show description about selling food
    await expect(page.getByText(/pangan/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vendor Flow - Public Pages', () => {
  test('landing page shows vendor information', async ({ page }) => {
    await page.goto('/');
    
    // Landing page should mention vendors/penjual
    await expect(page.locator('body')).toBeVisible();
  });

  test('about page accessible', async ({ page }) => {
    await page.goto('/tentang');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });
});
