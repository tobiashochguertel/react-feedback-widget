/**
 * Authentication middleware
 *
 * Supports both API key and JWT authentication:
 *
 * API Key authentication via:
 * - Authorization header: Bearer <api-key>
 * - X-API-Key header: <api-key>
 * - Query parameter: ?api_key=<api-key>
 *
 * JWT authentication via:
 * - Authorization header: Bearer <jwt-token>
 *
 * Can be used as:
 * 1. Global middleware (all routes require auth)
 * 2. Route-specific middleware
 * 3. Optional auth (sets user context if valid token provided)
 */

import type { Context, Next } from "hono";
import { verify, sign, decode } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import { config } from "../config";

/**
 * JWT claims structure for feedback server
 */
export interface JWTClaims extends JWTPayload {
  /** Subject - typically user ID */
  sub: string;
  /** User role */
  role?: "admin" | "user" | "viewer";
  /** Project ID for scoped access */
  projectId?: string;
  /** Session ID for tracking */
  sessionId?: string;
}

/**
 * Authentication result context
 */
export interface AuthContext {
  authenticated: boolean;
  authMethod?: "apikey" | "jwt" | undefined;
  apiKeyId?: string | undefined;
  /** JWT claims when authenticated via JWT */
  jwtClaims?: JWTClaims | undefined;
  /** User ID from JWT sub claim */
  userId?: string | undefined;
  /** User role from JWT */
  role?: "admin" | "user" | "viewer" | undefined;
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
 * Extract JWT token from Authorization header
 *
 * Expects: Authorization: Bearer <jwt-token>
 */
function extractJWT(c: Context): string | null {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * Validate and decode JWT token
 *
 * @returns JWT claims if valid, null if invalid
 */
async function validateJWT(token: string): Promise<JWTClaims | null> {
  const secret = config.jwtSecret;

  if (!secret) {
    console.warn("JWT_SECRET not configured but JWT auth is enabled");
    return null;
  }

  try {
    const payload = await verify(token, secret, "HS256");
    return payload as JWTClaims;
  } catch {
    // Token is invalid, expired, or signature doesn't match
    return null;
  }
}

/**
 * Sign a JWT token with the configured secret
 *
 * @param claims - JWT claims to include in the token
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed JWT token
 *
 * @example
 * ```ts
 * const token = await signJWT({
 *   sub: "user123",
 *   role: "admin",
 *   projectId: "proj_abc123"
 * });
 * ```
 */
export async function signJWT(
  claims: Omit<JWTClaims, "iat" | "exp">,
  expiresIn: number = 3600
): Promise<string> {
  const secret = config.jwtSecret;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    ...claims,
    iat: now,
    exp: now + expiresIn,
  };

  return sign(payload, secret);
}

/**
 * Decode JWT token without verification
 *
 * Useful for debugging or extracting claims before verification
 *
 * @param token - JWT token to decode
 * @returns Decoded header and payload, or null if invalid format
 */
export function decodeJWT(token: string): {
  header: Record<string, unknown>;
  payload: JWTClaims;
} | null {
  try {
    const decoded = decode(token);
    return {
      header: decoded.header as unknown as Record<string, unknown>,
      payload: decoded.payload as JWTClaims,
    };
  } catch {
    return null;
  }
}

/**
 * JWT authentication middleware
 *
 * Requires valid JWT token for all requests when AUTH_ENABLED=true and AUTH_TYPE=jwt
 *
 * @example
 * ```ts
 * // Apply to all routes
 * app.use("*", jwtAuth());
 *
 * // Apply to specific routes
 * app.use("/api/admin/*", jwtAuth());
 * ```
 */
export function jwtAuth() {
  return async (c: Context, next: Next) => {
    // Skip auth if disabled
    if (!config.authEnabled) {
      c.set("auth", { authenticated: false } as AuthContext);
      return next();
    }

    // Check if auth type is JWT
    if (config.authType !== "jwt") {
      // Different auth type configured, skip JWT check
      return next();
    }

    // Extract JWT token
    const token = extractJWT(c);

    if (!token) {
      return unauthorized(
        c,
        "JWT token required. Provide via Authorization: Bearer <token> header."
      );
    }

    // Validate JWT token
    const claims = await validateJWT(token);

    if (!claims) {
      return unauthorized(c, "Invalid or expired JWT token");
    }

    // Set auth context with JWT claims
    const authContext: AuthContext = {
      authenticated: true,
      authMethod: "jwt",
      jwtClaims: claims,
      userId: claims.sub,
      role: claims.role,
    };
    c.set("auth", authContext);

    return next();
  };
}

/**
 * Combined authentication middleware
 *
 * Supports both API key and JWT based on configuration
 * Automatically uses the configured auth type
 *
 * @example
 * ```ts
 * app.use("/api/*", auth());
 * ```
 */
export function auth() {
  return async (c: Context, next: Next) => {
    // Skip auth if disabled
    if (!config.authEnabled) {
      c.set("auth", { authenticated: false } as AuthContext);
      return next();
    }

    // Route to appropriate auth method
    if (config.authType === "jwt") {
      return jwtAuth()(c, next);
    } else {
      return apiKeyAuth()(c, next);
    }
  };
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
 * Optional JWT authentication middleware
 *
 * Does not require auth, but sets auth context if valid JWT provided.
 * Useful for routes that have enhanced features for authenticated users.
 *
 * @example
 * ```ts
 * app.use("/api/public/*", optionalJwtAuth());
 * ```
 */
export function optionalJwtAuth() {
  return async (c: Context, next: Next) => {
    // Default to not authenticated
    const authContext: AuthContext = {
      authenticated: false,
    };

    // Skip if auth disabled or not JWT type
    if (!config.authEnabled || config.authType !== "jwt") {
      c.set("auth", authContext);
      return next();
    }

    // Try to extract and validate JWT
    const token = extractJWT(c);

    if (token) {
      const claims = await validateJWT(token);
      if (claims) {
        authContext.authenticated = true;
        authContext.authMethod = "jwt";
        authContext.jwtClaims = claims;
        authContext.userId = claims.sub;
        authContext.role = claims.role;
      }
    }

    c.set("auth", authContext);
    return next();
  };
}

/**
 * Optional authentication middleware (supports both API key and JWT)
 *
 * Does not require auth, but sets auth context if valid credentials provided.
 * Automatically uses the configured auth type.
 *
 * @example
 * ```ts
 * app.use("/api/public/*", optionalAuth());
 * ```
 */
export function optionalAuth() {
  return async (c: Context, next: Next) => {
    // Skip if auth disabled
    if (!config.authEnabled) {
      c.set("auth", { authenticated: false } as AuthContext);
      return next();
    }

    // Route to appropriate optional auth method
    if (config.authType === "jwt") {
      return optionalJwtAuth()(c, next);
    } else {
      return optionalApiKeyAuth()(c, next);
    }
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
