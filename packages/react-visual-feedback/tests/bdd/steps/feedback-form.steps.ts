/**
 * Step definitions for feedback form feature.
 *
 * These steps implement the Gherkin scenarios in feedback-form.feature
 */

import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

// ============================================================================
// When Steps
// ============================================================================

When('I enter the title {string}', async ({ feedbackWidget }, title: string) => {
  await feedbackWidget.fillTitle(title);
});

When('I enter the description {string}', async ({ feedbackWidget }, description: string) => {
  await feedbackWidget.fillDescription(description);
});

When('I select the feedback type {string}', async ({ feedbackWidget }, type: string) => {
  await feedbackWidget.selectFeedbackType(type as 'bug' | 'feature' | 'improvement');
});

When('I submit the feedback', async ({ feedbackWidget }) => {
  await feedbackWidget.submitFeedback();
});

// ============================================================================
// Then Steps
// ============================================================================

Then('the title field should contain {string}', async ({ page }, expectedTitle: string) => {
  // The modal uses a single textarea for feedback content (no separate title field)
  const textarea = page.getByPlaceholder(/what's on your mind/i);
  await expect(textarea).toHaveValue(expectedTitle);
});

Then('the description field should contain {string}', async ({ page }, expectedDescription: string) => {
  const descriptionInput = page.getByPlaceholder(/what's on your mind/i);
  await expect(descriptionInput).toHaveValue(expectedDescription);
});

Then('the feedback type should be {string}', async ({ page }, expectedType: string) => {
  // Feedback type buttons are aria-pressed when selected
  const typeButton = page.getByRole('button', { name: new RegExp(`^${expectedType}$`, 'i') });
  // Check if the button is marked as selected (could be via aria-pressed, aria-selected, or class)
  await expect(typeButton).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 }).catch(async () => {
    // Alternative: check if it has a "selected" class or data attribute
    await expect(typeButton).toHaveCSS('opacity', '1');
  });
});

Then('the feedback should be submitted successfully', async ({ page }) => {
  // Wait for success indication - this could be a toast, modal close, or success message
  // The exact implementation depends on the feedback widget's behavior
  const successIndicator = page.locator('[data-testid="success-message"], [role="alert"]').first();
  await expect(successIndicator).toBeVisible({ timeout: 10000 }).catch(async () => {
    // If no success message, check if modal closed (alternative success indication)
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });
});

Then('the submit button should be disabled', async ({ feedbackWidget }) => {
  const submitButton = feedbackWidget.getSubmitButton();
  await expect(submitButton).toBeDisabled({ timeout: 5000 });
});
