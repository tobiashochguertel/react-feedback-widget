/**
 * E002: Dashboard BDD Tests
 *
 * Tests for dashboard-related user stories:
 * - US-WUI-004: View Dashboard Overview
 * - US-WUI-005: Dashboard Statistics
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

describe("E002: Dashboard", () => {
  let serverAvailable = false;

  beforeAll(async () => {
    serverAvailable = await isServerHealthy();
    if (!serverAvailable) {
      console.warn("⚠️  API server not available - some tests will be skipped");
      console.warn(`   Expected server at: ${DEFAULT_BASE_URL}`);
    }
  });

  // ============================================================================
  // US-WUI-004: View Dashboard Overview
  // ============================================================================
  describe("US-WUI-004: View Dashboard Overview", () => {
    it("Given I am logged in, When I view the dashboard, Then I should see feedback statistics", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Fetch feedback stats
      const response = await apiRequest<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
      }>("/feedback/stats", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should get stats response
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data).toHaveProperty("total");
    });

    it("Given I am logged in, When I view the dashboard, Then I should see recent feedback items", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Fetch recent feedback with limit
      const response = await apiRequest<{
        items: unknown[];
        total: number;
      }>("/feedback?limit=5&sort=-createdAt", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should get feedback list
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("items");
      expect(Array.isArray(response.data?.items)).toBe(true);
    });
  });

  // ============================================================================
  // US-WUI-005: Dashboard Statistics
  // ============================================================================
  describe("US-WUI-005: Dashboard Statistics", () => {
    it("Given I am on the dashboard, When the page loads, Then I should see total feedback count", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Fetch stats
      const response = await apiRequest<{
        total: number;
      }>("/feedback/stats", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Total should be a number
      expect(response.ok).toBe(true);
      expect(typeof response.data?.total).toBe("number");
      expect(response.data?.total).toBeGreaterThanOrEqual(0);
    });

    it("Given I am on the dashboard, When the page loads, Then I should see feedback breakdown by status", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Fetch stats
      const response = await apiRequest<{
        byStatus: Record<string, number>;
      }>("/feedback/stats", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: byStatus should be an object
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty("byStatus");
      expect(typeof response.data?.byStatus).toBe("object");
    });

    it("Given I am on the dashboard, When the page loads, Then I should see feedback breakdown by type", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Fetch stats
      const response = await apiRequest<{
        byType: Record<string, number>;
      }>("/feedback/stats", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: byType should be an object
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty("byType");
      expect(typeof response.data?.byType).toBe("object");
    });
  });
});
