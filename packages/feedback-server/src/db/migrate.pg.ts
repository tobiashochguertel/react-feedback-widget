/**
 * PostgreSQL Migration
 *
 * Creates database tables for PostgreSQL.
 * Run this migration when using PostgreSQL as the database backend.
 */

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./schema.pg";

/**
 * Run PostgreSQL migrations
 */
export async function runPostgresMigrations(
  db: PostgresJsDatabase<typeof schema>
): Promise<void> {
  console.log("🔄 Running PostgreSQL migrations...");

  // Create enums
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE feedback_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'improvement', 'question', 'other');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'critical');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create feedback table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type feedback_type NOT NULL DEFAULT 'bug',
      status feedback_status NOT NULL DEFAULT 'pending',
      priority feedback_priority NOT NULL DEFAULT 'medium',
      environment JSONB,
      user_email TEXT,
      user_name TEXT,
      video_id TEXT,
      tags JSONB,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      synced_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Create screenshots table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      data_url TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  // Create console_logs table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS console_logs (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      source TEXT,
      line_number INTEGER,
      column_number INTEGER,
      stack TEXT,
      args JSONB
    );
  `);

  // Create network_requests table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS network_requests (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      method TEXT NOT NULL,
      status INTEGER,
      status_text TEXT,
      request_headers JSONB,
      response_headers JSONB,
      request_body TEXT,
      response_body TEXT,
      start_time REAL NOT NULL,
      end_time REAL,
      duration REAL,
      transfer_size INTEGER,
      initiator_type TEXT
    );
  `);

  // Create videos table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      feedback_id TEXT REFERENCES feedback(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'video/webm',
      size INTEGER NOT NULL DEFAULT 0,
      duration REAL,
      width INTEGER,
      height INTEGER,
      status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
      upload_progress REAL NOT NULL DEFAULT 0,
      storage_path TEXT,
      thumbnail_path TEXT,
      metadata JSONB,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Create video_chunks table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS video_chunks (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      checksum TEXT,
      uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);

  // Create sync_queue table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
      payload JSONB,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE
    );
  `);

  // Create indexes for better query performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback(project_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_screenshots_feedback_id ON screenshots(feedback_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_console_logs_feedback_id ON console_logs(feedback_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_network_requests_feedback_id ON network_requests(feedback_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_videos_feedback_id ON videos(feedback_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_video_chunks_video_id ON video_chunks(video_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_sync_queue_feedback_id ON sync_queue(feedback_id);
  `);

  // Create updated_at trigger function
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Create triggers for updated_at
  await db.execute(sql`
    DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
    CREATE TRIGGER update_feedback_updated_at
      BEFORE UPDATE ON feedback
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);

  await db.execute(sql`
    DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
    CREATE TRIGGER update_videos_updated_at
      BEFORE UPDATE ON videos
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);

  console.log("✅ PostgreSQL migrations completed successfully");
}

/**
 * Drop all tables (for testing/reset)
 */
export async function dropPostgresTables(
  db: PostgresJsDatabase<typeof schema>
): Promise<void> {
  console.log("🗑️ Dropping PostgreSQL tables...");

  // Drop tables in reverse order of dependencies
  await db.execute(sql`DROP TABLE IF EXISTS sync_queue CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS video_chunks CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS videos CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS network_requests CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS console_logs CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS screenshots CASCADE;`);
  await db.execute(sql`DROP TABLE IF EXISTS feedback CASCADE;`);

  // Drop enums
  await db.execute(sql`DROP TYPE IF EXISTS feedback_status CASCADE;`);
  await db.execute(sql`DROP TYPE IF EXISTS feedback_type CASCADE;`);
  await db.execute(sql`DROP TYPE IF EXISTS feedback_priority CASCADE;`);

  // Drop trigger function
  await db.execute(sql`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;`);

  console.log("✅ PostgreSQL tables dropped successfully");
}
