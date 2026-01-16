/**
 * Step definitions for theming feature.
 *
 * These steps implement the Gherkin scenarios in theming.feature
 *
 * The feedback widget supports light and dark themes via React props.
 * Since the example app has mode="light" hardcoded, we test visual
 * consistency and styling rather than theme switching.
 *
 * Note: "I open the feedback modal" step is defined in screen-recording.steps.ts
 */

import { expect } from '@playwright/test';
import { Then } from '../fixtures';

// ============================================================================
// Then Steps
// ============================================================================

Then('the modal should have visible text elements', async ({ page }) => {
  const modal = page.locator('[role="dialog"][aria-label="Send feedback"]');
  await expect(modal).toBeVisible();

  // Check for visible text elements in the modal
  // The modal should have a title, labels, and description areas
  const heading = modal.locator('h2, h3, [role="heading"]').first();
  const hasHeading = await heading.isVisible().catch(() => false);

  // Also check for label text
  const labels = modal.locator('label, [data-testid="feedback-type-label"]');
  const hasLabels = await labels.first().isVisible().catch(() => false);

  // At least one text element should be visible
  expect(hasHeading || hasLabels).toBe(true);
});

Then('the modal should have interactive buttons', async ({ page }) => {
  const modal = page.locator('[role="dialog"][aria-label="Send feedback"]');

  // Find interactive buttons
  const buttons = modal.getByRole('button');
  const buttonCount = await buttons.count();

  // Modal should have at least a close button and submit button
  expect(buttonCount).toBeGreaterThanOrEqual(2);

  // Check that buttons are clickable (not disabled for interaction)
  const firstButton = buttons.first();
  await expect(firstButton).toBeVisible();
});

Then('the text input fields should be visible', async ({ page }) => {
  const modal = page.locator('[role="dialog"][aria-label="Send feedback"]');

  // Look for text input areas - either textareas or input fields
  const textInputs = modal.locator('textarea, input[type="text"], [contenteditable="true"]');
  const inputCount = await textInputs.count();

  // Should have at least one text input (description field)
  expect(inputCount).toBeGreaterThanOrEqual(1);

  // The first input should be visible
  const firstInput = textInputs.first();
  await expect(firstInput).toBeVisible();
});

Then('the submit button should be styled distinctly', async ({ page }) => {
  const modal = page.locator('[role="dialog"][aria-label="Send feedback"]');

  // Find the main "Send Feedback" submit button specifically
  const submitButton = modal.getByRole('button', { name: 'Send Feedback' });
  await expect(submitButton).toBeVisible();

  // Check that it has background color (styled)
  const backgroundColor = await submitButton.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  // Submit button should have a distinct background color (not transparent)
  expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(backgroundColor).not.toBe('transparent');
});
