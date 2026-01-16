/**
 * BDD Fixtures for Playwright-BDD
 *
 * Custom fixtures for BDD tests with react-visual-feedback widget.
 * Extends the base Playwright test with feedback-specific helpers.
 */

import { test as base, createBdd } from 'playwright-bdd';
import type { Page } from '@playwright/test';

/**
 * Feedback widget page object for interacting with the widget.
 */
export class FeedbackWidgetPage {
  constructor(public readonly page: Page) { }

  /**
   * Navigate to the example app homepage.
   */
  async goto() {
    await this.page.goto('/');
    // Wait for Next.js hydration to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open the feedback modal using the trigger button.
   */
  async openFeedbackModal() {
    const triggerButton = this.page.getByRole('button', { name: /feedback/i });
    await triggerButton.click();
  }

  /**
   * Open the feedback modal using keyboard shortcut.
   */
  async openFeedbackModalWithShortcut() {
    await this.page.keyboard.press('Alt+a');
  }

  /**
   * Close the feedback modal using the close button.
   */
  async closeFeedbackModal() {
    const closeButton = this.page.getByRole('button', { name: /close/i });
    await closeButton.click();
  }

  /**
   * Close the feedback modal using Escape key.
   */
  async closeFeedbackModalWithEscape() {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Check if the feedback modal is visible.
   */
  async isFeedbackModalVisible() {
    const dialog = this.page.getByRole('dialog');
    return dialog.isVisible();
  }

  /**
   * Get the feedback modal dialog locator.
   */
  getFeedbackModal() {
    return this.page.getByRole('dialog');
  }

  /**
   * Get the screenshot preview locator.
   * The modal may show a screenshot preview in different ways depending on capture state.
   */
  getScreenshotPreview() {
    // Look for common screenshot preview patterns
    return this.page.locator('[data-testid="screenshot-preview"], [data-testid="screenshot-image"], img[alt*="screenshot" i], img[alt*="preview" i], .screenshot-preview').first();
  }

  /**
   * Fill in the feedback description.
   * Note: The modal uses a single textarea for feedback content.
   */
  async fillDescription(description: string) {
    const descriptionInput = this.page.getByPlaceholder(/what's on your mind/i);
    await descriptionInput.fill(description);
  }

  /**
   * Fill in the feedback title.
   * Note: The current modal design doesn't have a separate title field.
   * Using the main textarea instead.
   */
  async fillTitle(title: string) {
    // The modal only has one textarea - use it for title/description
    const textarea = this.page.getByPlaceholder(/what's on your mind/i);
    await textarea.fill(title);
  }

  /**
   * Select feedback type.
   * Types are presented as button options (Bug, Feature, Improvement, Other).
   */
  async selectFeedbackType(type: 'bug' | 'feature' | 'improvement') {
    // Feedback types are buttons with text like "Bug", "Feature", etc.
    const typeButton = this.page.getByRole('button', { name: new RegExp(`^${type}$`, 'i') });
    await typeButton.click();
  }

  /**
   * Submit the feedback form.
   */
  async submitFeedback() {
    const submitButton = this.page.getByRole('button', { name: /send feedback/i });
    await submitButton.click();
  }

  /**
   * Get the submit button locator.
   */
  getSubmitButton() {
    return this.page.getByRole('button', { name: /send feedback/i });
  }

  /**
   * Open the dashboard.
   * The button in the example app contains "📊 Open Dashboard" text.
   */
  async openDashboard() {
    // Use text matching for the dashboard button (includes emoji)
    const dashboardButton = this.page.getByRole('button', { name: /open dashboard/i });
    await dashboardButton.click();
    // Wait for dashboard to appear after click
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if dashboard is visible.
   * The dashboard title defaults to "Feedback" (not "Feedback Dashboard").
   */
  getDashboard() {
    // Look for the dashboard header title or the close button with title="Close"
    // The dashboard panel contains a header with title "Feedback" and count badge
    return this.page.locator('[title="Close"], [title="Refresh"]').first();
  }
}

/**
 * Custom fixtures for BDD tests.
 */
type BddFixtures = {
  feedbackWidget: FeedbackWidgetPage;
};

/**
 * Extended test with custom fixtures.
 */
export const test = base.extend<BddFixtures>({
  feedbackWidget: async ({ page }, use) => {
    const feedbackWidget = new FeedbackWidgetPage(page);
    await use(feedbackWidget);
  },
});

/**
 * Create BDD step functions bound to our custom fixtures.
 */
export const { Given, When, Then, Before, After } = createBdd(test);
