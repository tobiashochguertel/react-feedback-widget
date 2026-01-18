/**
 * WebSocket Subscription Tracker
 *
 * Tracks active subscriptions and handles automatic re-subscription
 * on reconnection.
 *
 * TASK-WWS-005: Create Subscription Tracker
 *
 * @example
 * ```typescript
 * const tracker = new SubscriptionTracker();
 *
 * // Add subscription
 * tracker.add('feedback', { status: ['new'] });
 *
 * // Check if subscribed
 * if (tracker.has('feedback')) {
 *   // ...
 * }
 *
 * // Mark as confirmed (after server acknowledgement)
 * tracker.confirm('feedback');
 *
 * // Get all for re-subscription
 * const subs = tracker.getAll();
 * ```
 */

import type { SubscriptionFilters, Subscription } from './types';

// ============================================================================
// Subscription Tracker Class
// ============================================================================

/**
 * Tracks WebSocket channel subscriptions
 */
export class SubscriptionTracker {
  private subscriptions: Map<string, Subscription> = new Map();
  private idCounter: number = 0;

  // ============================================================================
  // Public Methods - Subscription Management
  // ============================================================================

  /**
   * Add a new subscription
   */
  add(channel: string, filters?: SubscriptionFilters): Subscription {
    // Check if already subscribed to this channel
    const existing = this.subscriptions.get(channel);
    if (existing) {
      // Update filters and mark as unconfirmed
      existing.filters = filters;
      existing.confirmed = false;
      return existing;
    }

    // Create new subscription
    const subscription: Subscription = {
      id: this.generateId(),
      channel,
      filters,
      confirmed: false,
      createdAt: Date.now(),
    };

    this.subscriptions.set(channel, subscription);
    return subscription;
  }

  /**
   * Remove a subscription by channel
   */
  remove(channel: string): boolean {
    return this.subscriptions.delete(channel);
  }

  /**
   * Remove a subscription by ID
   */
  removeById(id: string): boolean {
    for (const [channel, sub] of this.subscriptions) {
      if (sub.id === id) {
        this.subscriptions.delete(channel);
        return true;
      }
    }
    return false;
  }

  /**
   * Check if subscribed to a channel
   */
  has(channel: string): boolean {
    return this.subscriptions.has(channel);
  }

  /**
   * Get subscription by channel
   */
  get(channel: string): Subscription | undefined {
    return this.subscriptions.get(channel);
  }

  /**
   * Get subscription by ID
   */
  getById(id: string): Subscription | undefined {
    for (const sub of this.subscriptions.values()) {
      if (sub.id === id) {
        return sub;
      }
    }
    return undefined;
  }

  /**
   * Get all subscriptions
   */
  getAll(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get all confirmed subscriptions
   */
  getConfirmed(): Subscription[] {
    return this.getAll().filter((sub) => sub.confirmed);
  }

  /**
   * Get all unconfirmed subscriptions (pending confirmation)
   */
  getUnconfirmed(): Subscription[] {
    return this.getAll().filter((sub) => !sub.confirmed);
  }

  /**
   * Get subscription count
   */
  count(): number {
    return this.subscriptions.size;
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }

  // ============================================================================
  // Public Methods - Confirmation Status
  // ============================================================================

  /**
   * Mark a subscription as confirmed
   */
  confirm(channel: string): boolean {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      subscription.confirmed = true;
      return true;
    }
    return false;
  }

  /**
   * Mark a subscription as unconfirmed (for re-subscription)
   */
  unconfirm(channel: string): boolean {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      subscription.confirmed = false;
      return true;
    }
    return false;
  }

  /**
   * Mark all subscriptions as unconfirmed (for reconnection)
   */
  unconfirmAll(): void {
    for (const sub of this.subscriptions.values()) {
      sub.confirmed = false;
    }
  }

  /**
   * Check if a subscription is confirmed
   */
  isConfirmed(channel: string): boolean {
    return this.subscriptions.get(channel)?.confirmed ?? false;
  }

  // ============================================================================
  // Public Methods - Filter Updates
  // ============================================================================

  /**
   * Update filters for a subscription
   */
  updateFilters(channel: string, filters?: SubscriptionFilters): boolean {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      subscription.filters = filters;
      // Mark as unconfirmed since filters changed
      subscription.confirmed = false;
      return true;
    }
    return false;
  }

  // ============================================================================
  // Public Methods - Batch Operations
  // ============================================================================

  /**
   * Add multiple subscriptions at once
   */
  addMany(
    subscriptions: Array<{ channel: string; filters?: SubscriptionFilters }>,
  ): Subscription[] {
    return subscriptions.map(({ channel, filters }) => this.add(channel, filters));
  }

  /**
   * Remove multiple subscriptions at once
   */
  removeMany(channels: string[]): number {
    let removed = 0;
    for (const channel of channels) {
      if (this.remove(channel)) {
        removed++;
      }
    }
    return removed;
  }

  // ============================================================================
  // Public Methods - Serialization
  // ============================================================================

  /**
   * Export subscriptions for persistence
   */
  toJSON(): Array<{ channel: string; filters?: SubscriptionFilters | undefined }> {
    return this.getAll().map((sub) => ({
      channel: sub.channel,
      filters: sub.filters,
    }));
  }

  /**
   * Import subscriptions from persistence
   */
  fromJSON(data: Array<{ channel: string; filters?: SubscriptionFilters }>): void {
    this.clear();
    for (const { channel, filters } of data) {
      this.add(channel, filters);
    }
  }

  // ============================================================================
  // Public Methods - Statistics
  // ============================================================================

  /**
   * Get subscription statistics
   */
  getStats(): {
    total: number;
    confirmed: number;
    unconfirmed: number;
    channels: string[];
  } {
    const all = this.getAll();
    const confirmed = all.filter((s) => s.confirmed);

    return {
      total: all.length,
      confirmed: confirmed.length,
      unconfirmed: all.length - confirmed.length,
      channels: all.map((s) => s.channel),
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateId(): string {
    this.idCounter++;
    return `sub_${Date.now()}_${this.idCounter}`;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a channel name for a specific feedback item
 */
export function createFeedbackChannel(feedbackId?: string): string {
  return feedbackId ? `feedback:${feedbackId}` : 'feedback';
}

/**
 * Parse a channel name to extract the feedback ID
 */
export function parseFeedbackChannel(channel: string): { feedbackId?: string } {
  if (channel === 'feedback') {
    return {};
  }

  if (channel.startsWith('feedback:')) {
    return { feedbackId: channel.substring(9) };
  }

  return {};
}

/**
 * Check if a channel is a feedback channel
 */
export function isFeedbackChannel(channel: string): boolean {
  return channel === 'feedback' || channel.startsWith('feedback:');
}
