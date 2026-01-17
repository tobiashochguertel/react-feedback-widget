/**
 * PostgreSQL Database Schema
 *
 * Drizzle ORM schema definitions for PostgreSQL.
 * This mirrors the SQLite schema but uses PostgreSQL-specific types.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

// PostgreSQL enums
export const feedbackStatusEnum = pgEnum("feedback_status", [
  "pending",
  "in_progress",
  "resolved",
  "closed",
  "archived",
]);

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "bug",
  "feature",
  "improvement",
  "question",
  "other",
]);

export const feedbackPriorityEnum = pgEnum("feedback_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

// Environment info type
export type EnvironmentInfo = {
  userAgent: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  devicePixelRatio?: number;
  url: string;
  pageTitle?: string;
};

/**
 * Feedback table
 */
export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: feedbackTypeEnum("type").notNull().default("bug"),
  status: feedbackStatusEnum("status").notNull().default("pending"),
  priority: feedbackPriorityEnum("priority").notNull().default("medium"),

  // Environment info (stored as JSONB)
  environment: jsonb("environment").$type<EnvironmentInfo>(),

  // User info
  userEmail: text("user_email"),
  userName: text("user_name"),

  // Related media
  videoId: text("video_id"),

  // Tags stored as JSONB array
  tags: jsonb("tags").$type<string[]>(),

  // Custom metadata as JSONB
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  // Timestamps (using timestamp with time zone)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
});

/**
 * Screenshots table
 */
export const screenshots = pgTable("screenshots", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  dataUrl: text("data_url").notNull(),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Console logs table
 */
export const consoleLogs = pgTable("console_logs", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  level: text("level").notNull(),
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
  source: text("source"),
  lineNumber: integer("line_number"),
  columnNumber: integer("column_number"),
  stack: text("stack"),
  args: jsonb("args").$type<unknown[]>(),
});

/**
 * Network requests table
 */
export const networkRequests = pgTable("network_requests", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  method: text("method").notNull(),
  status: integer("status"),
  statusText: text("status_text"),
  requestHeaders: jsonb("request_headers").$type<Record<string, string>>(),
  responseHeaders: jsonb("response_headers").$type<Record<string, string>>(),
  requestBody: text("request_body"),
  responseBody: text("response_body"),
  startTime: real("start_time").notNull(),
  endTime: real("end_time"),
  duration: real("duration"),
  transferSize: integer("transfer_size"),
  initiatorType: text("initiator_type"),
});

/**
 * Videos table
 */
export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id").references(() => feedback.id, {
    onDelete: "set null",
  }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull().default("video/webm"),
  size: integer("size").notNull().default(0),
  duration: real("duration"),
  width: integer("width"),
  height: integer("height"),
  status: text("status")
    .$type<"uploading" | "processing" | "ready" | "error">()
    .notNull()
    .default("uploading"),
  uploadProgress: real("upload_progress").notNull().default(0),
  storagePath: text("storage_path"),
  thumbnailPath: text("thumbnail_path"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/**
 * Video chunks table (for chunked uploads)
 */
export const videoChunks = pgTable("video_chunks", {
  id: text("id").primaryKey(),
  videoId: text("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
  checksum: text("checksum"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Sync queue table (for offline sync)
 */
export const syncQueue = pgTable("sync_queue", {
  id: text("id").primaryKey(),
  feedbackId: text("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  operation: text("operation")
    .$type<"create" | "update" | "delete">()
    .notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// Export schema types
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
export type VideoChunk = typeof videoChunks.$inferSelect;
export type NewVideoChunk = typeof videoChunks.$inferInsert;
export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;
