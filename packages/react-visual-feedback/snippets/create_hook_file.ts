#!/usr/bin/env bun
/**
 * Script to create useIntegrations hook file
 * Using writeFileSync to work around create_file tool issues
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const hookContent = `/**
 * React Visual Feedback - useIntegrations Hook
 *
 * Custom hook for managing integration clients (Jira, Google Sheets, etc.).
 * This hook implements the Interface Segregation Principle by providing
 * a focused API for integration management.
 *
 * @packageDocumentation
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { ComponentType } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Supported integration types
 */
export type IntegrationType = 'jira' | 'sheets';

/**
 * Generic feedback data type for integration submission
 */
export interface FeedbackData {
  [key: string]: unknown;
}

/**
 * Result of an integration submission
 */
export interface IntegrationResult {
  /** Whether the submission was successful */
  success: boolean;

  /** Error message if submission failed */
  error?: string;

  /** Jira issue key (for Jira integration) */
  issueKey?: string;

  /** Jira issue URL (for Jira integration) */
  issueUrl?: string;

  /** Row number (for Sheets integration) */
  rowNumber?: number;

  /** Integration type this result is from */
  type?: IntegrationType;
}

/**
 * Status of a single integration
 */
export interface IntegrationStatus {
  /** Whether the integration is currently processing */
  loading: boolean;

  /** Error message if last operation failed */
  error: string | null;

  /** Result of the last operation */
  result: IntegrationResult | null;
}

/**
 * Status map for all integration types
 */
export interface IntegrationStatusMap {
  jira: IntegrationStatus;
  sheets: IntegrationStatus;
}

/**
 * Jira integration configuration
 */
export interface JiraConfig {
  enabled: boolean;
  type?: string;
  endpoint?: string;
  webhookUrl?: string;
  projectKey?: string;
  issueType?: string;
  syncStatus?: boolean;
  statusMapping?: Record<string, string>;
  customFields?: Record<string, unknown>;
  fields?: Record<string, unknown>;
}

/**
 * Sheets integration configuration
 */
export interface SheetsConfig {
  enabled: boolean;
  type?: string;
  endpoint?: string;
  deploymentUrl?: string;
  webhookUrl?: string;
  columns?: string[] | Record<string, unknown>;
  columnOrder?: string[];
  sheetName?: string;
}

/**
 * Combined integration configuration
 */
export interface IntegrationConfig {
  jira?: JiraConfig | null;
  sheets?: SheetsConfig | null;
}

/**
 * Service interface for integration client (dependency injection)
 */
export interface IntegrationService {
  /**
   * Send feedback to a specific integration
   * @param type Integration type
   * @param data Feedback data to send
   * @returns Promise resolving to integration result
   */
  send(type: IntegrationType, data: FeedbackData): Promise<IntegrationResult>;

  /**
   * Send feedback to all enabled integrations
   * @param data Feedback data to send
   * @returns Promise resolving to results map
   */
  sendAll(data: FeedbackData): Promise<Record<IntegrationType, IntegrationResult | null>>;

  /**
   * Update status in an integration
   * @param type Integration type
   * @param id Feedback ID
   * @param status New status
   * @returns Promise resolving to integration result
   */
  updateStatus?(
    type: IntegrationType,
    id: string,
    status: string
  ): Promise<IntegrationResult>;
}

/**
 * Options for the useIntegrations hook
 */
export interface UseIntegrationsOptions {
  /** Integration configuration */
  config?: IntegrationConfig;

  /** Custom integration service (for dependency injection) */
  service?: IntegrationService;

  /** Callback when a submission succeeds */
  onSuccess?: (type: IntegrationType, result: IntegrationResult) => void;

  /** Callback when a submission fails */
  onError?: (type: IntegrationType, error: Error) => void;

  /** Callback when status changes */
  onStatusChange?: (status: IntegrationStatusMap) => void;
}

/**
 * Return type for the useIntegrations hook
 */
export interface UseIntegrationsReturn {
  /** Current status of all integrations */
  status: IntegrationStatusMap;

  /** Last results from each integration */
  lastResults: Record<IntegrationType, IntegrationResult | null>;

  /** Check if an integration is configured and enabled */
  isConfigured: (type: IntegrationType) => boolean;

  /** Submit feedback to a specific integration */
  submit: (type: IntegrationType, data: FeedbackData) => Promise<IntegrationResult>;

  /** Submit feedback to all enabled integrations */
  submitAll: (data: FeedbackData) => Promise<Record<IntegrationType, IntegrationResult | null>>;

  /** Update status in an integration */
  updateStatus: (
    type: IntegrationType,
    id: string,
    status: string
  ) => Promise<IntegrationResult | null>;

  /** Get configuration modal component for an integration (if available) */
  getConfigModal: (type: IntegrationType) => ComponentType | null;

  /** Reset status for a specific integration or all */
  resetStatus: (type?: IntegrationType) => void;

  /** Check if any integration is currently loading */
  isLoading: boolean;

  /** Check if any integration has an error */
  hasError: boolean;

  /** Get list of configured integration types */
  configuredTypes: IntegrationType[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Initial status for an integration
 */
const INITIAL_STATUS: IntegrationStatus = {
  loading: false,
  error: null,
  result: null,
};

/**
 * Initial status map for all integrations
 */
const INITIAL_STATUS_MAP: IntegrationStatusMap = {
  jira: { ...INITIAL_STATUS },
  sheets: { ...INITIAL_STATUS },
};

// ============================================================================
// Default Service Implementation
// ============================================================================

/**
 * Creates a default integration service that makes HTTP requests
 * @param config Integration configuration
 * @returns Integration service
 */
function createDefaultService(config?: IntegrationConfig): IntegrationService {
  return {
    async send(type: IntegrationType, data: FeedbackData): Promise<IntegrationResult> {
      const integrationConfig = type === 'jira' ? config?.jira : config?.sheets;

      if (!integrationConfig?.enabled) {
        return {
          success: false,
          error: \`\${type} integration is not enabled\`,
          type,
        };
      }

      const endpoint =
        integrationConfig.endpoint ||
        (type === 'jira' ? '/api/feedback/jira' : '/api/feedback/sheets');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', ...data }),
        });

        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }

        const result = (await response.json()) as IntegrationResult;
        return { ...result, type };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          type,
        };
      }
    },

    async sendAll(data: FeedbackData): Promise<Record<IntegrationType, IntegrationResult | null>> {
      const results: Record<IntegrationType, IntegrationResult | null> = {
        jira: null,
        sheets: null,
      };

      const promises: Promise<void>[] = [];

      if (config?.jira?.enabled) {
        promises.push(
          this.send('jira', data).then((result) => {
            results.jira = result;
          })
        );
      }

      if (config?.sheets?.enabled) {
        promises.push(
          this.send('sheets', data).then((result) => {
            results.sheets = result;
          })
        );
      }

      await Promise.all(promises);
      return results;
    },

    async updateStatus(
      type: IntegrationType,
      id: string,
      status: string
    ): Promise<IntegrationResult> {
      const integrationConfig = type === 'jira' ? config?.jira : config?.sheets;

      if (!integrationConfig?.enabled) {
        return {
          success: false,
          error: \`\${type} integration is not enabled\`,
          type,
        };
      }

      const endpoint =
        integrationConfig.endpoint ||
        (type === 'jira' ? '/api/feedback/jira' : '/api/feedback/sheets');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'updateStatus', feedbackId: id, status }),
        });

        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }

        const result = (await response.json()) as IntegrationResult;
        return { ...result, type };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          type,
        };
      }
    },
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing integrations (Jira, Google Sheets, etc.)
 *
 * Features:
 * - Tracks status for each integration type
 * - Provides submit method for each integration
 * - Exposes last results for each integration
 * - Handles success/error callbacks
 * - Supports dependency injection for testing
 *
 * @param options Hook options including config and callbacks
 * @returns Integration management interface
 *
 * @example
 * \`\`\`tsx
 * function FeedbackForm() {
 *   const { submit, status, isConfigured } = useIntegrations({
 *     config: {
 *       jira: { enabled: true, endpoint: '/api/jira' },
 *       sheets: { enabled: true, endpoint: '/api/sheets' },
 *     },
 *     onSuccess: (type, result) => console.log(\`\${type} success:\`, result),
 *     onError: (type, error) => console.error(\`\${type} error:\`, error),
 *   });
 *
 *   const handleSubmit = async (data) => {
 *     if (isConfigured('jira')) {
 *       await submit('jira', data);
 *     }
 *   };
 *
 *   return (
 *     <form>
 *       {status.jira.loading && <span>Submitting to Jira...</span>}
 *       {status.jira.error && <span>Error: {status.jira.error}</span>}
 *     </form>
 *   );
 * }
 * \`\`\`
 */
export function useIntegrations(
  options: UseIntegrationsOptions = {}
): UseIntegrationsReturn {
  const { config, service: customService, onSuccess, onError, onStatusChange } = options;

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────

  const [status, setStatus] = useState<IntegrationStatusMap>({ ...INITIAL_STATUS_MAP });
  const [lastResults, setLastResults] = useState<Record<IntegrationType, IntegrationResult | null>>({
    jira: null,
    sheets: null,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Refs for stable callbacks
  // ─────────────────────────────────────────────────────────────────────────

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);
  const configRef = useRef(config);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // ─────────────────────────────────────────────────────────────────────────
  // Service
  // ─────────────────────────────────────────────────────────────────────────

  const serviceRef = useRef<IntegrationService | null>(null);

  useEffect(() => {
    serviceRef.current = customService ?? createDefaultService(config);
  }, [customService, config?.jira?.enabled, config?.sheets?.enabled]);

  // Initialize service on first render
  if (!serviceRef.current) {
    serviceRef.current = customService ?? createDefaultService(config);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Status update helper
  // ─────────────────────────────────────────────────────────────────────────

  const updateStatusForType = useCallback(
    (type: IntegrationType, update: Partial<IntegrationStatus>) => {
      setStatus((prev) => {
        const newStatus = {
          ...prev,
          [type]: { ...prev[type], ...update },
        };
        // Notify status change
        onStatusChangeRef.current?.(newStatus);
        return newStatus;
      });
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Core Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if an integration is configured and enabled
   */
  const isConfigured = useCallback(
    (type: IntegrationType): boolean => {
      const currentConfig = configRef.current;
      if (type === 'jira') {
        return Boolean(currentConfig?.jira?.enabled);
      }
      if (type === 'sheets') {
        return Boolean(currentConfig?.sheets?.enabled);
      }
      return false;
    },
    []
  );

  /**
   * Submit feedback to a specific integration
   */
  const submit = useCallback(
    async (type: IntegrationType, data: FeedbackData): Promise<IntegrationResult> => {
      const service = serviceRef.current;

      if (!service) {
        const error: IntegrationResult = {
          success: false,
          error: 'Integration service not initialized',
          type,
        };
        return error;
      }

      // Set loading state
      updateStatusForType(type, { loading: true, error: null });

      try {
        const result = await service.send(type, data);

        // Update status
        updateStatusForType(type, {
          loading: false,
          error: result.success ? null : result.error ?? null,
          result,
        });

        // Update last results
        setLastResults((prev) => ({ ...prev, [type]: result }));

        // Call success/error callbacks
        if (result.success) {
          onSuccessRef.current?.(type, result);
        } else if (result.error) {
          onErrorRef.current?.(type, new Error(result.error));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorResult: IntegrationResult = {
          success: false,
          error: errorMessage,
          type,
        };

        updateStatusForType(type, {
          loading: false,
          error: errorMessage,
          result: errorResult,
        });

        setLastResults((prev) => ({ ...prev, [type]: errorResult }));
        onErrorRef.current?.(type, error instanceof Error ? error : new Error(errorMessage));

        return errorResult;
      }
    },
    [updateStatusForType]
  );

  /**
   * Submit feedback to all enabled integrations
   */
  const submitAll = useCallback(
    async (data: FeedbackData): Promise<Record<IntegrationType, IntegrationResult | null>> => {
      const results: Record<IntegrationType, IntegrationResult | null> = {
        jira: null,
        sheets: null,
      };

      const promises: Promise<void>[] = [];

      if (isConfigured('jira')) {
        promises.push(
          submit('jira', data).then((result) => {
            results.jira = result;
          })
        );
      }

      if (isConfigured('sheets')) {
        promises.push(
          submit('sheets', data).then((result) => {
            results.sheets = result;
          })
        );
      }

      await Promise.all(promises);
      return results;
    },
    [isConfigured, submit]
  );

  /**
   * Update status in an integration
   */
  const updateIntegrationStatus = useCallback(
    async (
      type: IntegrationType,
      id: string,
      newStatus: string
    ): Promise<IntegrationResult | null> => {
      const service = serviceRef.current;

      if (!service?.updateStatus) {
        return null;
      }

      if (!isConfigured(type)) {
        return null;
      }

      updateStatusForType(type, { loading: true, error: null });

      try {
        const result = await service.updateStatus(type, id, newStatus);

        updateStatusForType(type, {
          loading: false,
          error: result.success ? null : result.error ?? null,
          result,
        });

        if (result.success) {
          onSuccessRef.current?.(type, result);
        } else if (result.error) {
          onErrorRef.current?.(type, new Error(result.error));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        updateStatusForType(type, {
          loading: false,
          error: errorMessage,
          result: { success: false, error: errorMessage, type },
        });

        onErrorRef.current?.(type, error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
    },
    [isConfigured, updateStatusForType]
  );

  /**
   * Get configuration modal for an integration (placeholder for future)
   */
  const getConfigModal = useCallback((_type: IntegrationType): ComponentType | null => {
    // TODO: Implement when modal components are available
    return null;
  }, []);

  /**
   * Reset status for a specific integration or all
   */
  const resetStatus = useCallback((type?: IntegrationType) => {
    if (type) {
      setStatus((prev) => ({
        ...prev,
        [type]: { ...INITIAL_STATUS },
      }));
    } else {
      setStatus({ ...INITIAL_STATUS_MAP });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────────

  const isLoading = useMemo(
    () => status.jira.loading || status.sheets.loading,
    [status.jira.loading, status.sheets.loading]
  );

  const hasError = useMemo(
    () => Boolean(status.jira.error || status.sheets.error),
    [status.jira.error, status.sheets.error]
  );

  const configuredTypes = useMemo((): IntegrationType[] => {
    const types: IntegrationType[] = [];
    if (config?.jira?.enabled) types.push('jira');
    if (config?.sheets?.enabled) types.push('sheets');
    return types;
  }, [config?.jira?.enabled, config?.sheets?.enabled]);

  // ─────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────

  return useMemo(
    () => ({
      status,
      lastResults,
      isConfigured,
      submit,
      submitAll,
      updateStatus: updateIntegrationStatus,
      getConfigModal,
      resetStatus,
      isLoading,
      hasError,
      configuredTypes,
    }),
    [
      status,
      lastResults,
      isConfigured,
      submit,
      submitAll,
      updateIntegrationStatus,
      getConfigModal,
      resetStatus,
      isLoading,
      hasError,
      configuredTypes,
    ]
  );
}
`;

const filePath = '../src/hooks/useIntegrations.ts';

// Ensure directory exists
mkdirSync(dirname(filePath), { recursive: true });

// Write file
writeFileSync(filePath, hookContent);

console.log(`Created ${filePath}`);
