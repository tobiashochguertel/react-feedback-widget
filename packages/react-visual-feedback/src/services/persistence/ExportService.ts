/**
 * Export Service
 *
 * Service for exporting feedback data to bundles and downloadable files.
 *
 * @packageDocumentation
 */

import type { FeedbackData } from '../../types';
import type { StorageService } from '../storage/StorageService';
import type { VideoStorageService } from '../storage/VideoStorageService';
import type {
  ExportService,
  ExportOptions,
  FeedbackBundle,
} from './types';
import { STORAGE } from '../../constants/storage';
import { createBundle, stringifyBundle } from './BundleSerializer';

/**
 * Dependencies required by the ExportService
 */
export interface ExportServiceDeps {
  /** Storage service for feedback data */
  storageService: StorageService<FeedbackData[]>;
  /** Video storage service for recorded sessions */
  videoService: VideoStorageService;
}

/**
 * Create an ExportService instance
 *
 * @param deps - Service dependencies
 * @returns ExportService instance
 */
export function createExportService(deps: ExportServiceDeps): ExportService {
  const { storageService, videoService } = deps;

  /**
   * Extract video ID from video reference string
   * Format: "video:uuid" or just the raw ID
   */
  function extractVideoId(videoRef: string | undefined | null): string | null {
    if (!videoRef) return null;
    if (videoRef.startsWith('video:')) {
      return videoRef.substring(6);
    }
    return videoRef;
  }

  /**
   * Generate a filename for the export
   */
  function generateFilename(customName?: string): string {
    if (customName) {
      return `${customName}.json`;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `feedback-export-${timestamp}.json`;
  }

  /**
   * Trigger a browser download for the given content
   */
  function triggerDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return {
    async exportToBundle(options: ExportOptions = {}): Promise<FeedbackBundle> {
      const {
        includeVideos = true,
        feedbackIds,
        typeFilter,
      } = options;

      // Get all feedback from storage
      let feedback = storageService.get(STORAGE.FEEDBACK_KEY) || [];

      // Apply ID filter if specified
      if (feedbackIds && feedbackIds.length > 0) {
        const idSet = new Set(feedbackIds);
        feedback = feedback.filter((f) => idSet.has(f.id));
      }

      // Apply type filter if specified
      if (typeFilter && typeFilter.length > 0) {
        const typeSet = new Set(typeFilter);
        feedback = feedback.filter((f) => typeSet.has(f.type));
      }

      // Collect videos for the filtered feedback
      const videos = new Map<string, { blob: Blob; duration?: number }>();

      if (includeVideos) {
        for (const item of feedback) {
          const videoId = extractVideoId(item.video);
          if (videoId) {
            try {
              const record = await videoService.getRecord(videoId);
              if (record) {
                // Build video entry conditionally to avoid undefined values
                const videoEntry: { blob: Blob; duration?: number } = {
                  blob: record.blob,
                };
                if (record.duration !== undefined) {
                  videoEntry.duration = record.duration;
                }
                videos.set(videoId, videoEntry);
              }
            } catch (error) {
              console.warn(`Failed to retrieve video ${videoId}:`, error);
            }
          }
        }
      }

      return createBundle(feedback, videos);
    },

    async exportToFile(options: ExportOptions = {}): Promise<void> {
      const bundle = await this.exportToBundle(options);
      const json = stringifyBundle(bundle);
      const filename = generateFilename(options.filename);
      triggerDownload(json, filename);
    },

    downloadBundle(bundle: FeedbackBundle, filename?: string): void {
      const json = stringifyBundle(bundle);
      const name = generateFilename(filename);
      triggerDownload(json, name);
    },
  };
}
