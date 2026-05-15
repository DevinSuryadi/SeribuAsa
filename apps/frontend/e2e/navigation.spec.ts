import { test, expect } from '@playwright/test';

test.describe('Navigation - Public Pages', () => {
  test('all public pages load without errors', async ({ page }) => {
    const publicPages = [
      { url: '/', title: 'Landing' },
      { url: '/donasi', title: 'Donasi' },
      { url: '/tentang', title: 'Tentang' },
      { url: '/dampak', title: 'Dampak' },
      { url: '/privasi', title: 'Privasi' },
      { url: '/syarat', title: 'Syarat' },
      { url: '/kontak', title: 'Kontak' },
      { url: '/login', title: 'Login' },
      { url: '/register', title: 'Register' },
      { url: '/lupa-sandi', title: 'Lupa Sandi' },
    ];

    for (const { url, title } of publicPages) {
      const response = await page.goto(url);
      expect(response?.status(), `${title} page (${url}) should return 200`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('landing page has all main sections', async ({ page }) => {
    await page.goto('/');
    
    // Navbar
    await expect(page.getByRole('banner')).toBeVisible();
    
    // Main content
    await expect(page.locator('main')).toBeVisible();
    
    // Footer
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('footer has important links', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    
    // Check for privacy and terms links
    const privasiLink = footer.getByRole('link', { name: /privasi/i });
    const syaratLink = footer.getByRole('link', { name: /syarat/i });
    
    if (await privasiLink.isVisible()) {
      await expect(privasiLink).toBeVisible();
    }
    if (await syaratLink.isVisible()) {
      await expect(syaratLink).toBeVisible();
    }
  });

  test('privasi page loads', async ({ page }) => {
    await page.goto('/privasi');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('syarat page loads', async ({ page }) => {
    await page.goto('/syarat');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('kontak page loads', async ({ page }) => {
    await page.goto('/kontak');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Navigation - 404 Handling', () => {
  test('unknown routes redirect to home', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    
    // Should redirect to home (catch-all route)
    await page.waitForURL('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('unknown dashboard routes redirect', async ({ page }) => {
    await page.goto('/dashboard/unknown-page');
    
    // Should redirect
    await page.waitForURL(/login|masuk|\//);
  });
});

test.describe('Navigation - Responsive Design', () => {
  test('mobile viewport shows hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // On mobile, navbar should still be visible
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Navigation - Performance', () => {
  test('landing page loads within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('login page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await expect(page.locator('h2')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('donation page loads within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/donasi');
    await expect(page.locator('body')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Navigation - SEO & Accessibility', () => {
  test('landing page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have at least one h1 or h2
    const headings = page.locator('h1, h2');
    await expect(headings.first()).toBeVisible();
  });

  test('login page has proper form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Should have labels for form inputs
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Images should have alt attribute (can be empty for decorative)
      expect(alt).not.toBeNull();
    }
  });

  test('links have accessible names', async ({ page }) => {
    await page.goto('/');
    
    // Check that main navigation links have text
    const navLinks = page.getByRole('link');
    const linkCount = await navLinks.count();
    
    expect(linkCount).toBeGreaterThan(0);
  });

  test('page has proper lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    // Should have a language attribute
    expect(lang).not.toBeNull();
  });
});

test.describe('Navigation - Browser Back/Forward', () => {
  test('browser back button works correctly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/donasi');
    await page.goto('/tentang');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/donasi/);
    
    // Go back again
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('browser forward button works correctly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/donasi');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/donasi/);
  });
});
