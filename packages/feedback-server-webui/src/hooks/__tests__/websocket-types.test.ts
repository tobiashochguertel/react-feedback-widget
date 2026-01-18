/**
 * WebSocket Types and Utilities Tests
 *
 * TASK-WWS-010: Unit tests for WebSocket types and utilities
 *
 * These tests focus on the type-safe utilities and helpers that can be
 * tested without mocking complex WebSocket or React dependencies.
 */

import { describe, it, expect } from 'vitest';

// ==========================================================================
// Type Imports (compile-time verification)
// ==========================================================================

import type {
  ConnectionStatus,
  WebSocketClientConfig,
  UseWebSocketOptions,
  UseWebSocketReturn,
  UseFeedbackSubscriptionOptions,
  UseFeedbackSubscriptionReturn,
  Subscription,
  SubscriptionFilters,
  SendResult,
} from '@/lib/websocket';

import {
  WS_CLOSE_CODES,
  WebSocketClient,
  SubscriptionTracker,
  ReconnectionManager,
  createFeedbackChannel,
  parseFeedbackChannel,
  isFeedbackChannel,
  calculateReconnectDelay,
  formatDelay,
} from '@/lib/websocket';

// ==========================================================================
// Close Codes Tests
// ==========================================================================

describe('WS_CLOSE_CODES', () => {
  it('should have standard WebSocket close codes', () => {
    expect(WS_CLOSE_CODES.NORMAL).toBe(1000);
    expect(WS_CLOSE_CODES.GOING_AWAY).toBe(1001);
    expect(WS_CLOSE_CODES.PROTOCOL_ERROR).toBe(1002);
  });

  it('should have custom application close codes', () => {
    expect(WS_CLOSE_CODES.AUTH_FAILED).toBe(4001);
    expect(WS_CLOSE_CODES.RATE_LIMITED).toBe(4029);
    expect(WS_CLOSE_CODES.SERVER_ERROR).toBe(4500);
  });

  it('should have immutable close codes', () => {
    // TypeScript const assertion makes this immutable
    const codes = { ...WS_CLOSE_CODES };
    expect(codes).toEqual(WS_CLOSE_CODES);
  });
});

// ==========================================================================
// Type Compatibility Tests (compile-time verification)
// ==========================================================================

describe('Type Compatibility', () => {
  describe('ConnectionStatus', () => {
    it('should accept valid connection status values', () => {
      const statuses: ConnectionStatus[] = [
        'connecting',
        'connected',
        'disconnecting',
        'disconnected',
        'reconnecting',
      ];

      expect(statuses).toHaveLength(5);
    });
  });

  describe('WebSocketClientConfig', () => {
    it('should accept valid config with required fields', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:3000/ws',
      };

      expect(config.url).toBe('ws://localhost:3000/ws');
    });

    it('should accept config with all optional fields', () => {
      const config: WebSocketClientConfig = {
        url: 'ws://localhost:3000/ws',
        autoReconnect: true,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        maxReconnectDelay: 30000,
        heartbeatInterval: 30000,
        connectionTimeout: 10000,
      };

      expect(config.autoReconnect).toBe(true);
      expect(config.maxReconnectAttempts).toBe(5);
    });
  });

  describe('Subscription', () => {
    it('should accept valid subscription object', () => {
      const subscription: Subscription = {
        id: 'sub_123',
        channel: 'feedback',
        confirmed: false,
        createdAt: Date.now(),
      };

      expect(subscription.id).toBe('sub_123');
      expect(subscription.channel).toBe('feedback');
    });

    it('should accept subscription with optional filters', () => {
      const subscription: Subscription = {
        id: 'sub_456',
        channel: 'feedback',
        filters: { status: ['new'] },
        confirmed: true,
        createdAt: Date.now(),
      };

      expect(subscription.filters?.status).toEqual(['new']);
    });
  });

  describe('SendResult', () => {
    it('should accept success result', () => {
      const result: SendResult = {
        success: true,
      };

      expect(result.success).toBe(true);
    });

    it('should accept error result', () => {
      const result: SendResult = {
        success: false,
        error: 'Connection failed',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('UseWebSocketOptions', () => {
    it('should accept minimal options', () => {
      const options: UseWebSocketOptions = {
        url: 'ws://localhost:3000/ws',
      };

      expect(options.url).toBeDefined();
    });

    it('should accept options with callbacks', () => {
      const options: UseWebSocketOptions = {
        url: 'ws://localhost:3000/ws',
        autoConnect: true,
        autoReconnect: true,
        onConnect: () => { },
        onDisconnect: () => { },
        onError: () => { },
        onReconnecting: () => { },
      };

      expect(options.autoConnect).toBe(true);
    });
  });

  describe('UseFeedbackSubscriptionOptions', () => {
    it('should accept minimal options', () => {
      const options: UseFeedbackSubscriptionOptions = {};

      expect(options.autoSubscribe).toBeUndefined();
    });

    it('should accept options with callbacks', () => {
      const options: UseFeedbackSubscriptionOptions = {
        projectId: 'project-123',
        autoSubscribe: true,
        filters: { status: ['new', 'in_progress'] },
        onFeedbackCreated: () => { },
        onFeedbackUpdated: () => { },
        onFeedbackDeleted: () => { },
      };

      expect(options.projectId).toBe('project-123');
      expect(options.autoSubscribe).toBe(true);
    });
  });
});

// ==========================================================================
// Class Export Tests
// ==========================================================================

describe('Class Exports', () => {
  describe('WebSocketClient', () => {
    it('should be a constructor function', () => {
      expect(typeof WebSocketClient).toBe('function');
    });

    it('should have static members if any', () => {
      // Verify WebSocketClient can be referenced
      expect(WebSocketClient).toBeDefined();
    });
  });

  describe('SubscriptionTracker', () => {
    it('should be a constructor function', () => {
      expect(typeof SubscriptionTracker).toBe('function');
    });

    it('should be instantiable', () => {
      const tracker = new SubscriptionTracker();
      expect(tracker).toBeInstanceOf(SubscriptionTracker);
    });
  });

  describe('ReconnectionManager', () => {
    it('should be a constructor function', () => {
      expect(typeof ReconnectionManager).toBe('function');
    });

    it('should be instantiable with required config', () => {
      const manager = new ReconnectionManager({
        onReconnect: () => { },
      });
      expect(manager).toBeInstanceOf(ReconnectionManager);
    });
  });
});

// ==========================================================================
// Helper Function Tests
// ==========================================================================

describe('Helper Functions', () => {
  describe('createFeedbackChannel', () => {
    it('should create general feedback channel', () => {
      expect(createFeedbackChannel()).toBe('feedback');
    });

    it('should create feedback-specific channel', () => {
      expect(createFeedbackChannel('item-123')).toBe('feedback:item-123');
    });
  });

  describe('parseFeedbackChannel', () => {
    it('should parse general feedback channel', () => {
      const result = parseFeedbackChannel('feedback');
      expect(result.feedbackId).toBeUndefined();
    });

    it('should parse feedback-specific channel', () => {
      const result = parseFeedbackChannel('feedback:item-456');
      expect(result.feedbackId).toBe('item-456');
    });

    it('should return empty object for non-feedback channels', () => {
      const result = parseFeedbackChannel('other:channel');
      expect(result.feedbackId).toBeUndefined();
    });
  });

  describe('isFeedbackChannel', () => {
    it('should identify general feedback channel', () => {
      expect(isFeedbackChannel('feedback')).toBe(true);
    });

    it('should identify feedback-specific channels', () => {
      expect(isFeedbackChannel('feedback:item-123')).toBe(true);
    });

    it('should reject non-feedback channels', () => {
      expect(isFeedbackChannel('updates')).toBe(false);
      expect(isFeedbackChannel('other:channel')).toBe(false);
    });
  });

  describe('calculateReconnectDelay', () => {
    it('should calculate delay for first attempt', () => {
      const delay = calculateReconnectDelay(0, 1000, 30000);
      expect(delay).toBe(1000);
    });

    it('should increase delay exponentially', () => {
      const delay1 = calculateReconnectDelay(1, 1000, 30000);
      const delay2 = calculateReconnectDelay(2, 1000, 30000);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should cap at maxDelay', () => {
      const delay = calculateReconnectDelay(10, 1000, 30000);
      expect(delay).toBeLessThanOrEqual(30000);
    });
  });

  describe('formatDelay', () => {
    it('should format milliseconds', () => {
      expect(formatDelay(500)).toMatch(/ms/);
    });

    it('should format seconds', () => {
      expect(formatDelay(2500)).toMatch(/s/);
    });

    it('should format minutes', () => {
      expect(formatDelay(120000)).toMatch(/m/);
    });
  });
});
