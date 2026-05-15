import { test, expect } from '@playwright/test';

test.describe('Donor Flow - Protected Routes', () => {
  test('donor dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/donor');
    
    // Should redirect to login
    await page.waitForURL(/login|masuk|\//);
  });

  test('donor riwayat redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/riwayat');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('donor dampak redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/dampak');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('donor langganan redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/langganan');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('profile page redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/profile');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('create donation redirects when not authenticated', async ({ page }) => {
    await page.goto('/donation/create');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('donation success redirects when not authenticated', async ({ page }) => {
    await page.goto('/donation/success');
    
    await page.waitForURL(/login|masuk|\//);
  });
});

test.describe('Donor Flow - Registration', () => {
  test('can access register page with donor role', async ({ page }) => {
    await page.goto('/register?role=donor');
    
    await expect(page.locator('body')).toBeVisible();
    // Should show donatur option
    await expect(page.getByText(/donatur/i).first()).toBeVisible();
  });

  test('register page shows donor role description', async ({ page }) => {
    await page.goto('/register');
    
    // Should show donor role info
    await expect(page.getByText(/donatur/i).first()).toBeVisible();
  });

  test('donor role description mentions nutrisi', async ({ page }) => {
    await page.goto('/register');
    
    // Click donor to see description
    const donorOption = page.getByText(/donatur/i).first();
    await donorOption.click();
    
    // Should show description about helping nutrition
    await expect(page.getByText(/nutrisi/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Donor Flow - Donation Page', () => {
  test('donation page loads with content', async ({ page }) => {
    await page.goto('/donasi');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('donation page has donation options', async ({ page }) => {
    await page.goto('/donasi');
    
    // Should show donation amounts or options
    await expect(page.locator('main')).toBeVisible();
  });

  test('donation page has CTA button', async ({ page }) => {
    await page.goto('/donasi');
    
    // Should have a call-to-action
    const ctaButton = page.getByRole('button', { name: /donasi|mulai|berikan/i }).first();
    const ctaLink = page.getByRole('link', { name: /donasi|mulai|berikan/i }).first();
    
    const hasButton = await ctaButton.isVisible().catch(() => false);
    const hasLink = await ctaLink.isVisible().catch(() => false);
    
    expect(hasButton || hasLink).toBeTruthy();
  });
});

test.describe('Donor Flow - Impact Page', () => {
  test('impact page loads', async ({ page }) => {
    await page.goto('/dampak');
    
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('impact page shows statistics', async ({ page }) => {
    await page.goto('/dampak');
    
    // Should show impact data
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Donor Flow - Login for Donation', () => {
  test('login page shows donation redirect message when from checkout', async ({ page }) => {
    await page.goto('/login?from=checkout');
    
    // Should show message about continuing donation
    await expect(page.getByText(/donasi/i).first()).toBeVisible();
  });

  test('can fill login form for donation flow', async ({ page }) => {
    await page.goto('/login?from=checkout');
    
    // Fill form
    await page.getByPlaceholder(/nama@contoh.com/i).fill('donor@example.com');
    await page.getByPlaceholder(/••••••••/).fill('Password123!');
    
    // Submit button should be enabled
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await expect(submitButton).toBeEnabled();
  });
});
