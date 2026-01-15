/**
 * In-Memory Storage Service Implementation
 *
 * Implements StorageService interface using an in-memory Map.
 * Ideal for testing and environments without localStorage.
 *
 * @packageDocumentation
 */

import type { StorageService } from './StorageService';

/**
 * Storage service implementation using in-memory Map
 *
 * This implementation is useful for:
 * - Unit testing without localStorage mocks
 * - Server-side rendering scenarios
 * - Temporary storage that doesn't persist
 *
 * @typeParam T - Type of values stored
 *
 * @example
 * ```typescript
 * const storage = new InMemoryStorageService<FeedbackItem>();
 * storage.set('item1', { id: '1', text: 'Bug report' });
 * const item = storage.get('item1');
 * ```
 */
export class InMemoryStorageService<T = unknown> implements StorageService<T> {
  private storage: Map<string, T> = new Map();

  /**
   * Retrieve a value by key
   */
  get(key: string): T | null {
    const value = this.storage.get(key);
    return value !== undefined ? value : null;
  }

  /**
   * Store a value with a key
   */
  set(key: string, value: T): boolean {
    try {
      this.storage.set(key, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove a value by key
   */
  remove(key: string): boolean {
    return this.storage.delete(key);
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.storage.has(key);
  }

  /**
   * Clear all stored values
   */
  clear(): boolean {
    this.storage.clear();
    return true;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Get the number of stored items (useful for testing)
   */
  get size(): number {
    return this.storage.size;
  }
}
