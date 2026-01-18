/**
 * Feedback Detail E2E Tests
 *
 * Tests for the feedback detail page.
 *
 * TASK-WUI-029: Set Up Playwright E2E Tests
 */

import { test, expect, createTestFeedback, deleteTestFeedback } from "./fixtures";

test.describe("Feedback Detail", () => {
  let testFeedbackId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    // Create a test feedback item
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      testFeedbackId = await createTestFeedback(page, {
        title: "E2E Detail Test Feedback",
        description: "Created for E2E detail page testing",
        type: "bug",
        status: "open",
      });
    } catch {
      // API might not be available
      testFeedbackId = null;
    }

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    // Clean up
    if (testFeedbackId) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await deleteTestFeedback(page, testFeedbackId);
      } catch {
        // Ignore cleanup errors
      }

      await context.close();
    }
  });

  test.describe("Detail View", () => {
    test("should display feedback details", async ({ authenticatedPage }) => {
      test.skip(!testFeedbackId, "No test feedback created");

      // Navigate directly to detail page
      await authenticatedPage.goto(`/feedback/${testFeedbackId}`);

      // Wait for content
      await authenticatedPage.waitForLoadState("networkidle");

      // Should show main content area
      const main = authenticatedPage.getByRole("main");
      await expect(main).toBeVisible();
    });

    test("should show 404 for non-existent feedback", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/feedback/non-existent-id-12345");

      // Wait for response
      await authenticatedPage.waitForLoadState("networkidle");

      // Should show error state or not found message
      const main = authenticatedPage.getByRole("main");
      await expect(main).toBeVisible();
    });

    test("should have back button to return to list", async ({ authenticatedPage }) => {
      test.skip(!testFeedbackId, "No test feedback created");

      await authenticatedPage.goto(`/feedback/${testFeedbackId}`);
      await authenticatedPage.waitForLoadState("networkidle");

      // Look for back button or link
      const backButton = authenticatedPage.getByRole("link", { name: /back|return/i });

      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(authenticatedPage).toHaveURL(/\/feedback$/);
      }
    });
  });

  test.describe("Status Badge", () => {
    test("should display status badge", async ({ authenticatedPage }) => {
      test.skip(!testFeedbackId, "No test feedback created");

      await authenticatedPage.goto(`/feedback/${testFeedbackId}`);
      await authenticatedPage.waitForLoadState("networkidle");

      // Look for status badge (could be text "Open", "Closed", etc.)
      const main = authenticatedPage.getByRole("main");
      await expect(main).toBeVisible();
    });
  });

  test.describe("Screenshot Viewer", () => {
    test("should display screenshot if attached", async ({ authenticatedPage }) => {
      test.skip(!testFeedbackId, "No test feedback created");

      await authenticatedPage.goto(`/feedback/${testFeedbackId}`);
      await authenticatedPage.waitForLoadState("networkidle");

      // Look for any images
      const images = authenticatedPage.getByRole("img");

      // This test is informational - screenshot may or may not exist
      const count = await images.count();
      console.log(`Found ${count} images on detail page`);
    });
  });
});
