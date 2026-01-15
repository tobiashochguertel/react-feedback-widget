# Service Layer Documentation

> **Updated:** 2026-01-16  
> **Related:** [Architecture Overview](../architecture/README.md)

## Overview

The service layer provides abstraction over browser APIs and external services, enabling testability and flexibility through dependency injection.

## Available Services

| Service | Interface | Production | Test |
|---------|-----------|------------|------|
| Storage | `StorageService` | `LocalStorageService` | `InMemoryStorageService` |
| Video Storage | `VideoStorageService` | `IndexedDBVideoStorageService` | `InMemoryVideoStorageService` |
| Recording | `RecorderService` | `MediaRecorderService` | `MockRecorderService` |
| Screenshot | `ScreenshotService` | `ModernScreenshotService` | `MockScreenshotService` |

## Documentation

| Document | Description |
|----------|-------------|
| [Storage Service](./storage-service.md) | Key-value storage abstraction |
| [Video Storage Service](./video-storage-service.md) | Blob storage for videos |
| [Recorder Service](./recorder-service.md) | Screen recording |
| [Screenshot Service](./screenshot-service.md) | Screenshot capture |

## Quick Start

### Using Default Services (Production)

```tsx
import { FeedbackProvider } from 'react-visual-feedback';

// Uses default production services automatically
function App() {
  return (
    <FeedbackProvider onSubmit={handleSubmit}>
      <YourApp />
    </FeedbackProvider>
  );
}
```

### Using Custom Services

```tsx
import {
  FeedbackProvider,
  createProductionServices,
  InMemoryStorageService,
} from 'react-visual-feedback';

async function App() {
  // Create production services with custom storage
  const services = await createProductionServices({}, {
    storage: new InMemoryStorageService(), // Override storage
  });

  return (
    <FeedbackProvider services={services} onSubmit={handleSubmit}>
      <YourApp />
    </FeedbackProvider>
  );
}
```

### Using Test Services

```tsx
import {
  FeedbackProvider,
  createTestServicesSync,
} from 'react-visual-feedback';

// For testing - all services are mocked
const testServices = createTestServicesSync();

function TestWrapper({ children }) {
  return (
    <FeedbackProvider services={testServices}>
      {children}
    </FeedbackProvider>
  );
}
```

## Service Factory

The `ServiceFactory` module provides factory functions for creating service containers:

### `createProductionServices(config?, overrides?)`

Creates async production services using real browser APIs.

```typescript
import { createProductionServices } from 'react-visual-feedback';

const services = await createProductionServices({
  storagePrefix: 'myapp_',
  videoDbName: 'my_videos',
  videoStoreName: 'recordings',
});
```

### `createTestServices(config?, overrides?)`

Creates async test services using mocks.

```typescript
import { createTestServices } from 'react-visual-feedback';

const testServices = await createTestServices();
```

### `createProductionServicesSync(overrides?)`

Creates sync production services (no lazy loading).

```typescript
import { createProductionServicesSync } from 'react-visual-feedback';

const services = createProductionServicesSync();
```

### `createTestServicesSync(overrides?)`

Creates sync test services (recommended for tests).

```typescript
import { createTestServicesSync } from 'react-visual-feedback';

const testServices = createTestServicesSync();
```

## Service Container Interface

```typescript
interface ServiceContainer {
  /** General key-value storage (localStorage) */
  storage: StorageService;
  
  /** Video blob storage (IndexedDB) */
  videoStorage: VideoStorageService;
  
  /** Screen recording service */
  recorder: RecorderService;
  
  /** Screenshot capture service */
  screenshot: ScreenshotService;
}
```

## Dependency Injection Pattern

### Why DI?

1. **Testability** — Replace real services with mocks in tests
2. **Flexibility** — Swap implementations without changing components
3. **Isolation** — Components don't depend on browser APIs directly
4. **SSR Support** — Use mock services during server-side rendering

### Injecting Services

```tsx
// Component receives service via hook
function MyComponent() {
  const { capture } = useScreenCapture({
    screenshotService: customScreenshotService,
  });
}

// Or via provider
<FeedbackProvider
  services={{
    storage: new InMemoryStorageService(),
    videoStorage: new InMemoryVideoStorageService(),
    recorder: new MockRecorderService(),
    screenshot: new MockScreenshotService(),
  }}
>
  {children}
</FeedbackProvider>
```

## Creating Custom Services

Implement the service interface to create custom implementations:

```typescript
import type { StorageService } from 'react-visual-feedback';

class CloudStorageService implements StorageService {
  private cloudClient: CloudClient;

  constructor(config: CloudConfig) {
    this.cloudClient = new CloudClient(config);
  }

  get<T>(key: string): T | null {
    // Implement cloud get
  }

  set<T>(key: string, value: T): boolean {
    // Implement cloud set
  }

  remove(key: string): boolean {
    // Implement cloud remove
  }

  has(key: string): boolean {
    // Implement cloud check
  }

  clear(): boolean {
    // Implement cloud clear
  }

  keys(): string[] {
    // Implement cloud keys
  }
}

// Use custom service
<FeedbackProvider
  services={{
    storage: new CloudStorageService({ apiKey: '...' }),
    // ... other services
  }}
>
  {children}
</FeedbackProvider>
```

## Browser API Availability

Check if browser APIs are available before using services:

```typescript
import { isBrowserEnvironment, checkBrowserApiAvailability } from 'react-visual-feedback';

// Check if running in browser
if (isBrowserEnvironment()) {
  const { localStorage, indexedDB, mediaRecorder, html2canvas } = checkBrowserApiAvailability();
  
  if (!mediaRecorder) {
    console.warn('Screen recording not supported');
  }
}
```

## Error Handling

Services throw errors for invalid operations:

```typescript
const storage = new LocalStorageService();

try {
  // Will throw if localStorage is disabled
  storage.set('key', value);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('Storage quota exceeded');
  }
}
```

## Related Documentation

- [Architecture Overview](../architecture/README.md)
- [Hooks API](../hooks/README.md)
- [Testing Guide](../getting-started/testing.md)

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
