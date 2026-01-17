/**
 * Database Factory
 *
 * Factory module that creates the appropriate database connection
 * based on the DATABASE_URL configuration.
 *
 * Supports:
 * - SQLite: file:./path/to/db or sqlite:./path/to/db
 * - PostgreSQL: postgres://user:pass@host:port/db or postgresql://...
 */

import { config } from "../config";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type postgres from "postgres";
import type { Database as SQLiteDatabase } from "bun:sqlite";

// Schema types
import type * as sqliteSchema from "./schema";
import type * as pgSchema from "./schema.pg";

// Database type union
export type DatabaseType = "sqlite" | "postgres";

// Unified database interface
export interface DatabaseConnection {
  type: DatabaseType;
  db: BunSQLiteDatabase<typeof sqliteSchema> | PostgresJsDatabase<typeof pgSchema>;
  checkHealth(): Promise<{ healthy: boolean; responseTime: number; error?: string }>;
  close(): Promise<void>;
}

// SQLite connection wrapper
interface SQLiteConnection extends DatabaseConnection {
  type: "sqlite";
  db: BunSQLiteDatabase<typeof sqliteSchema>;
  sqlite: SQLiteDatabase;
}

// PostgreSQL connection wrapper
interface PostgresConnection extends DatabaseConnection {
  type: "postgres";
  db: PostgresJsDatabase<typeof pgSchema>;
  client: ReturnType<typeof postgres>;
}

/**
 * Detect database type from URL
 */
export function detectDatabaseType(url: string): DatabaseType {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return "postgres";
  }
  // Default to SQLite for file: or any other URL
  return "sqlite";
}

/**
 * Create SQLite database connection
 */
async function createSQLiteConnection(url: string): Promise<SQLiteConnection> {
  // Dynamic import to avoid loading SQLite when not needed
  const { drizzle } = await import("drizzle-orm/bun-sqlite");
  const { Database } = await import("bun:sqlite");
  const schema = await import("./schema");

  // Parse database path
  let dbPath = url;
  if (url.startsWith("file:")) {
    dbPath = url.replace("file:", "");
  } else if (url.startsWith("sqlite:")) {
    dbPath = url.replace("sqlite:", "");
  }

  // Create SQLite database connection
  const sqlite = new Database(dbPath, { create: true });

  // Enable WAL mode for better concurrency
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  // Create Drizzle instance
  const db = drizzle(sqlite, { schema });

  return {
    type: "sqlite" as const,
    db,
    sqlite,
    async checkHealth() {
      const start = performance.now();
      try {
        sqlite.query("SELECT 1").get();
        return {
          healthy: true,
          responseTime: Math.round(performance.now() - start),
        };
      } catch (error) {
        return {
          healthy: false,
          responseTime: Math.round(performance.now() - start),
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    async close() {
      sqlite.close();
    },
  };
}

/**
 * Create PostgreSQL database connection
 */
async function createPostgresConnection(url: string): Promise<PostgresConnection> {
  // Dynamic import to avoid loading postgres when not needed
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const postgresModule = await import("postgres");
  const schema = await import("./schema.pg");

  // Get the default export
  const postgres = postgresModule.default;

  // Create postgres client
  const client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  // Create Drizzle instance
  const db = drizzle(client, { schema });

  return {
    type: "postgres" as const,
    db,
    client,
    async checkHealth() {
      const start = performance.now();
      try {
        await client`SELECT 1`;
        return {
          healthy: true,
          responseTime: Math.round(performance.now() - start),
        };
      } catch (error) {
        return {
          healthy: false,
          responseTime: Math.round(performance.now() - start),
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    async close() {
      await client.end();
    },
  };
}

/**
 * Create database connection based on URL
 */
export async function createDatabaseConnection(
  url: string = config.databaseUrl
): Promise<DatabaseConnection> {
  const dbType = detectDatabaseType(url);

  if (dbType === "postgres") {
    return createPostgresConnection(url);
  }

  return createSQLiteConnection(url);
}

/**
 * Type guard for SQLite connection
 */
export function isSQLiteConnection(
  conn: DatabaseConnection
): conn is SQLiteConnection {
  return conn.type === "sqlite";
}

/**
 * Type guard for PostgreSQL connection
 */
export function isPostgresConnection(
  conn: DatabaseConnection
): conn is PostgresConnection {
  return conn.type === "postgres";
}

// Cached connection instance
let cachedConnection: DatabaseConnection | null = null;

/**
 * Get or create database connection (singleton)
 */
export async function getDatabaseConnection(): Promise<DatabaseConnection> {
  if (!cachedConnection) {
    cachedConnection = await createDatabaseConnection();
  }
  return cachedConnection;
}

/**
 * Close cached connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (cachedConnection) {
    await cachedConnection.close();
    cachedConnection = null;
  }
}

/**
 * Get database health status
 */
export async function getDatabaseHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  type: DatabaseType;
  error?: string;
}> {
  const conn = await getDatabaseConnection();
  const health = await conn.checkHealth();
  return {
    ...health,
    type: conn.type,
  };
}
