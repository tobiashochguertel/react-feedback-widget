/**
 * Rate limiter middleware
 */

import type { MiddlewareHandler } from "hono";
import { config } from "../config";

// Simple in-memory rate limiter
// TODO: Use Redis for distributed rate limiting in production
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client identifier for rate limiting
 */
const getClientId = (c: { req: { header: (name: string) => string | undefined } }): string => {
  // Try X-Forwarded-For first (for proxied requests)
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Fall back to X-Real-IP
  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Default to a generic identifier
  return "unknown";
};

/**
 * Rate limiter middleware factory
 */
export const rateLimiter = (options?: {
  windowMs?: number;
  maxRequests?: number;
}): MiddlewareHandler => {
  const windowMs = options?.windowMs ?? config.rateLimitWindowMs;
  const maxRequests = options?.maxRequests ?? config.rateLimitMaxRequests;

  return async (c, next) => {
    const clientId = getClientId(c);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = requestCounts.get(clientId);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      requestCounts.set(clientId, entry);
    }

    // Increment request count
    entry.count++;

    // Set rate limit headers
    c.header("X-RateLimit-Limit", maxRequests.toString());
    c.header(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - entry.count).toString()
    );
    c.header(
      "X-RateLimit-Reset",
      Math.ceil(entry.resetTime / 1000).toString()
    );

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      c.header("Retry-After", Math.ceil((entry.resetTime - now) / 1000).toString());

      return c.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        429
      );
    }

    await next();
  };
};

// Cleanup old entries periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [clientId, entry] of requestCounts.entries()) {
      if (now > entry.resetTime) {
        requestCounts.delete(clientId);
      }
    }
  },
  60 * 1000 // Every minute
);
