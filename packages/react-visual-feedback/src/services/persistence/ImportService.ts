/**
 * Import Service
 *
 * Service for importing feedback data from files and bundles.
 *
 * @packageDocumentation
 */

import type { FeedbackData } from '../../types';
import type { StorageService } from '../storage/StorageService';
import type { VideoStorageService } from '../storage/VideoStorageService';
import type {
  ImportService,
  ImportOptions,
  ImportResult,
  FeedbackBundle,
} from './types';
import { MAX_FEEDBACK_ITEMS } from './types';
import { STORAGE } from '../../constants/storage';
import { parseBundle, validateBundle, deserializeBlob } from './BundleSerializer';

/**
 * Dependencies required by the ImportService
 */
export interface ImportServiceDeps {
  /** Storage service for feedback data */
  storageService: StorageService<FeedbackData[]>;
  /** Video storage service for recorded sessions */
  videoService: VideoStorageService;
}

/**
 * Create an ImportService instance
 *
 * @param deps - Service dependencies
 * @returns ImportService instance
 */
export function createImportService(deps: ImportServiceDeps): ImportService {
  const { storageService, videoService } = deps;

  /**
   * Read file contents as text
   */
  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsText(file);
    });
  }

  /**
   * Generate a unique ID for renamed duplicates
   */
  function generateRenamedId(originalId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${originalId}-imported-${timestamp}-${random}`;
  }

  return {
    async importFromFile(
      file: File,
      options: ImportOptions = {}
    ): Promise<ImportResult> {
      try {
        const text = await readFileAsText(file);
        const bundle = parseBundle(text);
        return this.importFromBundle(bundle, options);
      } catch (error) {
        return {
          success: false,
          importedCount: 0,
          skippedCount: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error reading file'],
          warnings: [],
        };
      }
    },

    async importFromBundle(
      bundle: FeedbackBundle,
      options: ImportOptions = {}
    ): Promise<ImportResult> {
      const {
        duplicateHandling = 'skip',
        includeVideos = true,
      } = options;

      const result: ImportResult = {
        success: true,
        importedCount: 0,
        skippedCount: 0,
        errors: [],
        warnings: [],
      };

      // Validate bundle structure
      if (!validateBundle(bundle)) {
        return {
          success: false,
          importedCount: 0,
          skippedCount: 0,
          errors: ['Invalid bundle format'],
          warnings: [],
        };
      }

      // Get existing feedback
      const existing = storageService.get(STORAGE.FEEDBACK_KEY) || [];
      const existingIds = new Set(existing.map((f) => f.id));
      const importedFeedback: FeedbackData[] = [...existing];

      // Create a map for video ID remapping (when using 'rename')
      const videoIdMap = new Map<string, string>();

      // Process each feedback item
      for (const feedback of bundle.feedback) {
        const isDuplicate = existingIds.has(feedback.id);

        if (isDuplicate) {
          switch (duplicateHandling) {
            case 'skip':
              result.skippedCount++;
              result.warnings.push(`Skipped duplicate: ${feedback.id}`);
              continue;

            case 'replace': {
              // Find and replace the existing item
              const index = importedFeedback.findIndex((f) => f.id === feedback.id);
              if (index !== -1) {
                importedFeedback[index] = feedback;
                result.importedCount++;
              }
              break;
            }

            case 'rename': {
              // Generate new ID and update references
              const oldId = feedback.id;
              const newId = generateRenamedId(oldId);
              feedback.id = newId;

              // Update video reference if present
              if (feedback.video?.startsWith('video:')) {
                const oldVideoId = feedback.video.substring(6);
                const newVideoId = generateRenamedId(oldVideoId);
                videoIdMap.set(oldVideoId, newVideoId);
                feedback.video = `video:${newVideoId}`;
              }

              importedFeedback.push(feedback);
              existingIds.add(newId);
              result.importedCount++;
              break;
            }
          }
        } else {
          // New item, just add it
          importedFeedback.push(feedback);
          existingIds.add(feedback.id);
          result.importedCount++;
        }
      }

      // Import videos if requested
      if (includeVideos && bundle.videos.length > 0) {
        for (const video of bundle.videos) {
          try {
            // Check if this video ID was remapped
            const targetId = videoIdMap.get(video.id) || video.id;

            // Deserialize and store the video
            const blob = deserializeBlob(video.data, video.mimeType);
            // Build options conditionally to avoid undefined values
            const options: { duration?: number } = {};
            if (video.duration !== undefined) {
              options.duration = video.duration;
            }
            await videoService.save(targetId, blob, options);
          } catch (error) {
            result.warnings.push(
              `Failed to import video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      }

      // Enforce maximum feedback limit
      const trimmedFeedback = importedFeedback.slice(0, MAX_FEEDBACK_ITEMS);
      if (importedFeedback.length > MAX_FEEDBACK_ITEMS) {
        const removed = importedFeedback.length - MAX_FEEDBACK_ITEMS;
        result.warnings.push(
          `Storage limit reached: removed ${removed} oldest items to stay under ${MAX_FEEDBACK_ITEMS} limit`
        );
      }

      // Save to storage
      const saveSuccess = storageService.set(STORAGE.FEEDBACK_KEY, trimmedFeedback);
      if (!saveSuccess) {
        result.success = false;
        result.errors.push('Failed to save feedback to storage');
      }

      return result;
    },

    validateBundle(bundle: unknown): bundle is FeedbackBundle {
      return validateBundle(bundle);
    },
  };
}
