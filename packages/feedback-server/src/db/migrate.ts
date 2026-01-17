/**
 * Database Migration Script
 *
 * Creates all tables in the database.
 * Run this script to initialize or reset the database.
 */

import { sql } from "drizzle-orm";
import { db, sqlite } from "./index";

// SQL to create all tables
const createTablesSQL = `
-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'bug' CHECK(type IN ('bug', 'feature', 'improvement', 'question', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'resolved', 'closed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
  environment TEXT,
  user_email TEXT,
  user_name TEXT,
  video_id TEXT,
  tags TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

-- Screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL,
  data TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  captured_at TEXT NOT NULL,
  annotations TEXT
);

-- Console logs table
CREATE TABLE IF NOT EXISTS console_logs (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK(level IN ('log', 'info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  data TEXT
);

-- Network requests table
CREATE TABLE IF NOT EXISTS network_requests (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER,
  duration INTEGER,
  timestamp TEXT NOT NULL,
  success INTEGER NOT NULL,
  error TEXT
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  feedback_id TEXT REFERENCES feedback(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'video/webm',
  size INTEGER NOT NULL,
  duration REAL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'uploading', 'processing', 'ready', 'failed')),
  total_chunks INTEGER,
  uploaded_chunks INTEGER DEFAULT 0,
  thumbnail_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  scopes TEXT,
  expires_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_screenshots_feedback_id ON screenshots(feedback_id);
CREATE INDEX IF NOT EXISTS idx_console_logs_feedback_id ON console_logs(feedback_id);
CREATE INDEX IF NOT EXISTS idx_network_requests_feedback_id ON network_requests(feedback_id);
CREATE INDEX IF NOT EXISTS idx_videos_project_id ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_videos_feedback_id ON videos(feedback_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_project_id ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
`;

/**
 * Run migrations to create all tables
 */
export function migrate(): void {
  console.log("Running database migrations...");

  try {
    sqlite.exec(createTablesSQL);
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    throw error;
  }
}

/**
 * Drop all tables (for testing/reset)
 */
export function dropAllTables(): void {
  console.log("Dropping all tables...");

  sqlite.exec(`
    DROP TABLE IF EXISTS api_keys;
    DROP TABLE IF EXISTS network_requests;
    DROP TABLE IF EXISTS console_logs;
    DROP TABLE IF EXISTS screenshots;
    DROP TABLE IF EXISTS videos;
    DROP TABLE IF EXISTS feedback;
  `);

  console.log("✅ All tables dropped");
}

// Run migration if executed directly
if (import.meta.main) {
  migrate();
}
