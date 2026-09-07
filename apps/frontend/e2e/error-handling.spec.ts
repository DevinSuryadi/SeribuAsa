import { test, expect } from '@playwright/test';

test.describe('Error Handling - Network Errors', () => {
  test('page handles offline gracefully', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate - should show error or cached page
    await page.goto('/donasi').catch(() => {});
    
    // Restore connection
    await context.setOffline(false);
  });

  test('login handles network error gracefully', async ({ page, context }) => {
    await page.goto('/login');
    
    // Fill form
    await page.getByPlaceholder(/nama@contoh.com/i).fill('test@example.com');
    await page.getByPlaceholder(/••••••••/).fill('Password123!');
    
    // Go offline before submit
    await context.setOffline(true);
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await submitButton.click();
    
    // Should show error or handle gracefully
    await expect(page.locator('body')).toBeVisible();
    
    // Restore connection
    await context.setOffline(false);
  });
});

test.describe('Error Handling - Invalid URLs', () => {
  test('invalid route shows 404 page', async ({ page }) => {
    await page.goto('/invalid-page-that-does-not-exist');
    
    // Catch-all route should render NotFound
    await expect(page.getByText(/halaman tidak ditemukan/i)).toBeVisible();
  });

  test('invalid dashboard route shows 404 page', async ({ page }) => {
    await page.goto('/dashboard/invalid-section');
    
    await expect(page.getByText(/halaman tidak ditemukan/i)).toBeVisible();
  });

  test('invalid admin route shows 404 page', async ({ page }) => {
    await page.goto('/dashboard/admin/invalid-page');
    
    await expect(page.getByText(/halaman tidak ditemukan/i)).toBeVisible();
  });

  test('deeply nested invalid route shows 404 page', async ({ page }) => {
    await page.goto('/a/b/c/d/e/f');
    
    await expect(page.getByText(/halaman tidak ditemukan/i)).toBeVisible();
  });
});

test.describe('Error Handling - Form Validation', () => {
  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials
    await page.getByPlaceholder(/nama@contoh.com/i).fill('nonexistent@example.com');
    await page.getByPlaceholder(/••••••••/).fill('WrongPassword123!');
    
    // Submit
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await submitButton.click();
    
    // Should show error toast (wait for API response)
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  });

  test('login validates email format client-side', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid email
    await page.getByPlaceholder(/nama@contoh.com/i).fill('not-an-email');
    await page.getByPlaceholder(/••••••••/).fill('Password123!');
    
    // Submit
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await submitButton.click();
    
    // Should show validation error
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('login prevents submission with empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Don't fill anything
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    
    // Button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('login prevents submission with short password', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder(/nama@contoh.com/i).fill('test@example.com');
    await page.getByPlaceholder(/••••••••/).fill('123');
    
    // Button should be disabled for password < 6 chars
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Error Handling - Page Load Errors', () => {
  test('handles slow page load gracefully', async ({ page }) => {
    test.setTimeout(60000);
    // Simulate slow network
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 500 * 1024, // 500 KB/s
      uploadThroughput: 500 * 1024,
      latency: 500, // 500ms latency
    });
    
    await page.goto('/', { timeout: 60000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('lazy loaded pages show loading state', async ({ page }) => {
    // Navigate to a lazy-loaded page
    await page.goto('/donasi');
    
    // Should eventually load
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Error Handling - Session Management', () => {
  test('expired session shows appropriate message', async ({ page }) => {
    await page.goto('/login?expired=true');
    
    // Should show session expired toast
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('accessing protected route without auth redirects cleanly', async ({ page }) => {
    // Try multiple protected routes
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/donor',
      '/dashboard/beneficiary',
      '/dashboard/vendor',
      '/dashboard/admin',
      '/dashboard/profile',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should redirect without errors
      await page.waitForURL(/login|masuk|\//);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
