/**
 * Storage-related constants
 *
 * @packageDocumentation
 */

/**
 * Storage configuration constants
 */
export const STORAGE = {
  /** Key used for storing feedback data in localStorage */
  FEEDBACK_KEY: 'react-feedback-data',

  /** IndexedDB database name for video storage */
  VIDEO_DB_NAME: 'FeedbackVideoDB',

  /** IndexedDB object store name for videos */
  VIDEO_STORE_NAME: 'videos',

  /** Maximum video size in megabytes */
  MAX_VIDEO_SIZE_MB: 500,

  /** Maximum video size in bytes (calculated from MB) */
  get MAX_VIDEO_SIZE_BYTES(): number {
    return this.MAX_VIDEO_SIZE_MB * 1024 * 1024;
  },
} as const;

/**
 * Type for storage keys
 */
export type StorageKey = keyof typeof STORAGE;
