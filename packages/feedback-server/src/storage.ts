/**
 * Storage Module
 *
 * Provides file storage functionality for screenshots and videos.
 * Uses local filesystem storage.
 */

import { mkdir, stat, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { config } from "./config";

/**
 * Ensure the upload directory exists
 */
export async function ensureUploadDir(): Promise<void> {
  await mkdir(config.uploadDir, { recursive: true });
  await mkdir(join(config.uploadDir, "screenshots"), { recursive: true });
  await mkdir(join(config.uploadDir, "videos"), { recursive: true });
  await mkdir(join(config.uploadDir, "thumbnails"), { recursive: true });
}

/**
 * Save a file to storage
 */
export async function saveFile(
  path: string,
  data: Buffer | Uint8Array
): Promise<void> {
  const fullPath = join(config.uploadDir, path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);
}

/**
 * Read a file from storage
 */
export async function readStoredFile(path: string): Promise<Buffer> {
  const fullPath = join(config.uploadDir, path);
  return readFile(fullPath);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  const fullPath = join(config.uploadDir, path);
  await unlink(fullPath);
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const fullPath = join(config.uploadDir, path);
    await stat(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file info
 */
export async function getFileInfo(
  path: string
): Promise<{ size: number; mtime: Date } | null> {
  try {
    const fullPath = join(config.uploadDir, path);
    const stats = await stat(fullPath);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * List files in a directory
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    const fullPath = join(config.uploadDir, dirPath);
    return await readdir(fullPath);
  } catch {
    return [];
  }
}

/**
 * Check storage health
 */
export async function checkStorageHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const start = performance.now();

  try {
    // Try to ensure directories exist and write a test file
    await ensureUploadDir();

    const testPath = join(config.uploadDir, ".health-check");
    const testData = Buffer.from("health-check");

    await writeFile(testPath, testData);
    await stat(testPath);
    await unlink(testPath);

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
