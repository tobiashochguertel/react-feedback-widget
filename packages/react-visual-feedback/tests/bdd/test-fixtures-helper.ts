/**
 * Test Fixtures Helper for BDD Tests
 *
 * Provides pre-populated feedback data and utilities for
 * seeding/clearing storage in Playwright tests.
 *
 * @packageDocumentation
 */

import type { Page } from '@playwright/test';
import type { FeedbackData, FeedbackType, EventLog } from '../../src/types';
import type { FeedbackBundle, SerializedVideo } from '../../src/services/persistence/types';
import {
  BUNDLE_VERSION,
  BUNDLE_SOURCE,
  MAX_FEEDBACK_ITEMS,
} from '../../src/services/persistence/types';
import { STORAGE } from '../../src/constants/storage';

// ============================================
// MOCK DATA GENERATORS
// ============================================

/**
 * Generate a unique ID for test data
 */
export function generateTestId(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create a mock feedback item
 */
export function createMockFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
  const id = overrides.id || generateTestId('feedback');
  const now = Date.now();

  return {
    id,
    type: 'bug' as FeedbackType,
    description: `Test feedback description for ${id}`,
    status: 'pending',
    timestamp: now,
    url: 'http://localhost:3000/',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    screenshot: undefined,
    video: undefined,
    events: [],
    metadata: {
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      devicePixelRatio: 1,
      language: 'en-US',
      platform: 'Test Platform',
      cookiesEnabled: true,
    },
    ...overrides,
  };
}

/**
 * Create a mock event log entry
 */
export function createMockEventLog(overrides: Partial<EventLog> = {}): EventLog {
  return {
    type: 'click',
    timestamp: Date.now(),
    data: {
      target: 'button.test-button',
      x: 100,
      y: 200,
    },
    ...overrides,
  };
}

/**
 * Create a minimal video blob (WebM header bytes)
 * This is a valid WebM container header
 */
export function createMockVideoBlob(): Blob {
  // Minimal WebM file header bytes
  const webmHeader = new Uint8Array([
    0x1A, 0x45, 0xDF, 0xA3, // EBML header
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F, // Size
    0x42, 0x86, 0x81, 0x01, // EBMLVersion
    0x42, 0xF7, 0x81, 0x01, // EBMLReadVersion
    0x42, 0xF2, 0x81, 0x04, // EBMLMaxIDLength
    0x42, 0xF3, 0x81, 0x08, // EBMLMaxSizeLength
    0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D, // DocType "webm"
  ]);

  return new Blob([webmHeader], { type: 'video/webm' });
}

/**
 * Serialize a Blob to base64 data URL
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================
// STANDARD TEST FIXTURES
// ============================================

/**
 * Standard test fixtures with various feedback items
 */
export const STANDARD_FIXTURES = {
  /**
   * Feedback items for testing different statuses
   */
  statusFeedback: [
    createMockFeedback({ id: 'status-pending', status: 'pending', description: 'Pending feedback item' }),
    createMockFeedback({ id: 'status-in-progress', status: 'in-progress', description: 'In-progress feedback item' }),
    createMockFeedback({ id: 'status-completed', status: 'completed', description: 'Completed feedback item' }),
    createMockFeedback({ id: 'status-rejected', status: 'rejected', description: 'Rejected feedback item' }),
  ],

  /**
   * Feedback items for testing different types
   */
  typeFeedback: [
    createMockFeedback({ id: 'type-bug', type: 'bug' as FeedbackType, description: 'Bug report' }),
    createMockFeedback({ id: 'type-feature', type: 'feature' as FeedbackType, description: 'Feature request' }),
    createMockFeedback({ id: 'type-improvement', type: 'improvement' as FeedbackType, description: 'Improvement suggestion' }),
  ],

  /**
   * Feedback with video reference
   */
  videoFeedback: createMockFeedback({
    id: 'feedback-with-video',
    description: 'Feedback with video recording',
    video: 'video:test-video-001',
  }),

  /**
   * Feedback with event logs
   */
  eventsFeedback: createMockFeedback({
    id: 'feedback-with-events',
    description: 'Feedback with event logs',
    events: [
      createMockEventLog({ type: 'click', data: { target: 'button.submit' } }),
      createMockEventLog({ type: 'input', data: { target: 'input.email', value: 'test@example.com' } }),
      createMockEventLog({ type: 'scroll', data: { scrollY: 500 } }),
    ],
  }),
};

/**
 * Get all standard feedback items as an array
 */
export function getAllStandardFeedback(): FeedbackData[] {
  return [
    ...STANDARD_FIXTURES.statusFeedback,
    ...STANDARD_FIXTURES.typeFeedback,
    STANDARD_FIXTURES.videoFeedback,
    STANDARD_FIXTURES.eventsFeedback,
  ];
}

// ============================================
// PAGE HELPERS FOR PLAYWRIGHT
// ============================================

/**
 * Seed feedback data into the page's localStorage
 */
export async function seedFeedbackData(page: Page, feedback: FeedbackData[]): Promise<void> {
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: STORAGE.FEEDBACK_KEY, data: feedback }
  );
}

/**
 * Seed video data into the page's IndexedDB
 */
export async function seedVideoData(
  page: Page,
  videos: Array<{ id: string; dataUrl: string }>
): Promise<void> {
  await page.evaluate(
    async ({ dbName, storeName, videos }) => {
      // Open IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        };
      });

      // Convert data URLs back to blobs and store
      for (const video of videos) {
        const response = await fetch(video.dataUrl);
        const blob = await response.blob();

        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const record = { id: video.id, blob, timestamp: Date.now() };
          const request = store.put(record);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      db.close();
    },
    {
      dbName: STORAGE.VIDEO_DB_NAME,
      storeName: STORAGE.VIDEO_STORE_NAME,
      videos,
    }
  );
}

/**
 * Clear all feedback data from localStorage
 */
export async function clearFeedbackData(page: Page): Promise<void> {
  await page.evaluate(
    ({ key }) => {
      localStorage.removeItem(key);
    },
    { key: STORAGE.FEEDBACK_KEY }
  );
}

/**
 * Clear all video data from IndexedDB
 */
export async function clearVideoData(page: Page): Promise<void> {
  await page.evaluate(
    async ({ dbName }) => {
      // Delete the entire database
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve(); // Proceed even if blocked
      });
    },
    { dbName: STORAGE.VIDEO_DB_NAME }
  );
}

/**
 * Clear all feedback and video data
 */
export async function clearAllData(page: Page): Promise<void> {
  await Promise.all([
    clearFeedbackData(page),
    clearVideoData(page),
  ]);
}

/**
 * Get feedback data from localStorage
 */
export async function getFeedbackData(page: Page): Promise<FeedbackData[]> {
  return page.evaluate(
    ({ key }) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },
    { key: STORAGE.FEEDBACK_KEY }
  );
}

/**
 * Load standard test fixtures into the page
 */
export async function loadStandardFixtures(page: Page): Promise<void> {
  // Create mock video blob and convert to data URL
  const videoBlob = createMockVideoBlob();
  const videoDataUrl = await blobToDataUrl(videoBlob);

  // Seed feedback data
  await seedFeedbackData(page, getAllStandardFeedback());

  // Seed video data for the video feedback
  await seedVideoData(page, [
    { id: 'test-video-001', dataUrl: videoDataUrl },
  ]);
}

// ============================================
// BUNDLE HELPERS
// ============================================

/**
 * Create a mock FeedbackBundle for import testing
 */
export async function createMockBundle(
  feedback: FeedbackData[],
  includeVideos = false
): Promise<FeedbackBundle> {
  const videos: SerializedVideo[] = [];

  if (includeVideos) {
    // Find feedback items with video references
    for (const item of feedback) {
      if (item.video?.startsWith('video:')) {
        const videoId = item.video.substring(6);
        const blob = createMockVideoBlob();
        const dataUrl = await blobToDataUrl(blob);

        videos.push({
          id: videoId,
          data: dataUrl,
          mimeType: 'video/webm',
          size: blob.size,
          duration: 5000, // 5 seconds
        });
      }
    }
  }

  return {
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    source: BUNDLE_SOURCE,
    feedback,
    videos,
    metadata: {
      feedbackCount: feedback.length,
      videoCount: videos.length,
      totalVideoSize: videos.reduce((sum, v) => sum + v.size, 0),
    },
  };
}

/**
 * Create bundle JSON string for file import testing
 */
export async function createMockBundleJson(
  feedback: FeedbackData[],
  includeVideos = false
): Promise<string> {
  const bundle = await createMockBundle(feedback, includeVideos);
  return JSON.stringify(bundle, null, 2);
}

// ============================================
// DOWNLOAD INTERCEPTION
// ============================================

/**
 * Context for storing captured download info
 */
export interface CapturedDownload {
  filename: string;
  content: string;
  bundle: FeedbackBundle | null;
}

/**
 * Set up download interception to capture exported files
 */
export async function setupDownloadCapture(page: Page): Promise<{ getDownload: () => CapturedDownload | null }> {
  let capturedDownload: CapturedDownload | null = null;

  // Listen for download events
  page.on('download', async (download) => {
    const filename = download.suggestedFilename();
    const path = await download.path();

    if (path) {
      // Read the file content
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf-8');

      let bundle: FeedbackBundle | null = null;
      try {
        bundle = JSON.parse(content);
      } catch {
        // Not valid JSON
      }

      capturedDownload = { filename, content, bundle };
    }
  });

  return {
    getDownload: () => capturedDownload,
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  BUNDLE_VERSION,
  BUNDLE_SOURCE,
  MAX_FEEDBACK_ITEMS,
  STORAGE,
};

export type { FeedbackBundle, SerializedVideo };
