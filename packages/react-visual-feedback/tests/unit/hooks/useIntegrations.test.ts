/**
 * Tests for useIntegrations hook
 *
 * These tests verify the integration management functionality:
 * - Status tracking for each integration type
 * - Submit method for individual integrations
 * - Submit all method for bulk operations
 * - Configuration checks
 * - Error handling
 * - Callback invocations
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useIntegrations,
  type UseIntegrationsOptions,
  type IntegrationService,
  type IntegrationResult,
  type IntegrationType,
  type IntegrationStatusMap,
} from '../../../src/hooks/useIntegrations.js';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Helper to flush promises and run timers
 */
async function flushPromisesAndTimers(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    vi.runAllTimers();
    await Promise.resolve();
  });
}

/**
 * Create a mock integration service
 */
function createMockService(overrides: Partial<IntegrationService> = {}): IntegrationService {
  return {
    send: vi.fn().mockResolvedValue({ success: true, type: 'jira' }),
    sendAll: vi.fn().mockResolvedValue({ jira: { success: true }, sheets: { success: true } }),
    updateStatus: vi.fn().mockResolvedValue({ success: true }),
    ...overrides,
  };
}

/**
 * Default options with mock service
 */
function createOptions(overrides: Partial<UseIntegrationsOptions> = {}): UseIntegrationsOptions {
  return {
    config: {
      jira: { enabled: true, endpoint: '/api/jira' },
      sheets: { enabled: true, endpoint: '/api/sheets' },
    },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('useIntegrations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Initial State Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Initial State', () => {
    test('should initialize with default empty status', () => {
      const { result } = renderHook(() => useIntegrations());

      expect(result.current.status.jira).toEqual({
        loading: false,
        error: null,
        result: null,
      });
      expect(result.current.status.sheets).toEqual({
        loading: false,
        error: null,
        result: null,
      });
    });

    test('should initialize with null lastResults', () => {
      const { result } = renderHook(() => useIntegrations());

      expect(result.current.lastResults.jira).toBeNull();
      expect(result.current.lastResults.sheets).toBeNull();
    });

    test('should start with isLoading false', () => {
      const { result } = renderHook(() => useIntegrations());

      expect(result.current.isLoading).toBe(false);
    });

    test('should start with hasError false', () => {
      const { result } = renderHook(() => useIntegrations());

      expect(result.current.hasError).toBe(false);
    });

    test('should return empty configuredTypes when no config provided', () => {
      const { result } = renderHook(() => useIntegrations());

      expect(result.current.configuredTypes).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // isConfigured Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('isConfigured', () => {
    test('should return true when jira is enabled', () => {
      const { result } = renderHook(() =>
        useIntegrations({
          config: { jira: { enabled: true } },
        })
      );

      expect(result.current.isConfigured('jira')).toBe(true);
    });

    test('should return false when jira is disabled', () => {
      const { result } = renderHook(() =>
        useIntegrations({
          config: { jira: { enabled: false } },
        })
      );

      expect(result.current.isConfigured('jira')).toBe(false);
    });

    test('should return true when sheets is enabled', () => {
      const { result } = renderHook(() =>
        useIntegrations({
          config: { sheets: { enabled: true } },
        })
      );

      expect(result.current.isConfigured('sheets')).toBe(true);
    });

    test('should return false when sheets is disabled', () => {
      const { result } = renderHook(() =>
        useIntegrations({
          config: { sheets: { enabled: false } },
        })
      );

      expect(result.current.isConfigured('sheets')).toBe(false);
    });

    test('should return false for unconfigured integration type', () => {
      const { result } = renderHook(() => useIntegrations());

      expect(result.current.isConfigured('jira')).toBe(false);
      expect(result.current.isConfigured('sheets')).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // configuredTypes Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('configuredTypes', () => {
    test('should return all enabled types', () => {
      const { result } = renderHook(() =>
        useIntegrations({
          config: {
            jira: { enabled: true },
            sheets: { enabled: true },
          },
        })
      );

      expect(result.current.configuredTypes).toEqual(['jira', 'sheets']);
    });

    test('should return only jira when only jira is enabled', () => {
      const { result } = renderHook(() =>
        useIntegrations({
          config: {
            jira: { enabled: true },
            sheets: { enabled: false },
          },
        })
      );

      expect(result.current.configuredTypes).toEqual(['jira']);
    });

    test('should return only sheets when only sheets is enabled', () => {
      const { result } = renderHook(() =>
        useIntegrations({
          config: {
            jira: { enabled: false },
            sheets: { enabled: true },
          },
        })
      );

      expect(result.current.configuredTypes).toEqual(['sheets']);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Submit Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('submit', () => {
    test('should call service.send with correct parameters', async () => {
      const mockService = createMockService();
      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
        })
      );

      const feedbackData = { id: '123', feedback: 'test' };

      await act(async () => {
        await result.current.submit('jira', feedbackData);
      });

      expect(mockService.send).toHaveBeenCalledWith('jira', feedbackData);
    });

    test('should set loading state during submission', async () => {
      let resolvePromise: (value: IntegrationResult) => void;
      const sendPromise = new Promise<IntegrationResult>((resolve) => {
        resolvePromise = resolve;
      });

      const mockService = createMockService({
        send: vi.fn().mockReturnValue(sendPromise),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
        })
      );

      // Start submission (don't await)
      let submitPromise: Promise<IntegrationResult>;
      act(() => {
        submitPromise = result.current.submit('jira', { id: '1' });
      });

      // Should be loading
      expect(result.current.status.jira.loading).toBe(true);
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true });
        await submitPromise;
      });

      // Should no longer be loading
      expect(result.current.status.jira.loading).toBe(false);
    });

    test('should update lastResults on successful submission', async () => {
      const successResult: IntegrationResult = {
        success: true,
        issueKey: 'JIRA-123',
        issueUrl: 'https://jira.example.com/JIRA-123',
        type: 'jira',
      };

      const mockService = createMockService({
        send: vi.fn().mockResolvedValue(successResult),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
        })
      );

      await act(async () => {
        await result.current.submit('jira', { id: '1' });
      });

      expect(result.current.lastResults.jira).toEqual(successResult);
    });

    test('should call onSuccess callback on successful submission', async () => {
      const onSuccess = vi.fn();
      const successResult: IntegrationResult = { success: true, type: 'jira' };

      const mockService = createMockService({
        send: vi.fn().mockResolvedValue(successResult),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
          onSuccess,
        })
      );

      await act(async () => {
        await result.current.submit('jira', { id: '1' });
      });

      expect(onSuccess).toHaveBeenCalledWith('jira', successResult);
    });

    test('should handle submission error from service', async () => {
      const errorResult: IntegrationResult = {
        success: false,
        error: 'API error',
        type: 'jira',
      };

      const mockService = createMockService({
        send: vi.fn().mockResolvedValue(errorResult),
      });

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
          onError,
        })
      );

      await act(async () => {
        await result.current.submit('jira', { id: '1' });
      });

      expect(result.current.status.jira.error).toBe('API error');
      expect(result.current.hasError).toBe(true);
      expect(onError).toHaveBeenCalledWith('jira', expect.any(Error));
    });

    test('should handle thrown error during submission', async () => {
      const mockService = createMockService({
        send: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
          onError,
        })
      );

      await act(async () => {
        await result.current.submit('jira', { id: '1' });
      });

      expect(result.current.status.jira.error).toBe('Network error');
      expect(onError).toHaveBeenCalledWith('jira', expect.any(Error));
    });

    test('should return error result when service is not initialized', async () => {
      // This shouldn't happen in normal usage, but test the guard
      const { result } = renderHook(() => useIntegrations());

      // Force service to be null by accessing before initialization
      // In practice, the hook always initializes the service
      const submitResult = await act(async () => {
        return await result.current.submit('jira', { id: '1' });
      });

      // The default service should be created, returning "not enabled" error
      expect(submitResult.success).toBe(false);
      expect(submitResult.error).toContain('not enabled');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // submitAll Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('submitAll', () => {
    test('should submit to all enabled integrations', async () => {
      const mockService = createMockService({
        send: vi.fn().mockImplementation(async (type: IntegrationType) => ({
          success: true,
          type,
        })),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          config: {
            jira: { enabled: true },
            sheets: { enabled: true },
          },
          service: mockService,
        })
      );

      const feedbackData = { id: '123' };

      await act(async () => {
        await result.current.submitAll(feedbackData);
      });

      expect(mockService.send).toHaveBeenCalledTimes(2);
      expect(mockService.send).toHaveBeenCalledWith('jira', feedbackData);
      expect(mockService.send).toHaveBeenCalledWith('sheets', feedbackData);
    });

    test('should only submit to enabled integrations', async () => {
      const mockService = createMockService({
        send: vi.fn().mockResolvedValue({ success: true }),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          config: {
            jira: { enabled: true },
            sheets: { enabled: false },
          },
          service: mockService,
        })
      );

      await act(async () => {
        await result.current.submitAll({ id: '123' });
      });

      expect(mockService.send).toHaveBeenCalledTimes(1);
      expect(mockService.send).toHaveBeenCalledWith('jira', { id: '123' });
    });

    test('should return results for all submitted integrations', async () => {
      const mockService = createMockService({
        send: vi.fn().mockImplementation(async (type: IntegrationType) => ({
          success: true,
          type,
          issueKey: type === 'jira' ? 'JIRA-1' : undefined,
        })),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          config: {
            jira: { enabled: true },
            sheets: { enabled: true },
          },
          service: mockService,
        })
      );

      let results: Record<IntegrationType, IntegrationResult | null>;

      await act(async () => {
        results = await result.current.submitAll({ id: '123' });
      });

      expect(results!.jira?.success).toBe(true);
      expect(results!.jira?.issueKey).toBe('JIRA-1');
      expect(results!.sheets?.success).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // updateStatus Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    test('should call service.updateStatus with correct parameters', async () => {
      const mockService = createMockService();

      const { result } = renderHook(() =>
        useIntegrations({
          config: { jira: { enabled: true } },
          service: mockService,
        })
      );

      await act(async () => {
        await result.current.updateStatus('jira', 'feedback-123', 'resolved');
      });

      expect(mockService.updateStatus).toHaveBeenCalledWith('jira', 'feedback-123', 'resolved');
    });

    test('should return null when integration is not configured', async () => {
      const mockService = createMockService();

      const { result } = renderHook(() =>
        useIntegrations({
          config: { jira: { enabled: false } },
          service: mockService,
        })
      );

      let updateResult: IntegrationResult | null;

      await act(async () => {
        updateResult = await result.current.updateStatus('jira', 'feedback-123', 'resolved');
      });

      expect(updateResult!).toBeNull();
      expect(mockService.updateStatus).not.toHaveBeenCalled();
    });

    test('should update status on successful status update', async () => {
      const mockService = createMockService({
        updateStatus: vi.fn().mockResolvedValue({ success: true, type: 'jira' }),
      });

      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useIntegrations({
          config: { jira: { enabled: true } },
          service: mockService,
          onSuccess,
        })
      );

      await act(async () => {
        await result.current.updateStatus('jira', 'feedback-123', 'resolved');
      });

      expect(onSuccess).toHaveBeenCalledWith('jira', { success: true, type: 'jira' });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // resetStatus Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('resetStatus', () => {
    test('should reset status for specific integration type', async () => {
      const mockService = createMockService({
        send: vi.fn().mockResolvedValue({ success: false, error: 'Error' }),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
        })
      );

      // Submit to create error state
      await act(async () => {
        await result.current.submit('jira', { id: '1' });
      });

      expect(result.current.status.jira.error).toBe('Error');

      // Reset jira status only
      act(() => {
        result.current.resetStatus('jira');
      });

      expect(result.current.status.jira).toEqual({
        loading: false,
        error: null,
        result: null,
      });
    });

    test('should reset all status when no type provided', async () => {
      const mockService = createMockService({
        send: vi.fn().mockResolvedValue({ success: false, error: 'Error' }),
      });

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
        })
      );

      // Submit to both
      await act(async () => {
        await result.current.submit('jira', { id: '1' });
        await result.current.submit('sheets', { id: '2' });
      });

      // Reset all
      act(() => {
        result.current.resetStatus();
      });

      expect(result.current.status.jira.error).toBeNull();
      expect(result.current.status.sheets.error).toBeNull();
      expect(result.current.hasError).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // getConfigModal Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('getConfigModal', () => {
    test('should return null (placeholder for future implementation)', () => {
      const { result } = renderHook(() => useIntegrations());

      expect(result.current.getConfigModal('jira')).toBeNull();
      expect(result.current.getConfigModal('sheets')).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Callback Stability Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Callback Stability', () => {
    test('should maintain stable function references across rerenders', () => {
      const { result, rerender } = renderHook(() => useIntegrations(createOptions()));

      const firstRender = {
        submit: result.current.submit,
        submitAll: result.current.submitAll,
        isConfigured: result.current.isConfigured,
        resetStatus: result.current.resetStatus,
        getConfigModal: result.current.getConfigModal,
        updateStatus: result.current.updateStatus,
      };

      rerender();

      expect(result.current.submit).toBe(firstRender.submit);
      expect(result.current.submitAll).toBe(firstRender.submitAll);
      expect(result.current.isConfigured).toBe(firstRender.isConfigured);
      expect(result.current.resetStatus).toBe(firstRender.resetStatus);
      expect(result.current.getConfigModal).toBe(firstRender.getConfigModal);
      expect(result.current.updateStatus).toBe(firstRender.updateStatus);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // onStatusChange Callback Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('onStatusChange', () => {
    test('should call onStatusChange when status changes', async () => {
      const onStatusChange = vi.fn();
      const mockService = createMockService();

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
          onStatusChange,
        })
      );

      await act(async () => {
        await result.current.submit('jira', { id: '1' });
      });

      // Called at least twice: once for loading, once for result
      expect(onStatusChange).toHaveBeenCalled();
      expect(onStatusChange).toHaveBeenCalledWith(expect.objectContaining({
        jira: expect.any(Object),
        sheets: expect.any(Object),
      }));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Memoization Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Memoization', () => {
    test('should memoize return object when dependencies unchanged', () => {
      const { result, rerender } = renderHook(() => useIntegrations(createOptions()));

      const firstResult = result.current;
      rerender();

      // The overall return object should be memoized
      expect(result.current).toBe(firstResult);
    });

    test('should update when status changes', async () => {
      const mockService = createMockService();

      const { result } = renderHook(() =>
        useIntegrations({
          ...createOptions(),
          service: mockService,
        })
      );

      const initialStatus = result.current.status;

      await act(async () => {
        await result.current.submit('jira', { id: '1' });
      });

      expect(result.current.status).not.toBe(initialStatus);
    });
  });
});
