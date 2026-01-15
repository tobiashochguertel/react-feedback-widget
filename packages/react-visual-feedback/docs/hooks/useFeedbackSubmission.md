# useFeedbackSubmission

> **Updated:** 2026-01-16
> **Related:** [Hooks Overview](./README.md), [Integration Guide](../integrations/)

## Purpose

Manages feedback submission queue with retry logic, persistence, and integration support.

## Import

```typescript
import { useFeedbackSubmission } from 'react-visual-feedback';
import type {
  UseFeedbackSubmissionOptions,
  UseFeedbackSubmissionReturn,
  SubmissionQueueItem,
  SubmissionStatus,
  SubmissionResult,
} from 'react-visual-feedback';
```

## API

### Types

```typescript
type SubmissionStatus =
  | 'pending'
  | 'submitting'
  | 'success'
  | 'error'
  | 'retrying';

interface SubmissionQueueItem {
  /** Unique identifier */
  id: string;
  /** Feedback data to submit */
  data: FeedbackData;
  /** Current status */
  status: SubmissionStatus;
  /** Number of retry attempts */
  retryCount: number;
  /** Error message if failed */
  error?: string;
  /** Timestamp when queued */
  createdAt: number;
  /** Timestamp of last attempt */
  lastAttempt?: number;
  /** Integration type (if applicable) */
  integrationType?: 'jira' | 'sheets' | 'custom';
}

interface FeedbackData {
  /** Feedback type */
  type: 'bug' | 'feature' | 'improvement' | 'general';
  /** Title/summary */
  title: string;
  /** Detailed description */
  description?: string;
  /** Screenshot data URL */
  screenshot?: string;
  /** Recording blob URL */
  recordingUrl?: string;
  /** Selected element info */
  elementInfo?: ElementInfo;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

interface SubmissionResult {
  /** Whether submission succeeded */
  success: boolean;
  /** Result from integration (e.g., Jira issue key) */
  result?: unknown;
  /** Error if failed */
  error?: Error;
}
```

### Options

```typescript
interface UseFeedbackSubmissionOptions {
  /** Custom submission handler */
  onSubmit?: (data: FeedbackData) => Promise<SubmissionResult>;

  /** Callback on successful submission */
  onSuccess?: (item: SubmissionQueueItem, result: unknown) => void;

  /** Callback on submission error */
  onError?: (item: SubmissionQueueItem, error: Error) => void;

  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;

  /** Retry delay in ms (default: 1000) */
  retryDelay?: number;

  /** Whether to persist queue to storage (default: true) */
  persistQueue?: boolean;

  /** Storage key for persistence */
  storageKey?: string;

  /** Auto-retry failed submissions (default: true) */
  autoRetry?: boolean;

  /** Process queue concurrently (default: 1) */
  concurrency?: number;
}
```

### Return Value

```typescript
interface UseFeedbackSubmissionReturn {
  /** Current queue items */
  queue: SubmissionQueueItem[];

  /** Items currently being submitted */
  submitting: SubmissionQueueItem[];

  /** Failed items */
  failed: SubmissionQueueItem[];

  /** Successfully submitted items */
  completed: SubmissionQueueItem[];

  /** Whether any submission is in progress */
  isSubmitting: boolean;

  /** Number of pending items */
  pendingCount: number;

  /** Submit new feedback */
  submit: (data: FeedbackData) => Promise<SubmissionResult>;

  /** Retry a failed submission */
  retry: (itemId: string) => Promise<SubmissionResult>;

  /** Retry all failed submissions */
  retryAll: () => Promise<SubmissionResult[]>;

  /** Cancel a pending submission */
  cancel: (itemId: string) => void;

  /** Remove an item from queue */
  remove: (itemId: string) => void;

  /** Clear completed items */
  clearCompleted: () => void;

  /** Clear all items */
  clearAll: () => void;

  /** Get item by ID */
  getItem: (itemId: string) => SubmissionQueueItem | undefined;
}
```

## Usage

### Basic Submission

```tsx
import { useFeedbackSubmission } from 'react-visual-feedback';

function FeedbackForm() {
  const { submit, isSubmitting } = useFeedbackSubmission({
    onSubmit: async (data) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      return { success: true, result: await response.json() };
    },
    onSuccess: (item, result) => {
      console.log('Feedback submitted:', result);
    },
    onError: (item, error) => {
      console.error('Submission failed:', error);
    },
  });

  const handleSubmit = async (formData) => {
    await submit({
      type: 'bug',
      title: formData.title,
      description: formData.description,
      screenshot: formData.screenshot,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}
```

### Queue Management

```tsx
import { useFeedbackSubmission } from 'react-visual-feedback';

function SubmissionQueue() {
  const {
    queue,
    submitting,
    failed,
    completed,
    pendingCount,
    retry,
    retryAll,
    cancel,
    remove,
    clearCompleted,
  } = useFeedbackSubmission();

  return (
    <div className="queue-panel">
      <h2>Submission Queue</h2>

      {/* Pending count */}
      {pendingCount > 0 && (
        <p className="pending-count">{pendingCount} pending</p>
      )}

      {/* In progress */}
      {submitting.length > 0 && (
        <section>
          <h3>Submitting</h3>
          {submitting.map(item => (
            <div key={item.id} className="item submitting">
              <span>{item.data.title}</span>
              <span className="spinner">⏳</span>
            </div>
          ))}
        </section>
      )}

      {/* Failed with retry */}
      {failed.length > 0 && (
        <section>
          <h3>Failed</h3>
          <button onClick={retryAll}>Retry All</button>
          {failed.map(item => (
            <div key={item.id} className="item failed">
              <span>{item.data.title}</span>
              <span className="error">{item.error}</span>
              <button onClick={() => retry(item.id)}>Retry</button>
              <button onClick={() => remove(item.id)}>Remove</button>
            </div>
          ))}
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h3>Completed</h3>
          <button onClick={clearCompleted}>Clear</button>
          {completed.map(item => (
            <div key={item.id} className="item completed">
              <span>{item.data.title}</span>
              <span className="success">✓</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
```

### With Retry Configuration

```tsx
import { useFeedbackSubmission } from 'react-visual-feedback';

function ReliableSubmission() {
  const { submit, queue } = useFeedbackSubmission({
    maxRetries: 5,
    retryDelay: 2000, // 2 seconds
    autoRetry: true,
    onSubmit: async (data) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status >= 500) {
          // Server error - will retry
          throw new Error('Server error, will retry');
        }
        // Client error - won't retry
        return { success: false, error: new Error('Invalid request') };
      }

      return { success: true, result: await response.json() };
    },
  });

  return (
    <div>
      {/* Show retry status */}
      {queue.filter(i => i.status === 'retrying').map(item => (
        <div key={item.id}>
          Retrying: {item.data.title} (attempt {item.retryCount + 1})
        </div>
      ))}
    </div>
  );
}
```

### Persistent Queue

```tsx
import { useFeedbackSubmission } from 'react-visual-feedback';

function OfflineCapableForm() {
  const { submit, queue, retryAll } = useFeedbackSubmission({
    persistQueue: true,
    storageKey: 'feedback-queue',
    autoRetry: false, // Manual retry when online
    onSubmit: async (data) => {
      if (!navigator.onLine) {
        throw new Error('Offline - will retry when online');
      }
      // Submit logic
    },
  });

  // Retry when coming back online
  useEffect(() => {
    const handleOnline = () => {
      retryAll();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [retryAll]);

  return (
    <div>
      {!navigator.onLine && (
        <div className="offline-banner">
          Offline - submissions will be queued
        </div>
      )}
      {queue.length > 0 && (
        <div className="queue-indicator">
          {queue.length} item(s) queued
        </div>
      )}
    </div>
  );
}
```

### With Integrations

```tsx
import { useFeedbackSubmission, useIntegrations } from 'react-visual-feedback';

function IntegratedSubmission() {
  const { connectedIntegrations, submitToJira, submitToSheets } = useIntegrations();

  const { submit } = useFeedbackSubmission({
    onSubmit: async (data) => {
      const results = [];

      // Submit to all connected integrations
      for (const integration of connectedIntegrations) {
        if (integration.type === 'jira') {
          results.push(await submitToJira(data));
        } else if (integration.type === 'sheets') {
          results.push(await submitToSheets(data));
        }
      }

      const allSuccessful = results.every(r => r.success);
      return {
        success: allSuccessful,
        result: results,
      };
    },
    onSuccess: (item, result) => {
      const jiraResult = result.find(r => r.issueKey);
      if (jiraResult) {
        toast.success(`Created Jira issue: ${jiraResult.issueKey}`);
      }
    },
  });

  return <FeedbackForm onSubmit={submit} />;
}
```

### Concurrent Submissions

```tsx
import { useFeedbackSubmission } from 'react-visual-feedback';

function BulkSubmission() {
  const { submit, isSubmitting, submitting } = useFeedbackSubmission({
    concurrency: 3, // Process up to 3 at a time
    onSubmit: async (data) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: response.ok };
    },
  });

  const submitBulk = async (feedbackItems: FeedbackData[]) => {
    // All will be queued, processed 3 at a time
    await Promise.all(feedbackItems.map(item => submit(item)));
  };

  return (
    <div>
      <button onClick={() => submitBulk(items)}>Submit All</button>
      {isSubmitting && (
        <p>Processing {submitting.length} submissions...</p>
      )}
    </div>
  );
}
```

## Testing

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeedbackSubmission } from 'react-visual-feedback';

describe('useFeedbackSubmission', () => {
  test('submits feedback successfully', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true, result: { id: '1' } });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useFeedbackSubmission({ onSubmit, onSuccess })
    );

    await act(async () => {
      await result.current.submit({
        type: 'bug',
        title: 'Test Bug',
      });
    });

    expect(onSubmit).toHaveBeenCalled();
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('retries on failure', async () => {
    let attempts = 0;
    const onSubmit = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network error');
      }
      return { success: true };
    });

    const { result } = renderHook(() =>
      useFeedbackSubmission({
        onSubmit,
        maxRetries: 3,
        retryDelay: 10, // Fast for testing
        autoRetry: true,
      })
    );

    await act(async () => {
      await result.current.submit({ type: 'bug', title: 'Test' });
    });

    await waitFor(() => {
      expect(attempts).toBe(3);
      expect(result.current.completed).toHaveLength(1);
    });
  });

  test('handles concurrent submissions', async () => {
    const submitting: string[] = [];
    const onSubmit = vi.fn().mockImplementation(async (data) => {
      submitting.push(data.title);
      await new Promise(r => setTimeout(r, 50));
      return { success: true };
    });

    const { result } = renderHook(() =>
      useFeedbackSubmission({ onSubmit, concurrency: 2 })
    );

    act(() => {
      result.current.submit({ type: 'bug', title: 'One' });
      result.current.submit({ type: 'bug', title: 'Two' });
      result.current.submit({ type: 'bug', title: 'Three' });
    });

    // With concurrency 2, first two should be submitting
    await waitFor(() => {
      expect(result.current.submitting.length).toBeLessThanOrEqual(2);
    });
  });

  test('clearCompleted removes completed items', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useFeedbackSubmission({ onSubmit })
    );

    await act(async () => {
      await result.current.submit({ type: 'bug', title: 'Test' });
    });

    await waitFor(() => {
      expect(result.current.completed).toHaveLength(1);
    });

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.completed).toHaveLength(0);
  });

  test('cancel removes pending item', () => {
    const { result } = renderHook(() =>
      useFeedbackSubmission({
        onSubmit: () => new Promise(() => {}), // Never resolves
      })
    );

    act(() => {
      result.current.submit({ type: 'bug', title: 'Pending' });
    });

    const itemId = result.current.queue[0]?.id;

    act(() => {
      result.current.cancel(itemId);
    });

    expect(result.current.getItem(itemId)).toBeUndefined();
  });
});
```

---

*Documentation compiled by GitHub Copilot*
*For project: react-visual-feedback*
