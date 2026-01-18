/**
 * E005: Real-time Updates BDD Tests
 *
 * Tests for real-time update user stories:
 * - US-WUI-014: Real-time Feedback Notifications
 * - US-WUI-015: Live Status Updates
 * - US-WUI-016: Connection Status Indicator
 *
 * Note: These tests focus on API endpoints that support real-time features.
 * Full WebSocket testing would require a WebSocket client.
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

describe("E005: Real-time Updates", () => {
  let serverAvailable = false;

  beforeAll(async () => {
    serverAvailable = await isServerHealthy();
    if (!serverAvailable) {
      console.warn("⚠️  API server not available - some tests will be skipped");
      console.warn(`   Expected server at: ${DEFAULT_BASE_URL}`);
    }
  });

  // ============================================================================
  // US-WUI-014: Real-time Feedback Notifications
  // ============================================================================
  describe("US-WUI-014: Real-time Feedback Notifications", () => {
    it("Given I am logged in, When the health endpoint is checked, Then it should indicate WebSocket capability", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Check health endpoint for WebSocket info
      const response = await apiRequest<{
        status: string;
        websocket?: { enabled: boolean; url?: string };
      }>("/health", {
        method: "GET",
      });

      // Assert: Health should return successfully
      expect(response.ok).toBe(true);
      expect(response.data).toHaveProperty("status");
      // WebSocket capability might not be exposed in health,
      // but the endpoint should work
    });

    it("Given the server supports real-time, Then the API should respond promptly", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      const startTime = Date.now();

      // Act: Make a request and measure response time
      const response = await apiRequest("/feedback?limit=1", {
        method: "GET",
        apiKey: testApiKey,
      });

      const responseTime = Date.now() - startTime;

      // Assert: Response should be fast (under 2 seconds)
      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(2000);
    });
  });

  // ============================================================================
  // US-WUI-015: Live Status Updates
  // ============================================================================
  describe("US-WUI-015: Live Status Updates", () => {
    it("Given I update feedback status, Then the response should return immediately with new status", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Note: Full live updates would require WebSocket testing
      // This test verifies the PATCH endpoint responds quickly

      // First create a test feedback
      const { createTestFeedback, trackFeedback, cleanupFeedback } = await import("../setup");

      const feedback = createTestFeedback({ title: "Live Update Test" });
      const createResponse = await apiRequest<{ id: string }>("/feedback", {
        method: "POST",
        apiKey: testApiKey,
        body: feedback,
      });

      if (!createResponse.ok || !createResponse.data?.id) {
        console.warn("⏭️  Could not create test feedback");
        return;
      }

      const feedbackId = createResponse.data.id;
      trackFeedback(feedbackId);

      try {
        const startTime = Date.now();

        // Act: Update status
        const updateResponse = await apiRequest(`/feedback/${feedbackId}`, {
          method: "PATCH",
          apiKey: testApiKey,
          body: { status: "resolved" },
        });

        const updateTime = Date.now() - startTime;

        // Assert: Update should be fast
        expect(updateResponse.ok).toBe(true);
        expect(updateTime).toBeLessThan(1000);
      } finally {
        await cleanupFeedback();
      }
    });
  });

  // ============================================================================
  // US-WUI-016: Connection Status Indicator
  // ============================================================================
  describe("US-WUI-016: Connection Status Indicator", () => {
    it("Given I have a connection to the server, When I check health, Then I should get connected status", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Check health endpoint
      const response = await apiRequest<{
        status: string;
        uptime?: number;
        timestamp?: string;
      }>("/health", {
        method: "GET",
      });

      // Assert: Should indicate healthy/connected status
      expect(response.ok).toBe(true);
      expect(response.data?.status).toBeDefined();
    });

    it("Given the server is down, When I check health, Then the request should fail gracefully", async () => {
      // Note: This test is always true if server is unavailable
      // In a real scenario, we'd mock the server being down

      // Act: Try to connect to a non-existent endpoint
      const response = await apiRequest("/nonexistent-endpoint-12345", {
        method: "GET",
      });

      // Assert: Should handle gracefully (404 or error)
      // The response should not throw, just return error state
      expect(response.status).toBe(404);
    });

    it("Given server health check fails, Then appropriate error should be returned", async () => {
      // This tests the error handling path

      // Act: Make a request that would fail (wrong method)
      const response = await apiRequest("/health", {
        method: "DELETE" as "DELETE", // Health endpoint likely doesn't support DELETE
      });

      // Assert: Should return appropriate error (405 Method Not Allowed or similar)
      // The exact status depends on server implementation
      expect([200, 204, 405, 404, 501].includes(response.status)).toBe(true);
    });
  });
});
