/**
 * WebSocket Reconnection Manager
 *
 * Manages automatic reconnection with exponential backoff.
 *
 * TASK-WWS-004: Create Reconnection Manager
 *
 * @example
 * ```typescript
 * const manager = new ReconnectionManager({
 *   maxAttempts: 10,
 *   baseDelay: 1000,
 *   maxDelay: 30000,
 *   onReconnect: () => connect(),
 * });
 *
 * // Schedule a reconnection attempt
 * manager.scheduleReconnect();
 *
 * // Stop reconnection attempts
 * manager.stop();
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Reconnection manager configuration
 */
export interface ReconnectionManagerConfig {
  /** Maximum number of reconnection attempts (0 = infinite) */
  maxAttempts: number;
  /** Base delay between attempts in milliseconds */
  baseDelay: number;
  /** Maximum delay between attempts in milliseconds */
  maxDelay: number;
  /** Jitter factor (0-1) to randomize delays */
  jitterFactor?: number;
  /** Callback when reconnection is attempted */
  onReconnect: () => void;
  /** Callback when max attempts reached */
  onMaxAttemptsReached?: () => void;
  /** Callback when delay is calculated */
  onDelayCalculated?: (delay: number, attempt: number) => void;
}

/**
 * Reconnection state
 */
export interface ReconnectionState {
  /** Number of reconnection attempts made */
  attempts: number;
  /** Whether reconnection is currently scheduled */
  isScheduled: boolean;
  /** Next scheduled reconnection time (timestamp) */
  nextAttemptAt: number | null;
  /** Time until next attempt in milliseconds */
  timeUntilNextAttempt: number | null;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  jitterFactor: 0.1,
} as const;

// ============================================================================
// Reconnection Manager Class
// ============================================================================

/**
 * Manages WebSocket reconnection with exponential backoff
 */
export class ReconnectionManager {
  private config: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    jitterFactor: number;
    onReconnect: () => void;
    onMaxAttemptsReached?: (() => void) | undefined;
    onDelayCalculated?: ((delay: number, attempt: number) => void) | undefined;
  };
  private attempts: number = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private nextAttemptAt: number | null = null;

  constructor(config: ReconnectionManagerConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect(): void {
    // Check if max attempts reached
    if (this.config.maxAttempts > 0 && this.attempts >= this.config.maxAttempts) {
      this.config.onMaxAttemptsReached?.();
      return;
    }

    // Cancel any existing timeout
    this.cancel();

    // Calculate delay with exponential backoff
    const delay = this.calculateDelay();
    this.nextAttemptAt = Date.now() + delay;

    // Notify delay calculated
    this.config.onDelayCalculated?.(delay, this.attempts + 1);

    // Schedule reconnection
    this.timeoutId = setTimeout(() => {
      this.attempts++;
      this.nextAttemptAt = null;
      this.config.onReconnect();
    }, delay);
  }

  /**
   * Cancel scheduled reconnection
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.nextAttemptAt = null;
  }

  /**
   * Stop reconnection attempts and reset
   */
  stop(): void {
    this.cancel();
    this.attempts = 0;
  }

  /**
   * Reset attempt counter (call on successful connection)
   */
  reset(): void {
    this.cancel();
    this.attempts = 0;
  }

  /**
   * Get current reconnection state
   */
  getState(): ReconnectionState {
    const now = Date.now();
    const timeUntilNextAttempt = this.nextAttemptAt ? Math.max(0, this.nextAttemptAt - now) : null;

    return {
      attempts: this.attempts,
      isScheduled: this.timeoutId !== null,
      nextAttemptAt: this.nextAttemptAt,
      timeUntilNextAttempt,
    };
  }

  /**
   * Get number of attempts made
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Check if reconnection is scheduled
   */
  isScheduled(): boolean {
    return this.timeoutId !== null;
  }

  /**
   * Check if max attempts reached
   */
  isMaxAttemptsReached(): boolean {
    return this.config.maxAttempts > 0 && this.attempts >= this.config.maxAttempts;
  }

  /**
   * Manually trigger reconnection (bypasses delay)
   */
  reconnectNow(): void {
    this.cancel();
    this.attempts++;
    this.config.onReconnect();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReconnectionManagerConfig>): void {
    Object.assign(this.config, config);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Calculate delay using exponential backoff with jitter
   */
  private calculateDelay(): number {
    // Exponential backoff: baseDelay * 2^attempts
    const exponentialDelay = this.config.baseDelay * Math.pow(2, this.attempts);

    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter
    const jitter = this.calculateJitter(cappedDelay);

    return Math.round(cappedDelay + jitter);
  }

  /**
   * Calculate jitter for delay randomization
   */
  private calculateJitter(delay: number): number {
    if (this.config.jitterFactor <= 0) {
      return 0;
    }

    const maxJitter = delay * this.config.jitterFactor;
    // Random jitter between -maxJitter and +maxJitter
    return (Math.random() * 2 - 1) * maxJitter;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate delay for a given attempt number (for preview/testing)
 */
export function calculateReconnectDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  return Math.min(exponentialDelay, maxDelay);
}

/**
 * Format delay for display
 */
export function formatDelay(delayMs: number): string {
  if (delayMs < 1000) {
    return `${delayMs}ms`;
  }

  const seconds = Math.round(delayMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}
