/**
 * Authentication E2E Tests
 *
 * Tests for login flow and authentication.
 *
 * TASK-WUI-029: Set Up Playwright E2E Tests
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      // Should show login form elements
      await expect(page.getByRole("heading", { name: /login|sign in/i })).toBeVisible();
      await expect(page.getByPlaceholder(/api key/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /login|sign in/i })).toBeVisible();
    });

    test("should show error for invalid API key", async ({ page }) => {
      await page.goto("/login");

      // Fill invalid API key
      await page.getByPlaceholder(/api key/i).fill("invalid-key");
      await page.getByRole("button", { name: /login|sign in/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 5000 });
    });

    test("should redirect to dashboard on successful login", async ({ page }) => {
      await page.goto("/login");

      // Fill valid API key
      const apiKey = process.env.TEST_API_KEY || "test-api-key-12345";
      await page.getByPlaceholder(/api key/i).fill(apiKey);
      await page.getByRole("button", { name: /login|sign in/i }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated users to login", async ({ page }) => {
      // Try to access protected route
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect to login when accessing feedback list", async ({ page }) => {
      await page.goto("/feedback");

      await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect to login when accessing settings", async ({ page }) => {
      await page.goto("/settings");

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
