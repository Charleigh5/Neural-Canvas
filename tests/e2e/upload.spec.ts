import { test, expect } from '@playwright/test';

/**
 * E2E Test: Image Upload Workflow
 *
 * Tests the file upload functionality via the Iris Core button.
 */
test.describe('Image Upload Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Gemini API
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
                      tags: ['nature', 'landscape'],
                      caption: 'A beautiful scene',
                      mood: 'calm',
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

  test('should navigate to home and display upload button', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('text=Neural').first()).toBeVisible({ timeout: 10000 });

    // Verify upload button is visible
    const uploadButton = page.locator('[data-testid="btn-upload"]');
    await expect(uploadButton).toBeVisible();
  });

  test('should show satellite buttons on home screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Neural').first()).toBeVisible({ timeout: 10000 });

    // Verify all satellite buttons are visible
    await expect(page.locator('[data-testid="btn-cloud-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-camera"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-vault"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-test-data"]')).toBeVisible();
  });

  test('should navigate to canvas when Constellation clicked', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Neural').first()).toBeVisible({ timeout: 10000 });

    // Click canvas button
    await page.locator('[data-testid="btn-canvas"]').click();

    // Wait for canvas to appear
    await page.waitForTimeout(1000);

    // Verify we're on canvas (Konva canvas should be visible)
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 5000 });
  });
});
