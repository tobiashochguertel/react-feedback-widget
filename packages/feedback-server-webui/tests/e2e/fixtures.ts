/**
 * E2E Test Fixtures
 *
 * Provides common test fixtures for Playwright E2E tests.
 *
 * TASK-WUI-029: Set Up Playwright E2E Tests
 */

import { test as base, expect, type Page } from "@playwright/test";

// ============================================================================
// Types
// ============================================================================

interface TestFixtures {
  /** Login and navigate to dashboard */
  authenticatedPage: Page;
}

// ============================================================================
// Configuration
// ============================================================================

const TEST_API_KEY = process.env.TEST_API_KEY || "test-api-key-12345";

// ============================================================================
// Custom Test with Fixtures
// ============================================================================

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto("/login");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if already authenticated (redirected to dashboard)
    if (page.url().includes("/dashboard")) {
      await use(page);
      return;
    }

    // Fill in API key
    const apiKeyInput = page.getByPlaceholder(/api key/i);
    await apiKeyInput.fill(TEST_API_KEY);

    // Click login button
    const loginButton = page.getByRole("button", { name: /login|sign in/i });
    await loginButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    await use(page);
  },
});

export { expect };

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for API to be healthy
 */
export async function waitForApi(page: Page, timeout = 30000): Promise<void> {
  const apiUrl =
    process.env.VITE_API_URL || "http://localhost:3001/api/v1/health";

  await page.waitForFunction(
    async (url) => {
      try {
        const response = await fetch(url);
        return response.ok;
      } catch {
        return false;
      }
    },
    apiUrl,
    { timeout }
  );
}

/**
 * Create a test feedback item via API
 */
export async function createTestFeedback(
  page: Page,
  data: {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
  } = {}
): Promise<string> {
  const apiUrl = process.env.VITE_API_URL || "http://localhost:3001";

  const response = await page.request.post(`${apiUrl}/api/v1/feedback`, {
    data: {
      title: data.title || `Test Feedback ${Date.now()}`,
      description: data.description || "Test description",
      type: data.type || "bug",
      status: data.status || "open",
      metadata: {},
    },
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": TEST_API_KEY,
    },
  });

  const feedback = await response.json();
  return feedback.id;
}

/**
 * Delete a test feedback item via API
 */
export async function deleteTestFeedback(
  page: Page,
  id: string
): Promise<void> {
  const apiUrl = process.env.VITE_API_URL || "http://localhost:3001";

  await page.request.delete(`${apiUrl}/api/v1/feedback/${id}`, {
    headers: {
      "X-API-Key": TEST_API_KEY,
    },
  });
}
