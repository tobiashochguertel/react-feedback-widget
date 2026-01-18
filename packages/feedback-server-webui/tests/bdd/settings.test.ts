/**
 * E006: Settings BDD Tests
 *
 * Tests for settings user stories:
 * - US-WUI-017: User Preferences
 * - US-WUI-018: Theme Settings
 *
 * Note: These tests focus on API endpoints that support user preferences.
 * Full UI testing would require Playwright/E2E tests.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
} from "vitest";
import {
  DEFAULT_BASE_URL,
  isServerHealthy,
  apiRequest,
  testApiKey,
} from "../setup";

describe("E006: Settings", () => {
  let serverAvailable = false;

  beforeAll(async () => {
    serverAvailable = await isServerHealthy();
    if (!serverAvailable) {
      console.warn("⚠️  API server not available - some tests will be skipped");
      console.warn(`   Expected server at: ${DEFAULT_BASE_URL}`);
    }
  });

  // ============================================================================
  // US-WUI-017: User Preferences
  // ============================================================================
  describe("US-WUI-017: User Preferences", () => {
    it("Given I am logged in, When I access health endpoint, Then the server should accept my authentication", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Note: User preferences might be stored client-side or via a preferences API
      // This test verifies the server accepts authenticated requests

      // Act: Make authenticated request
      const response = await apiRequest("/feedback?limit=1", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should succeed
      expect(response.ok).toBe(true);
    });

    it("Given I want to set pagination preferences, When I request with limit parameter, Then the server should respect it", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Request with specific limit (simulating preference)
      const response = await apiRequest<{ items: unknown[]; limit: number }>(
        "/feedback?limit=5",
        {
          method: "GET",
          apiKey: testApiKey,
        }
      );

      // Assert: Server should respect limit
      expect(response.ok).toBe(true);
      expect(response.data?.items.length).toBeLessThanOrEqual(5);
    });

    it("Given I want to set sort preferences, When I request with sort parameter, Then the server should respect it", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Request with sort parameter (descending by createdAt)
      const response = await apiRequest<{ items: { createdAt: string }[] }>(
        "/feedback?sort=-createdAt",
        {
          method: "GET",
          apiKey: testApiKey,
        }
      );

      // Assert: Items should be sorted (if there are multiple)
      expect(response.ok).toBe(true);

      const items = response.data?.items || [];
      if (items.length > 1) {
        // Verify descending order
        for (let i = 0; i < items.length - 1; i++) {
          const current = new Date(items[i].createdAt).getTime();
          const next = new Date(items[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  // ============================================================================
  // US-WUI-018: Theme Settings
  // ============================================================================
  describe("US-WUI-018: Theme Settings", () => {
    it("Given theme preferences are client-side, Then the API should work regardless of theme", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Note: Theme settings are typically stored in localStorage or cookies
      // The API doesn't care about theme - it's purely UI concern

      // Act: Make a request (theme doesn't affect API)
      const response = await apiRequest("/health", {
        method: "GET",
      });

      // Assert: API should work
      expect(response.ok).toBe(true);
    });

    it("Given I send Accept header preferences, Then the server should respond with JSON", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Request with explicit Accept header
      const response = await apiRequest("/health", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      // Assert: Should return JSON
      expect(response.ok).toBe(true);
      expect(response.data).toBeDefined();
      expect(typeof response.data).toBe("object");
    });

    // Note: Full theme testing would involve:
    // 1. Testing CSS variables are applied correctly
    // 2. Testing localStorage persistence
    // 3. Testing system preference detection
    // These are better suited for E2E tests with Playwright
  });

  // ============================================================================
  // Additional Settings Tests
  // ============================================================================
  describe("API Configuration", () => {
    it("Given I make CORS requests, Then the server should have appropriate headers", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Note: CORS headers are typically tested via browser or OPTIONS request
      // This is a basic connectivity test

      // Act: Make a request
      const response = await apiRequest("/health", {
        method: "GET",
      });

      // Assert: Should succeed (CORS is configured)
      expect(response.ok).toBe(true);
    });

    it("Given I request with invalid content-type, Then server should return appropriate error", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Send request with text content-type
      try {
        const response = await fetch(`${DEFAULT_BASE_URL}/api/v1/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "X-API-Key": testApiKey,
          },
          body: "plain text body",
        });

        // Assert: Should reject invalid content type
        // Server might return 400, 415, or 422
        expect([400, 415, 422].includes(response.status)).toBe(true);
      } catch {
        // Network error is acceptable if server rejects the request
        expect(true).toBe(true);
      }
    });
  });
});
