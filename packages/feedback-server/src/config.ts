/**
 * Server configuration
 */

import { z } from "zod";

// Environment schema
const envSchema = z.object({
  PORT: z.string().default("3000").transform(Number),
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

  // Authentication
  AUTH_ENABLED: z
    .string()
    .default("false")
    .transform((s) => s === "true"),
  AUTH_TYPE: z.enum(["apikey", "jwt"]).default("apikey"),
  API_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  API_KEY_SALT: z.string().optional(),

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

// Parse environment
const env = envSchema.parse(process.env);

/**
 * Application configuration
 */
export const config = {
  // Server
  port: env.PORT,
  host: env.HOST,
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",

  // Database
  databaseUrl: env.DATABASE_URL,

  // Storage
  uploadDir: env.UPLOAD_DIR,
  maxUploadSize: env.MAX_UPLOAD_SIZE,

  // Video
  videoChunkSize: env.VIDEO_CHUNK_SIZE,
  videoMaxDuration: env.VIDEO_MAX_DURATION,

  // Security
  authEnabled: env.AUTH_ENABLED,
  authType: env.AUTH_TYPE,
  apiKey: env.API_KEY,
  jwtSecret: env.JWT_SECRET,
  apiKeySalt: env.API_KEY_SALT,

  // CORS
  corsOrigins: env.CORS_ORIGINS,

  // Rate limiting
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,

  // Logging
  logLevel: env.LOG_LEVEL,
  logFormat: env.LOG_FORMAT,

  // Features
  enableVideoUpload: env.ENABLE_VIDEO_UPLOAD,
  enableWebsocket: env.ENABLE_WEBSOCKET,
  enableCompression: env.ENABLE_COMPRESSION,
} as const;

export type Config = typeof config;
