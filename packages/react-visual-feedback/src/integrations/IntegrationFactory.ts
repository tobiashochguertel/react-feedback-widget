/**
 * Integration Factory
 *
 * Factory pattern implementation for creating integration instances.
 * Allows registration and creation of integrations by type.
 *
 * @module integrations/IntegrationFactory
 */

import type {
  Integration,
  IntegrationConstructor,
  IntegrationType,
  IntegrationMetadata,
} from './types';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Registration entry for an integration.
 */
interface RegistrationEntry<TConfig = unknown, TResult = unknown> {
  /** Constructor function */
  constructor: IntegrationConstructor<TConfig, TResult>;
  /** Metadata about the integration */
  metadata: IntegrationMetadata;
}

// ============================================
// INTEGRATION FACTORY
// ============================================

/**
 * Factory for creating integration instances.
 *
 * Implements the Factory pattern to:
 * - Register integration constructors by type
 * - Create integration instances with configuration
 * - Query available integration types
 *
 * @example
 * ```typescript
 * const factory = new IntegrationFactory();
 *
 * // Register integrations
 * factory.register(JiraIntegration, jiraMetadata);
 * factory.register(SheetsIntegration, sheetsMetadata);
 *
 * // Create instance
 * const jira = factory.create('jira', { endpoint: '...' });
 *
 * // Get available types
 * const types = factory.getAvailable(); // ['jira', 'sheets']
 * ```
 */
export class IntegrationFactory {
  private registrations: Map<IntegrationType, RegistrationEntry> = new Map();

  /**
   * Register an integration constructor.
   *
   * @param Constructor - Integration constructor class
   * @param metadata - Integration metadata
   * @throws Error if type is already registered
   */
  register<TConfig = unknown, TResult = unknown>(
    Constructor: IntegrationConstructor<TConfig, TResult>,
    metadata: IntegrationMetadata
  ): void {
    if (this.registrations.has(metadata.type)) {
      throw new Error(`Integration type already registered: ${metadata.type}`);
    }

    this.registrations.set(metadata.type, {
      constructor: Constructor as IntegrationConstructor,
      metadata,
    });
  }

  /**
   * Unregister an integration type.
   *
   * @param type - Integration type to unregister
   * @returns true if successfully unregistered, false if not found
   */
  unregister(type: IntegrationType): boolean {
    return this.registrations.delete(type);
  }

  /**
   * Create an integration instance.
   *
   * @param type - Integration type to create
   * @param config - Configuration for the integration
   * @returns New integration instance
   * @throws Error if type is not registered
   */
  create<TConfig = unknown, TResult = unknown>(
    type: IntegrationType,
    config?: TConfig | undefined
  ): Integration<TConfig, TResult> {
    const registration = this.registrations.get(type);

    if (!registration) {
      const available = this.getAvailable().join(', ');
      throw new Error(
        `Unknown integration type: ${type}. Available types: ${available || 'none'}`
      );
    }

    const Constructor = registration.constructor as IntegrationConstructor<TConfig, TResult>;
    return new Constructor(config);
  }

  /**
   * Check if an integration type is registered.
   *
   * @param type - Integration type to check
   * @returns true if registered
   */
  has(type: IntegrationType): boolean {
    return this.registrations.has(type);
  }

  /**
   * Get list of available integration types.
   *
   * @returns Array of registered integration types
   */
  getAvailable(): IntegrationType[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Get metadata for an integration type.
   *
   * @param type - Integration type
   * @returns Metadata or undefined if not found
   */
  getMetadata(type: IntegrationType): IntegrationMetadata | undefined {
    return this.registrations.get(type)?.metadata;
  }

  /**
   * Get all registered integration metadata.
   *
   * @returns Array of all integration metadata
   */
  getAllMetadata(): IntegrationMetadata[] {
    return Array.from(this.registrations.values()).map(reg => reg.metadata);
  }

  /**
   * Clear all registrations.
   * Useful for testing.
   */
  clear(): void {
    this.registrations.clear();
  }
}

// ============================================
// DEFAULT FACTORY INSTANCE
// ============================================

/**
 * Default factory instance for convenience.
 * In most cases, use this singleton instead of creating new factories.
 */
export const integrationFactory = new IntegrationFactory();
