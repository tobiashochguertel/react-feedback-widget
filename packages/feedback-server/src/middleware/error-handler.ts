/**
 * Error handler middleware
 */

import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { config } from "../config";

/**
 * Custom application error
 */
export class AppError extends Error {
  constructor(
    public statusCode: StatusCode,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      404,
      id ? `${resource} with ID '${id}' not found` : `${resource} not found`,
      "NOT_FOUND"
    );
    this.name = "NotFoundError";
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/**
 * Global error handler
 */
export const errorHandler = (err: Error, c: Context) => {
  // Handle known application errors
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.name.replace("Error", ""),
        message: err.message,
        code: err.code,
        ...(config.isDevelopment && err.details
          ? { details: err.details }
          : {}),
      },
      err.statusCode
    );
  }

  // Log unknown errors
  console.error("Unhandled error:", err);

  // Return generic error in production
  return c.json(
    {
      error: "Internal Server Error",
      message: config.isDevelopment
        ? err.message
        : "An unexpected error occurred",
      ...(config.isDevelopment ? { stack: err.stack } : {}),
    },
    500
  );
};
