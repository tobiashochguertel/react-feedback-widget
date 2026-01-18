/**
 * Unit Tests for Reconnection Manager
 *
 * TASK-WWS-009: Unit Tests for WebSocket Library
 *
 * Tests the ReconnectionManager class with mocked timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ReconnectionManager,
  calculateReconnectDelay,
  formatDelay,
} from '../reconnect';

describe('ReconnectionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Basic Functionality Tests
  // ==========================================================================

  describe('Basic Functionality', () => {
    it('should create manager with required config', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        onReconnect,
      });

      expect(manager.getAttempts()).toBe(0);
      expect(manager.isMaxAttemptsReached()).toBe(false);
    });

    it('should track attempt count', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        onReconnect,
      });

      manager.scheduleReconnect();
      vi.runAllTimers();
      expect(manager.getAttempts()).toBe(1);

      manager.scheduleReconnect();
      vi.runAllTimers();
      expect(manager.getAttempts()).toBe(2);
    });

    it('should reset attempt count on reset()', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        onReconnect,
      });

      manager.scheduleReconnect();
      vi.runAllTimers();
      manager.scheduleReconnect();
      vi.runAllTimers();
      manager.reset();

      expect(manager.getAttempts()).toBe(0);
    });
  });

  // ==========================================================================
  // Scheduling Tests
  // ==========================================================================

  describe('Scheduling', () => {
    it('should call onReconnect callback after delay', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        jitterFactor: 0, // Disable jitter for predictable testing
        onReconnect,
      });

      manager.scheduleReconnect();

      expect(onReconnect).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(onReconnect).toHaveBeenCalledTimes(1);
    });

    it('should increase delay with each attempt (exponential backoff)', () => {
      const onDelayCalculated = vi.fn();
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        jitterFactor: 0,
        onReconnect,
        onDelayCalculated,
      });

      // Attempt 1: base delay (1000ms)
      manager.scheduleReconnect();
      vi.runAllTimers();

      // Attempt 2: 2 * base (2000ms)
      manager.scheduleReconnect();
      vi.runAllTimers();

      // Attempt 3: 4 * base (4000ms)
      manager.scheduleReconnect();
      vi.runAllTimers();

      expect(onDelayCalculated).toHaveBeenNthCalledWith(1, 1000, 1);
      expect(onDelayCalculated).toHaveBeenNthCalledWith(2, 2000, 2);
      expect(onDelayCalculated).toHaveBeenNthCalledWith(3, 4000, 3);
    });

    it('should cap delay at maxDelay', () => {
      const onDelayCalculated = vi.fn();
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 20,
        baseDelay: 1000,
        maxDelay: 5000,
        jitterFactor: 0,
        onReconnect,
        onDelayCalculated,
      });

      // Run many attempts to exceed maxDelay
      for (let i = 0; i < 10; i++) {
        manager.scheduleReconnect();
        vi.runAllTimers();
      }

      // All delays after the third should be 5000 (capped)
      const calls = onDelayCalculated.mock.calls;
      for (let i = 2; i < calls.length; i++) {
        expect(calls[i][0]).toBeLessThanOrEqual(5000);
      }
    });

    it('should cancel pending reconnect on cancel()', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        onReconnect,
      });

      manager.scheduleReconnect();
      manager.cancel();

      vi.advanceTimersByTime(2000);

      expect(onReconnect).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Max Attempts Tests
  // ==========================================================================

  describe('Max Attempts', () => {
    it('should detect when max attempts reached', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        onReconnect,
      });

      manager.scheduleReconnect();
      vi.runAllTimers();
      expect(manager.isMaxAttemptsReached()).toBe(false);

      manager.scheduleReconnect();
      vi.runAllTimers();
      expect(manager.isMaxAttemptsReached()).toBe(false);

      manager.scheduleReconnect();
      vi.runAllTimers();
      expect(manager.isMaxAttemptsReached()).toBe(true);
    });

    it('should call onMaxAttemptsReached when max attempts reached', () => {
      const onReconnect = vi.fn();
      const onMaxAttemptsReached = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 2,
        baseDelay: 100,
        maxDelay: 1000,
        onReconnect,
        onMaxAttemptsReached,
      });

      manager.scheduleReconnect();
      vi.runAllTimers();
      manager.scheduleReconnect();
      vi.runAllTimers();

      // This should trigger onMaxAttemptsReached
      manager.scheduleReconnect();

      expect(onMaxAttemptsReached).toHaveBeenCalledTimes(1);
    });

    it('should allow infinite attempts when maxAttempts is 0', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 0,
        baseDelay: 10,
        maxDelay: 100,
        onReconnect,
      });

      // Run many attempts
      for (let i = 0; i < 100; i++) {
        expect(manager.isMaxAttemptsReached()).toBe(false);
        manager.scheduleReconnect();
        vi.runAllTimers();
      }

      expect(manager.getAttempts()).toBe(100);
      expect(manager.isMaxAttemptsReached()).toBe(false);
    });
  });

  // ==========================================================================
  // Immediate Reconnect Tests
  // ==========================================================================

  describe('Immediate Reconnect', () => {
    it('should reconnect immediately on reconnectNow()', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 10000, // Long delay
        maxDelay: 30000,
        onReconnect,
      });

      manager.reconnectNow();

      // Should be called immediately (synchronously)
      expect(onReconnect).toHaveBeenCalledTimes(1);
      expect(manager.getAttempts()).toBe(1);
    });

    it('should cancel pending reconnect when calling reconnectNow()', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 10000,
        maxDelay: 30000,
        onReconnect,
      });

      manager.scheduleReconnect();
      manager.reconnectNow();

      // Should only be called once (from reconnectNow)
      vi.advanceTimersByTime(20000);
      expect(onReconnect).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // State Tests
  // ==========================================================================

  describe('State', () => {
    it('should report scheduled state correctly', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        onReconnect,
      });

      expect(manager.isScheduled()).toBe(false);

      manager.scheduleReconnect();
      expect(manager.isScheduled()).toBe(true);

      // After cancel, should not be scheduled
      manager.cancel();
      expect(manager.isScheduled()).toBe(false);
    });

    it('should return correct state from getState()', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        jitterFactor: 0,
        onReconnect,
      });

      const state1 = manager.getState();
      expect(state1.attempts).toBe(0);
      expect(state1.isScheduled).toBe(false);
      expect(state1.nextAttemptAt).toBeNull();

      manager.scheduleReconnect();
      const state2 = manager.getState();
      expect(state2.isScheduled).toBe(true);
      expect(state2.nextAttemptAt).not.toBeNull();
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('Cleanup', () => {
    it('should clean up on stop()', () => {
      const onReconnect = vi.fn();
      const manager = new ReconnectionManager({
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 30000,
        onReconnect,
      });

      manager.scheduleReconnect();
      vi.runAllTimers();
      manager.scheduleReconnect();
      vi.runAllTimers();

      manager.stop();

      expect(manager.getAttempts()).toBe(0);
      expect(manager.isScheduled()).toBe(false);

      vi.advanceTimersByTime(60000);
      expect(onReconnect).toHaveBeenCalledTimes(2); // Only the two before stop
    });
  });
});

// ==========================================================================
// Utility Function Tests
// ==========================================================================

describe('calculateReconnectDelay', () => {
  it('should calculate correct delay for first attempt', () => {
    const delay = calculateReconnectDelay(0, 1000, 30000);
    expect(delay).toBe(1000);
  });

  it('should double delay for each subsequent attempt', () => {
    const delay1 = calculateReconnectDelay(0, 1000, 30000);
    const delay2 = calculateReconnectDelay(1, 1000, 30000);
    const delay3 = calculateReconnectDelay(2, 1000, 30000);

    expect(delay1).toBe(1000);
    expect(delay2).toBe(2000);
    expect(delay3).toBe(4000);
  });

  it('should cap at maxDelay', () => {
    const delay = calculateReconnectDelay(100, 1000, 5000);
    expect(delay).toBe(5000);
  });
});

describe('formatDelay', () => {
  it('should format milliseconds correctly', () => {
    expect(formatDelay(500)).toBe('500ms');
    expect(formatDelay(999)).toBe('999ms');
  });

  it('should format seconds correctly', () => {
    expect(formatDelay(1000)).toBe('1s');
    expect(formatDelay(1500)).toBe('2s'); // rounds
    expect(formatDelay(2000)).toBe('2s');
    expect(formatDelay(30000)).toBe('30s');
    expect(formatDelay(59000)).toBe('59s');
  });

  it('should format minutes correctly', () => {
    expect(formatDelay(60000)).toBe('1m');
    expect(formatDelay(90000)).toBe('1m 30s');
    expect(formatDelay(120000)).toBe('2m');
  });
});
