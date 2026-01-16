/**
 * Step definitions for screenshot capture feature.
 *
 * These steps implement the Gherkin scenarios in screenshot-capture.feature
 */

import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

// ============================================================================
// When Steps
// ============================================================================

When('I click on a page element', async ({ page }) => {
  // First, hover over a visible element on the page to trigger hover detection
  // The element selection mode requires hovering before clicking
  const element = page.locator('h1').first();

  // Hover to trigger the hover detection which sets hoveredElement
  await element.hover();

  // Wait a bit for the hover to be registered
  await page.waitForTimeout(500);

  // Now click to trigger screenshot capture
  await element.click();
});

// ============================================================================
// Then Steps
// ============================================================================

Then('a screenshot preview should be displayed', async ({ feedbackWidget }) => {
  const screenshotPreview = feedbackWidget.getScreenshotPreview();
  await expect(screenshotPreview).toBeVisible({ timeout: 10000 });
});

Then('no screenshot preview should be displayed', async ({ feedbackWidget }) => {
  const screenshotPreview = feedbackWidget.getScreenshotPreview();
  // The screenshot preview should not be visible when modal is opened without element selection
  await expect(screenshotPreview).not.toBeVisible({ timeout: 5000 });
});
