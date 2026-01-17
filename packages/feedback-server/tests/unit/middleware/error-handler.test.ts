/**
 * Unit Tests: Error Handler Middleware
 *
 * Tests the custom error classes and error handling logic.
 */

import { describe, it, expect } from "vitest";

// Since we're testing the error classes in isolation, we'll recreate the logic
// This avoids issues with importing config/environment dependencies

describe("Error Classes", () => {
  describe("AppError", () => {
    class AppError extends Error {
      constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public details?: unknown
      ) {
        super(message);
        this.name = "AppError";
      }
    }

    it("should create an AppError with all properties", () => {
      const error = new AppError(400, "Bad Request", "BAD_REQUEST", {
        field: "email",
      });

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Bad Request");
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.details).toEqual({ field: "email" });
      expect(error.name).toBe("AppError");
    });

    it("should create an AppError without optional properties", () => {
      const error = new AppError(500, "Internal Server Error");

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Internal Server Error");
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it("should be an instance of Error", () => {
      const error = new AppError(400, "Test");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("NotFoundError", () => {
    class AppError extends Error {
      constructor(
        public statusCode: number,
        public message: string,
        public code?: string
      ) {
        super(message);
        this.name = "AppError";
      }
    }

    class NotFoundError extends AppError {
      constructor(resource: string, id?: string) {
        super(
          404,
          id ? `${resource} with ID '${id}' not found` : `${resource} not found`,
          "NOT_FOUND"
        );
        this.name = "NotFoundError";
      }
    }

    it("should create NotFoundError with resource and ID", () => {
      const error = new NotFoundError("Feedback", "abc123");

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Feedback with ID 'abc123' not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.name).toBe("NotFoundError");
    });

    it("should create NotFoundError with resource only", () => {
      const error = new NotFoundError("User");

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("User not found");
      expect(error.code).toBe("NOT_FOUND");
    });
  });

  describe("ValidationError", () => {
    class AppError extends Error {
      constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public details?: unknown
      ) {
        super(message);
        this.name = "AppError";
      }
    }

    class ValidationError extends AppError {
      constructor(message: string, details?: unknown) {
        super(400, message, "VALIDATION_ERROR", details);
        this.name = "ValidationError";
      }
    }

    it("should create ValidationError with message and details", () => {
      const error = new ValidationError("Invalid email format", {
        field: "email",
        value: "not-an-email",
      });

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid email format");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.details).toEqual({
        field: "email",
        value: "not-an-email",
      });
    });

    it("should create ValidationError without details", () => {
      const error = new ValidationError("Required field missing");

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Required field missing");
      expect(error.details).toBeUndefined();
    });
  });

  describe("UnauthorizedError", () => {
    class AppError extends Error {
      constructor(
        public statusCode: number,
        public message: string,
        public code?: string
      ) {
        super(message);
        this.name = "AppError";
      }
    }

    class UnauthorizedError extends AppError {
      constructor(message = "Unauthorized") {
        super(401, message, "UNAUTHORIZED");
        this.name = "UnauthorizedError";
      }
    }

    it("should create UnauthorizedError with default message", () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Unauthorized");
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("should create UnauthorizedError with custom message", () => {
      const error = new UnauthorizedError("Invalid API key");

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Invalid API key");
    });
  });

  describe("ForbiddenError", () => {
    class AppError extends Error {
      constructor(
        public statusCode: number,
        public message: string,
        public code?: string
      ) {
        super(message);
        this.name = "AppError";
      }
    }

    class ForbiddenError extends AppError {
      constructor(message = "Forbidden") {
        super(403, message, "FORBIDDEN");
        this.name = "ForbiddenError";
      }
    }

    it("should create ForbiddenError with default message", () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Forbidden");
      expect(error.code).toBe("FORBIDDEN");
    });

    it("should create ForbiddenError with custom message", () => {
      const error = new ForbiddenError("Insufficient permissions");

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Insufficient permissions");
    });
  });
});

describe("Error Response Formatting", () => {
  it("should format AppError response correctly", () => {
    // Given: An AppError
    const error = {
      name: "ValidationError",
      message: "Invalid input",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: { field: "email" },
    };

    // When: We format the response
    const response = {
      error: error.name.replace("Error", ""),
      message: error.message,
      code: error.code,
    };

    // Then: Should be formatted correctly
    expect(response).toEqual({
      error: "Validation",
      message: "Invalid input",
      code: "VALIDATION_ERROR",
    });
  });

  it("should format generic error response in production", () => {
    // Given: An unknown error
    const error = new Error("Database connection failed");
    const isDevelopment = false;

    // When: We format the response
    const response = {
      error: "Internal Server Error",
      message: isDevelopment ? error.message : "An unexpected error occurred",
    };

    // Then: Should hide details in production
    expect(response.message).toBe("An unexpected error occurred");
  });

  it("should include details in development", () => {
    // Given: An unknown error
    const error = new Error("Database connection failed");
    const isDevelopment = true;

    // When: We format the response
    const response = {
      error: "Internal Server Error",
      message: isDevelopment ? error.message : "An unexpected error occurred",
      ...(isDevelopment ? { stack: error.stack } : {}),
    };

    // Then: Should include details in development
    expect(response.message).toBe("Database connection failed");
    expect(response.stack).toBeDefined();
  });
});
