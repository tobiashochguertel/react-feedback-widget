/**
 * Integration Types and Interfaces
 *
 * Base interfaces that all integrations must implement.
 * Follows the Strategy pattern for interchangeable integration behaviors.
 *
 * @module integrations/types
 */

import type { ComponentType } from 'react';
import type { FeedbackData, Theme } from '../types';

// ============================================
// CORE TYPES
// ============================================

/**
 * Supported integration types.
 * Extensible to add new integrations.
 */
export type IntegrationType = 'jira' | 'sheets' | 'custom';

/**
 * Integration connection types for specific services.
 */
export type IntegrationConnectionType =
  | 'server'      // Custom server endpoint
  | 'oauth'       // OAuth 2.0 flow
  | 'automation'  // Automation webhooks
  | 'zapier'      // Zapier integration
  | 'apps_script' // Google Apps Script
  | 'direct';     // Direct API access

// ============================================
// VALIDATION
// ============================================

/**
 * Single validation error.
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code?: string | undefined;
}

/**
 * Result of configuration validation.
 */
export interface ValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** List of validation errors (empty if valid) */
  errors: ValidationError[];
}

// ============================================
// SUBMISSION
// ============================================

/**
 * Result of a feedback submission to an integration.
 */
export interface SubmissionResult<TData = unknown> {
  /** Whether submission succeeded */
  success: boolean;
  /** Integration-specific result data */
  data?: TData | undefined;
  /** Error message if submission failed */
  error?: string | undefined;
  /** Error code for programmatic handling */
  errorCode?: string | undefined;
}

/**
 * Options for feedback submission.
 */
export interface SubmissionOptions {
  /** Whether to retry on failure */
  retry?: boolean | undefined;
  /** Maximum retry attempts */
  maxRetries?: number | undefined;
  /** Timeout in milliseconds */
  timeout?: number | undefined;
}

// ============================================
// CONFIG MODAL
// ============================================

/**
 * Props passed to integration configuration modals.
 */
export interface ConfigModalProps<TConfig = unknown> {
  /** Current configuration */
  config: TConfig | undefined;
  /** Callback when configuration changes */
  onChange: (config: TConfig) => void;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when configuration is saved */
  onSave: (config: TConfig) => void;
  /** Theme for styling */
  theme: Theme;
  /** Whether currently saving */
  isSaving?: boolean | undefined;
  /** Validation errors to display */
  errors?: ValidationError[] | undefined;
}

// ============================================
// BASE INTEGRATION INTERFACE
// ============================================

/**
 * Base interface that all integrations must implement.
 *
 * @template TConfig - Configuration type specific to the integration
 * @template TResult - Result type from submission
 *
 * @example
 * ```typescript
 * class JiraIntegration implements Integration<JiraConfig, JiraIssue> {
 *   readonly type = 'jira';
 *
 *   isConfigured(): boolean {
 *     return !!this.config?.endpoint;
 *   }
 *
 *   validateConfig(config: JiraConfig): ValidationResult {
 *     // Validation logic
 *   }
 *
 *   async submit(data: FeedbackData): Promise<SubmissionResult<JiraIssue>> {
 *     // Submit to Jira
 *   }
 *
 *   getConfigModal(): React.ComponentType<ConfigModalProps<JiraConfig>> {
 *     return JiraConfigModal;
 *   }
 * }
 * ```
 */
export interface Integration<TConfig = unknown, TResult = unknown> {
  /** Unique type identifier for this integration */
  readonly type: IntegrationType;

  /** Human-readable name */
  readonly name: string;

  /** Description of the integration */
  readonly description: string;

  /** Icon component or URL */
  readonly icon?: ComponentType<{ size?: number | undefined }> | string | undefined;

  /**
   * Check if the integration is properly configured.
   * @returns true if ready to accept submissions
   */
  isConfigured(): boolean;

  /**
   * Validate a configuration object.
   * @param config - Configuration to validate
   * @returns Validation result with any errors
   */
  validateConfig(config: TConfig): ValidationResult;

  /**
   * Submit feedback data to the integration.
   * @param data - Feedback to submit
   * @param options - Optional submission settings
   * @returns Promise resolving to submission result
   */
  submit(data: FeedbackData, options?: SubmissionOptions | undefined): Promise<SubmissionResult<TResult>>;

  /**
   * Get the React component for the configuration modal.
   * @returns Modal component for configuring this integration
   */
  getConfigModal(): ComponentType<ConfigModalProps<TConfig>>;

  /**
   * Get current configuration.
   * @returns Current configuration or undefined
   */
  getConfig(): TConfig | undefined;

  /**
   * Update configuration.
   * @param config - New configuration
   */
  setConfig(config: TConfig): void;
}

// ============================================
// INTEGRATION CONSTRUCTOR
// ============================================

/**
 * Constructor type for creating integrations.
 */
export interface IntegrationConstructor<TConfig = unknown, TResult = unknown> {
  new(config?: TConfig | undefined): Integration<TConfig, TResult>;
}

// ============================================
// INTEGRATION METADATA
// ============================================

/**
 * Metadata about an integration type.
 * Used for registration and discovery.
 */
export interface IntegrationMetadata {
  /** Integration type identifier */
  type: IntegrationType;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Icon component or URL */
  icon?: ComponentType<{ size?: number | undefined }> | string | undefined;
  /** Supported connection types */
  connectionTypes: IntegrationConnectionType[];
  /** Whether integration requires server-side support */
  requiresServer: boolean;
  /** Documentation URL */
  docsUrl?: string | undefined;
}

// ============================================
// STATUS SYNC
// ============================================

/**
 * Status mapping between local and integration statuses.
 */
export interface StatusMapping {
  /** Map local status to integration status */
  toIntegration: Record<string, string>;
  /** Map integration status to local status */
  fromIntegration: Record<string, string>;
}

/**
 * Status sync configuration.
 */
export interface StatusSyncConfig {
  /** Whether to sync status changes */
  enabled: boolean;
  /** Status mapping */
  mapping: StatusMapping;
  /** Webhook URL for receiving status updates */
  webhookUrl?: string | undefined;
}
