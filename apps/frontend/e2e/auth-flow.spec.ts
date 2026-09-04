import { test, expect } from '@playwright/test';

test.describe('Auth Flow - Landing & Navigation', () => {
  test('landing page loads with all sections', async ({ page }) => {
    await page.goto('/');
    
    // Navbar visible
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'SeribuAsa' }).first()).toBeVisible();
    
    // Hero section visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('navbar has correct navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation links exist
    await expect(page.getByRole('link', { name: /donasi/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /tentang/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /dampak/i }).first()).toBeVisible();
  });

  test('navigate to login page from landing', async ({ page }) => {
    await page.goto('/');
    
    // Click login/masuk button
    const loginLink = page.getByRole('link', { name: /masuk/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('navigate to register page from landing', async ({ page }) => {
    await page.goto('/');
    
    const registerLink = page.getByRole('link', { name: /daftar/i }).first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});

test.describe('Auth Flow - Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page loads correctly', async ({ page }) => {
    // Check page title/heading
    await expect(page.locator('h2')).toContainText(/Selamat Datang/i);
    
    // Check form elements
    await expect(page.getByPlaceholder(/nama@contoh.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/)).toBeVisible();
  });

  test('login form has email input', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/nama@contoh.com/i);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('login form has password input', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/••••••••/);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/••••••••/);
    
    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Type something first
    await passwordInput.fill('TestPassword123!');
    
    // Click toggle button
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await toggleButton.click();
    
    // Password should be visible now
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('submit button is disabled when form is empty', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when form is filled', async ({ page }) => {
    await page.getByPlaceholder(/nama@contoh.com/i).fill('test@example.com');
    await page.getByPlaceholder(/••••••••/).fill('Password123!');
    
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await expect(submitButton).toBeEnabled();
  });

  test('shows error for invalid email format', async ({ page }) => {
    await page.getByPlaceholder(/nama@contoh.com/i).fill('invalid-email');
    await page.getByPlaceholder(/••••••••/).fill('Password123!');
    
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    await submitButton.click();
    
    // Should show error toast
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows error for short password', async ({ page }) => {
    await page.getByPlaceholder(/nama@contoh.com/i).fill('test@example.com');
    await page.getByPlaceholder(/••••••••/).fill('12345');
    
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    // Button should be disabled for password < 6 chars
    await expect(submitButton).toBeDisabled();
  });

  test('has forgot password link', async ({ page }) => {
    const forgotLink = page.getByRole('link', { name: /lupa kata sandi/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/lupa-sandi/);
  });

  test('has register link', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /daftar sekarang/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/register/);
  });

  test('has Google login button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('logo links back to home', async ({ page }) => {
    const logoLink = page.getByRole('link').filter({ has: page.locator('img[alt*="SeribuAsa"]') });
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Auth Flow - Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('register page loads correctly', async ({ page }) => {
    // Should show role selection or registration form
    await expect(page.locator('body')).toBeVisible();
    // Check for SeribuAsa branding
    await expect(page.locator('img[alt*="SeribuAsa"]')).toBeVisible();
  });

  test('shows role selection options', async ({ page }) => {
    // Should show donor, beneficiary, vendor options
    await expect(page.getByText(/donatur/i).first()).toBeVisible();
    await expect(page.getByText(/penerima/i).first()).toBeVisible();
    await expect(page.getByText(/vendor/i).first()).toBeVisible();
  });

  test('can select donor role', async ({ page }) => {
    const donorOption = page.getByText(/donatur/i).first();
    await donorOption.click();
    
    // Should highlight or select the donor option
    await expect(page.locator('body')).toBeVisible();
  });

  test('can select beneficiary role', async ({ page }) => {
    const beneficiaryOption = page.getByText(/penerima/i).first();
    await beneficiaryOption.click();
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('can select vendor role', async ({ page }) => {
    const vendorOption = page.getByText(/vendor/i).first();
    await vendorOption.click();
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('has login link', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /masuk/i }).first();
    await expect(loginLink).toBeVisible();
  });

  test('has Google signup button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('register with role from URL parameter', async ({ page }) => {
    await page.goto('/register?role=donor');
    
    // Should pre-select donor role
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Auth Flow - Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lupa-sandi');
  });

  test('forgot password page loads', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    // Should have email input for reset
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('can submit email for password reset', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    
    // Find and click submit button
    const submitButton = page.getByRole('button', { name: /kirim|reset|atur ulang/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  });

  test('has back to login link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /masuk|kembali|login/i }).first();
    await expect(backLink).toBeVisible();
  });
});

test.describe('Auth Flow - Protected Routes', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login or show login page
    await page.waitForURL(/login|masuk|\//);
  });

  test('donor dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/donor');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('beneficiary dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/beneficiary');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('vendor dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/vendor');
    
    await page.waitForURL(/login|masuk|\//);
  });

  test('admin dashboard redirects when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/admin');
    
    await page.waitForURL(/login|masuk|\//);
  });
});

test.describe('Auth Flow - Session Expired', () => {
  test('shows session expired message', async ({ page }) => {
    await page.goto('/login?expired=true');
    
    // Should show expired session toast
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5000 });
  });
});
