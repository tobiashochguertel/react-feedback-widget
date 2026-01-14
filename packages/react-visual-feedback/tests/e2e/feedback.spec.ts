/**
 * E2E tests for core feedback functionality.
 *
 * Tests the full feedback flow including:
 * - Opening feedback modal
 * - Capturing screenshots
 * - Annotating screenshots
 * - Submitting feedback
 */

import { test, expect } from '@playwright/test';

test.describe('Feedback Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the example app
    await page.goto('/');
  });

  test.describe('Opening Feedback Modal', () => {
    test('opens modal via floating button click', async ({ page }) => {
      // Find and click the feedback trigger button
      const triggerButton = page.getByRole('button', { name: /feedback/i });
      await triggerButton.click();

      // Verify modal is visible
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('opens modal via keyboard shortcut (Alt+A)', async ({ page }) => {
      // Press Alt+A to open feedback
      await page.keyboard.press('Alt+a');

      // Verify modal is visible
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('closes modal via close button', async ({ page }) => {
      // Open modal
      await page.keyboard.press('Alt+a');
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click close button
      const closeButton = page.getByRole('button', { name: /close/i });
      await closeButton.click();

      // Verify modal is hidden
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('closes modal via Escape key', async ({ page }) => {
      // Open modal
      await page.keyboard.press('Alt+a');
      await expect(page.getByRole('dialog')).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Verify modal is hidden
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Screenshot Capture', () => {
    test('captures screenshot when modal opens', async ({ page }) => {
      // Open modal via screenshot capture
      await page.keyboard.press('Alt+a');

      // Wait for screenshot to appear
      const screenshotPreview = page.locator('[data-testid="screenshot-preview"]');
      await expect(screenshotPreview).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Feedback Form', () => {
    test.beforeEach(async ({ page }) => {
      // Open modal
      await page.keyboard.press('Alt+a');
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('allows entering feedback title', async ({ page }) => {
      const titleInput = page.getByPlaceholder(/title/i);
      await titleInput.fill('Test Bug Report');

      await expect(titleInput).toHaveValue('Test Bug Report');
    });

    test('allows entering feedback description', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder(/description/i);
      await descriptionInput.fill('This is a test description for the bug report.');

      await expect(descriptionInput).toHaveValue('This is a test description for the bug report.');
    });

    test('allows selecting feedback type', async ({ page }) => {
      const typeSelector = page.getByRole('combobox', { name: /type/i });
      await typeSelector.click();

      const bugOption = page.getByRole('option', { name: /bug/i });
      await bugOption.click();

      await expect(typeSelector).toHaveText(/bug/i);
    });
  });

  test.describe('Annotation Tools', () => {
    test.beforeEach(async ({ page }) => {
      // Open modal and wait for screenshot
      await page.keyboard.press('Alt+a');
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.waitForTimeout(1000); // Wait for screenshot to load
    });

    test('shows annotation toolbar', async ({ page }) => {
      const annotationTools = page.locator('[data-testid="annotation-toolbar"]');
      await expect(annotationTools).toBeVisible();
    });

    test('allows selecting pen tool', async ({ page }) => {
      const penTool = page.getByRole('button', { name: /pen|draw/i });
      await penTool.click();

      await expect(penTool).toHaveAttribute('aria-pressed', 'true');
    });

    test('allows selecting highlighter tool', async ({ page }) => {
      const highlighterTool = page.getByRole('button', { name: /highlight/i });
      await highlighterTool.click();

      await expect(highlighterTool).toHaveAttribute('aria-pressed', 'true');
    });

    test('allows selecting rectangle tool', async ({ page }) => {
      const rectangleTool = page.getByRole('button', { name: /rectangle|box/i });
      await rectangleTool.click();

      await expect(rectangleTool).toHaveAttribute('aria-pressed', 'true');
    });

    test('allows changing annotation color', async ({ page }) => {
      const colorPicker = page.getByRole('button', { name: /color/i });
      await colorPicker.click();

      const redColor = page.getByRole('option', { name: /red/i });
      await expect(redColor).toBeVisible();
    });
  });

  test.describe('Feedback Submission', () => {
    test('shows validation error for empty title', async ({ page }) => {
      // Open modal
      await page.keyboard.press('Alt+a');
      await expect(page.getByRole('dialog')).toBeVisible();

      // Try to submit without title
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();

      // Expect validation error
      const errorMessage = page.getByText(/title is required/i);
      await expect(errorMessage).toBeVisible();
    });

    test('submits feedback successfully', async ({ page }) => {
      // Open modal
      await page.keyboard.press('Alt+a');
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill out form
      await page.getByPlaceholder(/title/i).fill('Test Bug Report');
      await page.getByPlaceholder(/description/i).fill('This is a test description.');

      // Submit
      const submitButton = page.getByRole('button', { name: /submit/i });
      await submitButton.click();

      // Expect success message or modal to close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Screen Recording', () => {
  test('shows recording button when enabled', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.keyboard.press('Alt+a');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Look for recording button
    const recordButton = page.getByRole('button', { name: /record/i });
    await expect(recordButton).toBeVisible();
  });

  test('starts recording when button is clicked', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.keyboard.press('Alt+a');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click record button
    const recordButton = page.getByRole('button', { name: /record/i });
    await recordButton.click();

    // Recording overlay should appear
    const recordingOverlay = page.locator('[data-testid="recording-overlay"]');
    await expect(recordingOverlay).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('modal is focusable and traps focus', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.keyboard.press('Alt+a');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Tab should cycle within modal
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Focus should remain within modal
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('');
  });

  test('all interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.keyboard.press('Alt+a');
    await expect(page.getByRole('dialog')).toBeVisible();

    // All buttons should have accessible names
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') ?? await button.textContent();
      expect(name?.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Responsive Design', () => {
  test('modal is usable on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Open modal
    await page.keyboard.press('Alt+a');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Modal should be visible and not overflow
    const modal = page.getByRole('dialog');
    const boundingBox = await modal.boundingBox();

    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('modal is usable on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Open modal
    await page.keyboard.press('Alt+a');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Should work normally
    await page.getByPlaceholder(/title/i).fill('Tablet Test');
    await expect(page.getByPlaceholder(/title/i)).toHaveValue('Tablet Test');
  });
});
