/**
 * Storage Service Interface
 *
 * Abstract interface for key-value storage operations.
 * Implementations can be LocalStorage, SessionStorage, IndexedDB, or in-memory.
 *
 * @packageDocumentation
 */

/**
 * Generic storage service interface for key-value operations
 *
 * @typeParam T - Type of values stored (defaults to unknown)
 */
export interface StorageService<T = unknown> {
  /**
   * Retrieve a value by key
   *
   * @param key - Storage key
   * @returns The stored value or null if not found
   */
  get(key: string): T | null;

  /**
   * Store a value with a key
   *
   * @param key - Storage key
   * @param value - Value to store
   * @returns true if successful
   */
  set(key: string, value: T): boolean;

  /**
   * Remove a value by key
   *
   * @param key - Storage key
   * @returns true if successful
   */
  remove(key: string): boolean;

  /**
   * Check if a key exists
   *
   * @param key - Storage key
   * @returns true if key exists
   */
  has(key: string): boolean;

  /**
   * Clear all stored values
   *
   * @returns true if successful
   */
  clear(): boolean;

  /**
   * Get all keys
   *
   * @returns Array of storage keys
   */
  keys(): string[];
}

/**
 * Async storage service interface for operations that may require async I/O
 *
 * @typeParam T - Type of values stored
 */
export interface AsyncStorageService<T = unknown> {
  /**
   * Retrieve a value by key
   */
  get(key: string): Promise<T | null>;

  /**
   * Store a value with a key
   */
  set(key: string, value: T): Promise<boolean>;

  /**
   * Remove a value by key
   */
  remove(key: string): Promise<boolean>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all stored values
   */
  clear(): Promise<boolean>;

  /**
   * Get all keys
   */
  keys(): Promise<string[]>;
}
