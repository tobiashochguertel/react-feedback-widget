/**
 * Video routes
 *
 * Implements chunked video upload with the following flow:
 * 1. POST /init - Initialize upload, get videoId and chunk info
 * 2. PUT /:videoId/chunks/:chunkNumber - Upload each chunk
 * 3. POST /:videoId/complete - Finalize upload and reassemble video
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { nanoid } from "nanoid";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { db, schema } from "../db";
import {
  saveFile,
  readStoredFile,
  deleteFile,
  fileExists,
  getFileInfo,
  listFiles,
} from "../storage";
import { NotFoundError, ValidationError } from "../middleware/error-handler";
import { config } from "../config";
import { join } from "node:path";
import { mkdir, readdir, unlink, readFile, writeFile } from "node:fs/promises";

export const videoRouter = new Hono();

// Constants
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB max video size

// Validation schemas
const initUploadSchema = z.object({
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.string().regex(/^video\//),
  size: z.number().int().positive().max(MAX_VIDEO_SIZE),
  duration: z.number().optional(),
});

const completeUploadSchema = z.object({
  feedbackId: z.string().optional(),
});

const listQuerySchema = z.object({
  projectId: z.string().optional(),
  sessionId: z.string().optional(),
  status: z.enum(["pending", "uploading", "processing", "ready", "failed"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Initialize a video upload
 */
videoRouter.post("/init", zValidator("json", initUploadSchema), async (c) => {
  const data = c.req.valid("json");

  // Generate video ID
  const videoId = nanoid();

  // Calculate total chunks
  const totalChunks = Math.ceil(data.size / CHUNK_SIZE);

  // Create storage path
  const storagePath = `videos/${videoId}`;

  // Create video record
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  await db.insert(schema.videos).values({
    id: videoId,
    projectId: data.projectId,
    sessionId: data.sessionId,
    filename: data.filename,
    mimeType: data.mimeType,
    size: data.size,
    duration: data.duration ?? null,
    storagePath,
    status: "uploading",
    totalChunks,
    uploadedChunks: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Create chunks directory
  const chunksDir = join(config.uploadDir, storagePath, "chunks");
  await mkdir(chunksDir, { recursive: true });

  // Build upload URL (relative to API)
  const uploadUrl = `/api/v1/videos/${videoId}/chunks`;

  return c.json(
    {
      videoId,
      uploadUrl,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      expiresAt,
    },
    201
  );
});

/**
 * Upload a video chunk
 */
videoRouter.put("/:videoId/chunks/:chunkNumber", async (c) => {
  const { videoId, chunkNumber } = c.req.param();
  const chunkNum = parseInt(chunkNumber, 10);

  if (isNaN(chunkNum) || chunkNum < 0) {
    throw new ValidationError("Invalid chunk number");
  }

  // Get video record
  const video = await db.query.videos.findFirst({
    where: eq(schema.videos.id, videoId),
  });

  if (!video) {
    throw new NotFoundError("Video", videoId);
  }

  if (video.status !== "uploading") {
    throw new ValidationError(`Cannot upload chunks to video with status: ${video.status}`);
  }

  if (chunkNum >= (video.totalChunks ?? 0)) {
    throw new ValidationError(`Chunk number ${chunkNum} exceeds total chunks ${video.totalChunks}`);
  }

  // Get chunk data from request body
  const arrayBuffer = await c.req.arrayBuffer();
  const chunkData = Buffer.from(arrayBuffer);

  if (chunkData.length === 0) {
    throw new ValidationError("Empty chunk data");
  }

  // Save chunk
  const chunkPath = join(video.storagePath, "chunks", `chunk_${chunkNum.toString().padStart(5, "0")}`);
  await saveFile(chunkPath, chunkData);

  // Count uploaded chunks
  const chunksDir = join(config.uploadDir, video.storagePath, "chunks");
  const uploadedFiles = await readdir(chunksDir);
  const uploadedChunks = uploadedFiles.filter((f) => f.startsWith("chunk_")).length;

  // Update video record
  const progress = Math.round((uploadedChunks / (video.totalChunks ?? 1)) * 100);

  await db
    .update(schema.videos)
    .set({
      uploadedChunks,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.videos.id, videoId));

  return c.json({
    videoId,
    chunkNumber: chunkNum,
    totalChunks: video.totalChunks,
    progress,
    complete: uploadedChunks === video.totalChunks,
  });
});

/**
 * Complete video upload
 */
videoRouter.post(
  "/:videoId/complete",
  zValidator("json", completeUploadSchema),
  async (c) => {
    const videoId = c.req.param("videoId");
    const data = c.req.valid("json");

    // Get video record
    const video = await db.query.videos.findFirst({
      where: eq(schema.videos.id, videoId),
    });

    if (!video) {
      throw new NotFoundError("Video", videoId);
    }

    if (video.status !== "uploading") {
      throw new ValidationError(`Cannot complete video with status: ${video.status}`);
    }

    // Verify all chunks are uploaded
    const chunksDir = join(config.uploadDir, video.storagePath, "chunks");
    const uploadedFiles = await readdir(chunksDir);
    const uploadedChunks = uploadedFiles.filter((f) => f.startsWith("chunk_")).length;

    if (uploadedChunks !== video.totalChunks) {
      throw new ValidationError(
        `Upload incomplete: ${uploadedChunks}/${video.totalChunks} chunks uploaded`
      );
    }

    // Update status to processing
    await db
      .update(schema.videos)
      .set({
        status: "processing",
        feedbackId: data.feedbackId ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.videos.id, videoId));

    // Reassemble chunks into final video file
    try {
      const chunks: Buffer[] = [];

      // Read chunks in order
      const sortedFiles = uploadedFiles
        .filter((f) => f.startsWith("chunk_"))
        .sort();

      for (const file of sortedFiles) {
        const chunkPath = join(chunksDir, file);
        const chunkData = await readFile(chunkPath);
        chunks.push(chunkData);
      }

      // Combine chunks
      const finalVideo = Buffer.concat(chunks);

      // Save final video
      const finalPath = join(video.storagePath, video.filename);
      await saveFile(finalPath, finalVideo);

      // Cleanup chunks directory
      for (const file of sortedFiles) {
        const chunkPath = join(chunksDir, file);
        await unlink(chunkPath);
      }

      // Update video status to ready
      await db
        .update(schema.videos)
        .set({
          status: "ready",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.videos.id, videoId));

      // Fetch updated video
      const updatedVideo = await db.query.videos.findFirst({
        where: eq(schema.videos.id, videoId),
      });

      return c.json(formatVideoResponse(updatedVideo!));
    } catch (error) {
      // Mark as failed on error
      await db
        .update(schema.videos)
        .set({
          status: "failed",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.videos.id, videoId));

      throw error;
    }
  }
);

/**
 * Get video metadata
 */
videoRouter.get("/:videoId", async (c) => {
  const videoId = c.req.param("videoId");

  // Handle "stream" and "thumbnail" as separate routes
  if (videoId === "stream" || videoId === "thumbnail") {
    return c.json({ error: "Not found", message: "Video not found" }, 404);
  }

  const video = await db.query.videos.findFirst({
    where: eq(schema.videos.id, videoId),
  });

  if (!video) {
    throw new NotFoundError("Video", videoId);
  }

  return c.json(formatVideoResponse(video));
});

/**
 * Stream video content
 */
videoRouter.get("/:videoId/stream", async (c) => {
  const videoId = c.req.param("videoId");

  const video = await db.query.videos.findFirst({
    where: eq(schema.videos.id, videoId),
  });

  if (!video) {
    throw new NotFoundError("Video", videoId);
  }

  if (video.status !== "ready") {
    throw new ValidationError(`Video is not ready for streaming: ${video.status}`);
  }

  // Get file path
  const filePath = join(video.storagePath, video.filename);

  // Check if file exists
  if (!(await fileExists(filePath))) {
    throw new NotFoundError("Video file", videoId);
  }

  // Get file info
  const fileInfo = await getFileInfo(filePath);
  if (!fileInfo) {
    throw new NotFoundError("Video file", videoId);
  }

  // Handle range requests for video streaming
  const range = c.req.header("range");
  const videoBuffer = await readStoredFile(filePath);

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileInfo.size - 1;
    const chunksize = end - start + 1;

    const chunk = new Uint8Array(videoBuffer.subarray(start, end + 1));

    return new Response(chunk, {
      status: 206,
      headers: {
        "Content-Type": video.mimeType,
        "Content-Range": `bytes ${start}-${end}/${fileInfo.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunksize),
      },
    });
  }

  // Return full video
  return new Response(new Uint8Array(videoBuffer), {
    status: 200,
    headers: {
      "Content-Type": video.mimeType,
      "Accept-Ranges": "bytes",
      "Content-Length": String(fileInfo.size),
    },
  });
});

/**
 * Get video thumbnail
 */
videoRouter.get("/:videoId/thumbnail", async (c) => {
  const videoId = c.req.param("videoId");

  const video = await db.query.videos.findFirst({
    where: eq(schema.videos.id, videoId),
  });

  if (!video) {
    throw new NotFoundError("Video", videoId);
  }

  // Check if thumbnail exists
  if (video.thumbnailPath && (await fileExists(video.thumbnailPath))) {
    const thumbnail = await readStoredFile(video.thumbnailPath);
    return new Response(new Uint8Array(thumbnail), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(thumbnail.length),
      },
    });
  }

  // Return placeholder or 404
  return c.json(
    {
      error: "Not found",
      message: "Thumbnail not available",
    },
    404
  );
});

/**
 * Delete video
 */
videoRouter.delete("/:videoId", async (c) => {
  const videoId = c.req.param("videoId");

  const video = await db.query.videos.findFirst({
    where: eq(schema.videos.id, videoId),
  });

  if (!video) {
    throw new NotFoundError("Video", videoId);
  }

  // Delete files from storage
  try {
    // Delete video file
    const videoPath = join(video.storagePath, video.filename);
    if (await fileExists(videoPath)) {
      await deleteFile(videoPath);
    }

    // Delete thumbnail if exists
    if (video.thumbnailPath && (await fileExists(video.thumbnailPath))) {
      await deleteFile(video.thumbnailPath);
    }

    // Delete any remaining chunks
    const chunksDir = join(video.storagePath, "chunks");
    const chunks = await listFiles(chunksDir);
    for (const chunk of chunks) {
      await deleteFile(join(chunksDir, chunk));
    }
  } catch {
    // Ignore storage errors during deletion
  }

  // Delete from database
  await db.delete(schema.videos).where(eq(schema.videos.id, videoId));

  return c.body(null, 204);
});

/**
 * List videos with pagination and filtering
 */
videoRouter.get("/", zValidator("query", listQuerySchema), async (c) => {
  const query = c.req.valid("query");

  // Build where conditions
  const conditions = [];

  if (query.projectId) {
    conditions.push(eq(schema.videos.projectId, query.projectId));
  }

  if (query.sessionId) {
    conditions.push(eq(schema.videos.sessionId, query.sessionId));
  }

  if (query.status) {
    conditions.push(eq(schema.videos.status, query.status));
  }

  // Calculate offset
  const offset = (query.page - 1) * query.pageSize;

  // Get videos
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [videos, countResult] = await Promise.all([
    db.query.videos.findMany({
      where: whereClause,
      orderBy: [desc(schema.videos.createdAt)],
      limit: query.pageSize,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.videos)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;
  const hasMore = offset + videos.length < total;

  return c.json({
    data: videos.map(formatVideoResponse),
    total,
    page: query.page,
    pageSize: query.pageSize,
    hasMore,
  });
});

/**
 * Format video for API response
 */
function formatVideoResponse(video: schema.Video) {
  return {
    id: video.id,
    projectId: video.projectId,
    sessionId: video.sessionId,
    feedbackId: video.feedbackId,
    filename: video.filename,
    mimeType: video.mimeType,
    size: video.size,
    duration: video.duration,
    status: video.status,
    url: video.status === "ready" ? `/api/v1/videos/${video.id}/stream` : undefined,
    thumbnailUrl: video.thumbnailPath ? `/api/v1/videos/${video.id}/thumbnail` : undefined,
    uploadProgress:
      video.status === "uploading" && video.totalChunks
        ? Math.round(((video.uploadedChunks ?? 0) / video.totalChunks) * 100)
        : undefined,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}
