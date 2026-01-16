# Data Persistence API - Feature Tasks

**Source Specification**: [008.data-persistence-api/README.md](../008.data-persistence-api/README.md)
**Created**: 2026-01-16
**Updated**: 2026-01-16

---

## T001 - BundleSerializer

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: None

### Description

Implement the `BundleSerializer` service that handles serialization and deserialization of feedback data, including video blobs encoded as Base64 strings.

### Implementation

**Location**: `src/services/persistence/BundleSerializer.ts`

```typescript
/**
 * Serialize a Blob to base64 data URL
 */
export async function serializeBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Deserialize base64 data URL to Blob
 */
export function deserializeBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Create a FeedbackBundle from feedback data and videos
 */
export async function createBundle(
  feedback: FeedbackData[],
  videos: Map<string, Blob>,
): Promise<FeedbackBundle> {
  const serializedVideos: SerializedVideo[] = [];

  for (const [id, blob] of videos) {
    serializedVideos.push({
      id,
      data: await serializeBlob(blob),
      mimeType: blob.type,
      size: blob.size,
    });
  }

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    source: "react-visual-feedback",
    feedback,
    videos: serializedVideos,
    metadata: {
      feedbackCount: feedback.length,
      videoCount: serializedVideos.length,
      totalVideoSize: serializedVideos.reduce((sum, v) => sum + v.size, 0),
      userAgent: navigator.userAgent,
      exportUrl: window.location.href,
    },
  };
}

/**
 * Parse JSON string to FeedbackBundle
 */
export function parseBundle(json: string): FeedbackBundle {
  const bundle = JSON.parse(json);
  if (!validateBundle(bundle)) {
    throw new Error("Invalid bundle format");
  }
  return bundle;
}

/**
 * Validate bundle structure
 */
export function validateBundle(bundle: unknown): bundle is FeedbackBundle {
  if (!bundle || typeof bundle !== "object") return false;
  const b = bundle as Record<string, unknown>;
  return (
    typeof b.version === "string" &&
    typeof b.exportedAt === "string" &&
    typeof b.source === "string" &&
    Array.isArray(b.feedback) &&
    Array.isArray(b.videos) &&
    typeof b.metadata === "object"
  );
}
```

### Acceptance Criteria

- [ ] `serializeBlob()` converts Blob to base64 data URL
- [ ] `deserializeBlob()` converts base64 back to Blob with correct MIME type
- [ ] `createBundle()` creates valid FeedbackBundle with all required fields
- [ ] `parseBundle()` parses JSON string and validates structure
- [ ] `validateBundle()` returns false for invalid bundle structures
- [ ] Bundle version is set to "1.0.0"
- [ ] Metadata includes correct counts and totals

### Testing

- [ ] Unit test: serializeBlob with text blob
- [ ] Unit test: serializeBlob with video blob
- [ ] Unit test: deserializeBlob roundtrip
- [ ] Unit test: createBundle with empty data
- [ ] Unit test: createBundle with feedback and videos
- [ ] Unit test: parseBundle with valid JSON
- [ ] Unit test: parseBundle with invalid JSON
- [ ] Unit test: validateBundle with valid structure
- [ ] Unit test: validateBundle with missing fields

---

## T002 - ExportService

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: T001

### Description

Implement the `ExportService` that orchestrates exporting feedback data to a downloadable JSON file.

### Implementation

**Location**: `src/services/persistence/ExportService.ts`

```typescript
export interface ExportOptions {
  includeVideos?: boolean;
  feedbackIds?: string[];
  typeFilter?: FeedbackType[];
}

export interface ExportServiceDeps {
  storageService: StorageService<FeedbackData[]>;
  videoService: VideoStorageService;
}

export function createExportService(deps: ExportServiceDeps): ExportService {
  const { storageService, videoService } = deps;

  return {
    async exportToBundle(options: ExportOptions = {}): Promise<FeedbackBundle> {
      // Get all feedback
      let feedback = storageService.get(STORAGE.FEEDBACK_KEY) || [];

      // Apply filters
      if (options.feedbackIds) {
        feedback = feedback.filter((f) => options.feedbackIds!.includes(f.id));
      }
      if (options.typeFilter) {
        feedback = feedback.filter((f) => options.typeFilter!.includes(f.type));
      }

      // Get videos if requested
      const videos = new Map<string, Blob>();
      if (options.includeVideos !== false) {
        for (const f of feedback) {
          if (f.video?.startsWith("video:")) {
            const videoId = f.video.replace("video:", "");
            const blob = await videoService.get(videoId);
            if (blob) {
              videos.set(videoId, blob);
            }
          }
        }
      }

      return createBundle(feedback, videos);
    },

    async exportToFile(options: ExportOptions = {}): Promise<void> {
      const bundle = await this.exportToBundle(options);
      const json = JSON.stringify(bundle, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    downloadBundle(bundle: FeedbackBundle, filename?: string): void {
      const json = JSON.stringify(bundle, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `feedback-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  };
}
```

### Acceptance Criteria

- [ ] `exportToBundle()` returns FeedbackBundle with all feedback items
- [ ] `exportToBundle()` filters by feedbackIds when provided
- [ ] `exportToBundle()` filters by type when typeFilter provided
- [ ] `exportToBundle()` includes videos when includeVideos is true (default)
- [ ] `exportToBundle()` excludes videos when includeVideos is false
- [ ] `exportToFile()` triggers browser download with JSON file
- [ ] `downloadBundle()` triggers download for provided bundle
- [ ] Downloaded file has correct name format

### Testing

- [ ] Unit test: exportToBundle with empty storage
- [ ] Unit test: exportToBundle with multiple items
- [ ] Unit test: exportToBundle with ID filter
- [ ] Unit test: exportToBundle with type filter
- [ ] Unit test: exportToBundle with videos
- [ ] Unit test: exportToBundle without videos
- [ ] Integration test: exportToFile creates downloadable file

---

## T003 - ImportService

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: T001

### Description

Implement the `ImportService` that handles importing feedback data from JSON files.

### Implementation

**Location**: `src/services/persistence/ImportService.ts`

```typescript
export interface ImportOptions {
  duplicateHandling?: "skip" | "replace" | "rename";
  includeVideos?: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
  warnings: string[];
}

export interface ImportServiceDeps {
  storageService: StorageService<FeedbackData[]>;
  videoService: VideoStorageService;
}

export function createImportService(deps: ImportServiceDeps): ImportService {
  const { storageService, videoService } = deps;

  return {
    async importFromFile(
      file: File,
      options: ImportOptions = {},
    ): Promise<ImportResult> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const json = e.target?.result as string;
            const bundle = parseBundle(json);
            const result = await this.importFromBundle(bundle, options);
            resolve(result);
          } catch (error) {
            resolve({
              success: false,
              importedCount: 0,
              skippedCount: 0,
              errors: [
                error instanceof Error ? error.message : "Unknown error",
              ],
              warnings: [],
            });
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },

    async importFromBundle(
      bundle: FeedbackBundle,
      options: ImportOptions = {},
    ): Promise<ImportResult> {
      const { duplicateHandling = "skip", includeVideos = true } = options;
      const result: ImportResult = {
        success: true,
        importedCount: 0,
        skippedCount: 0,
        errors: [],
        warnings: [],
      };

      // Get existing feedback
      const existing = storageService.get(STORAGE.FEEDBACK_KEY) || [];
      const existingIds = new Set(existing.map((f) => f.id));
      const importedFeedback: FeedbackData[] = [...existing];

      for (const feedback of bundle.feedback) {
        const isDuplicate = existingIds.has(feedback.id);

        if (isDuplicate) {
          if (duplicateHandling === "skip") {
            result.skippedCount++;
            result.warnings.push(`Skipped duplicate: ${feedback.id}`);
            continue;
          } else if (duplicateHandling === "replace") {
            const index = importedFeedback.findIndex(
              (f) => f.id === feedback.id,
            );
            importedFeedback[index] = feedback;
          } else if (duplicateHandling === "rename") {
            feedback.id = `${feedback.id}-${Date.now()}`;
          }
        }

        if (!isDuplicate || duplicateHandling !== "skip") {
          if (!isDuplicate) {
            importedFeedback.push(feedback);
          }
          result.importedCount++;
        }
      }

      // Import videos
      if (includeVideos) {
        for (const video of bundle.videos) {
          try {
            const blob = deserializeBlob(video.data, video.mimeType);
            await videoService.save(video.id, blob, {
              duration: video.duration,
            });
          } catch (error) {
            result.warnings.push(`Failed to import video: ${video.id}`);
          }
        }
      }

      // Save to storage
      storageService.set(STORAGE.FEEDBACK_KEY, importedFeedback.slice(0, 50));

      return result;
    },

    validateBundle(bundle: unknown): bundle is FeedbackBundle {
      return validateBundle(bundle);
    },
  };
}
```

### Acceptance Criteria

- [ ] `importFromFile()` reads and parses JSON file
- [ ] `importFromFile()` returns error result for invalid files
- [ ] `importFromBundle()` adds new feedback items to storage
- [ ] `importFromBundle()` respects duplicateHandling: 'skip'
- [ ] `importFromBundle()` respects duplicateHandling: 'replace'
- [ ] `importFromBundle()` respects duplicateHandling: 'rename'
- [ ] `importFromBundle()` imports videos when includeVideos is true
- [ ] `importFromBundle()` skips videos when includeVideos is false
- [ ] Result includes accurate counts for imported/skipped
- [ ] Enforces 50-item storage limit

### Testing

- [ ] Unit test: importFromBundle with empty bundle
- [ ] Unit test: importFromBundle adds new items
- [ ] Unit test: importFromBundle skip duplicates
- [ ] Unit test: importFromBundle replace duplicates
- [ ] Unit test: importFromBundle rename duplicates
- [ ] Unit test: importFromBundle with videos
- [ ] Unit test: validateBundle with valid structure
- [ ] Unit test: validateBundle with invalid structure
- [ ] Integration test: importFromFile with real file

---

## T004 - PersistenceFactory

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: T002, T003

### Description

Implement the factory function that creates persistence services with proper dependency injection.

### Implementation

**Location**: `src/services/persistence/index.ts`

```typescript
export interface PersistenceServices {
  exportService: ExportService;
  importService: ImportService;
}

export interface PersistenceConfig {
  storageService?: StorageService<FeedbackData[]>;
  videoService?: VideoStorageService;
}

/**
 * Create persistence services with production dependencies
 */
export function createPersistenceServices(
  config: PersistenceConfig = {},
): PersistenceServices {
  const storageService =
    config.storageService || new LocalStorageService<FeedbackData[]>();
  const videoService =
    config.videoService || new IndexedDBVideoStorageService();

  return {
    exportService: createExportService({ storageService, videoService }),
    importService: createImportService({ storageService, videoService }),
  };
}

/**
 * Create persistence services for testing
 */
export function createTestPersistenceServices(): PersistenceServices {
  const storageService = new InMemoryStorageService<FeedbackData[]>();
  const videoService = new InMemoryVideoStorageService();

  return {
    exportService: createExportService({ storageService, videoService }),
    importService: createImportService({ storageService, videoService }),
  };
}

// Re-exports
export * from "./types";
export * from "./BundleSerializer";
export * from "./ExportService";
export * from "./ImportService";
```

### Acceptance Criteria

- [ ] `createPersistenceServices()` returns both export and import services
- [ ] `createPersistenceServices()` uses production services by default
- [ ] `createPersistenceServices()` accepts custom service overrides
- [ ] `createTestPersistenceServices()` uses in-memory services
- [ ] All types are properly exported
- [ ] All service creators are properly exported

### Testing

- [ ] Unit test: createPersistenceServices with defaults
- [ ] Unit test: createPersistenceServices with custom storage
- [ ] Unit test: createTestPersistenceServices creates in-memory
- [ ] Integration test: full export/import roundtrip

---

**Documentation compiled by:** GitHub Copilot
**For project:** react-visual-feedback
**Date:** January 16, 2026
