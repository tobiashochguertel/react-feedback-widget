/**
 * LocalStorage Service Implementation
 *
 * Implements StorageService interface using browser localStorage.
 * Provides JSON serialization/deserialization for stored values.
 *
 * @packageDocumentation
 */

import type { StorageService } from './StorageService';

/**
 * Storage service implementation using browser localStorage
 *
 * @typeParam T - Type of values stored (will be JSON serialized)
 *
 * @example
 * ```typescript
 * const storage = new LocalStorageService<FeedbackItem>('feedback_');
 * storage.set('item1', { id: '1', text: 'Bug report' });
 * const item = storage.get('item1');
 * ```
 */
export class LocalStorageService<T = unknown> implements StorageService<T> {
  private prefix: string;

  /**
   * Create a new LocalStorageService
   *
   * @param prefix - Optional key prefix for namespacing (default: '')
   */
  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  /**
   * Get the full key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Retrieve a value by key
   */
  get(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch {
      // Handle JSON parse errors or localStorage access errors
      return null;
    }
  }

  /**
   * Store a value with a key
   */
  set(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serialized);
      return true;
    } catch {
      // Handle quota exceeded or serialization errors
      return false;
    }
  }

  /**
   * Remove a value by key
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    try {
      return localStorage.getItem(this.getKey(key)) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear all stored values (with prefix if set)
   */
  clear(): boolean {
    try {
      if (this.prefix) {
        // Only clear keys with matching prefix
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } else {
        localStorage.clear();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys (without prefix)
   */
  keys(): string[] {
    try {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          if (this.prefix) {
            if (key.startsWith(this.prefix)) {
              allKeys.push(key.slice(this.prefix.length));
            }
          } else {
            allKeys.push(key);
          }
        }
      }
      return allKeys;
    } catch {
      return [];
    }
  }
}
