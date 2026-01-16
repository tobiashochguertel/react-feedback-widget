/**
 * Bundle Serializer
 *
 * Utilities for serializing and deserializing feedback bundles.
 * Handles conversion of Blobs to base64 and back.
 *
 * @packageDocumentation
 */

import type { FeedbackData } from '../../types';
import type {
  FeedbackBundle,
  SerializedVideo,
  BundleMetadata,
} from './types';
import { BUNDLE_VERSION, BUNDLE_SOURCE } from './types';

/**
 * Serialize a Blob to a base64 data URL
 *
 * @param blob - Blob to serialize
 * @returns Promise resolving to base64 data URL
 */
export async function serializeBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Deserialize a base64 data URL to a Blob
 *
 * @param dataUrl - Base64 data URL (data:mime/type;base64,...)
 * @param mimeType - MIME type for the resulting Blob
 * @returns Blob instance
 */
export function deserializeBlob(dataUrl: string, mimeType: string): Blob {
  // Extract base64 portion after the comma
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    throw new Error('Invalid data URL: missing comma separator');
  }

  const base64 = dataUrl.substring(commaIndex + 1);

  // Decode base64 to binary
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

/**
 * Create a FeedbackBundle from feedback data and videos
 *
 * @param feedback - Array of feedback items
 * @param videos - Map of video ID to Blob
 * @returns Promise resolving to a complete FeedbackBundle
 */
export async function createBundle(
  feedback: FeedbackData[],
  videos: Map<string, { blob: Blob; duration?: number }>
): Promise<FeedbackBundle> {
  // Serialize all videos to base64
  const serializedVideos: SerializedVideo[] = [];

  for (const [id, record] of videos) {
    try {
      const data = await serializeBlob(record.blob);
      // Build video object conditionally to avoid undefined values
      const video: SerializedVideo = {
        id,
        data,
        mimeType: record.blob.type || 'video/webm',
        size: record.blob.size,
      };
      if (record.duration !== undefined) {
        video.duration = record.duration;
      }
      serializedVideos.push(video);
    } catch (error) {
      // Log but don't fail the entire export for one video
      console.warn(`Failed to serialize video ${id}:`, error);
    }
  }

  // Calculate metadata - build object conditionally to avoid undefined values
  const metadata: BundleMetadata = {
    feedbackCount: feedback.length,
    videoCount: serializedVideos.length,
    totalVideoSize: serializedVideos.reduce((sum, v) => sum + v.size, 0),
  };
  if (typeof navigator !== 'undefined') {
    metadata.userAgent = navigator.userAgent;
  }
  if (typeof window !== 'undefined') {
    metadata.exportUrl = window.location.href;
  }

  return {
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    source: BUNDLE_SOURCE,
    feedback,
    videos: serializedVideos,
    metadata,
  };
}

/**
 * Parse a JSON string to a FeedbackBundle
 *
 * @param json - JSON string to parse
 * @returns Parsed FeedbackBundle
 * @throws Error if JSON is invalid or bundle structure is invalid
 */
export function parseBundle(json: string): FeedbackBundle {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: failed to parse bundle');
  }

  if (!validateBundle(parsed)) {
    throw new Error('Invalid bundle: structure does not match expected format');
  }

  return parsed;
}

/**
 * Validate that an object is a valid FeedbackBundle
 *
 * @param bundle - Object to validate
 * @returns true if the object is a valid FeedbackBundle
 */
export function validateBundle(bundle: unknown): bundle is FeedbackBundle {
  if (!bundle || typeof bundle !== 'object') {
    return false;
  }

  const b = bundle as Record<string, unknown>;

  // Check required string fields
  if (typeof b.version !== 'string') return false;
  if (typeof b.exportedAt !== 'string') return false;
  if (typeof b.source !== 'string') return false;

  // Check arrays
  if (!Array.isArray(b.feedback)) return false;
  if (!Array.isArray(b.videos)) return false;

  // Check metadata object
  if (!b.metadata || typeof b.metadata !== 'object') return false;

  const metadata = b.metadata as Record<string, unknown>;
  if (typeof metadata.feedbackCount !== 'number') return false;
  if (typeof metadata.videoCount !== 'number') return false;

  // Validate videos structure (basic check)
  for (const video of b.videos) {
    if (!video || typeof video !== 'object') return false;
    const v = video as Record<string, unknown>;
    if (typeof v.id !== 'string') return false;
    if (typeof v.data !== 'string') return false;
    if (typeof v.mimeType !== 'string') return false;
  }

  return true;
}

/**
 * Convert a FeedbackBundle to a formatted JSON string
 *
 * @param bundle - Bundle to stringify
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string
 */
export function stringifyBundle(bundle: FeedbackBundle, pretty = true): string {
  return pretty ? JSON.stringify(bundle, null, 2) : JSON.stringify(bundle);
}
