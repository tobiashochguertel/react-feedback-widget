/**
 * Integration Registry
 *
 * Registry for managing configured integration instances.
 * Provides lifecycle management and lookup functionality.
 *
 * @module integrations/IntegrationRegistry
 */

import type { Integration, IntegrationType, SubmissionResult, SubmissionOptions } from './types';
import type { FeedbackData } from '../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Configuration for enabling/disabling integrations.
 */
export interface IntegrationState {
  /** The integration instance */
  integration: Integration;
  /** Whether the integration is currently enabled */
  enabled: boolean;
  /** Last error if any */
  lastError?: string | undefined;
  /** Last successful submission timestamp */
  lastSuccessAt?: Date | undefined;
}

/**
 * Result from submitting to multiple integrations.
 */
export interface MultiSubmissionResult {
  /** Overall success (true if at least one succeeded) */
  success: boolean;
  /** Results per integration type */
  results: Map<IntegrationType, SubmissionResult>;
  /** Types that succeeded */
  succeeded: IntegrationType[];
  /** Types that failed */
  failed: IntegrationType[];
}

// ============================================
// INTEGRATION REGISTRY
// ============================================

/**
 * Registry for managing configured integration instances.
 *
 * Provides:
 * - Registration of configured integrations
 * - Enable/disable toggling
 * - Batch submission to multiple integrations
 * - State tracking per integration
 *
 * @example
 * ```typescript
 * const registry = new IntegrationRegistry();
 *
 * // Add integrations
 * registry.add(jiraIntegration);
 * registry.add(sheetsIntegration);
 *
 * // Enable specific integration
 * registry.setEnabled('jira', true);
 *
 * // Submit to all enabled integrations
 * const results = await registry.submitToAll(feedbackData);
 * ```
 */
export class IntegrationRegistry {
  private integrations: Map<IntegrationType, IntegrationState> = new Map();

  /**
   * Add an integration to the registry.
   *
   * @param integration - Integration instance to add
   * @param enabled - Whether to enable immediately (default: true)
   * @throws Error if type is already registered
   */
  add(integration: Integration, enabled = true): void {
    if (this.integrations.has(integration.type)) {
      throw new Error(`Integration already registered: ${integration.type}`);
    }

    this.integrations.set(integration.type, {
      integration,
      enabled,
    });
  }

  /**
   * Remove an integration from the registry.
   *
   * @param type - Integration type to remove
   * @returns true if removed, false if not found
   */
  remove(type: IntegrationType): boolean {
    return this.integrations.delete(type);
  }

  /**
   * Get an integration by type.
   *
   * @param type - Integration type
   * @returns Integration instance or undefined
   */
  get<TConfig = unknown, TResult = unknown>(
    type: IntegrationType
  ): Integration<TConfig, TResult> | undefined {
    return this.integrations.get(type)?.integration as Integration<TConfig, TResult> | undefined;
  }

  /**
   * Get state for an integration.
   *
   * @param type - Integration type
   * @returns Integration state or undefined
   */
  getState(type: IntegrationType): IntegrationState | undefined {
    return this.integrations.get(type);
  }

  /**
   * Check if an integration is registered.
   *
   * @param type - Integration type
   * @returns true if registered
   */
  has(type: IntegrationType): boolean {
    return this.integrations.has(type);
  }

  /**
   * Enable or disable an integration.
   *
   * @param type - Integration type
   * @param enabled - Whether to enable
   * @returns true if state changed, false if not found
   */
  setEnabled(type: IntegrationType, enabled: boolean): boolean {
    const state = this.integrations.get(type);
    if (!state) return false;

    state.enabled = enabled;
    return true;
  }

  /**
   * Check if an integration is enabled.
   *
   * @param type - Integration type
   * @returns true if enabled, false if disabled or not found
   */
  isEnabled(type: IntegrationType): boolean {
    return this.integrations.get(type)?.enabled ?? false;
  }

  /**
   * Get all registered integration types.
   *
   * @returns Array of all registered types
   */
  getAll(): IntegrationType[] {
    return Array.from(this.integrations.keys());
  }

  /**
   * Get all enabled integration types.
   *
   * @returns Array of enabled types
   */
  getEnabled(): IntegrationType[] {
    return Array.from(this.integrations.entries())
      .filter(([, state]) => state.enabled)
      .map(([type]) => type);
  }

  /**
   * Get all configured (enabled and properly configured) integrations.
   *
   * @returns Array of ready-to-use integration types
   */
  getConfigured(): IntegrationType[] {
    return Array.from(this.integrations.entries())
      .filter(([, state]) => state.enabled && state.integration.isConfigured())
      .map(([type]) => type);
  }

  /**
   * Submit feedback to a specific integration.
   *
   * @param type - Integration type
   * @param data - Feedback data to submit
   * @param options - Submission options
   * @returns Submission result
   */
  async submit(
    type: IntegrationType,
    data: FeedbackData,
    options?: SubmissionOptions | undefined
  ): Promise<SubmissionResult> {
    const state = this.integrations.get(type);

    if (!state) {
      return {
        success: false,
        error: `Integration not found: ${type}`,
        errorCode: 'NOT_FOUND',
      };
    }

    if (!state.enabled) {
      return {
        success: false,
        error: `Integration disabled: ${type}`,
        errorCode: 'DISABLED',
      };
    }

    if (!state.integration.isConfigured()) {
      return {
        success: false,
        error: `Integration not configured: ${type}`,
        errorCode: 'NOT_CONFIGURED',
      };
    }

    try {
      const result = await state.integration.submit(data, options);

      if (result.success) {
        state.lastSuccessAt = new Date();
        state.lastError = undefined;
      } else {
        state.lastError = result.error;
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.lastError = message;

      return {
        success: false,
        error: message,
        errorCode: 'EXCEPTION',
      };
    }
  }

  /**
   * Submit feedback to all enabled and configured integrations.
   *
   * @param data - Feedback data to submit
   * @param options - Submission options
   * @returns Multi-submission result with per-integration results
   */
  async submitToAll(
    data: FeedbackData,
    options?: SubmissionOptions | undefined
  ): Promise<MultiSubmissionResult> {
    const configured = this.getConfigured();
    const results = new Map<IntegrationType, SubmissionResult>();
    const succeeded: IntegrationType[] = [];
    const failed: IntegrationType[] = [];

    // Submit to all configured integrations in parallel
    await Promise.all(
      configured.map(async (type) => {
        const result = await this.submit(type, data, options);
        results.set(type, result);

        if (result.success) {
          succeeded.push(type);
        } else {
          failed.push(type);
        }
      })
    );

    return {
      success: succeeded.length > 0,
      results,
      succeeded,
      failed,
    };
  }

  /**
   * Submit feedback to specific integrations.
   *
   * @param types - Integration types to submit to
   * @param data - Feedback data to submit
   * @param options - Submission options
   * @returns Multi-submission result with per-integration results
   */
  async submitTo(
    types: IntegrationType[],
    data: FeedbackData,
    options?: SubmissionOptions | undefined
  ): Promise<MultiSubmissionResult> {
    const results = new Map<IntegrationType, SubmissionResult>();
    const succeeded: IntegrationType[] = [];
    const failed: IntegrationType[] = [];

    // Submit to specified integrations in parallel
    await Promise.all(
      types.map(async (type) => {
        const result = await this.submit(type, data, options);
        results.set(type, result);

        if (result.success) {
          succeeded.push(type);
        } else {
          failed.push(type);
        }
      })
    );

    return {
      success: succeeded.length > 0,
      results,
      succeeded,
      failed,
    };
  }

  /**
   * Clear all integrations from the registry.
   */
  clear(): void {
    this.integrations.clear();
  }
}

// ============================================
// DEFAULT REGISTRY INSTANCE
// ============================================

/**
 * Default registry instance for convenience.
 * In most cases, use this singleton instead of creating new registries.
 */
export const integrationRegistry = new IntegrationRegistry();
