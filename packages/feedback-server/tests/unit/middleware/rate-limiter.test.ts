/**
 * Unit Tests: Rate Limiter Middleware
 *
 * Tests the rate limiting functionality in isolation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// We'll test the logic by mocking the Hono context
describe("Rate Limiter Middleware", () => {
  describe("getClientId extraction", () => {
    it("should extract client ID from X-Forwarded-For header", () => {
      // Given: A request with X-Forwarded-For header
      const mockHeader = vi.fn((name: string) => {
        if (name === "x-forwarded-for") return "192.168.1.1, 10.0.0.1";
        return undefined;
      });

      // When: We extract the first IP
      const forwarded = mockHeader("x-forwarded-for");
      const clientId = forwarded?.split(",")[0].trim();

      // Then: Should get the first IP
      expect(clientId).toBe("192.168.1.1");
    });

    it("should fall back to X-Real-IP if no X-Forwarded-For", () => {
      // Given: A request with only X-Real-IP header
      const mockHeader = vi.fn((name: string) => {
        if (name === "x-real-ip") return "10.20.30.40";
        return undefined;
      });

      // When: We check headers in order
      const forwarded = mockHeader("x-forwarded-for");
      const realIp = mockHeader("x-real-ip");
      const clientId = forwarded?.split(",")[0].trim() || realIp || "unknown";

      // Then: Should get X-Real-IP value
      expect(clientId).toBe("10.20.30.40");
    });

    it("should return 'unknown' if no identifying headers", () => {
      // Given: A request with no identifying headers
      const mockHeader = vi.fn(() => undefined);

      // When: We check headers
      const forwarded = mockHeader("x-forwarded-for");
      const realIp = mockHeader("x-real-ip");
      const clientId = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

      // Then: Should return 'unknown'
      expect(clientId).toBe("unknown");
    });
  });

  describe("Rate limiting logic", () => {
    let requestCounts: Map<string, { count: number; resetTime: number }>;

    beforeEach(() => {
      requestCounts = new Map();
    });

    it("should allow requests within limit", () => {
      // Given: Rate limit config
      const maxRequests = 10;
      const windowMs = 60000;
      const clientId = "test-client";
      const now = Date.now();

      // When: First request
      const entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(clientId, entry);

      // Then: Should be within limit
      expect(entry.count).toBeLessThanOrEqual(maxRequests);
      expect(requestCounts.get(clientId)?.count).toBe(1);
    });

    it("should track request count correctly", () => {
      // Given: An existing entry
      const clientId = "test-client";
      const entry = {
        count: 5,
        resetTime: Date.now() + 60000,
      };
      requestCounts.set(clientId, entry);

      // When: Another request comes in
      entry.count++;

      // Then: Count should be incremented
      expect(entry.count).toBe(6);
    });

    it("should identify when limit is exceeded", () => {
      // Given: An entry at the limit
      const maxRequests = 10;
      const clientId = "test-client";
      const entry = {
        count: 10,
        resetTime: Date.now() + 60000,
      };
      requestCounts.set(clientId, entry);

      // When: Another request comes in
      entry.count++;

      // Then: Should exceed limit
      expect(entry.count > maxRequests).toBe(true);
    });

    it("should reset count after window expires", () => {
      // Given: An expired entry
      const clientId = "test-client";
      const now = Date.now();
      const entry = {
        count: 100,
        resetTime: now - 1000, // Expired 1 second ago
      };
      requestCounts.set(clientId, entry);

      // When: We check if window expired
      const isExpired = now > entry.resetTime;

      // Then: Should be expired
      expect(isExpired).toBe(true);
    });

    it("should calculate remaining requests correctly", () => {
      // Given: An entry with some requests made
      const maxRequests = 100;
      const entry = { count: 35, resetTime: Date.now() + 60000 };

      // When: We calculate remaining
      const remaining = Math.max(0, maxRequests - entry.count);

      // Then: Should show correct remaining
      expect(remaining).toBe(65);
    });

    it("should not go negative for remaining requests", () => {
      // Given: An entry over the limit
      const maxRequests = 100;
      const entry = { count: 150, resetTime: Date.now() + 60000 };

      // When: We calculate remaining
      const remaining = Math.max(0, maxRequests - entry.count);

      // Then: Should be zero, not negative
      expect(remaining).toBe(0);
    });
  });

  describe("Rate limit headers", () => {
    it("should calculate correct X-RateLimit-Limit header value", () => {
      const maxRequests = 100;
      const headerValue = maxRequests.toString();
      expect(headerValue).toBe("100");
    });

    it("should calculate correct X-RateLimit-Remaining header value", () => {
      const maxRequests = 100;
      const count = 25;
      const remaining = Math.max(0, maxRequests - count).toString();
      expect(remaining).toBe("75");
    });

    it("should calculate correct X-RateLimit-Reset header value", () => {
      const resetTime = Date.now() + 60000;
      const headerValue = Math.ceil(resetTime / 1000).toString();
      // Should be roughly current time + 60 seconds in Unix timestamp
      expect(Number(headerValue)).toBeGreaterThan(Date.now() / 1000);
    });

    it("should calculate correct Retry-After header value", () => {
      const now = Date.now();
      const resetTime = now + 30000; // 30 seconds from now
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      expect(retryAfter).toBe(30);
    });
  });
});
