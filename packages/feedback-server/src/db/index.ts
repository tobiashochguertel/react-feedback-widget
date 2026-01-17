/**
 * Database Connection
 *
 * Creates and exports the database connection using Drizzle ORM.
 * Uses better-sqlite3 for SQLite support.
 */

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { config } from "../config";
import * as schema from "./schema";

// Parse database URL
function getDatabasePath(url: string): string {
  // Handle "file:" prefix for SQLite
  if (url.startsWith("file:")) {
    return url.replace("file:", "");
  }
  return url;
}

// Create SQLite database connection
const sqlite = new Database(getDatabasePath(config.databaseUrl), {
  create: true,
});

// Enable WAL mode for better concurrency
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for convenience
export { schema };

// Export database instance for direct access (testing, migrations)
export { sqlite };

/**
 * Check if database is connected and working
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const start = performance.now();

  try {
    // Simple query to check connection
    sqlite.query("SELECT 1").get();
    const responseTime = Math.round(performance.now() - start);

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - start);

    return {
      healthy: false,
      responseTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Close database connection (for cleanup)
 */
export function closeDatabase(): void {
  sqlite.close();
}
