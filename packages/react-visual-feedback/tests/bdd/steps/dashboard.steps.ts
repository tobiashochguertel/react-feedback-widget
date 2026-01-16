/**
 * Step definitions for feedback dashboard feature.
 *
 * These steps implement the Gherkin scenarios in dashboard.feature.
 */

import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';

// ============================================================================
// Given Steps
// ============================================================================

Given('the feedback dashboard is open', async ({ feedbackWidget }) => {
  await feedbackWidget.openDashboard();
  await expect(feedbackWidget.getDashboard()).toBeVisible({ timeout: 10000 });
});

// ============================================================================
// When Steps
// ============================================================================

When('I click the dashboard button', async ({ feedbackWidget }) => {
  await feedbackWidget.openDashboard();
});

When('I close the dashboard', async ({ page }) => {
  // The dashboard has a close button with X icon and title="Close"
  // Also can click the backdrop to close
  const closeButton = page.locator('button[title="Close"]').first();
  await closeButton.click();
});

When('I click the status filter dropdown', async ({ page }) => {
  // The filter dropdown is a select element in the dashboard
  const filterDropdown = page.locator('select').first();
  await expect(filterDropdown).toBeVisible({ timeout: 5000 });
  // Use force: true to bypass overlay interception on mobile
  await filterDropdown.click({ force: true });
});

// ============================================================================
// Then Steps
// ============================================================================

Then('the feedback dashboard should be visible', async ({ feedbackWidget }) => {
  await expect(feedbackWidget.getDashboard()).toBeVisible({ timeout: 10000 });
});

Then('the feedback dashboard should not be visible', async ({ feedbackWidget }) => {
  await expect(feedbackWidget.getDashboard()).not.toBeVisible({ timeout: 5000 });
});

Then('an empty state message should be displayed', async ({ page }) => {
  // The dashboard shows "No feedback found" when empty
  const emptyState = page.locator('text="No feedback found"');
  await expect(emptyState).toBeVisible({ timeout: 10000 });
});

Then('the search input should be visible', async ({ page }) => {
  // Search input has placeholder "Search feedback..."
  const searchInput = page.locator('input[placeholder*="Search"]');
  await expect(searchInput).toBeVisible({ timeout: 5000 });
});

Then('the status filter dropdown should be visible', async ({ page }) => {
  // Filter dropdown is a select element in the dashboard
  const filterDropdown = page.locator('select').first();
  await expect(filterDropdown).toBeVisible({ timeout: 5000 });
});

Then('filter options should be available', async ({ page }) => {
  // Check that the filter dropdown has options
  const filterDropdown = page.locator('select').first();
  const options = filterDropdown.locator('option');
  const count = await options.count();

  // Should have at least "All" and some status options
  expect(count).toBeGreaterThanOrEqual(2);
});
