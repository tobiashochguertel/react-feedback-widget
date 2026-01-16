/**
 * Step definitions for feedback modal feature.
 *
 * These steps implement the Gherkin scenarios in feedback-modal.feature
 */

import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';

// ============================================================================
// Given Steps
// ============================================================================

Given('I am on the example app homepage', async ({ feedbackWidget }) => {
  await feedbackWidget.goto();
});

Given('the feedback modal is open', async ({ feedbackWidget }) => {
  await feedbackWidget.openFeedbackModalWithShortcut();
  await expect(feedbackWidget.getFeedbackModal()).toBeVisible({ timeout: 10000 });
});

// ============================================================================
// When Steps
// ============================================================================

When('I click the feedback trigger button', async ({ feedbackWidget }) => {
  await feedbackWidget.openFeedbackModal();
});

When('I click the select element button', async ({ page }) => {
  const selectButton = page.getByRole('button', { name: /Select Element/i });
  await selectButton.click();
});

When('I press the keyboard shortcut {string}', async ({ page }, shortcut: string) => {
  // Playwright expects modifiers to be capitalized (Alt, Shift, Control)
  // but the key to be lowercase (e.g., "Alt+a", not "Alt+A")
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1].toLowerCase();
  const modifiers = parts.slice(0, -1);
  const normalizedShortcut = [...modifiers, key].join('+');
  await page.keyboard.press(normalizedShortcut);
});

When('I click the close button', async ({ feedbackWidget }) => {
  await feedbackWidget.closeFeedbackModal();
});

When('I press the Escape key', async ({ feedbackWidget }) => {
  await feedbackWidget.closeFeedbackModalWithEscape();
});

// ============================================================================
// Then Steps
// ============================================================================

Then('the feedback modal should be visible', async ({ feedbackWidget }) => {
  await expect(feedbackWidget.getFeedbackModal()).toBeVisible({ timeout: 10000 });
});

Then('the feedback modal should not be visible', async ({ feedbackWidget }) => {
  await expect(feedbackWidget.getFeedbackModal()).not.toBeVisible({ timeout: 5000 });
});

Then('the element selection overlay should be visible', async ({ page }) => {
  // The element selection overlay uses data-testid="selection-overlay"
  const overlay = page.locator('[data-testid="selection-overlay"]');
  await expect(overlay).toBeVisible({ timeout: 10000 });
});
