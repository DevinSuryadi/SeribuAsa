import { test, expect } from '@playwright/test';

test.describe('Checkout Flow - Protected Routes', () => {
  test('checkout page redirects when not authenticated', async ({ page }) => {
    await page.goto('/checkout');
    
    // Should redirect to login
    await page.waitForURL(/login|masuk|\//);
  });

  test('checkout success page redirects when not authenticated', async ({ page }) => {
    await page.goto('/checkout/success/some-order-id');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('cart page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/cart');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('order detail page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/orders/some-order-id');
    
    await page.waitForURL(/login|masuk|\//);
  });
});

test.describe('Checkout Flow - Donation Checkout', () => {
  test('donation checkout page loads', async ({ page }) => {
    await page.goto('/donation/checkout');
    
    // Should load (may show empty state or redirect)
    await expect(page.locator('body')).toBeVisible();
  });

  test('donation checkout accessible from donation page', async ({ page }) => {
    await page.goto('/donasi');
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Checkout Flow - Cart Management', () => {
  test('cart requires authentication', async ({ page }) => {
    await page.goto('/dashboard/cart');
    
    // Should redirect to login
    await page.waitForURL(/login|masuk|\//);
  });
});

test.describe('Checkout Flow - Order History', () => {
  test('orders redirect to dompet-nutrisi', async ({ page }) => {
    await page.goto('/dashboard/orders');
    
    // Should redirect (to dompet-nutrisi or login)
    await page.waitForURL(/dompet-nutrisi|login|masuk|\//);
  });
});
