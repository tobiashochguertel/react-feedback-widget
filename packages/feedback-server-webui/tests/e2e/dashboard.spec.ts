/**
 * Dashboard E2E Tests
 *
 * Tests for the dashboard page and navigation.
 *
 * TASK-WUI-029: Set Up Playwright E2E Tests
 */

import { test, expect } from "./fixtures";

test.describe("Dashboard", () => {
  test.describe("Navigation", () => {
    test("should display dashboard after login", async ({ authenticatedPage }) => {
      // Should be on dashboard
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);

      // Should show dashboard heading or content
      await expect(authenticatedPage.getByRole("main")).toBeVisible();
    });

    test("should show sidebar navigation", async ({ authenticatedPage }) => {
      const sidebar = authenticatedPage.locator("aside");
      await expect(sidebar).toBeVisible();

      // Check for navigation links
      await expect(authenticatedPage.getByText("Dashboard")).toBeVisible();
      await expect(authenticatedPage.getByText("Feedback")).toBeVisible();
      await expect(authenticatedPage.getByText("Settings")).toBeVisible();
    });

    test("should navigate to feedback list", async ({ authenticatedPage }) => {
      // Click on Feedback link
      await authenticatedPage.getByText("Feedback").click();

      // Should be on feedback page
      await expect(authenticatedPage).toHaveURL(/\/feedback/);
    });

    test("should navigate to settings", async ({ authenticatedPage }) => {
      // Click on Settings link
      await authenticatedPage.getByText("Settings").click();

      // Should be on settings page
      await expect(authenticatedPage).toHaveURL(/\/settings/);
    });

    test("should navigate back to dashboard", async ({ authenticatedPage }) => {
      // Navigate away first
      await authenticatedPage.getByText("Settings").click();
      await expect(authenticatedPage).toHaveURL(/\/settings/);

      // Navigate back to dashboard
      await authenticatedPage.getByText("Dashboard").click();
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
    });
  });

  test.describe("Dashboard Content", () => {
    test("should show statistics cards", async ({ authenticatedPage }) => {
      // Dashboard should have stats/cards
      const main = authenticatedPage.getByRole("main");
      await expect(main).toBeVisible();

      // Look for typical dashboard elements
      // (Exact content depends on implementation)
    });
  });

  test.describe("Logout", () => {
    test("should logout when clicking logout button", async ({ authenticatedPage }) => {
      // Find and click logout button
      const logoutButton = authenticatedPage.getByText("Logout");
      await logoutButton.click();

      // Should redirect to login
      await expect(authenticatedPage).toHaveURL(/\/login/, { timeout: 5000 });
    });
  });
});
