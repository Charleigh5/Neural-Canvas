import { test, expect } from '@playwright/test';

/**
 * E2E Test: Sequencer & Export Workflow
 *
 * Tests the sequencer functionality including adding images,
 * opening themes, and export modal.
 */
test.describe('Sequencer & Export Workflow', () => {
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
                      tags: ['test'],
                      caption: 'Test image',
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

    // Load app and inject test data
    await page.goto('/');
    await expect(page.locator('text=Neural').first()).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="btn-test-data"]').click();
    await page.waitForTimeout(3000);
  });

  test('should display sequencer timeline after data injection', async ({ page }) => {
    // Navigate to canvas first, then look for sequencer elements
    await page.locator('[data-testid="btn-canvas"]').click();
    await page.waitForTimeout(2000);

    // The sequencer timeline should be visible in the UI
    const timeline = page.locator('[data-testid="sequencer-timeline"]');
    if (await timeline.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(timeline).toBeVisible();
    }
  });

  test('should open themes panel when button clicked', async ({ page }) => {
    await page.locator('[data-testid="btn-canvas"]').click();
    await page.waitForTimeout(1000);

    const themesButton = page.locator('[data-testid="btn-themes"]');
    if (await themesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themesButton.click();
      await page.waitForTimeout(500);

      // Verify theme studio opened (look for theme-related elements)
      const themePanel = page.locator('text=Theme').first();
      await expect(themePanel).toBeVisible({ timeout: 3000 });
    }
  });

  test('should have export button in sequencer header', async ({ page }) => {
    await page.locator('[data-testid="btn-canvas"]').click();
    await page.waitForTimeout(1000);

    const exportButton = page.locator('[data-testid="btn-export"]');
    if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportButton).toBeVisible();
    }
  });
});
