/**
 * API Documentation routes
 *
 * Serves OpenAPI specification and Swagger UI
 */

import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import yaml from "js-yaml";

const docs = new Hono();

// Cache the OpenAPI spec in memory
let openApiSpecCache: Record<string, unknown> | null = null;

/**
 * Resolve path to OpenAPI spec file
 *
 * Tries multiple locations in order of preference:
 * 1. packages/generated/openapi/openapi.yaml (canonical source)
 * 2. src/generated/openapi.yaml (legacy fallback)
 */
function getOpenApiSpecPaths(): string[] {
  const cwd = process.cwd();
  const packageRoot = dirname(dirname(cwd)); // Go up to monorepo root from feedback-server

  return [
    join(packageRoot, "packages/generated/openapi/openapi.yaml"),
    join(cwd, "../generated/openapi/openapi.yaml"),
    join(cwd, "src/generated/openapi.yaml"),
  ];
}

/**
 * Load OpenAPI spec from file
 */
async function loadOpenApiSpec(): Promise<Record<string, unknown>> {
  if (openApiSpecCache) {
    return openApiSpecCache;
  }

  const paths = getOpenApiSpecPaths();

  for (const specPath of paths) {
    try {
      const content = await readFile(specPath, "utf-8");
      openApiSpecCache = yaml.load(content) as Record<string, unknown>;
      return openApiSpecCache;
    } catch {
      // Try next path
    }
  }

  console.error("Failed to load OpenAPI spec from paths:", paths);
  throw new Error("OpenAPI specification not found");
}

/**
 * GET /api/docs
 *
 * Swagger UI interface
 */
docs.get("/", swaggerUI({ url: "/api/docs/openapi.json" }));

/**
 * GET /api/docs/openapi.json
 *
 * OpenAPI specification in JSON format
 */
docs.get("/openapi.json", async (c) => {
  try {
    const spec = await loadOpenApiSpec();
    return c.json(spec);
  } catch {
    return c.json(
      {
        error: "OpenAPI specification not available",
        message: "Run 'bun run generate:api' to generate the specification",
      },
      500
    );
  }
});

/**
 * GET /api/docs/openapi.yaml
 *
 * OpenAPI specification in YAML format
 */
docs.get("/openapi.yaml", async (c) => {
  const paths = getOpenApiSpecPaths();

  for (const specPath of paths) {
    try {
      const content = await readFile(specPath, "utf-8");
      c.header("Content-Type", "text/yaml");
      return c.text(content);
    } catch {
      // Try next path
    }
  }

  return c.json(
    {
      error: "OpenAPI specification not available",
      message: "Run 'task generate' from root to generate the specification",
    },
    500
  );
});

/**
 * Clear OpenAPI spec cache
 *
 * Useful for development when regenerating specs
 */
export function clearOpenApiCache(): void {
  openApiSpecCache = null;
}

export { docs };
