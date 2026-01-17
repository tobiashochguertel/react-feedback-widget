/**
 * Authentication middleware
 *
 * Supports API key authentication via:
 * - Authorization header: Bearer <api-key>
 * - X-API-Key header: <api-key>
 * - Query parameter: ?api_key=<api-key>
 *
 * Can be used as:
 * 1. Global middleware (all routes require auth)
 * 2. Route-specific middleware
 * 3. Optional auth (sets user context if valid key provided)
 */

import type { Context, Next } from "hono";
import { config } from "../config";

/**
 * Authentication result context
 */
export interface AuthContext {
  authenticated: boolean;
  authMethod?: "apikey" | "jwt";
  apiKeyId?: string;
}

/**
 * Error response for unauthorized requests
 */
function unauthorized(c: Context, message: string = "Unauthorized") {
  return c.json(
    {
      error: "Unauthorized",
      message,
      code: "AUTH_REQUIRED",
    },
    401
  );
}

/**
 * Extract API key from request
 *
 * Checks (in order):
 * 1. Authorization: Bearer <key>
 * 2. X-API-Key header
 * 3. api_key query parameter
 */
function extractApiKey(c: Context): string | null {
  // Check Authorization header
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = c.req.header("X-API-Key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter
  const queryKey = c.req.query("api_key");
  if (queryKey) {
    return queryKey;
  }

  return null;
}

/**
 * Validate API key against configured key
 *
 * Uses timing-safe comparison to prevent timing attacks
 */
function validateApiKey(providedKey: string): boolean {
  const configuredKey = config.apiKey;

  if (!configuredKey) {
    // No API key configured, but auth is enabled - deny access
    return false;
  }

  // Use timing-safe comparison
  if (providedKey.length !== configuredKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < providedKey.length; i++) {
    result |= providedKey.charCodeAt(i) ^ configuredKey.charCodeAt(i);
  }

  return result === 0;
}

/**
 * API Key authentication middleware
 *
 * Requires valid API key for all requests when AUTH_ENABLED=true
 *
 * @example
 * ```ts
 * // Apply to all routes
 * app.use("*", apiKeyAuth());
 *
 * // Apply to specific routes
 * app.use("/api/admin/*", apiKeyAuth());
 * ```
 */
export function apiKeyAuth() {
  return async (c: Context, next: Next) => {
    // Skip auth if disabled
    if (!config.authEnabled) {
      // Set empty auth context
      c.set("auth", { authenticated: false } as AuthContext);
      return next();
    }

    // Check if auth type is API key
    if (config.authType !== "apikey") {
      // Different auth type configured, skip API key check
      return next();
    }

    // Extract API key
    const apiKey = extractApiKey(c);

    if (!apiKey) {
      return unauthorized(
        c,
        "API key required. Provide via Authorization header, X-API-Key header, or api_key query parameter."
      );
    }

    // Validate API key
    if (!validateApiKey(apiKey)) {
      return unauthorized(c, "Invalid API key");
    }

    // Set auth context
    const authContext: AuthContext = {
      authenticated: true,
      authMethod: "apikey",
    };
    c.set("auth", authContext);

    return next();
  };
}

/**
 * Optional API Key authentication middleware
 *
 * Does not require auth, but sets auth context if valid key provided.
 * Useful for routes that have enhanced features for authenticated users.
 *
 * @example
 * ```ts
 * app.use("/api/public/*", optionalApiKeyAuth());
 * ```
 */
export function optionalApiKeyAuth() {
  return async (c: Context, next: Next) => {
    // Default to not authenticated
    const authContext: AuthContext = {
      authenticated: false,
    };

    // Skip if auth disabled
    if (!config.authEnabled || config.authType !== "apikey") {
      c.set("auth", authContext);
      return next();
    }

    // Try to extract and validate API key
    const apiKey = extractApiKey(c);

    if (apiKey && validateApiKey(apiKey)) {
      authContext.authenticated = true;
      authContext.authMethod = "apikey";
    }

    c.set("auth", authContext);
    return next();
  };
}

/**
 * Require authentication middleware
 *
 * Use after optionalApiKeyAuth to require auth for specific routes
 *
 * @example
 * ```ts
 * app.use("/api/*", optionalApiKeyAuth());
 * app.use("/api/admin/*", requireAuth());
 * ```
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    // Skip if auth disabled globally
    if (!config.authEnabled) {
      return next();
    }

    const auth = c.get("auth") as AuthContext | undefined;

    if (!auth?.authenticated) {
      return unauthorized(c, "Authentication required for this resource");
    }

    return next();
  };
}

/**
 * Check if request is authenticated
 *
 * Utility function for route handlers
 */
export function isAuthenticated(c: Context): boolean {
  if (!config.authEnabled) {
    return true; // Auth disabled, treat as authenticated
  }

  const auth = c.get("auth") as AuthContext | undefined;
  return auth?.authenticated ?? false;
}

/**
 * Get auth context from request
 */
export function getAuthContext(c: Context): AuthContext {
  return (
    (c.get("auth") as AuthContext) || {
      authenticated: false,
    }
  );
}
