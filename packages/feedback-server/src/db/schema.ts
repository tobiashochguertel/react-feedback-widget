/**
 * Database Schema
 *
 * Drizzle ORM schema definitions for the feedback server.
 * Supports SQLite for development and PostgreSQL for production.
 */

import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from "drizzle-orm/sqlite-core";

// Enums as text columns with check constraints
export const feedbackStatusEnum = [
  "pending",
  "in_progress",
  "resolved",
  "closed",
  "archived",
] as const;

export const feedbackTypeEnum = [
  "bug",
  "feature",
  "improvement",
  "question",
  "other",
] as const;

export const feedbackPriorityEnum = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

/**
 * Feedback table
 */
export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: feedbackTypeEnum }).notNull().default("bug"),
  status: text("status", { enum: feedbackStatusEnum })
    .notNull()
    .default("pending"),
  priority: text("priority", { enum: feedbackPriorityEnum })
    .notNull()
    .default("medium"),

  // Environment info (stored as JSON)
  environment: text("environment", { mode: "json" }).$type<{
    userAgent: string;
    browser?: string;
    browserVersion?: string;
    os?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    devicePixelRatio?: number;
    url: string;
    pageTitle?: string;
  }>(),

  // User info
  userEmail: text("user_email"),
  userName: text("user_name"),

  // Related media
  videoId: text("video_id"),

  // Tags stored as JSON array
  tags: text("tags", { mode: "json" }).$type<string[]>(),

  // Custom metadata as JSON
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),

  // Timestamps
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  syncedAt: text("synced_at"),
});

/**
 * Screenshots table
 */
export const screenshots = sqliteTable("screenshots", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(), // Base64 encoded or URL
  width: integer("width"),
  height: integer("height"),
  capturedAt: text("captured_at").notNull(),

  // Annotations stored as JSON
  annotations: text("annotations", { mode: "json" }).$type<
    Array<{
      type: "rectangle" | "arrow" | "text" | "highlight" | "blur";
      x: number;
      y: number;
      width?: number;
      height?: number;
      endX?: number;
      endY?: number;
      text?: string;
      color?: string;
      strokeWidth?: number;
    }>
  >(),
});

/**
 * Console logs table
 */
export const consoleLogs = sqliteTable("console_logs", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  level: text("level", {
    enum: ["log", "info", "warn", "error", "debug"],
  }).notNull(),
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
  data: text("data", { mode: "json" }).$type<unknown[]>(),
});

/**
 * Network requests table
 */
export const networkRequests = sqliteTable("network_requests", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  method: text("method").notNull(),
  status: integer("status"),
  duration: integer("duration"),
  timestamp: text("timestamp").notNull(),
  success: integer("success", { mode: "boolean" }).notNull(),
  error: text("error"),
});

/**
 * Videos table
 */
export const videos = sqliteTable("videos", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  sessionId: text("session_id").notNull(),
  feedbackId: text("feedback_id").references(() => feedback.id, {
    onDelete: "set null",
  }),

  // File info
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull().default("video/webm"),
  size: integer("size").notNull(),
  duration: real("duration"),

  // Storage
  storagePath: text("storage_path").notNull(),

  // Upload status
  status: text("status", {
    enum: ["pending", "uploading", "processing", "ready", "failed"],
  })
    .notNull()
    .default("pending"),

  // Chunked upload tracking
  totalChunks: integer("total_chunks"),
  uploadedChunks: integer("uploaded_chunks").default(0),

  // Thumbnail
  thumbnailPath: text("thumbnail_path"),

  // Timestamps
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/**
 * API Keys table (for authentication)
 */
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(), // Hashed API key
  prefix: text("prefix").notNull(), // First 8 chars for identification
  scopes: text("scopes", { mode: "json" }).$type<string[]>(),
  expiresAt: text("expires_at"),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  revokedAt: text("revoked_at"),
});

/**
 * Video chunks table (for chunked uploads)
 */
export const videoChunks = sqliteTable("video_chunks", {
  id: text("id").primaryKey(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
  checksum: text("checksum"),
  uploadedAt: text("uploaded_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/**
 * Sync queue table (for offline sync)
 */
export const syncQueue = sqliteTable("sync_queue", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  operation: text("operation", {
    enum: ["create", "update", "delete"],
  }).notNull(),
  payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>(),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  processedAt: text("processed_at"),
});

// Type exports
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
export type Screenshot = typeof screenshots.$inferSelect;
export type NewScreenshot = typeof screenshots.$inferInsert;
export type ConsoleLog = typeof consoleLogs.$inferSelect;
export type NewConsoleLog = typeof consoleLogs.$inferInsert;
export type NetworkRequest = typeof networkRequests.$inferSelect;
export type NewNetworkRequest = typeof networkRequests.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type VideoChunk = typeof videoChunks.$inferSelect;
export type NewVideoChunk = typeof videoChunks.$inferInsert;
export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;
