import "@typespec/http";

using Http;

namespace FeedbackServer.Models;

/**
 * Video recording status
 */
enum VideoStatus {
  uploading,
  processing,
  ready,
  failed,
  deleted,
}

/**
 * Video recording metadata
 */
model Video {
  /** Unique identifier */
  id: string;

  /** Project/app identifier */
  projectId: string;

  /** Client session ID */
  sessionId: string;

  /** Associated feedback ID (if linked) */
  feedbackId?: string;

  /** Video file name */
  filename: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  size: int64;

  /** Duration in seconds */
  duration?: float32;

  /** Video width */
  width?: int32;

  /** Video height */
  height?: int32;

  /** Current status */
  status: VideoStatus;

  /** Storage URL (when ready) */
  url?: string;

  /** Thumbnail URL */
  thumbnailUrl?: string;

  /** Upload progress (0-100) */
  uploadProgress?: int32;

  /** Error message (if failed) */
  error?: string;

  /** Creation timestamp */
  @format("date-time")
  createdAt: string;

  /** Last update timestamp */
  @format("date-time")
  updatedAt: string;
}

/**
 * Video upload initialization request
 */
model InitVideoUploadRequest {
  /** Project/app identifier */
  projectId: string;

  /** Client session ID */
  sessionId: string;

  /** Video file name */
  filename: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  size: int64;

  /** Duration in seconds (if known) */
  duration?: float32;
}

/**
 * Video upload initialization response
 */
model InitVideoUploadResponse {
  /** Video ID for tracking */
  videoId: string;

  /** Upload URL for chunked upload */
  uploadUrl: string;

  /** Chunk size for uploads */
  chunkSize: int32;

  /** Total expected chunks */
  totalChunks: int32;

  /** Upload expiration time */
  @format("date-time")
  expiresAt: string;
}

/**
 * Video chunk upload response
 */
model ChunkUploadResponse {
  /** Video ID */
  videoId: string;

  /** Chunk number uploaded */
  chunkNumber: int32;

  /** Total chunks expected */
  totalChunks: int32;

  /** Overall upload progress (0-100) */
  progress: int32;

  /** Is upload complete */
  complete: boolean;
}

/**
 * Complete video upload request
 */
model CompleteVideoUploadRequest {
  /** Associated feedback ID (optional) */
  feedbackId?: string;
}
