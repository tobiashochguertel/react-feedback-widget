/**
 * Unit Tests for SubscriptionTracker
 *
 * TASK-WWS-009: Unit Tests for WebSocket Library
 *
 * Tests the SubscriptionTracker class for channel subscription management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionTracker, createFeedbackChannel, parseFeedbackChannel, isFeedbackChannel } from '../subscriptions';

describe('SubscriptionTracker', () => {
  let tracker: SubscriptionTracker;

  beforeEach(() => {
    tracker = new SubscriptionTracker();
  });

  // ==========================================================================
  // Basic Operations Tests
  // ==========================================================================

  describe('Basic Operations', () => {
    it('should start with no subscriptions', () => {
      expect(tracker.count()).toBe(0);
      expect(tracker.getAll()).toEqual([]);
    });

    it('should add a subscription', () => {
      const sub = tracker.add('feedback');

      expect(sub.channel).toBe('feedback');
      expect(sub.confirmed).toBe(false);
      expect(tracker.count()).toBe(1);
    });

    it('should add subscription with filters', () => {
      const filters = { status: ['new', 'in_progress'] };
      const sub = tracker.add('feedback', filters);

      expect(sub.channel).toBe('feedback');
      expect(sub.filters).toEqual(filters);
    });

    it('should check if subscribed to channel', () => {
      expect(tracker.has('feedback')).toBe(false);

      tracker.add('feedback');

      expect(tracker.has('feedback')).toBe(true);
    });

    it('should remove subscription', () => {
      tracker.add('feedback');

      expect(tracker.remove('feedback')).toBe(true);
      expect(tracker.has('feedback')).toBe(false);
      expect(tracker.count()).toBe(0);
    });

    it('should return false when removing non-existent subscription', () => {
      expect(tracker.remove('nonexistent')).toBe(false);
    });
  });

  // ==========================================================================
  // Confirmation Tests
  // ==========================================================================

  describe('Confirmation', () => {
    it('should confirm a subscription', () => {
      tracker.add('feedback');

      expect(tracker.confirm('feedback')).toBe(true);
      expect(tracker.isConfirmed('feedback')).toBe(true);
    });

    it('should return false when confirming non-existent channel', () => {
      expect(tracker.confirm('nonexistent')).toBe(false);
    });

    it('should unconfirm a subscription', () => {
      tracker.add('feedback');
      tracker.confirm('feedback');

      expect(tracker.unconfirm('feedback')).toBe(true);
      expect(tracker.isConfirmed('feedback')).toBe(false);
    });

    it('should get all confirmed subscriptions', () => {
      tracker.add('feedback');
      tracker.add('updates');
      tracker.add('system');
      tracker.confirm('feedback');
      tracker.confirm('system');

      const confirmed = tracker.getConfirmed();

      expect(confirmed.length).toBe(2);
      expect(confirmed.map(s => s.channel)).toContain('feedback');
      expect(confirmed.map(s => s.channel)).toContain('system');
    });

    it('should get all unconfirmed subscriptions', () => {
      tracker.add('feedback');
      tracker.add('updates');
      tracker.confirm('feedback');

      const unconfirmed = tracker.getUnconfirmed();

      expect(unconfirmed.length).toBe(1);
      expect(unconfirmed[0].channel).toBe('updates');
    });
  });

  // ==========================================================================
  // Batch Operations Tests
  // ==========================================================================

  describe('Batch Operations', () => {
    it('should add many subscriptions at once', () => {
      const subs = tracker.addMany([
        { channel: 'feedback' },
        { channel: 'updates', filters: { type: 'important' } },
        { channel: 'system' },
      ]);

      expect(subs.length).toBe(3);
      expect(tracker.count()).toBe(3);
    });

    it('should remove many subscriptions at once', () => {
      tracker.add('feedback');
      tracker.add('updates');
      tracker.add('system');

      const removed = tracker.removeMany(['feedback', 'updates']);

      expect(removed).toBe(2);
      expect(tracker.count()).toBe(1);
      expect(tracker.has('system')).toBe(true);
    });

    it('should clear all subscriptions', () => {
      tracker.add('feedback');
      tracker.add('updates');
      tracker.add('system');

      tracker.clear();

      expect(tracker.count()).toBe(0);
    });

    it('should unconfirm all subscriptions', () => {
      tracker.add('feedback');
      tracker.add('updates');
      tracker.confirm('feedback');
      tracker.confirm('updates');

      tracker.unconfirmAll();

      expect(tracker.getConfirmed().length).toBe(0);
    });
  });

  // ==========================================================================
  // Filter Updates Tests
  // ==========================================================================

  describe('Filter Updates', () => {
    it('should update filters for existing subscription', () => {
      tracker.add('feedback', { status: ['new'] });

      const result = tracker.updateFilters('feedback', { status: ['in_progress'] });

      expect(result).toBe(true);
      const sub = tracker.get('feedback');
      expect(sub?.filters).toEqual({ status: ['in_progress'] });
    });

    it('should mark subscription as unconfirmed when filters change', () => {
      tracker.add('feedback');
      tracker.confirm('feedback');

      tracker.updateFilters('feedback', { status: ['new'] });

      expect(tracker.isConfirmed('feedback')).toBe(false);
    });

    it('should return false when updating filters for non-existent channel', () => {
      expect(tracker.updateFilters('nonexistent', {})).toBe(false);
    });
  });

  // ==========================================================================
  // Serialization Tests
  // ==========================================================================

  describe('Serialization', () => {
    it('should export to JSON', () => {
      tracker.add('feedback', { status: ['new'] });
      tracker.add('updates');

      const json = tracker.toJSON();

      expect(json.length).toBe(2);
      expect(json.find(s => s.channel === 'feedback')?.filters).toEqual({ status: ['new'] });
    });

    it('should import from JSON', () => {
      const data = [
        { channel: 'feedback', filters: { status: ['new'] } },
        { channel: 'updates' },
      ];

      tracker.fromJSON(data);

      expect(tracker.count()).toBe(2);
      expect(tracker.has('feedback')).toBe(true);
      expect(tracker.has('updates')).toBe(true);
    });

    it('should clear existing subscriptions when importing', () => {
      tracker.add('old-channel');

      tracker.fromJSON([{ channel: 'new-channel' }]);

      expect(tracker.has('old-channel')).toBe(false);
      expect(tracker.has('new-channel')).toBe(true);
    });
  });

  // ==========================================================================
  // Statistics Tests
  // ==========================================================================

  describe('Statistics', () => {
    it('should get statistics', () => {
      tracker.add('feedback');
      tracker.add('updates');
      tracker.add('system');
      tracker.confirm('feedback');
      tracker.confirm('updates');

      const stats = tracker.getStats();

      expect(stats.total).toBe(3);
      expect(stats.confirmed).toBe(2);
      expect(stats.unconfirmed).toBe(1);
    });
  });
});

// ==========================================================================
// Channel Helper Functions Tests
// ==========================================================================

describe('Channel Helper Functions', () => {
  describe('createFeedbackChannel', () => {
    it('should create general feedback channel', () => {
      expect(createFeedbackChannel()).toBe('feedback');
    });

    it('should create project-specific feedback channel', () => {
      expect(createFeedbackChannel('project-123')).toBe('feedback:project-123');
    });
  });

  describe('parseFeedbackChannel', () => {
    it('should parse general feedback channel', () => {
      const result = parseFeedbackChannel('feedback');

      expect(result).toBeDefined();
      expect(result.feedbackId).toBeUndefined();
    });

    it('should parse feedback-specific channel', () => {
      const result = parseFeedbackChannel('feedback:item-123');

      expect(result).toBeDefined();
      expect(result.feedbackId).toBe('item-123');
    });

    it('should return empty object for non-feedback channels', () => {
      // Non-matching channels return empty object (no feedbackId)
      expect(parseFeedbackChannel('invalid').feedbackId).toBeUndefined();
      expect(parseFeedbackChannel('other:channel').feedbackId).toBeUndefined();
    });
  });

  describe('isFeedbackChannel', () => {
    it('should identify feedback channels', () => {
      expect(isFeedbackChannel('feedback')).toBe(true);
      expect(isFeedbackChannel('feedback:project-123')).toBe(true);
    });

    it('should reject non-feedback channels', () => {
      expect(isFeedbackChannel('updates')).toBe(false);
      expect(isFeedbackChannel('system:alerts')).toBe(false);
    });
  });
});
