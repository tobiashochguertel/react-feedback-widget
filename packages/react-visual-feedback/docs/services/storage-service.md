# StorageService

> **Updated:** 2026-01-16  
> **Related:** [Services Overview](./README.md)

## Purpose

Provides abstraction over key-value storage for storing feedback data. Enables swapping localStorage with in-memory storage for testing or SSR.

## Interface

```typescript
interface StorageService<T = unknown> {
  /**
   * Retrieve a value by key
   * @returns The stored value or null if not found
   */
  get(key: string): T | null;

  /**
   * Store a value with a key
   * @returns true if successful
   */
  set(key: string, value: T): boolean;

  /**
   * Remove a value by key
   * @returns true if successful
   */
  remove(key: string): boolean;

  /**
   * Check if a key exists
   */
  has(key: string): boolean;

  /**
   * Clear all stored values
   * @returns true if successful
   */
  clear(): boolean;

  /**
   * Get all keys
   */
  keys(): string[];
}
```

## Implementations

### LocalStorageService

Production implementation using browser localStorage.

```typescript
import { LocalStorageService } from 'react-visual-feedback';

const storage = new LocalStorageService();

// Store data
storage.set('user_preferences', { theme: 'dark' });

// Retrieve data
const prefs = storage.get<{ theme: string }>('user_preferences');
console.log(prefs?.theme); // 'dark'

// Check existence
if (storage.has('user_preferences')) {
  console.log('Preferences exist');
}

// List all keys
const keys = storage.keys(); // ['user_preferences']

// Remove specific key
storage.remove('user_preferences');

// Clear all
storage.clear();
```

**With Key Prefix**

```typescript
// All keys will be prefixed with 'myapp_'
const storage = new LocalStorageService('myapp_');

storage.set('settings', { volume: 80 });
// Actually stored as 'myapp_settings' in localStorage
```

### InMemoryStorageService

Test implementation using in-memory Map. Data is not persisted.

```typescript
import { InMemoryStorageService } from 'react-visual-feedback';

const storage = new InMemoryStorageService();

// Same API as LocalStorageService
storage.set('test_data', { value: 42 });
const data = storage.get('test_data');

// Data cleared when instance is garbage collected
```

**Testing Usage**

```tsx
import { render } from '@testing-library/react';
import { FeedbackProvider, InMemoryStorageService } from 'react-visual-feedback';

function renderWithProvider(ui: React.ReactElement) {
  const storage = new InMemoryStorageService();
  
  // Pre-populate test data
  storage.set('feedback_list', [
    { id: '1', type: 'bug', description: 'Test bug' },
  ]);

  return render(
    <FeedbackProvider services={{ storage }}>
      {ui}
    </FeedbackProvider>
  );
}

test('displays feedback from storage', () => {
  renderWithProvider(<FeedbackDashboard />);
  expect(screen.getByText('Test bug')).toBeInTheDocument();
});
```

## Usage in FeedbackProvider

```tsx
import { FeedbackProvider, LocalStorageService } from 'react-visual-feedback';

// Production (default)
<FeedbackProvider>
  {children}
</FeedbackProvider>

// Custom prefix
<FeedbackProvider
  services={{
    storage: new LocalStorageService('myapp_'),
  }}
>
  {children}
</FeedbackProvider>

// Testing
<FeedbackProvider
  services={{
    storage: new InMemoryStorageService(),
  }}
>
  {children}
</FeedbackProvider>
```

## Storage Keys

The library uses these storage keys:

| Key | Description | Type |
|-----|-------------|------|
| `feedback_list` | Array of feedback items | `FeedbackData[]` |
| `feedback_queue` | Offline submission queue | `QueuedSubmission[]` |
| `feedback_integrations` | Integration configurations | `IntegrationsConfig` |
| `feedback_settings` | User preferences | `object` |

```typescript
import { STORAGE_KEYS } from 'react-visual-feedback';

// Access keys
console.log(STORAGE_KEYS.FEEDBACK_LIST); // 'feedback_list'
```

## Error Handling

### QuotaExceededError

```typescript
try {
  storage.set('large_data', hugeObject);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    console.error('Storage quota exceeded');
    // Clear old data or notify user
  }
}
```

### localStorage Disabled

```typescript
const storage = new LocalStorageService();

try {
  storage.set('key', 'value');
} catch (error) {
  if (error.name === 'SecurityError') {
    console.warn('localStorage is disabled, using in-memory fallback');
    return new InMemoryStorageService();
  }
}
```

## AsyncStorageService

For async storage operations (optional interface):

```typescript
interface AsyncStorageService<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<boolean>;
  remove(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
  keys(): Promise<string[]>;
}
```

This is useful for:
- IndexedDB storage
- Remote storage (cloud)
- Encrypted storage

## Best Practices

1. **Use key prefixes** to avoid collisions with other apps
2. **Handle errors** for quota and security issues
3. **Use InMemoryStorageService** for tests to ensure isolation
4. **Don't store sensitive data** in localStorage (use encrypted storage)
5. **Set size limits** for stored objects to prevent quota issues

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
