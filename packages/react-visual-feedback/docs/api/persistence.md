# Data Persistence API

> Comprehensive API reference for the react-visual-feedback Data Persistence system

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Types Reference](#types-reference)
- [Services](#services)
- [Utility Functions](#utility-functions)
- [Testing Support](#testing-support)
- [Advanced Usage](#advanced-usage)
- [Error Handling](#error-handling)
- [Migration Guide](#migration-guide)

---

## Overview

The Data Persistence API provides a robust system for exporting and importing feedback data, enabling:

- **Data Portability**: Export feedback bundles as portable JSON files
- **Backup & Restore**: Save and restore complete feedback history
- **Cross-Session Transfer**: Move feedback data between environments
- **Video Preservation**: Include screen recordings with base64 encoding

### Key Features

| Feature | Description |
|---------|-------------|
| Complete Export | Export all feedback items with associated videos |
| Selective Export | Filter exports by feedback type or specific IDs |
| Duplicate Handling | Configurable merge strategies on import |
| Validation | Type-safe bundle validation and parsing |
| Versioning | Bundle format versioning for compatibility |

---

## Installation

The persistence API is included in the main package:

```bash
npm install react-visual-feedback
```

### Import

```typescript
// Factory function (recommended)
import { createPersistenceServices } from 'react-visual-feedback';

// Individual utilities
import {
  createBundle,
  parseBundle,
  validateBundle,
  serializeBlob,
  deserializeBlob,
} from 'react-visual-feedback';

// Types
import type {
  FeedbackBundle,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ExportService,
  ImportService,
  PersistenceServices,
} from 'react-visual-feedback';
```

---

## Quick Start

### Export Feedback

```typescript
import { createPersistenceServices } from 'react-visual-feedback';

// Create services
const { exportService } = createPersistenceServices();

// Export all feedback to file (triggers download)
await exportService.exportToFile();

// Export with options
await exportService.exportToFile({
  includeVideos: true,
  filename: 'my-feedback-backup.json',
  typeFilter: ['bug', 'feedback'],
});

// Export to bundle (for programmatic use)
const bundle = await exportService.exportToBundle();
console.log(`Exported ${bundle.metadata.feedbackCount} items`);
```

### Import Feedback

```typescript
import { createPersistenceServices } from 'react-visual-feedback';

const { importService } = createPersistenceServices();

// Import from file (e.g., from file input)
const fileInput = document.querySelector<HTMLInputElement>('#file-input');
const file = fileInput?.files?.[0];

if (file) {
  const result = await importService.importFromFile(file, {
    includeVideos: true,
    duplicateHandling: 'skip', // 'skip' | 'replace' | 'keep-both'
  });

  if (result.success) {
    console.log(`Imported ${result.importedCount} items`);
    console.log(`Skipped ${result.skippedCount} duplicates`);
  } else {
    console.error('Import failed:', result.errors);
  }
}
```

---

## Core Concepts

### Bundle Format

A `FeedbackBundle` is the portable data format used for export/import:

```typescript
{
  version: '1.0.0',           // Bundle format version
  timestamp: 1704067200000,   // Export timestamp
  source: 'react-visual-feedback',
  feedback: [...],            // Array of FeedbackData
  videos: [...],              // Array of SerializedVideo
  metadata: {                 // Summary information
    feedbackCount: 5,
    videoCount: 2,
    totalVideoSize: 1024000,
    userAgent: 'Mozilla/5.0...',
    exportUrl: 'https://example.com'
  }
}
```

### Storage Architecture

The persistence layer uses two storage backends:

1. **LocalStorage** (`LocalStorageService`): Stores feedback metadata
2. **IndexedDB** (`IndexedDBVideoStorageService`): Stores video blobs

```
┌─────────────────┐     ┌──────────────────┐
│  ExportService  │────▶│  FeedbackBundle  │
├─────────────────┤     └──────────────────┘
│  ImportService  │◀────────────┘
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│LocalSt.│ │IndexedDB │
│Feedback│ │  Videos  │
└────────┘ └──────────┘
```

### Video Serialization

Videos are serialized as base64-encoded data URLs:

```typescript
interface SerializedVideo {
  id: string;           // Video ID matching feedback reference
  data: string;         // Base64 data URL
  mimeType: string;     // e.g., 'video/webm'
  size: number;         // Original blob size in bytes
  duration?: number;    // Video duration in seconds
}
```

---

## Types Reference

### FeedbackBundle

The complete exported data structure:

```typescript
interface FeedbackBundle {
  /** Bundle format version (currently '1.0.0') */
  version: string;

  /** Export timestamp (Unix milliseconds) */
  timestamp: number;

  /** Source identifier */
  source: 'react-visual-feedback';

  /** Array of feedback items */
  feedback: FeedbackData[];

  /** Array of serialized video recordings */
  videos: SerializedVideo[];

  /** Bundle metadata summary */
  metadata: BundleMetadata;
}
```

### SerializedVideo

Video data in portable format:

```typescript
interface SerializedVideo {
  /** Unique video identifier */
  id: string;

  /** Base64-encoded data URL */
  data: string;

  /** MIME type (e.g., 'video/webm') */
  mimeType: string;

  /** Original blob size in bytes */
  size: number;

  /** Video duration in seconds (optional) */
  duration?: number;
}
```

### BundleMetadata

Summary information about the bundle:

```typescript
interface BundleMetadata {
  /** Number of feedback items */
  feedbackCount: number;

  /** Number of video recordings */
  videoCount: number;

  /** Total size of all videos in bytes */
  totalVideoSize: number;

  /** Browser user agent (optional) */
  userAgent?: string;

  /** URL where export was triggered (optional) */
  exportUrl?: string;
}
```

### ExportOptions

Configuration for export operations:

```typescript
interface ExportOptions {
  /** Include video recordings (default: true) */
  includeVideos?: boolean;

  /** Export only specific feedback IDs */
  feedbackIds?: string[];

  /** Filter by feedback type */
  typeFilter?: FeedbackType[];

  /** Custom filename for download */
  filename?: string;
}
```

### ImportOptions

Configuration for import operations:

```typescript
interface ImportOptions {
  /** How to handle duplicate feedback IDs */
  duplicateHandling?: 'skip' | 'replace' | 'keep-both';

  /** Include video recordings (default: true) */
  includeVideos?: boolean;
}
```

**Duplicate Handling Strategies:**

| Strategy | Behavior |
|----------|----------|
| `skip` | Skip items with existing IDs (default) |
| `replace` | Overwrite existing items with imported data |
| `keep-both` | Keep both, assign new ID to imported item |

### ImportResult

Result of an import operation:

```typescript
interface ImportResult {
  /** Whether import completed successfully */
  success: boolean;

  /** Number of items imported */
  importedCount: number;

  /** Number of items skipped (duplicates) */
  skippedCount: number;

  /** Array of error messages */
  errors: string[];

  /** Array of warning messages */
  warnings: string[];
}
```

### Constants

```typescript
/** Current bundle format version */
export const BUNDLE_VERSION = '1.0.0';

/** Source identifier for bundles */
export const BUNDLE_SOURCE = 'react-visual-feedback';

/** Maximum feedback items per export */
export const MAX_FEEDBACK_ITEMS = 50;
```

---

## Services

### ExportService

Service for exporting feedback data:

```typescript
interface ExportService {
  /** Export feedback to a bundle object */
  exportToBundle(options?: ExportOptions): Promise<FeedbackBundle>;

  /** Export feedback to a file (triggers download) */
  exportToFile(options?: ExportOptions): Promise<void>;

  /** Download an existing bundle as a file */
  downloadBundle(bundle: FeedbackBundle, filename?: string): void;
}
```

#### exportToBundle

Creates a `FeedbackBundle` from stored feedback data:

```typescript
const { exportService } = createPersistenceServices();

// Export all feedback
const bundle = await exportService.exportToBundle();

// Export with options
const filteredBundle = await exportService.exportToBundle({
  includeVideos: true,
  typeFilter: ['bug'],
  feedbackIds: ['id-1', 'id-2'],
});

console.log(`Exported ${bundle.metadata.feedbackCount} items`);
console.log(`Total video size: ${bundle.metadata.totalVideoSize} bytes`);
```

#### exportToFile

Exports feedback and triggers a browser download:

```typescript
// Download with default filename
await exportService.exportToFile();

// Custom filename and options
await exportService.exportToFile({
  filename: 'feedback-backup-2024-01-01.json',
  includeVideos: true,
});
```

#### downloadBundle

Downloads an existing bundle object:

```typescript
const bundle = await exportService.exportToBundle();

// Modify or process bundle...

exportService.downloadBundle(bundle, 'processed-feedback.json');
```

### ImportService

Service for importing feedback data:

```typescript
interface ImportService {
  /** Import feedback from a File object */
  importFromFile(file: File, options?: ImportOptions): Promise<ImportResult>;

  /** Import feedback from a bundle object */
  importFromBundle(bundle: FeedbackBundle, options?: ImportOptions): Promise<ImportResult>;

  /** Validate a bundle object */
  validateBundle(bundle: unknown): bundle is FeedbackBundle;
}
```

#### importFromFile

Imports feedback from a file (e.g., from `<input type="file">`):

```typescript
const { importService } = createPersistenceServices();

// File input handler
async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const result = await importService.importFromFile(file, {
    duplicateHandling: 'skip',
    includeVideos: true,
  });

  if (result.success) {
    alert(`Imported ${result.importedCount} items`);
  } else {
    console.error('Errors:', result.errors);
  }
}
```

#### importFromBundle

Imports feedback from an existing bundle object:

```typescript
// Fetch bundle from API
const response = await fetch('/api/feedback-backup.json');
const bundle = await response.json();

// Validate before import
if (importService.validateBundle(bundle)) {
  const result = await importService.importFromBundle(bundle, {
    duplicateHandling: 'replace',
  });
  console.log(`Imported ${result.importedCount} items`);
}
```

#### validateBundle

Type guard to validate bundle structure:

```typescript
const data = JSON.parse(jsonString);

if (importService.validateBundle(data)) {
  // data is now typed as FeedbackBundle
  console.log(`Valid bundle with ${data.feedback.length} items`);
} else {
  console.error('Invalid bundle format');
}
```

---

## Utility Functions

### serializeBlob

Convert a Blob to a base64 data URL:

```typescript
import { serializeBlob } from 'react-visual-feedback';

const videoBlob = new Blob([videoData], { type: 'video/webm' });
const dataUrl = await serializeBlob(videoBlob);
// "data:video/webm;base64,..."
```

### deserializeBlob

Convert a data URL back to a Blob:

```typescript
import { deserializeBlob } from 'react-visual-feedback';

const blob = await deserializeBlob(
  'data:video/webm;base64,SGVsbG8gV29ybGQ=',
  'video/webm'
);
```

### createBundle

Create a bundle from feedback and video data:

```typescript
import { createBundle } from 'react-visual-feedback';

const bundle = createBundle(feedbackItems, serializedVideos);
```

### parseBundle

Parse a JSON string into a bundle (with validation):

```typescript
import { parseBundle } from 'react-visual-feedback';

const jsonString = await file.text();
const bundle = parseBundle(jsonString);

if (bundle) {
  console.log(`Parsed ${bundle.feedback.length} items`);
} else {
  console.error('Invalid bundle JSON');
}
```

### validateBundle

Type guard for bundle validation:

```typescript
import { validateBundle } from 'react-visual-feedback';

const data = JSON.parse(jsonString);

if (validateBundle(data)) {
  // data is FeedbackBundle
  processBundle(data);
}
```

### stringifyBundle

Convert a bundle to JSON string:

```typescript
import { stringifyBundle } from 'react-visual-feedback';

// Minified JSON
const json = stringifyBundle(bundle);

// Pretty-printed JSON
const prettyJson = stringifyBundle(bundle, true);
```

---

## Testing Support

### createTestPersistenceServices

Creates isolated persistence services for testing:

```typescript
import { createTestPersistenceServices } from 'react-visual-feedback';

describe('Persistence Tests', () => {
  let testPersistence: TestPersistenceServices;

  beforeEach(async () => {
    testPersistence = createTestPersistenceServices();
  });

  afterEach(async () => {
    await testPersistence.clearTestData();
  });

  it('should export seeded data', async () => {
    // Seed test data
    const mockFeedback = [
      { id: 'test-1', type: 'bug', message: 'Test bug' },
    ];
    const mockVideos = new Map([
      ['video-1', new Blob(['test'], { type: 'video/webm' })],
    ]);

    await testPersistence.seedTestData(mockFeedback, mockVideos);

    // Test export
    const bundle = await testPersistence.exportService.exportToBundle();
    expect(bundle.feedback).toHaveLength(1);
    expect(bundle.videos).toHaveLength(1);
  });
});
```

### TestPersistenceServices Interface

```typescript
interface TestPersistenceServices extends PersistenceServices {
  /** In-memory storage for test assertions */
  storageService: StorageService<FeedbackData[]>;

  /** In-memory video storage for test assertions */
  videoService: VideoStorageService;

  /** Helper to seed test data */
  seedTestData(
    feedback: FeedbackData[],
    videos?: Map<string, Blob>
  ): Promise<void>;

  /** Helper to clear all test data */
  clearTestData(): Promise<void>;
}
```

---

## Advanced Usage

### Custom Storage Configuration

Configure persistence services with custom storage:

```typescript
import { createPersistenceServices } from 'react-visual-feedback';

const persistence = createPersistenceServices({
  storagePrefix: 'my-app-feedback',
  storageKey: 'custom-feedback-key',
});
```

### Batch Export with Progress

Export large datasets with progress tracking:

```typescript
async function exportWithProgress(onProgress: (percent: number) => void) {
  const { exportService } = createPersistenceServices();

  onProgress(10);
  const bundle = await exportService.exportToBundle();

  onProgress(50);
  // Process or validate bundle...

  onProgress(90);
  exportService.downloadBundle(bundle, 'backup.json');

  onProgress(100);
  return bundle;
}
```

### Merging Bundles

Combine multiple bundles:

```typescript
import { createBundle, validateBundle } from 'react-visual-feedback';

function mergeBundles(
  bundles: FeedbackBundle[]
): FeedbackBundle {
  const allFeedback = bundles.flatMap(b => b.feedback);
  const allVideos = bundles.flatMap(b => b.videos);

  // Deduplicate by ID
  const feedbackMap = new Map(allFeedback.map(f => [f.id, f]));
  const videoMap = new Map(allVideos.map(v => [v.id, v]));

  return createBundle(
    Array.from(feedbackMap.values()),
    Array.from(videoMap.values())
  );
}
```

### Server-Side Storage

Send bundles to a backend API:

```typescript
async function uploadToServer(bundle: FeedbackBundle) {
  const response = await fetch('/api/feedback/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bundle),
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

async function downloadFromServer(): Promise<ImportResult> {
  const response = await fetch('/api/feedback/backup');
  const bundle = await response.json();

  const { importService } = createPersistenceServices();

  if (importService.validateBundle(bundle)) {
    return importService.importFromBundle(bundle);
  }

  return {
    success: false,
    importedCount: 0,
    skippedCount: 0,
    errors: ['Invalid bundle from server'],
    warnings: [],
  };
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid bundle format` | Bundle doesn't match schema | Use `validateBundle()` before import |
| `Version mismatch` | Unsupported bundle version | Check `BUNDLE_VERSION` constant |
| `Video not found` | Referenced video missing | Export with `includeVideos: true` |
| `Storage quota exceeded` | Too much data | Clear old feedback or export/clear |

### Error Handling Pattern

```typescript
async function safeImport(file: File): Promise<ImportResult> {
  const { importService } = createPersistenceServices();

  try {
    const result = await importService.importFromFile(file);

    if (!result.success) {
      console.error('Import errors:', result.errors);
      result.warnings.forEach(w => console.warn(w));
    }

    return result;
  } catch (error) {
    return {
      success: false,
      importedCount: 0,
      skippedCount: 0,
      errors: [
        error instanceof Error
          ? error.message
          : 'Unknown error during import',
      ],
      warnings: [],
    };
  }
}
```

---

## Migration Guide

### From Manual Export

If you previously exported feedback manually:

```typescript
// Old approach
const oldData = localStorage.getItem('feedback');

// New approach
import { createPersistenceServices, createBundle } from 'react-visual-feedback';

const feedback = JSON.parse(oldData);
const bundle = createBundle(feedback, []);

const { importService } = createPersistenceServices();
await importService.importFromBundle(bundle);
```

### Bundle Version Compatibility

| Bundle Version | Library Version | Notes |
|----------------|-----------------|-------|
| 1.0.0 | 2.0.0+ | Current version |

---

## See Also

- [Getting Started Guide](../getting-started/quick-start.md)
- [FeedbackDashboard Component](../components/FeedbackDashboard.md)
- [Storage Architecture](../architecture/storage.md)
- [BDD Test Specifications](../spec/009.data-persistence-api/009.data-persistence-api.feature)

---

*Last updated: January 2025*
