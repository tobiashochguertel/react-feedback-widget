/**
 * Unit Tests: Configuration
 *
 * Tests the configuration parsing and validation logic.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the environment schema for testing
const envSchema = z.object({
  PORT: z
    .string()
    .default("3000")
    .transform(Number),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().default("file:./data/feedback.db"),

  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_SIZE: z
    .string()
    .default("104857600")
    .transform(Number),

  VIDEO_CHUNK_SIZE: z
    .string()
    .default("1048576")
    .transform(Number),
  VIDEO_MAX_DURATION: z
    .string()
    .default("300")
    .transform(Number),

  AUTH_ENABLED: z
    .string()
    .default("false")
    .transform((s) => s === "true"),
  AUTH_TYPE: z.enum(["apikey", "jwt"]).default("apikey"),
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),

  CORS_ORIGINS: z
    .string()
    .default("*")
    .transform((s) => (s === "*" ? ["*"] : s.split(",").map((o) => o.trim()))),

  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("60000")
    .transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default("100")
    .transform(Number),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("json"),

  ENABLE_VIDEO_UPLOAD: z
    .string()
    .default("true")
    .transform((s) => s === "true"),
  ENABLE_WEBSOCKET: z
    .string()
    .default("true")
    .transform((s) => s === "true"),
  ENABLE_COMPRESSION: z
    .string()
    .default("true")
    .transform((s) => s === "true"),
});

describe("Configuration Schema", () => {
  describe("Default values", () => {
    it("should use default PORT of 3000", () => {
      const result = envSchema.parse({});
      expect(result.PORT).toBe(3000);
    });

    it("should use default HOST of 0.0.0.0", () => {
      const result = envSchema.parse({});
      expect(result.HOST).toBe("0.0.0.0");
    });

    it("should use default NODE_ENV of development", () => {
      const result = envSchema.parse({});
      expect(result.NODE_ENV).toBe("development");
    });

    it("should use default DATABASE_URL for SQLite", () => {
      const result = envSchema.parse({});
      expect(result.DATABASE_URL).toBe("file:./data/feedback.db");
    });

    it("should use default rate limit of 100 requests per 60 seconds", () => {
      const result = envSchema.parse({});
      expect(result.RATE_LIMIT_MAX_REQUESTS).toBe(100);
      expect(result.RATE_LIMIT_WINDOW_MS).toBe(60000);
    });

    it("should enable video upload by default", () => {
      const result = envSchema.parse({});
      expect(result.ENABLE_VIDEO_UPLOAD).toBe(true);
    });

    it("should enable WebSocket by default", () => {
      const result = envSchema.parse({});
      expect(result.ENABLE_WEBSOCKET).toBe(true);
    });

    it("should disable auth by default", () => {
      const result = envSchema.parse({});
      expect(result.AUTH_ENABLED).toBe(false);
    });
  });

  describe("Custom values", () => {
    it("should parse custom PORT", () => {
      const result = envSchema.parse({ PORT: "8080" });
      expect(result.PORT).toBe(8080);
    });

    it("should parse production NODE_ENV", () => {
      const result = envSchema.parse({ NODE_ENV: "production" });
      expect(result.NODE_ENV).toBe("production");
    });

    it("should parse enabled AUTH_ENABLED", () => {
      const result = envSchema.parse({ AUTH_ENABLED: "true" });
      expect(result.AUTH_ENABLED).toBe(true);
    });

    it("should parse disabled AUTH_ENABLED", () => {
      const result = envSchema.parse({ AUTH_ENABLED: "false" });
      expect(result.AUTH_ENABLED).toBe(false);
    });

    it("should parse custom rate limits", () => {
      const result = envSchema.parse({
        RATE_LIMIT_MAX_REQUESTS: "1000",
        RATE_LIMIT_WINDOW_MS: "120000",
      });
      expect(result.RATE_LIMIT_MAX_REQUESTS).toBe(1000);
      expect(result.RATE_LIMIT_WINDOW_MS).toBe(120000);
    });
  });

  describe("CORS_ORIGINS parsing", () => {
    it("should parse wildcard as array with *", () => {
      const result = envSchema.parse({ CORS_ORIGINS: "*" });
      expect(result.CORS_ORIGINS).toEqual(["*"]);
    });

    it("should parse single origin", () => {
      const result = envSchema.parse({
        CORS_ORIGINS: "https://example.com",
      });
      expect(result.CORS_ORIGINS).toEqual(["https://example.com"]);
    });

    it("should parse multiple origins", () => {
      const result = envSchema.parse({
        CORS_ORIGINS: "https://example.com, https://api.example.com",
      });
      expect(result.CORS_ORIGINS).toEqual([
        "https://example.com",
        "https://api.example.com",
      ]);
    });

    it("should trim whitespace from origins", () => {
      const result = envSchema.parse({
        CORS_ORIGINS: "  https://example.com  ,  https://api.example.com  ",
      });
      expect(result.CORS_ORIGINS).toEqual([
        "https://example.com",
        "https://api.example.com",
      ]);
    });
  });

  describe("AUTH_TYPE validation", () => {
    it("should accept apikey type", () => {
      const result = envSchema.parse({ AUTH_TYPE: "apikey" });
      expect(result.AUTH_TYPE).toBe("apikey");
    });

    it("should accept jwt type", () => {
      const result = envSchema.parse({ AUTH_TYPE: "jwt" });
      expect(result.AUTH_TYPE).toBe("jwt");
    });

    it("should reject invalid auth type", () => {
      expect(() => {
        envSchema.parse({ AUTH_TYPE: "oauth" });
      }).toThrow();
    });
  });

  describe("NODE_ENV validation", () => {
    it("should accept development", () => {
      const result = envSchema.parse({ NODE_ENV: "development" });
      expect(result.NODE_ENV).toBe("development");
    });

    it("should accept production", () => {
      const result = envSchema.parse({ NODE_ENV: "production" });
      expect(result.NODE_ENV).toBe("production");
    });

    it("should accept test", () => {
      const result = envSchema.parse({ NODE_ENV: "test" });
      expect(result.NODE_ENV).toBe("test");
    });

    it("should reject invalid environment", () => {
      expect(() => {
        envSchema.parse({ NODE_ENV: "staging" });
      }).toThrow();
    });
  });

  describe("LOG_LEVEL validation", () => {
    it.each(["debug", "info", "warn", "error"])(
      "should accept log level: %s",
      (level) => {
        const result = envSchema.parse({ LOG_LEVEL: level });
        expect(result.LOG_LEVEL).toBe(level);
      }
    );

    it("should reject invalid log level", () => {
      expect(() => {
        envSchema.parse({ LOG_LEVEL: "verbose" });
      }).toThrow();
    });
  });

  describe("Number transformations", () => {
    it("should transform MAX_UPLOAD_SIZE to number", () => {
      const result = envSchema.parse({ MAX_UPLOAD_SIZE: "52428800" });
      expect(result.MAX_UPLOAD_SIZE).toBe(52428800);
      expect(typeof result.MAX_UPLOAD_SIZE).toBe("number");
    });

    it("should transform VIDEO_CHUNK_SIZE to number", () => {
      const result = envSchema.parse({ VIDEO_CHUNK_SIZE: "2097152" });
      expect(result.VIDEO_CHUNK_SIZE).toBe(2097152);
    });

    it("should transform VIDEO_MAX_DURATION to number", () => {
      const result = envSchema.parse({ VIDEO_MAX_DURATION: "600" });
      expect(result.VIDEO_MAX_DURATION).toBe(600);
    });
  });
});

describe("Configuration Derived Values", () => {
  it("should correctly identify development environment", () => {
    const env = envSchema.parse({ NODE_ENV: "development" });
    const isDevelopment = env.NODE_ENV === "development";
    expect(isDevelopment).toBe(true);
  });

  it("should correctly identify production environment", () => {
    const env = envSchema.parse({ NODE_ENV: "production" });
    const isProduction = env.NODE_ENV === "production";
    expect(isProduction).toBe(true);
  });

  it("should correctly identify test environment", () => {
    const env = envSchema.parse({ NODE_ENV: "test" });
    const isTest = env.NODE_ENV === "test";
    expect(isTest).toBe(true);
  });
});
