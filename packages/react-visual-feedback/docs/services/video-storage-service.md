# VideoStorageService

> **Updated:** 2026-01-16  
> **Related:** [Services Overview](./README.md)

## Purpose

Provides abstraction for storing video blobs, which are too large for localStorage. Uses IndexedDB for production and in-memory Map for testing.

## Interface

```typescript
interface VideoRecord {
  /** Unique identifier for the video */
  id: string;
  /** Video blob data */
  blob: Blob;
  /** Timestamp when stored */
  timestamp: number;
  /** Video duration in seconds */
  duration?: number;
  /** MIME type */
  mimeType?: string;
  /** File size in bytes */
  size?: number;
}

interface VideoStorageOptions {
  /** Override timestamp (defaults to Date.now()) */
  timestamp?: number;
  /** Video duration in seconds */
  duration?: number;
}

interface VideoStorageService {
  /** Store a video blob */
  save(id: string, blob: Blob, options?: VideoStorageOptions): Promise<boolean>;

  /** Retrieve a video blob by ID */
  get(id: string): Promise<Blob | null>;

  /** Retrieve full video record by ID */
  getRecord(id: string): Promise<VideoRecord | null>;

  /** Delete a video by ID */
  delete(id: string): Promise<boolean>;

  /** Check if a video exists */
  has(id: string): Promise<boolean>;

  /** List all video IDs */
  list(): Promise<string[]>;

  /** Get all video records */
  listRecords(): Promise<VideoRecord[]>;

  /** Clear all videos */
  clear(): Promise<boolean>;

  /** Get total storage size in bytes */
  getStorageSize(): Promise<number>;
}
```

## Implementations

### IndexedDBVideoStorageService

Production implementation using IndexedDB for efficient blob storage.

```typescript
import { IndexedDBVideoStorageService } from 'react-visual-feedback';

const videoStorage = new IndexedDBVideoStorageService();

// Store a video
const videoBlob = new Blob([videoData], { type: 'video/webm' });
await videoStorage.save('feedback-123', videoBlob, { duration: 45 });

// Retrieve the video
const blob = await videoStorage.get('feedback-123');
if (blob) {
  const url = URL.createObjectURL(blob);
  videoElement.src = url;
}

// Get full record with metadata
const record = await videoStorage.getRecord('feedback-123');
console.log(`Duration: ${record?.duration}s, Size: ${record?.size} bytes`);

// List all videos
const videoIds = await videoStorage.list();
console.log(`Stored videos: ${videoIds.length}`);

// Check storage usage
const totalSize = await videoStorage.getStorageSize();
console.log(`Total storage: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// Delete a video
await videoStorage.delete('feedback-123');

// Clear all videos
await videoStorage.clear();
```

**Custom Database Configuration**

```typescript
const videoStorage = new IndexedDBVideoStorageService(
  'my_app_videos',  // Database name
  'recordings'      // Store name
);
```

### InMemoryVideoStorageService

Test implementation using in-memory Map.

```typescript
import { InMemoryVideoStorageService } from 'react-visual-feedback';

const videoStorage = new InMemoryVideoStorageService();

// Same API as IndexedDBVideoStorageService
await videoStorage.save('test-video', mockBlob);
const blob = await videoStorage.get('test-video');
```

**Testing Usage**

```tsx
import { FeedbackProvider, InMemoryVideoStorageService } from 'react-visual-feedback';

function TestWrapper({ children }) {
  const videoStorage = new InMemoryVideoStorageService();
  
  return (
    <FeedbackProvider services={{ videoStorage }}>
      {children}
    </FeedbackProvider>
  );
}

test('plays recorded video', async () => {
  const videoStorage = new InMemoryVideoStorageService();
  
  // Pre-populate with test video
  const testBlob = new Blob(['test'], { type: 'video/webm' });
  await videoStorage.save('feedback-1', testBlob, { duration: 10 });

  render(
    <FeedbackProvider services={{ videoStorage }}>
      <SessionReplay feedbackId="feedback-1" />
    </FeedbackProvider>
  );

  expect(screen.getByRole('video')).toBeInTheDocument();
});
```

## Usage in FeedbackProvider

```tsx
import { 
  FeedbackProvider, 
  IndexedDBVideoStorageService,
  InMemoryVideoStorageService,
} from 'react-visual-feedback';

// Production (default)
<FeedbackProvider>
  {children}
</FeedbackProvider>

// Custom database name
<FeedbackProvider
  services={{
    videoStorage: new IndexedDBVideoStorageService('my_videos', 'store'),
  }}
>
  {children}
</FeedbackProvider>

// Testing
<FeedbackProvider
  services={{
    videoStorage: new InMemoryVideoStorageService(),
  }}
>
  {children}
</FeedbackProvider>
```

## Storage Management

### Checking Storage Quota

```typescript
const videoStorage = new IndexedDBVideoStorageService();

async function checkStorageQuota() {
  const used = await videoStorage.getStorageSize();
  const usedMB = used / 1024 / 1024;
  
  if (usedMB > 100) {
    console.warn(`Video storage: ${usedMB.toFixed(2)} MB - consider cleanup`);
  }
}
```

### Cleaning Old Videos

```typescript
async function cleanupOldVideos(maxAgeDays: number = 30) {
  const videoStorage = new IndexedDBVideoStorageService();
  const records = await videoStorage.listRecords();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const record of records) {
    if (now - record.timestamp > maxAgeMs) {
      await videoStorage.delete(record.id);
      console.log(`Deleted old video: ${record.id}`);
    }
  }
}
```

### Storage Size Limits

```typescript
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

async function saveVideoWithLimit(id: string, blob: Blob): Promise<boolean> {
  if (blob.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(`Video exceeds ${MAX_VIDEO_SIZE_MB}MB limit`);
  }
  
  return videoStorage.save(id, blob);
}
```

## IndexedDB Structure

The IndexedDBVideoStorageService creates:

- **Database**: `feedback_videos` (configurable)
- **Object Store**: `videos` (configurable)
- **Key Path**: `id`
- **Indexes**: `timestamp`

```
IndexedDB
└── feedback_videos (database)
    └── videos (object store)
        ├── { id: 'feedback-1', blob: Blob, timestamp: 1705234567890 }
        ├── { id: 'feedback-2', blob: Blob, timestamp: 1705234578901 }
        └── ...
```

## Error Handling

### Storage Quota Exceeded

```typescript
try {
  await videoStorage.save('large-video', hugeBlob);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Clean up old videos and retry
    await cleanupOldVideos(7);
    await videoStorage.save('large-video', hugeBlob);
  }
}
```

### IndexedDB Not Available

```typescript
import { isBrowserEnvironment, checkBrowserApiAvailability } from 'react-visual-feedback';

if (isBrowserEnvironment()) {
  const { indexedDB } = checkBrowserApiAvailability();
  
  if (!indexedDB) {
    console.warn('IndexedDB not available, videos will not persist');
    // Use InMemoryVideoStorageService as fallback
  }
}
```

## Best Practices

1. **Set size limits** — Check blob size before saving
2. **Clean up old videos** — Implement retention policy
3. **Monitor storage usage** — Alert when nearing quota
4. **Use InMemoryVideoStorageService** for tests
5. **Handle quota errors** gracefully

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
