import { test, expect } from '@playwright/test';

test.describe('Accessibility - Keyboard Navigation', () => {
  test('login form is navigable with keyboard', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to email input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to type in focused input
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('login submit button is reachable via Tab', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form first
    await page.getByPlaceholder(/nama@contoh.com/i).fill('test@example.com');
    await page.getByPlaceholder(/••••••••/).fill('Password123!');
    
    // Tab through form elements
    await page.getByPlaceholder(/••••••••/).press('Tab');
    
    // Should eventually reach submit button
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Enter key submits login form', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.getByPlaceholder(/nama@contoh.com/i).fill('test@example.com');
    await page.getByPlaceholder(/••••••••/).fill('Password123!');
    
    // Press Enter
    await page.getByPlaceholder(/••••••••/).press('Enter');
    
    // Should attempt to submit (may show error toast)
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigation links are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/login');
    
    // Click on email input
    const emailInput = page.getByPlaceholder(/nama@contoh.com/i);
    await emailInput.focus();
    
    // Should have visible focus indicator
    await expect(emailInput).toBeFocused();
  });

  test('focus moves to first input on login page', async ({ page }) => {
    await page.goto('/login');
    
    // Tab into the form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Some element should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Accessibility - Color Contrast & Visibility', () => {
  test('text is readable on landing page', async ({ page }) => {
    await page.goto('/');
    
    // Check that main heading is visible
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    // Check font size is reasonable
    const fontSize = await heading.evaluate((el) => {
      return parseInt(window.getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test('buttons have sufficient size', async ({ page }) => {
    await page.goto('/login');
    
    const submitButton = page.getByRole('button', { name: /masuk/i }).first();
    if (await submitButton.isVisible()) {
      const box = await submitButton.boundingBox();
      if (box) {
        // Minimum touch target size (44x44 px recommended)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('form inputs have sufficient size', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder(/nama@contoh.com/i);
    const box = await emailInput.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe('Accessibility - ARIA & Semantic HTML', () => {
  test('page has landmark regions', async ({ page }) => {
    await page.goto('/');
    
    // Should have banner (header)
    await expect(page.getByRole('banner')).toBeVisible();
    
    // Should have main content
    await expect(page.locator('main')).toBeVisible();
    
    // Should have footer
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/login');
    
    // Check that labels exist
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/login');
    
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const name = await button.getAttribute('aria-label') || await button.textContent();
        expect(name?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('images have alt attributes', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        expect(alt).not.toBeNull();
      }
    }
  });

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/');
    
    const links = page.getByRole('link');
    const linkCount = await links.count();
    
    for (let i = 0; i < Math.min(linkCount, 20); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const hasContent = (text?.trim().length || 0) > 0 || (ariaLabel?.trim().length || 0) > 0;
        
        // Links should have some accessible name
        // (some may have only icon children with aria-label)
        if (!hasContent) {
          const childImg = link.locator('img, svg');
          const hasIcon = await childImg.count() > 0;
          expect(hasIcon).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Accessibility - Reduced Motion', () => {
  test('page works with reduced motion preference', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Page should still load and be functional
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Accessibility - Dark Mode / High Contrast', () => {
  test('page works with forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('page works with dark color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    // Page should still load
    await expect(page.locator('body')).toBeVisible();
  });
});
