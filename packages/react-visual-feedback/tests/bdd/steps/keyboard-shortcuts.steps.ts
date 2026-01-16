/**
 * Step definitions for keyboard shortcuts feature.
 *
 * These steps implement the Gherkin scenarios in keyboard-shortcuts.feature.
 * Many steps are reused from feedback-modal.steps.ts.
 */

import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

// ============================================================================
// When Steps
// ============================================================================

When('I press the Tab key', async ({ page }) => {
  await page.keyboard.press('Tab');
});

// ============================================================================
// Then Steps
// ============================================================================

Then('focus should move to the next interactive element', async ({ page }) => {
  // Verify that some element now has focus (not the body)
  const focusedElement = page.locator(':focus');
  await expect(focusedElement).toBeVisible({ timeout: 5000 });

  // Verify the focused element is an interactive element
  const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());
  const interactiveElements = ['button', 'input', 'textarea', 'select', 'a'];
  const isInteractive = interactiveElements.includes(tagName) ||
    await focusedElement.getAttribute('tabindex') !== null;

  expect(isInteractive).toBeTruthy();
});
