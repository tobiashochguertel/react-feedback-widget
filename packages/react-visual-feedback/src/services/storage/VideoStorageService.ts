/**
 * Video Storage Service Interface
 *
 * Specialized interface for storing and retrieving video blobs.
 * Designed for IndexedDB or similar blob-capable storage.
 *
 * @packageDocumentation
 */

/**
 * Video record stored in the database
 */
export interface VideoRecord {
  /** Unique identifier for the video */
  id: string;
  /** Video blob data */
  blob: Blob;
  /** Timestamp when the video was stored */
  timestamp: number;
  /** Optional video duration in seconds */
  duration?: number;
  /** Optional MIME type */
  mimeType?: string;
  /** Optional file size in bytes */
  size?: number;
}

/**
 * Options for storing a video
 */
export interface VideoStorageOptions {
  /** Override the timestamp (defaults to Date.now()) */
  timestamp?: number;
  /** Video duration in seconds */
  duration?: number;
}

/**
 * Video storage service interface
 *
 * Provides async operations for storing and retrieving video blobs,
 * typically using IndexedDB for large binary storage.
 */
export interface VideoStorageService {
  /**
   * Store a video blob
   *
   * @param id - Unique identifier for the video
   * @param blob - Video blob to store
   * @param options - Optional storage options
   * @returns true if successful
   */
  save(id: string, blob: Blob, options?: VideoStorageOptions): Promise<boolean>;

  /**
   * Retrieve a video blob by ID
   *
   * @param id - Video identifier
   * @returns Video blob or null if not found
   */
  get(id: string): Promise<Blob | null>;

  /**
   * Retrieve full video record by ID
   *
   * @param id - Video identifier
   * @returns Full video record or null if not found
   */
  getRecord(id: string): Promise<VideoRecord | null>;

  /**
   * Delete a video by ID
   *
   * @param id - Video identifier
   * @returns true if successful
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if a video exists
   *
   * @param id - Video identifier
   * @returns true if video exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Get all video IDs
   *
   * @returns Array of video identifiers
   */
  listIds(): Promise<string[]>;

  /**
   * Clear all stored videos
   *
   * @returns true if successful
   */
  clear(): Promise<boolean>;

  /**
   * Get total storage size used
   *
   * @returns Size in bytes
   */
  getStorageSize(): Promise<number>;
}
