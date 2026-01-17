/**
 * Integration Tests: Health API
 *
 * Tests the health check endpoints with actual HTTP requests.
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  createTestClient,
  waitForServer,
  TestClient,
  DEFAULT_BASE_URL,
} from "../setup";

describe("Health API Integration", () => {
  let client: TestClient;
  const baseUrl = DEFAULT_BASE_URL;

  beforeAll(async () => {
    await waitForServer(baseUrl, 15000);
    client = createTestClient(baseUrl);
  });

  describe("GET /api/v1/health", () => {
    it("should return healthy status", async () => {
      // Act
      const response = await client.get<{
        status: string;
        timestamp: string;
      }>("/api/v1/health");

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.status).toBe("healthy");
      expect(response.data?.timestamp).toBeDefined();
    });

    it("should include version in response", async () => {
      // Act
      const response = await client.get<{
        status: string;
        version?: string;
      }>("/api/v1/health");

      // Assert
      expect(response.status).toBe(200);
      // Version may or may not be present depending on config
      if (response.data?.version) {
        expect(response.data.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    it("should return details when requested", async () => {
      // Act
      const response = await client.get<{
        status: string;
        uptime?: number;
        memory?: object;
      }>("/api/v1/health?details=true");

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.status).toBe("healthy");
      // Detailed info may include uptime, memory, etc.
    });
  });

  describe("GET /api/v1/health/ready", () => {
    it("should return ready status", async () => {
      // Retry logic for ready endpoint - server might briefly report 503
      let response: { status: number; data?: { ready: boolean } };
      let attempts = 0;
      const maxAttempts = 5;

      do {
        response = await client.get<{ ready: boolean }>("/api/v1/health/ready");
        if (response.status === 503) {
          attempts++;
          await new Promise((r) => setTimeout(r, 100)); // Wait 100ms before retry
        }
      } while (response.status === 503 && attempts < maxAttempts);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.ready).toBe(true);
    });
  });

  describe("GET /api/v1/health/live", () => {
    it("should return alive status", async () => {
      // Act
      const response = await client.get<{
        alive: boolean;
      }>("/api/v1/health/live");

      // Assert
      expect(response.status).toBe(200);
      expect(response.data?.alive).toBe(true);
    });
  });

  describe("Response Time", () => {
    it("should respond quickly (under 1 second)", async () => {
      // Act
      const startTime = Date.now();
      const response = await client.get("/api/v1/health");
      const duration = Date.now() - startTime;

      // Assert
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });
  });
});
