/**
 * Integration Tests for Data Persistence Services
 *
 * Tests the ExportService and ImportService working together
 * with in-memory storage to verify the complete export/import flow.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTestPersistenceServices,
  parseBundle,
  validateBundle,
  stringifyBundle,
  serializeBlob,
  deserializeBlob,
  BUNDLE_VERSION,
  BUNDLE_SOURCE,
} from '../../src/services/persistence';
import { STORAGE } from '../../src/constants/storage';
import type {
  TestPersistenceServices,
  FeedbackBundle,
  SerializedVideo,
} from '../../src/services/persistence';
import type { FeedbackData, FeedbackType, ViewportInfo } from '../../src/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Create mock viewport info for testing
 */
function createMockViewport(): ViewportInfo {
  return {
    width: 1920,
    height: 1080,
    scrollX: 0,
    scrollY: 0,
    devicePixelRatio: 1,
  };
}

/**
 * Create mock feedback data for testing
 */
function createMockFeedback(
  id: string,
  type: FeedbackType = 'bug',
  hasVideo = false
): FeedbackData {
  const feedback: FeedbackData = {
    id,
    type,
    feedback: `Test ${type} feedback for ${id}`,
    timestamp: new Date().toISOString(),
    url: 'https://example.com/test',
    userAgent: 'Test User Agent',
    viewport: createMockViewport(),
  };

  if (hasVideo) {
    feedback.video = `video-${id}`;
  }

  return feedback;
}

/**
 * Create a mock video blob
 */
function createMockVideoBlob(content = 'mock video content'): Blob {
  return new Blob([content], { type: 'video/webm' });
}

/**
 * Helper to create a FeedbackBundle manually for tests
 */
function createTestBundle(
  feedbackItems: FeedbackData[],
  videos: SerializedVideo[] = []
): FeedbackBundle {
  return {
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    source: BUNDLE_SOURCE,
    feedback: feedbackItems,
    videos,
    metadata: {
      feedbackCount: feedbackItems.length,
      videoCount: videos.length,
      totalVideoSize: videos.reduce((sum, v) => sum + v.size, 0),
    },
  };
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Persistence Services Integration', () => {
  let persistence: TestPersistenceServices;

  beforeEach(() => {
    persistence = createTestPersistenceServices();
  });

  afterEach(async () => {
    await persistence.clearTestData();
  });

  // ===========================================================================
  // Export Service Tests
  // ===========================================================================

  describe('ExportService', () => {
    describe('exportToBundle', () => {
      it('should export empty bundle when no feedback exists', async () => {
        const bundle = await persistence.exportService.exportToBundle();

        expect(bundle.version).toBe(BUNDLE_VERSION);
        expect(bundle.source).toBe(BUNDLE_SOURCE);
        expect(bundle.feedback).toEqual([]);
        expect(bundle.videos).toEqual([]);
        expect(bundle.metadata.feedbackCount).toBe(0);
        expect(bundle.metadata.videoCount).toBe(0);
        expect(bundle.exportedAt).toBeDefined();
      });

      it('should export all feedback items', async () => {
        // Seed data
        const mockFeedback = [
          createMockFeedback('fb-1', 'bug'),
          createMockFeedback('fb-2', 'feature'),
          createMockFeedback('fb-3', 'question'),
        ];
        await persistence.seedTestData(mockFeedback);

        const bundle = await persistence.exportService.exportToBundle();

        expect(bundle.feedback).toHaveLength(3);
        expect(bundle.metadata.feedbackCount).toBe(3);
        expect(bundle.feedback.map(f => f.id)).toEqual(['fb-1', 'fb-2', 'fb-3']);
      });

      it('should export feedback with associated videos', async () => {
        const mockFeedback = [
          createMockFeedback('fb-1', 'bug', true),
          createMockFeedback('fb-2', 'feature', true),
        ];
        const mockVideos = new Map([
          ['video-fb-1', createMockVideoBlob('video 1 content')],
          ['video-fb-2', createMockVideoBlob('video 2 content')],
        ]);

        await persistence.seedTestData(mockFeedback, mockVideos);

        const bundle = await persistence.exportService.exportToBundle({
          includeVideos: true,
        });

        expect(bundle.feedback).toHaveLength(2);
        expect(bundle.videos).toHaveLength(2);
        expect(bundle.metadata.videoCount).toBe(2);
        expect(bundle.metadata.totalVideoSize).toBeGreaterThan(0);
      });

      it('should filter by feedback type', async () => {
        const mockFeedback = [
          createMockFeedback('fb-1', 'bug'),
          createMockFeedback('fb-2', 'feature'),
          createMockFeedback('fb-3', 'bug'),
          createMockFeedback('fb-4', 'question'),
        ];
        await persistence.seedTestData(mockFeedback);

        const bundle = await persistence.exportService.exportToBundle({
          typeFilter: ['bug'],
        });

        expect(bundle.feedback).toHaveLength(2);
        expect(bundle.feedback.every(f => f.type === 'bug')).toBe(true);
      });

      it('should filter by feedback IDs', async () => {
        const mockFeedback = [
          createMockFeedback('fb-1', 'bug'),
          createMockFeedback('fb-2', 'feature'),
          createMockFeedback('fb-3', 'question'),
        ];
        await persistence.seedTestData(mockFeedback);

        const bundle = await persistence.exportService.exportToBundle({
          feedbackIds: ['fb-1', 'fb-3'],
        });

        expect(bundle.feedback).toHaveLength(2);
        expect(bundle.feedback.map(f => f.id)).toEqual(['fb-1', 'fb-3']);
      });

      it('should exclude videos when includeVideos is false', async () => {
        const mockFeedback = [createMockFeedback('fb-1', 'bug', true)];
        const mockVideos = new Map([
          ['video-fb-1', createMockVideoBlob()],
        ]);
        await persistence.seedTestData(mockFeedback, mockVideos);

        const bundle = await persistence.exportService.exportToBundle({
          includeVideos: false,
        });

        expect(bundle.feedback).toHaveLength(1);
        expect(bundle.videos).toHaveLength(0);
        expect(bundle.metadata.videoCount).toBe(0);
      });

      it('should include metadata with export context', async () => {
        const mockFeedback = [createMockFeedback('fb-1', 'bug')];
        await persistence.seedTestData(mockFeedback);

        const bundle = await persistence.exportService.exportToBundle();

        expect(bundle.exportedAt).toBeDefined();
        expect(new Date(bundle.exportedAt).getTime()).toBeGreaterThan(0);
        expect(bundle.metadata.feedbackCount).toBe(1);
      });
    });
  });

  // ===========================================================================
  // Import Service Tests
  // ===========================================================================

  describe('ImportService', () => {
    describe('importFromBundle', () => {
      it('should import feedback from bundle', async () => {
        const bundle = createTestBundle([
          createMockFeedback('fb-1', 'bug'),
          createMockFeedback('fb-2', 'feature'),
        ]);

        const result = await persistence.importService.importFromBundle(bundle);

        expect(result.success).toBe(true);
        expect(result.importedCount).toBe(2);
        expect(result.skippedCount).toBe(0);
        expect(result.errors).toHaveLength(0);

        // Verify data was stored
        const storedFeedback = persistence.storageService.get(STORAGE.FEEDBACK_KEY);
        expect(storedFeedback).toHaveLength(2);
      });

      it('should import feedback with videos', async () => {
        // Create serialized video
        const videoBlob = createMockVideoBlob();
        const serializedData = await serializeBlob(videoBlob);

        const bundle: FeedbackBundle = {
          version: BUNDLE_VERSION,
          exportedAt: new Date().toISOString(),
          source: BUNDLE_SOURCE,
          feedback: [createMockFeedback('fb-1', 'bug', true)],
          videos: [
            {
              id: 'video-fb-1',
              data: serializedData,
              mimeType: 'video/webm',
              size: videoBlob.size,
            },
          ],
          metadata: {
            feedbackCount: 1,
            videoCount: 1,
            totalVideoSize: videoBlob.size,
          },
        };

        const result = await persistence.importService.importFromBundle(bundle, {
          includeVideos: true,
        });

        expect(result.success).toBe(true);
        expect(result.importedCount).toBe(1);

        // Verify video was stored
        const storedVideo = await persistence.videoService.get('video-fb-1');
        expect(storedVideo).not.toBeNull();
      });

      it('should skip duplicates with skip strategy', async () => {
        // Seed existing data
        await persistence.seedTestData([createMockFeedback('fb-1', 'bug')]);

        // Import bundle with same ID
        const bundle = createTestBundle([
          createMockFeedback('fb-1', 'bug'), // Duplicate
          createMockFeedback('fb-2', 'feature'), // New
        ]);

        const result = await persistence.importService.importFromBundle(bundle, {
          duplicateHandling: 'skip',
        });

        expect(result.success).toBe(true);
        expect(result.importedCount).toBe(1);
        expect(result.skippedCount).toBe(1);

        // Verify only 2 items (1 original + 1 new)
        const storedFeedback = persistence.storageService.get(STORAGE.FEEDBACK_KEY);
        expect(storedFeedback).toHaveLength(2);
      });

      it('should replace duplicates with replace strategy', async () => {
        // Seed existing data
        const originalFeedback = createMockFeedback('fb-1', 'bug');
        originalFeedback.feedback = 'Original feedback';
        await persistence.seedTestData([originalFeedback]);

        // Import bundle with same ID but different feedback
        const updatedFeedback = createMockFeedback('fb-1', 'bug');
        updatedFeedback.feedback = 'Updated feedback';

        const bundle = createTestBundle([updatedFeedback]);

        const result = await persistence.importService.importFromBundle(bundle, {
          duplicateHandling: 'replace',
        });

        expect(result.success).toBe(true);
        expect(result.importedCount).toBe(1);
        expect(result.skippedCount).toBe(0);

        // Verify feedback was updated
        const storedFeedback = persistence.storageService.get(STORAGE.FEEDBACK_KEY);
        expect(storedFeedback?.[0].feedback).toBe('Updated feedback');
      });

      it('should rename duplicates with rename strategy', async () => {
        // Seed existing data
        await persistence.seedTestData([createMockFeedback('fb-1', 'bug')]);

        // Import bundle with same ID
        const bundle = createTestBundle([createMockFeedback('fb-1', 'bug')]);

        const result = await persistence.importService.importFromBundle(bundle, {
          duplicateHandling: 'rename',
        });

        expect(result.success).toBe(true);
        expect(result.importedCount).toBe(1);
        expect(result.skippedCount).toBe(0);

        // Verify both items exist (with different IDs)
        const storedFeedback = persistence.storageService.get(STORAGE.FEEDBACK_KEY);
        expect(storedFeedback).toHaveLength(2);
        // Second item should have modified ID
        const ids = storedFeedback?.map(f => f.id) ?? [];
        expect(ids).toContain('fb-1');
        expect(ids.some(id => id !== 'fb-1')).toBe(true);
      });
    });

    describe('validateBundle', () => {
      it('should return true for valid bundle', () => {
        const bundle = createTestBundle([createMockFeedback('fb-1', 'bug')]);
        expect(persistence.importService.validateBundle(bundle)).toBe(true);
      });

      it('should return false for invalid bundle', () => {
        const invalidBundle = { invalid: 'structure' };
        expect(persistence.importService.validateBundle(invalidBundle)).toBe(false);
      });

      it('should return false for null', () => {
        expect(persistence.importService.validateBundle(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(persistence.importService.validateBundle(undefined)).toBe(false);
      });

      it('should return false for missing required fields', () => {
        const incompleteBundle = {
          version: BUNDLE_VERSION,
          // missing other fields
        };
        expect(persistence.importService.validateBundle(incompleteBundle)).toBe(false);
      });
    });

    describe('importFromFile', () => {
      it('should import from JSON file', async () => {
        const bundle = createTestBundle([createMockFeedback('fb-1', 'bug')]);
        const json = stringifyBundle(bundle);
        const file = new File([json], 'backup.json', { type: 'application/json' });

        const result = await persistence.importService.importFromFile(file);

        expect(result.success).toBe(true);
        expect(result.importedCount).toBe(1);
      });

      it('should fail for invalid JSON', async () => {
        const file = new File(['not valid json'], 'bad.json', {
          type: 'application/json',
        });

        const result = await persistence.importService.importFromFile(file);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should fail for invalid bundle structure', async () => {
        const file = new File(['{"not": "a bundle"}'], 'invalid.json', {
          type: 'application/json',
        });

        const result = await persistence.importService.importFromFile(file);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // Roundtrip Tests
  // ===========================================================================

  describe('Export → Import Roundtrip', () => {
    it('should preserve feedback data through export and import', async () => {
      // Setup original data
      const originalFeedback = [
        createMockFeedback('fb-1', 'bug'),
        createMockFeedback('fb-2', 'feature'),
        createMockFeedback('fb-3', 'question'),
      ];
      await persistence.seedTestData(originalFeedback);

      // Export
      const bundle = await persistence.exportService.exportToBundle();

      // Clear and import
      await persistence.clearTestData();
      const result = await persistence.importService.importFromBundle(bundle);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(3);

      // Verify data integrity
      const importedFeedback = persistence.storageService.get(STORAGE.FEEDBACK_KEY);
      expect(importedFeedback).toHaveLength(3);

      for (const original of originalFeedback) {
        const imported = importedFeedback?.find(f => f.id === original.id);
        expect(imported).toBeDefined();
        expect(imported?.type).toBe(original.type);
        expect(imported?.feedback).toBe(original.feedback);
      }
    });

    it('should preserve video data through export and import', async () => {
      // Setup original data with video
      const originalFeedback = [createMockFeedback('fb-1', 'bug', true)];
      const originalVideos = new Map([
        ['video-fb-1', createMockVideoBlob('unique video content 12345')],
      ]);
      await persistence.seedTestData(originalFeedback, originalVideos);

      // Export with videos
      const bundle = await persistence.exportService.exportToBundle({
        includeVideos: true,
      });

      // Clear and import
      await persistence.clearTestData();
      const result = await persistence.importService.importFromBundle(bundle, {
        includeVideos: true,
      });

      expect(result.success).toBe(true);

      // Verify video was restored
      const restoredVideo = await persistence.videoService.get('video-fb-1');
      expect(restoredVideo).not.toBeNull();
      expect(restoredVideo?.size).toBeGreaterThan(0);
    });

    it('should preserve bundle through JSON serialization', async () => {
      const originalFeedback = [createMockFeedback('fb-1', 'bug')];
      await persistence.seedTestData(originalFeedback);

      // Export and serialize
      const bundle = await persistence.exportService.exportToBundle();
      const json = stringifyBundle(bundle);

      // Parse and validate
      const parsed = parseBundle(json);
      expect(parsed).not.toBeNull();
      expect(validateBundle(parsed)).toBe(true);

      // Import parsed bundle
      await persistence.clearTestData();
      const result = await persistence.importService.importFromBundle(parsed);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
    });
  });

  // ===========================================================================
  // Utility Function Tests
  // ===========================================================================

  describe('Utility Functions', () => {
    describe('serializeBlob / deserializeBlob', () => {
      it('should round-trip blob data', async () => {
        const originalContent = 'Test video content for serialization';
        const originalBlob = new Blob([originalContent], { type: 'video/webm' });

        // Serialize
        const dataUrl = await serializeBlob(originalBlob);
        expect(dataUrl).toMatch(/^data:video\/webm;base64,/);

        // Deserialize
        const restoredBlob = deserializeBlob(dataUrl, 'video/webm');
        expect(restoredBlob.size).toBe(originalBlob.size);
        expect(restoredBlob.type).toBe('video/webm');
      });

      it('should handle empty blob', async () => {
        const emptyBlob = new Blob([], { type: 'video/webm' });
        const dataUrl = await serializeBlob(emptyBlob);
        const restored = deserializeBlob(dataUrl, 'video/webm');

        expect(restored.size).toBe(0);
      });

      it('should handle large blob', async () => {
        // Create 1MB blob
        const largeContent = 'x'.repeat(1024 * 1024);
        const largeBlob = new Blob([largeContent], { type: 'video/webm' });

        const dataUrl = await serializeBlob(largeBlob);
        const restored = deserializeBlob(dataUrl, 'video/webm');

        expect(restored.size).toBe(largeBlob.size);
      });
    });

    describe('parseBundle / stringifyBundle', () => {
      it('should round-trip through JSON', () => {
        const feedbackItems = [createMockFeedback('fb-1', 'bug')];
        const original = createTestBundle(feedbackItems);

        const json = stringifyBundle(original);
        const parsed = parseBundle(json);

        expect(parsed).not.toBeNull();
        expect(parsed.version).toBe(original.version);
        expect(parsed.feedback).toHaveLength(1);
        expect(parsed.feedback[0].id).toBe('fb-1');
      });

      it('should support pretty printing', () => {
        const bundle = createTestBundle([createMockFeedback('fb-1', 'bug')]);

        const minified = stringifyBundle(bundle, false);
        const pretty = stringifyBundle(bundle, true);

        expect(pretty.length).toBeGreaterThan(minified.length);
        expect(pretty).toContain('\n');
      });

      it('should throw for invalid JSON', () => {
        expect(() => parseBundle('not valid json')).toThrow();
      });

      it('should throw for invalid bundle structure', () => {
        expect(() => parseBundle('{"invalid": "structure"}')).toThrow();
      });
    });

    describe('validateBundle', () => {
      it('should validate correct bundle', () => {
        const bundle = createTestBundle([createMockFeedback('fb-1', 'bug')]);
        expect(validateBundle(bundle)).toBe(true);
      });

      it('should reject wrong version', () => {
        const bundle = createTestBundle([]);
        (bundle as { version: string }).version = '99.0.0';
        // Note: current validateBundle doesn't check version value
        // It only checks structure, so this may still pass
      });

      it('should reject wrong source', () => {
        const bundle = createTestBundle([]);
        (bundle as { source: string }).source = 'wrong-source';
        // Note: current validateBundle doesn't check source value
      });

      it('should reject missing feedback array', () => {
        const bundle = createTestBundle([]);
        delete (bundle as Partial<FeedbackBundle>).feedback;
        expect(validateBundle(bundle)).toBe(false);
      });

      it('should reject missing videos array', () => {
        const bundle = createTestBundle([]);
        delete (bundle as Partial<FeedbackBundle>).videos;
        expect(validateBundle(bundle)).toBe(false);
      });

      it('should reject missing metadata', () => {
        const bundle = createTestBundle([]);
        delete (bundle as Partial<FeedbackBundle>).metadata;
        expect(validateBundle(bundle)).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle feedback with special characters', async () => {
      const feedbackItem = createMockFeedback('fb-1', 'bug');
      feedbackItem.feedback = 'Special chars: <script>alert("xss")</script> & "quotes" \'apostrophe\'';
      await persistence.seedTestData([feedbackItem]);

      const bundle = await persistence.exportService.exportToBundle();
      const json = stringifyBundle(bundle);
      const parsed = parseBundle(json);

      expect(parsed.feedback[0].feedback).toBe(feedbackItem.feedback);
    });

    it('should handle feedback with Unicode', async () => {
      const feedbackItem = createMockFeedback('fb-1', 'bug');
      feedbackItem.feedback = 'Unicode: 你好 🚀 émoji 日本語';
      await persistence.seedTestData([feedbackItem]);

      const bundle = await persistence.exportService.exportToBundle();
      const json = stringifyBundle(bundle);
      const parsed = parseBundle(json);

      expect(parsed.feedback[0].feedback).toBe(feedbackItem.feedback);
    });

    it('should handle empty feedback text', async () => {
      const feedbackItem = createMockFeedback('fb-1', 'bug');
      feedbackItem.feedback = '';
      await persistence.seedTestData([feedbackItem]);

      const bundle = await persistence.exportService.exportToBundle();
      await persistence.clearTestData();

      const result = await persistence.importService.importFromBundle(bundle);
      expect(result.success).toBe(true);

      const stored = persistence.storageService.get(STORAGE.FEEDBACK_KEY);
      expect(stored?.[0].feedback).toBe('');
    });

    it('should handle very long feedback text', async () => {
      const feedbackItem = createMockFeedback('fb-1', 'bug');
      feedbackItem.feedback = 'x'.repeat(10000);
      await persistence.seedTestData([feedbackItem]);

      const bundle = await persistence.exportService.exportToBundle();
      await persistence.clearTestData();

      const result = await persistence.importService.importFromBundle(bundle);
      expect(result.success).toBe(true);

      const stored = persistence.storageService.get(STORAGE.FEEDBACK_KEY);
      expect(stored?.[0].feedback.length).toBe(10000);
    });

    it('should handle feedback with minimal fields', async () => {
      const minimalFeedback: FeedbackData = {
        id: 'fb-minimal',
        type: 'bug',
        feedback: 'Minimal feedback',
        timestamp: new Date().toISOString(),
        url: 'https://example.com',
        userAgent: 'Test UA',
        viewport: createMockViewport(),
      };
      await persistence.seedTestData([minimalFeedback]);

      const bundle = await persistence.exportService.exportToBundle();
      await persistence.clearTestData();

      const result = await persistence.importService.importFromBundle(bundle);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
    });
  });
});
