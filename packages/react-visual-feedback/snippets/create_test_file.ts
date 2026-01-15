#!/usr/bin/env bun
/**
 * Script to create the useFeedbackSubmission test file
 */

import { writeFileSync } from 'fs';

const testContent = `/**
 * React Visual Feedback - useFeedbackSubmission Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useFeedbackSubmission,
  type SubmissionService,
  type FeedbackData,
} from '../../../src/hooks/useFeedbackSubmission';

function createMockService(
  overrides: Partial<SubmissionService> = {}
): SubmissionService {
  return {
    submit: vi.fn().mockResolvedValue({ id: 'test-result', success: true }),
    ...overrides,
  };
}

function createFeedbackData(overrides: Partial<FeedbackData> = {}): FeedbackData {
  return {
    title: 'Test Feedback',
    description: 'Test description',
    type: 'bug',
    ...overrides,
  };
}

async function flushPromisesAndTimers(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    vi.runAllTimers();
    await Promise.resolve();
  });
}

describe('useFeedbackSubmission', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty queue', () => {
      const { result } = renderHook(() => useFeedbackSubmission());
      expect(result.current.queue).toEqual([]);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.pendingCount).toBe(0);
      expect(result.current.errorCount).toBe(0);
    });

    it('should initialize with provided initial queue', () => {
      const initialQueue = [{
        id: 'test-1',
        status: 'pending' as const,
        feedbackData: createFeedbackData(),
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.pendingCount).toBe(1);
    });
  });

  describe('submit', () => {
    it('should add submission to queue', async () => {
      const mockService = createMockService();
      const { result } = renderHook(() => useFeedbackSubmission({ service: mockService }));
      let submissionId: string = '';
      await act(async () => {
        submissionId = await result.current.submit(createFeedbackData());
      });
      expect(submissionId).toMatch(/^sub_/);
      expect(result.current.queue.length).toBeGreaterThanOrEqual(1);
    });

    it('should call service submit method', async () => {
      const mockService = createMockService();
      const feedbackData = createFeedbackData();
      const { result } = renderHook(() => useFeedbackSubmission({ service: mockService }));
      await act(async () => {
        await result.current.submit(feedbackData);
      });
      await flushPromisesAndTimers();
      expect(mockService.submit).toHaveBeenCalledWith(feedbackData);
    });

    it('should update status to success on successful submission', async () => {
      const mockService = createMockService({
        submit: vi.fn().mockResolvedValue({ id: 'result', success: true }),
      });
      const { result } = renderHook(() => useFeedbackSubmission({ service: mockService }));
      let submissionId: string = '';
      await act(async () => {
        submissionId = await result.current.submit(createFeedbackData());
      });
      await flushPromisesAndTimers();
      const submission = result.current.getSubmission(submissionId);
      expect(submission?.status).toBe('success');
    });

    it('should call onSubmissionComplete callback on success', async () => {
      const onSubmissionComplete = vi.fn();
      const mockService = createMockService();
      const { result } = renderHook(() =>
        useFeedbackSubmission({ service: mockService, onSubmissionComplete })
      );
      await act(async () => {
        await result.current.submit(createFeedbackData());
      });
      await flushPromisesAndTimers();
      expect(onSubmissionComplete).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should mark as error after max retries', async () => {
      const mockService = createMockService({
        submit: vi.fn().mockRejectedValue(new Error('Permanent error')),
      });
      const onSubmissionError = vi.fn();
      const { result } = renderHook(() =>
        useFeedbackSubmission({ service: mockService, maxRetries: 0, onSubmissionError })
      );
      let submissionId: string = '';
      await act(async () => {
        submissionId = await result.current.submit(createFeedbackData());
      });
      await flushPromisesAndTimers();
      const submission = result.current.getSubmission(submissionId);
      expect(submission?.status).toBe('error');
      expect(submission?.error).toBe('Permanent error');
      expect(onSubmissionError).toHaveBeenCalled();
    });
  });

  describe('retry method', () => {
    it('should retry a failed submission', async () => {
      const mockService = createMockService({
        submit: vi.fn()
          .mockRejectedValueOnce(new Error('Error'))
          .mockResolvedValueOnce({ id: 'result', success: true }),
      });
      const { result } = renderHook(() =>
        useFeedbackSubmission({ service: mockService, maxRetries: 0 })
      );
      let submissionId: string = '';
      await act(async () => {
        submissionId = await result.current.submit(createFeedbackData());
      });
      await flushPromisesAndTimers();
      expect(result.current.getSubmission(submissionId)?.status).toBe('error');
      await act(async () => {
        await result.current.retry(submissionId);
      });
      await flushPromisesAndTimers();
      expect(result.current.getSubmission(submissionId)?.status).toBe('success');
    });
  });

  describe('queue management', () => {
    it('should dismiss a submission', () => {
      const initialQueue = [{
        id: 'to-dismiss',
        status: 'error' as const,
        feedbackData: createFeedbackData(),
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      expect(result.current.queue).toHaveLength(1);
      act(() => { result.current.dismiss('to-dismiss'); });
      expect(result.current.queue).toHaveLength(0);
    });

    it('should clear completed submissions', () => {
      const initialQueue = [
        { id: 'pending-1', status: 'pending' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
        { id: 'success-1', status: 'success' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
        { id: 'error-1', status: 'error' as const, feedbackData: createFeedbackData(), retryCount: 3, createdAt: new Date().toISOString(), error: 'Failed' },
      ];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      act(() => { result.current.clearCompleted(); });
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].id).toBe('pending-1');
    });

    it('should clear all submissions', () => {
      const initialQueue = [
        { id: 'sub-1', status: 'pending' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
        { id: 'sub-2', status: 'success' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
      ];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      act(() => { result.current.clearAll(); });
      expect(result.current.queue).toHaveLength(0);
    });

    it('should get a specific submission by ID', () => {
      const initialQueue = [{
        id: 'find-me',
        status: 'pending' as const,
        feedbackData: createFeedbackData({ title: 'Find Me' }),
        retryCount: 0,
        createdAt: new Date().toISOString(),
      }];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      const submission = result.current.getSubmission('find-me');
      expect(submission?.feedbackData.title).toBe('Find Me');
    });

    it('should return undefined for non-existent submission', () => {
      const { result } = renderHook(() => useFeedbackSubmission());
      expect(result.current.getSubmission('does-not-exist')).toBeUndefined();
    });
  });

  describe('computed values', () => {
    it('should track isSubmitting correctly', () => {
      const initialQueue = [
        { id: 'sub-1', status: 'pending' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
        { id: 'sub-2', status: 'submitting' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
      ];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      expect(result.current.isSubmitting).toBe(true);
    });

    it('should track pendingCount correctly', () => {
      const initialQueue = [
        { id: 'pending-1', status: 'pending' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
        { id: 'pending-2', status: 'pending' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
        { id: 'success-1', status: 'success' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
      ];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      expect(result.current.pendingCount).toBe(2);
    });

    it('should track errorCount correctly', () => {
      const initialQueue = [
        { id: 'error-1', status: 'error' as const, feedbackData: createFeedbackData(), retryCount: 3, createdAt: new Date().toISOString(), error: 'E1' },
        { id: 'error-2', status: 'error' as const, feedbackData: createFeedbackData(), retryCount: 3, createdAt: new Date().toISOString(), error: 'E2' },
        { id: 'success-1', status: 'success' as const, feedbackData: createFeedbackData(), retryCount: 0, createdAt: new Date().toISOString() },
      ];
      const { result } = renderHook(() => useFeedbackSubmission({ initialQueue }));
      expect(result.current.errorCount).toBe(2);
    });
  });

  describe('callbacks', () => {
    it('should call onQueueChange when queue changes', async () => {
      const onQueueChange = vi.fn();
      const mockService = createMockService();
      const { result } = renderHook(() => useFeedbackSubmission({ service: mockService, onQueueChange }));
      await act(async () => {
        await result.current.submit(createFeedbackData());
      });
      expect(onQueueChange).toHaveBeenCalled();
    });
  });
});
`;

const filePath = 'tests/unit/hooks/useFeedbackSubmission.test.ts';

writeFileSync(filePath, testContent, 'utf8');
console.log(`Created ${filePath}`);
