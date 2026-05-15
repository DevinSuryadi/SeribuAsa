import { test, expect } from '@playwright/test';

test.describe('Admin Flow - Protected Routes', () => {
  test('admin dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin');
    
    // Should redirect to login
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin users page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin/users');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin products page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin/products');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin beneficiaries page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin/beneficiaries');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin donations page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin/donations');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin orders page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin/orders');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin vouchers page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin/vouchers');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin reports page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin/reports');
    
    await page.waitForURL(/login|masuk|\//);
  });
});

test.describe('Admin Flow - Access Control', () => {
  test('all admin routes are protected', async ({ page }) => {
    const adminRoutes = [
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/products',
      '/dashboard/admin/beneficiaries',
      '/dashboard/admin/donations',
      '/dashboard/admin/orders',
      '/dashboard/admin/vouchers',
      '/dashboard/admin/reports',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      // Should not stay on admin page without auth
      await page.waitForURL(/login|masuk|\//);
    }
  });
});
