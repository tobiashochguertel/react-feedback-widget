/**
 * React Visual Feedback - useFeedbackSubmission Hook
 *
 * Custom hook for managing feedback submission queue with retry logic.
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for submission management.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Generic feedback data type - consumers provide their own shape
 */
export interface FeedbackData {
  [key: string]: unknown;
}

/**
 * Status of a submission in the queue
 */
export type SubmissionStatus = 'pending' | 'submitting' | 'success' | 'error';

/**
 * A single item in the submission queue
 */
export interface SubmissionQueueItem {
  /** Unique identifier for the submission */
  id: string;

  /** Current status of the submission */
  status: SubmissionStatus;

  /** The feedback data being submitted */
  feedbackData: FeedbackData;

  /** Number of retry attempts made */
  retryCount: number;

  /** ISO timestamp when the submission was created */
  createdAt: string;

  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Result of a successful submission
 */
export interface SubmissionResult {
  /** The submission ID */
  id: string;

  /** Whether the submission was successful */
  success: boolean;

  /** Optional data returned from the submission handler */
  data?: unknown;
}

/**
 * Service interface for dependency injection
 * Allows consumers to provide their own submission handler
 */
export interface SubmissionService {
  /**
   * Submit feedback data and return a result
   * @param data The feedback data to submit
   * @returns Promise resolving to submission result
   */
  submit(data: FeedbackData): Promise<SubmissionResult>;
}

/**
 * Options for the useFeedbackSubmission hook
 */
export interface UseFeedbackSubmissionOptions {
  /** Custom submission service (for dependency injection) */
  service?: SubmissionService;

  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Timeout in milliseconds for each submission attempt (default: 30000) */
  timeoutMs?: number;

  /** Initial queue items (for controlled mode) */
  initialQueue?: SubmissionQueueItem[];

  /** Callback when a submission completes successfully */
  onSubmissionComplete?: (id: string, result: SubmissionResult) => void;

  /** Callback when a submission fails after all retries */
  onSubmissionError?: (id: string, error: Error) => void;

  /** Callback when queue changes */
  onQueueChange?: (queue: SubmissionQueueItem[]) => void;
}

/**
 * Return type of the useFeedbackSubmission hook
 */
export interface UseFeedbackSubmissionReturn {
  /** Current submission queue */
  queue: SubmissionQueueItem[];

  /** Whether any submission is currently in progress */
  isSubmitting: boolean;

  /** Number of pending submissions */
  pendingCount: number;

  /** Number of submissions with errors */
  errorCount: number;

  /** Submit new feedback data, returns submission ID */
  submit: (feedbackData: FeedbackData) => Promise<string>;

  /** Retry a failed submission */
  retry: (submissionId: string) => Promise<void>;

  /** Dismiss a submission from the queue */
  dismiss: (submissionId: string) => void;

  /** Clear all completed (success/error) submissions */
  clearCompleted: () => void;

  /** Clear all submissions */
  clearAll: () => void;

  /** Get a specific submission by ID */
  getSubmission: (id: string) => SubmissionQueueItem | undefined;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique submission ID
 */
function generateSubmissionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a promise that rejects after a timeout
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Submission timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Race a promise against a timeout
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([promise, createTimeoutPromise(timeoutMs)]);
}

// ============================================================================
// Default Service
// ============================================================================

/**
 * Default submission service that simulates a successful submission
 * In real usage, consumers should provide their own service
 */
const defaultService: SubmissionService = {
  async submit(data: FeedbackData): Promise<SubmissionResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      id: generateSubmissionId(),
      success: true,
      data,
    };
  },
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing feedback submission queue.
 *
 * Provides:
 * - Queue management for feedback submissions
 * - Automatic retry logic for failed submissions
 * - Timeout handling for slow submissions
 * - Status tracking for each submission
 *
 * @example
 * ```tsx
 * function FeedbackForm() {
 *   const { queue, submit, retry, dismiss, isSubmitting } = useFeedbackSubmission({
 *     service: {
 *       submit: async (data) => {
 *         const response = await fetch('/api/feedback', {
 *           method: 'POST',
 *           body: JSON.stringify(data),
 *         });
 *         return { id: 'xxx', success: response.ok };
 *       },
 *     },
 *     maxRetries: 3,
 *     timeoutMs: 30000,
 *     onSubmissionComplete: (id, result) => {
 *       console.log(`Submission ${id} completed:`, result);
 *     },
 *     onSubmissionError: (id, error) => {
 *       console.error(`Submission ${id} failed:`, error);
 *     },
 *   });
 *
 *   const handleSubmit = async (feedbackData: FeedbackData) => {
 *     const submissionId = await submit(feedbackData);
 *     console.log(`Queued submission: ${submissionId}`);
 *   };
 *
 *   return (
 *     <div>
 *       {isSubmitting && <p>Submitting...</p>}
 *       {queue.map((item) => (
 *         <div key={item.id}>
 *           {item.status === 'error' && (
 *             <button onClick={() => retry(item.id)}>Retry</button>
 *           )}
 *           <button onClick={() => dismiss(item.id)}>Dismiss</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeedbackSubmission(
  options: UseFeedbackSubmissionOptions = {}
): UseFeedbackSubmissionReturn {
  const {
    service = defaultService,
    maxRetries = 3,
    timeoutMs = 30000,
    initialQueue = [],
    onSubmissionComplete,
    onSubmissionError,
    onQueueChange,
  } = options;

  // State
  const [queue, setQueue] = useState<SubmissionQueueItem[]>(initialQueue);

  // Refs for stable callback references
  const serviceRef = useRef(service);
  serviceRef.current = service;

  const callbacksRef = useRef({ onSubmissionComplete, onSubmissionError, onQueueChange });
  callbacksRef.current = { onSubmissionComplete, onSubmissionError, onQueueChange };

  const optionsRef = useRef({ maxRetries, timeoutMs });
  optionsRef.current = { maxRetries, timeoutMs };

  // Notify on queue changes
  useEffect(() => {
    callbacksRef.current.onQueueChange?.(queue);
  }, [queue]);

  // Update a submission in the queue
  const updateSubmission = useCallback(
    (id: string, updates: Partial<SubmissionQueueItem>) => {
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // Process a single submission
  const processSubmission = useCallback(
    async (item: SubmissionQueueItem): Promise<void> => {
      const { maxRetries: max, timeoutMs: timeout } = optionsRef.current;
      const { onSubmissionComplete: onComplete, onSubmissionError: onError } =
        callbacksRef.current;
      const currentService = serviceRef.current;

      // Mark as submitting
      updateSubmission(item.id, { status: 'submitting' });

      try {
        // Submit with timeout
        const result = await withTimeout(
          currentService.submit(item.feedbackData),
          timeout
        );

        // Success
        updateSubmission(item.id, { status: 'success', error: undefined });
        onComplete?.(item.id, result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        if (item.retryCount < max) {
          // Retry
          updateSubmission(item.id, {
            status: 'pending',
            retryCount: item.retryCount + 1,
            error: errorMessage,
          });

          // Schedule retry with exponential backoff
          const backoffMs = Math.min(1000 * Math.pow(2, item.retryCount), 30000);
          setTimeout(() => {
            setQueue((prev) => {
              const updatedItem = prev.find((i) => i.id === item.id);
              if (updatedItem && updatedItem.status === 'pending') {
                processSubmission(updatedItem);
              }
              return prev;
            });
          }, backoffMs);
        } else {
          // Max retries reached
          updateSubmission(item.id, {
            status: 'error',
            error: errorMessage,
          });
          onError?.(item.id, error instanceof Error ? error : new Error(errorMessage));
        }
      }
    },
    [updateSubmission]
  );

  // Submit new feedback
  const submit = useCallback(
    async (feedbackData: FeedbackData): Promise<string> => {
      const id = generateSubmissionId();
      const newItem: SubmissionQueueItem = {
        id,
        status: 'pending',
        feedbackData,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      setQueue((prev) => [...prev, newItem]);

      // Start processing immediately
      // Use setTimeout to allow state to update first
      setTimeout(() => {
        processSubmission(newItem);
      }, 0);

      return id;
    },
    [processSubmission]
  );

  // Retry a failed submission
  const retry = useCallback(
    async (submissionId: string): Promise<void> => {
      const item = queue.find((i) => i.id === submissionId);
      if (item && item.status === 'error') {
        // Reset retry count and process again
        const updatedItem = { ...item, retryCount: 0 };
        updateSubmission(submissionId, { retryCount: 0, status: 'pending' });
        processSubmission(updatedItem);
      }
    },
    [queue, updateSubmission, processSubmission]
  );

  // Dismiss a submission
  const dismiss = useCallback((submissionId: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== submissionId));
  }, []);

  // Clear completed submissions
  const clearCompleted = useCallback(() => {
    setQueue((prev) =>
      prev.filter((item) => item.status !== 'success' && item.status !== 'error')
    );
  }, []);

  // Clear all submissions
  const clearAll = useCallback(() => {
    setQueue([]);
  }, []);

  // Get a specific submission
  const getSubmission = useCallback(
    (id: string) => queue.find((item) => item.id === id),
    [queue]
  );

  // Computed values
  const isSubmitting = useMemo(
    () => queue.some((item) => item.status === 'submitting'),
    [queue]
  );

  const pendingCount = useMemo(
    () => queue.filter((item) => item.status === 'pending').length,
    [queue]
  );

  const errorCount = useMemo(
    () => queue.filter((item) => item.status === 'error').length,
    [queue]
  );

  // Memoize return value
  return useMemo(
    () => ({
      queue,
      isSubmitting,
      pendingCount,
      errorCount,
      submit,
      retry,
      dismiss,
      clearCompleted,
      clearAll,
      getSubmission,
    }),
    [
      queue,
      isSubmitting,
      pendingCount,
      errorCount,
      submit,
      retry,
      dismiss,
      clearCompleted,
      clearAll,
      getSubmission,
    ]
  );
}
