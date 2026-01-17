/**
 * PostgreSQL Database Connection
 *
 * Creates and exports the PostgreSQL database connection using Drizzle ORM.
 * Uses the 'postgres' driver for PostgreSQL support.
 */

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.pg";

// Export type for the database instance
export type PostgresDB = PostgresJsDatabase<typeof schema>;

/**
 * Create a PostgreSQL database connection
 */
export function createPostgresConnection(connectionUrl: string): {
  db: PostgresDB;
  client: ReturnType<typeof postgres>;
} {
  // Create postgres client
  const client = postgres(connectionUrl, {
    max: 10, // Maximum pool connections
    idle_timeout: 20, // Idle connection timeout (seconds)
    connect_timeout: 10, // Connection timeout (seconds)
    prepare: false, // Disable prepared statements for better compatibility
  });

  // Create Drizzle instance
  const db = drizzle(client, { schema });

  return { db, client };
}

/**
 * Check if PostgreSQL database is connected and working
 */
export async function checkPostgresHealth(
  client: ReturnType<typeof postgres>
): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const start = performance.now();

  try {
    // Simple query to check connection
    await client`SELECT 1`;
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
 * Close PostgreSQL connection
 */
export async function closePostgresConnection(
  client: ReturnType<typeof postgres>
): Promise<void> {
  await client.end();
}

// Export schema
export { schema };
