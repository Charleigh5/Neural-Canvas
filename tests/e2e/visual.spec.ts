import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots and compare them against baselines
 * to detect unintended UI changes.
 *
 * Run with: npx playwright test visual.spec.ts --update-snapshots
 * to update baselines.
 */
test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Gemini API to ensure consistent responses
    await page.route('**/v1beta/models/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      tags: ['test'],
                      caption: 'Test',
                      mood: 'neutral',
                      quality: 0.9,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });
    });
  });

  test('home screen matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Neural').first()).toBeVisible({ timeout: 10000 });

    // Wait for animations to settle
    await page.waitForTimeout(2000);

    // Take screenshot and compare
    await expect(page).toHaveScreenshot('home-screen.png', {
      maxDiffPixelRatio: 0.05, // Allow 5% difference for anti-aliasing
      animations: 'disabled',
    });
  });

  test('canvas view matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Neural').first()).toBeVisible({ timeout: 10000 });

    // Navigate to canvas
    await page.locator('[data-testid="btn-canvas"]').click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('canvas-view.png', {
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    });
  });

  test('sequencer with data matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Neural').first()).toBeVisible({ timeout: 10000 });

    // Inject test data
    await page.locator('[data-testid="btn-test-data"]').click();
    await page.waitForTimeout(3000);

    // Navigate to canvas
    await page.locator('[data-testid="btn-canvas"]').click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('sequencer-with-data.png', {
      maxDiffPixelRatio: 0.1, // Higher tolerance for dynamic content
      animations: 'disabled',
    });
  });
});
