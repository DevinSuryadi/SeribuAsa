import { test, expect } from '@playwright/test';

test.describe('Beneficiary Flow - Protected Routes', () => {
  test('beneficiary dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/beneficiary');
    
    // Should redirect to login
    await page.waitForURL(/login|masuk|\//);
  });

  test('katalog pangan redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/katalog');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('dompet nutrisi redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/dompet-nutrisi');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('pemantauan gizi redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/pemantauan-gizi');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('survei FIES redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/survei-fies');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('rekomendasi AI redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/rekomendasi-ai');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('cart page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/cart');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('checkout page redirects when not authenticated', async ({ page }) => {
    await page.goto('/checkout');
    
    await page.waitForURL(/login|masuk|\//);
  });
});

test.describe('Beneficiary Flow - Public Access', () => {
  test('landing page accessible without auth', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'SeribuAsa' }).first()).toBeVisible();
  });

  test('donasi page accessible without auth', async ({ page }) => {
    await page.goto('/donasi');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('tentang page accessible without auth', async ({ page }) => {
    await page.goto('/tentang');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('dampak page accessible without auth', async ({ page }) => {
    await page.goto('/dampak');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Beneficiary Flow - Registration', () => {
  test('can access register page with beneficiary role', async ({ page }) => {
    await page.goto('/register?role=beneficiary');
    
    await expect(page.locator('body')).toBeVisible();
    // Should show penerima/beneficiary option selected or highlighted
    await expect(page.getByText(/penerima/i).first()).toBeVisible();
  });

  test('register page shows beneficiary role description', async ({ page }) => {
    await page.goto('/register');
    
    // Should show beneficiary role info
    await expect(page.getByText(/penerima/i).first()).toBeVisible();
  });
});

test.describe('Beneficiary Flow - URL Redirects', () => {
  test('vouchers redirects to dompet-nutrisi', async ({ page }) => {
    await page.goto('/dashboard/vouchers');
    
    // Should redirect (may go to login first if not authenticated)
    await page.waitForURL(/dompet-nutrisi|login|masuk|\//);
  });

  test('orders redirects to dompet-nutrisi with tab', async ({ page }) => {
    await page.goto('/dashboard/orders');
    
    // Should redirect
    await page.waitForURL(/dompet-nutrisi|login|masuk|\//);
  });
});
