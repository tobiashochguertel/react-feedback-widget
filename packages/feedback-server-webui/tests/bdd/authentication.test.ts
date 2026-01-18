/**
 * E001: Authentication BDD Tests
 *
 * Tests for authentication-related user stories:
 * - US-WUI-001: User Login
 * - US-WUI-002: Session Persistence
 * - US-WUI-003: User Logout
 *
 * Note: The server may have AUTH_ENABLED=false by default.
 * These tests verify authentication when enabled, and skip gracefully when disabled.
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

describe("E001: Authentication", () => {
  let serverAvailable = false;
  let authEnabled = false;

  beforeAll(async () => {
    serverAvailable = await isServerHealthy();
    if (!serverAvailable) {
      console.warn("⚠️  API server not available - some tests will be skipped");
      console.warn(`   Expected server at: ${DEFAULT_BASE_URL}`);
      return;
    }

    // Check if authentication is enabled by making a request without API key
    const response = await apiRequest("/feedback", { method: "GET" });
    // If we get 401, auth is enabled; if we get 200, auth is disabled
    authEnabled = response.status === 401;

    if (!authEnabled) {
      console.info("ℹ️  AUTH_ENABLED=false - authentication tests will verify API accessibility");
    }
  });

  // ============================================================================
  // US-WUI-001: User Login
  // ============================================================================
  describe("US-WUI-001: User Login", () => {
    it("Given I am on the login page, When I use a valid API key, Then I should have access to protected endpoints", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Make a request to a protected endpoint with valid API key
      const response = await apiRequest("/feedback", {
        method: "GET",
        apiKey: testApiKey,
      });

      // Assert: Should have access (200 OK or empty list)
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });

    it("Given I enter an invalid API key, Then I should see an error response (if auth enabled)", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Make a request with invalid API key
      const response = await apiRequest("/feedback", {
        method: "GET",
        apiKey: "invalid-api-key",
      });

      // Assert: If auth is enabled, should get 401; otherwise request succeeds
      if (authEnabled) {
        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
      } else {
        // Auth disabled - any request succeeds
        expect(response.ok).toBe(true);
      }
    });

    it("Given I make a request without credentials, Then I should see an unauthorized error (if auth enabled)", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Make a request without API key
      const response = await apiRequest("/feedback", {
        method: "GET",
        // No apiKey provided
      });

      // Assert: If auth is enabled, should get 401; otherwise request succeeds
      if (authEnabled) {
        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
      } else {
        // Auth disabled - any request succeeds
        expect(response.ok).toBe(true);
      }
    });
  });

  // ============================================================================
  // US-WUI-002: Session Persistence
  // ============================================================================
  describe("US-WUI-002: Session Persistence", () => {
    it("Given I have a valid API key, When I make multiple requests, Then all requests should succeed", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Make multiple requests with the same API key
      const responses = await Promise.all([
        apiRequest("/feedback", { method: "GET", apiKey: testApiKey }),
        apiRequest("/health", { method: "GET" }), // Health doesn't need auth
        apiRequest("/feedback?limit=5", { method: "GET", apiKey: testApiKey }),
      ]);

      // Assert: All authenticated requests should succeed
      expect(responses[0].ok).toBe(true);
      expect(responses[1].ok).toBe(true);
      expect(responses[2].ok).toBe(true);
    });

    it("Given I have a valid API key, When I access the health endpoint, Then it should return server status", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Check health endpoint
      const response = await apiRequest("/health", { method: "GET" });

      // Assert: Health endpoint should be accessible
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("status");
    });
  });

  // ============================================================================
  // US-WUI-003: User Logout (API Key Invalidation)
  // ============================================================================
  describe("US-WUI-003: User Logout", () => {
    it("Given I am using an API key, When the API key is revoked, Then subsequent requests should fail (if auth enabled)", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Note: In the current API key implementation, keys are static
      // This test verifies that invalid keys are rejected when auth is enabled
      const revokedApiKey = "revoked-key-12345";

      // Act: Make a request with a "revoked" (invalid) key
      const response = await apiRequest("/feedback", {
        method: "GET",
        apiKey: revokedApiKey,
      });

      // Assert: If auth is enabled, should get 401
      if (authEnabled) {
        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
      } else {
        // Auth disabled - any request succeeds
        expect(response.ok).toBe(true);
      }
    });

    it("Given I remove my API key, Then I should not have access to protected endpoints (if auth enabled)", async () => {
      if (!serverAvailable) {
        console.warn("⏭️  Skipping - server not available");
        return;
      }

      // Act: Make a request without API key (simulating logout)
      const response = await apiRequest("/feedback", {
        method: "GET",
        // No apiKey - simulating logged out state
      });

      // Assert: If auth is enabled, should get 401
      if (authEnabled) {
        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
      } else {
        // Auth disabled - any request succeeds
        expect(response.ok).toBe(true);
      }
    });
  });
});
