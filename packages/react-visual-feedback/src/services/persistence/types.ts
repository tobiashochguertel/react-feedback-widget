/**
 * Persistence Types
 *
 * Type definitions for the Data Persistence API.
 * Enables export/import of feedback data for backup, transfer, and testing.
 *
 * @packageDocumentation
 */

import type { FeedbackData } from '../../types';

// ============================================
// BUNDLE TYPES
// ============================================

/**
 * Serialized video data for transport/storage
 * Videos are converted to base64 data URLs for JSON compatibility
 */
export interface SerializedVideo {
  /** Video identifier (matches feedback.video reference) */
  id: string;
  /** Base64 data URL (data:video/webm;base64,...) */
  data: string;
  /** MIME type of the video */
  mimeType: string;
  /** Size of the original blob in bytes */
  size: number;
  /** Duration of the video in milliseconds */
  duration?: number;
}

/**
 * Metadata about a feedback bundle
 * Contains summary information for validation and display
 */
export interface BundleMetadata {
  /** Number of feedback items in the bundle */
  feedbackCount: number;
  /** Number of videos in the bundle */
  videoCount: number;
  /** Total size of all videos in bytes */
  totalVideoSize: number;
  /** User agent of the exporting browser */
  userAgent?: string;
  /** URL where the export was performed */
  exportUrl?: string;
}

/**
 * Complete feedback bundle for export/import
 * Self-contained package of feedback data with embedded videos
 */
export interface FeedbackBundle {
  /** Bundle format version (semver) */
  version: string;
  /** ISO timestamp of when the bundle was created */
  exportedAt: string;
  /** Source application identifier */
  source: string;
  /** Array of feedback items */
  feedback: FeedbackData[];
  /** Array of serialized videos */
  videos: SerializedVideo[];
  /** Bundle metadata for validation */
  metadata: BundleMetadata;
}

// ============================================
// EXPORT TYPES
// ============================================

/**
 * Options for exporting feedback data
 */
export interface ExportOptions {
  /** Include video recordings in export (default: true) */
  includeVideos?: boolean;
  /** Filter to specific feedback IDs */
  feedbackIds?: string[];
  /** Filter to specific feedback types */
  typeFilter?: FeedbackData['type'][];
  /** Custom filename for download (without extension) */
  filename?: string;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  /** Whether the export was successful */
  success: boolean;
  /** The exported bundle (if successful) */
  bundle?: FeedbackBundle;
  /** Error message (if failed) */
  error?: string;
}

// ============================================
// IMPORT TYPES
// ============================================

/**
 * How to handle duplicate feedback items during import
 */
export type DuplicateHandling = 'skip' | 'replace' | 'rename';

/**
 * Options for importing feedback data
 */
export interface ImportOptions {
  /** How to handle items with duplicate IDs (default: 'skip') */
  duplicateHandling?: DuplicateHandling;
  /** Include video recordings from import (default: true) */
  includeVideos?: boolean;
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  /** Whether the import was successful */
  success: boolean;
  /** Number of feedback items imported */
  importedCount: number;
  /** Number of items skipped (duplicates or errors) */
  skippedCount: number;
  /** Error messages encountered during import */
  errors: string[];
  /** Warning messages (non-fatal issues) */
  warnings: string[];
}

// ============================================
// SERVICE INTERFACES
// ============================================

/**
 * Export service interface
 * Handles exporting feedback data to bundles and files
 */
export interface ExportService {
  /**
   * Export feedback data to a bundle object
   *
   * @param options - Export options
   * @returns Promise resolving to the feedback bundle
   */
  exportToBundle(options?: ExportOptions): Promise<FeedbackBundle>;

  /**
   * Export feedback data and trigger browser download
   *
   * @param options - Export options
   * @returns Promise resolving when download is triggered
   */
  exportToFile(options?: ExportOptions): Promise<void>;

  /**
   * Download an existing bundle as a file
   *
   * @param bundle - Bundle to download
   * @param filename - Optional filename (without extension)
   */
  downloadBundle(bundle: FeedbackBundle, filename?: string): void;
}

/**
 * Import service interface
 * Handles importing feedback data from files and bundles
 */
export interface ImportService {
  /**
   * Import feedback data from a File object
   *
   * @param file - File to import from
   * @param options - Import options
   * @returns Promise resolving to import result
   */
  importFromFile(file: File, options?: ImportOptions): Promise<ImportResult>;

  /**
   * Import feedback data from a bundle object
   *
   * @param bundle - Bundle to import
   * @param options - Import options
   * @returns Promise resolving to import result
   */
  importFromBundle(
    bundle: FeedbackBundle,
    options?: ImportOptions
  ): Promise<ImportResult>;

  /**
   * Validate a bundle structure
   *
   * @param bundle - Object to validate
   * @returns true if the object is a valid FeedbackBundle
   */
  validateBundle(bundle: unknown): bundle is FeedbackBundle;
}

/**
 * Combined persistence services
 */
export interface PersistenceServices {
  /** Export service instance */
  exportService: ExportService;
  /** Import service instance */
  importService: ImportService;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Current bundle format version
 */
export const BUNDLE_VERSION = '1.0.0';

/**
 * Source identifier for bundles created by this library
 */
export const BUNDLE_SOURCE = 'react-visual-feedback';

/**
 * Maximum number of feedback items to store
 */
export const MAX_FEEDBACK_ITEMS = 50;
