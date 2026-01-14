/**
 * React Visual Feedback - Client-Side Integration Manager
 *
 * Handles communication with integration endpoints and webhooks.
 * Used internally by FeedbackProvider and FeedbackDashboard.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  FeedbackData,
  JiraConfig,
  SheetsConfig,
} from '../types/index.js';
import {
  INTEGRATION_TYPES,
  SheetColumnsMap,
  JiraFieldsMap,
  JiraStatusMapping,
} from './config.js';

// ============================================
// TYPES
// ============================================

/** Jira integration type */
export type JiraIntegrationType =
  | typeof INTEGRATION_TYPES.JIRA.SERVER
  | typeof INTEGRATION_TYPES.JIRA.AUTOMATION
  | typeof INTEGRATION_TYPES.JIRA.ZAPIER;

/** Sheets integration type */
export type SheetsIntegrationType =
  | typeof INTEGRATION_TYPES.SHEETS.SERVER
  | typeof INTEGRATION_TYPES.SHEETS.OAUTH
  | typeof INTEGRATION_TYPES.SHEETS.APPS_SCRIPT
  | typeof INTEGRATION_TYPES.SHEETS.ZAPIER;

/** Jira integration configuration */
export interface JiraIntegrationConfig {
  enabled: boolean;
  type?: JiraIntegrationType | undefined;
  endpoint?: string | undefined;
  webhookUrl?: string | undefined;
  syncStatus?: boolean | undefined;
  fields?: JiraFieldsMap | undefined;
  statusMapping?: {
    toJira?: JiraStatusMapping | undefined;
    fromJira?: JiraStatusMapping | undefined;
  } | undefined;
}

/** Sheets integration configuration */
export interface SheetsIntegrationConfig {
  enabled: boolean;
  type?: SheetsIntegrationType | undefined;
  endpoint?: string | undefined;
  deploymentUrl?: string | undefined;
  webhookUrl?: string | undefined;
  columns?: SheetColumnsMap | undefined;
  columnOrder?: string[] | undefined;
  sheetName?: string | undefined;
}

/** Full integration client configuration - accepts types from types/index.ts */
export interface IntegrationClientConfig {
  jira?: JiraConfig | null;
  sheets?: SheetsConfig | null;
  onError?: (type: 'jira' | 'sheets', error: Error) => void;
  onSuccess?: (type: 'jira' | 'sheets', result: IntegrationResult) => void;
}

/** Send feedback options */
export interface SendFeedbackOptions {
  jira?: boolean;
  sheets?: boolean;
}

/** Base integration result */
export interface IntegrationResult {
  success: boolean;
  error?: string | undefined;
  type?: string | undefined;
  issueKey?: string | undefined;
  issueUrl?: string | undefined;
  rowNumber?: number | undefined;
}

/** Full send feedback results */
export interface SendFeedbackResults {
  jira: IntegrationResult | null;
  sheets: IntegrationResult | null;
}

/** Jira automation payload */
interface JiraAutomationPayload {
  summary: string;
  description: string;
  type: string;
  userName: string;
  userEmail: string;
  url: string;
  viewport: string;
  hasScreenshot: boolean;
  hasVideo: boolean;
  timestamp: string;
  feedbackId: string;
}

/** Zapier payload */
interface ZapierPayload {
  timestamp: string;
  id: string;
  feedback: string;
  type: string;
  status: string;
  user_name: string;
  user_email: string;
  page_url: string;
  viewport: string;
  has_screenshot: boolean;
  has_video: boolean;
  element_selector: string;
  component_name: string;
}

/** Integration status for a single type */
export interface IntegrationStatus {
  loading: boolean;
  error: string | null;
  result: IntegrationResult | null;
}

/** Combined integration status */
export interface IntegrationsStatus {
  jira: IntegrationStatus;
  sheets: IntegrationStatus;
}

/** Hook return type */
export interface UseIntegrationsReturn {
  status: IntegrationsStatus;
  sendFeedback: (feedbackData: FeedbackData) => Promise<SendFeedbackResults | null>;
  updateStatus: (
    feedbackItem: FeedbackData & { jiraKey?: string },
    newStatus: string
  ) => Promise<Partial<SendFeedbackResults>>;
  client: IntegrationClient | null;
}

// ============================================
// INTEGRATION CLIENT
// ============================================

/**
 * Client for managing feedback integrations
 */
export class IntegrationClient {
  private jiraConfig: JiraConfig | null;
  private sheetsConfig: SheetsConfig | null;
  private _onError: (type: 'jira' | 'sheets', error: Error) => void;
  private onSuccess: (type: 'jira' | 'sheets', result: IntegrationResult) => void;

  constructor(config: IntegrationClientConfig = {}) {
    this.jiraConfig = config.jira ?? null;
    this.sheetsConfig = config.sheets ?? null;
    this._onError = config.onError ?? (() => { });
    this.onSuccess = config.onSuccess ?? (() => { });
  }

  /**
   * Send feedback to selected integrations
   * @param feedbackData - The feedback data to send
   * @param options - Optional. Specify which integrations to send to
   */
  async sendFeedback(
    feedbackData: FeedbackData,
    options: SendFeedbackOptions = {}
  ): Promise<SendFeedbackResults> {
    const results: SendFeedbackResults = {
      jira: null,
      sheets: null,
    };

    // Determine which integrations to use
    // If options are provided, use them; otherwise fall back to config
    const sendToJira =
      options.jira !== undefined ? options.jira : this.jiraConfig?.enabled;
    const sendToSheets =
      options.sheets !== undefined ? options.sheets : this.sheetsConfig?.enabled;

    const promises: Promise<void>[] = [];

    if (sendToJira && this.jiraConfig?.enabled) {
      promises.push(
        this.sendToJira(feedbackData)
          .then((r) => {
            results.jira = r;
          })
          .catch((e: Error) => {
            results.jira = { success: false, error: e.message };
            this._onError('jira', e);
          })
      );
    }

    if (sendToSheets && this.sheetsConfig?.enabled) {
      promises.push(
        this.sendToSheets(feedbackData)
          .then((r) => {
            results.sheets = r;
          })
          .catch((e: Error) => {
            results.sheets = { success: false, error: e.message };
            this._onError('sheets', e);
          })
      );
    }

    await Promise.all(promises);

    return results;
  }

  /**
   * Send feedback to Jira
   */
  async sendToJira(feedbackData: FeedbackData): Promise<IntegrationResult> {
    const config = this.jiraConfig;

    if (!config?.enabled) {
      return { success: false, error: 'Jira integration not enabled' };
    }

    const type = config.type ?? INTEGRATION_TYPES.JIRA.SERVER;

    switch (type) {
      case INTEGRATION_TYPES.JIRA.SERVER:
        return this.sendToJiraServer(feedbackData, config);

      case INTEGRATION_TYPES.JIRA.AUTOMATION:
        return this.sendToJiraAutomation(feedbackData, config);

      case INTEGRATION_TYPES.JIRA.ZAPIER:
        return this.sendToZapier(feedbackData, config.webhookUrl ?? '', 'jira');

      default:
        throw new Error(`Unknown Jira integration type: ${type}`);
    }
  }

  /**
   * Send to our server handler using FormData for large file support
   */
  private async sendToJiraServer(
    feedbackData: FeedbackData,
    config: JiraConfig
  ): Promise<IntegrationResult> {
    const endpoint = config.endpoint ?? '/api/feedback/jira';

    // Use FormData for efficient binary data transfer
    const formData = new FormData();
    formData.append('action', 'create');

    // Separate binary data from metadata
    const { video, screenshot, eventLogs, ...metadata } = feedbackData;

    // Add metadata as JSON
    formData.append('metadata', JSON.stringify(metadata));

    // Add screenshot if present (as base64 string or blob)
    if (screenshot) {
      if ((screenshot as unknown) instanceof Blob) {
        formData.append('screenshot', screenshot as unknown as Blob, 'screenshot.png');
      } else if (typeof screenshot === 'string' && screenshot.startsWith('data:')) {
        // Convert base64 to blob for efficient transfer
        const screenshotBlob = await this.dataURLToBlob(screenshot);
        if (screenshotBlob) {
          formData.append('screenshot', screenshotBlob, 'screenshot.png');
        }
      }
    }

    // Check for videoBlob on feedbackData (extended type)
    const extendedData = feedbackData as FeedbackData & { videoBlob?: Blob };

    // Add video if present (as blob - much more efficient than base64)
    if (extendedData.videoBlob instanceof Blob) {
      const extension = extendedData.videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('video', extendedData.videoBlob, `recording.${extension}`);
    } else if (video && typeof video === 'string' && video.startsWith('data:')) {
      // Video is already base64 string - convert to blob
      const videoAsBlob = await this.dataURLToBlob(video);
      if (videoAsBlob) {
        const extension = video.includes('video/mp4') ? 'mp4' : 'webm';
        formData.append('video', videoAsBlob, `recording.${extension}`);
      }
    }

    // Add event logs as JSON file
    if (eventLogs && eventLogs.length > 0) {
      const logsBlob = new Blob([JSON.stringify(eventLogs, null, 2)], {
        type: 'application/json',
      });
      formData.append('eventLogs', logsBlob, 'session-logs.json');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const result = (await response.json()) as IntegrationResult;
    this.onSuccess('jira', result);
    return result;
  }

  /**
   * Convert data URL to Blob
   */
  private async dataURLToBlob(dataURL: string): Promise<Blob | null> {
    try {
      const response = await fetch(dataURL);
      return await response.blob();
    } catch {
      return null;
    }
  }

  /**
   * Send to Jira Automation webhook
   */
  private async sendToJiraAutomation(
    feedbackData: FeedbackData,
    config: JiraConfig
  ): Promise<IntegrationResult> {
    if (!config.webhookUrl) {
      throw new Error('Jira Automation webhook URL not configured');
    }

    const payload: JiraAutomationPayload = {
      summary: `[Feedback] ${(feedbackData.feedback ?? '').substring(0, 200)}`,
      description: feedbackData.feedback ?? '',
      type: feedbackData.type ?? 'bug',
      userName: feedbackData.userName ?? 'Anonymous',
      userEmail: feedbackData.userEmail ?? '',
      url: feedbackData.url ?? '',
      viewport: feedbackData.viewport
        ? `${feedbackData.viewport.width}x${feedbackData.viewport.height}`
        : '',
      hasScreenshot: Boolean(feedbackData.screenshot),
      hasVideo: Boolean(feedbackData.video),
      timestamp: feedbackData.timestamp ?? new Date().toISOString(),
      feedbackId: feedbackData.id ?? '',
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Jira Automation webhook failed: ${response.status}`);
    }

    const result: IntegrationResult = { success: true, type: 'jira-automation' };
    this.onSuccess('jira', result);
    return result;
  }

  /**
   * Send feedback to Google Sheets
   */
  async sendToSheets(feedbackData: FeedbackData): Promise<IntegrationResult> {
    const config = this.sheetsConfig;

    if (!config?.enabled) {
      return { success: false, error: 'Sheets integration not enabled' };
    }

    const type = config.type ?? INTEGRATION_TYPES.SHEETS.SERVER;

    switch (type) {
      case INTEGRATION_TYPES.SHEETS.SERVER:
      case INTEGRATION_TYPES.SHEETS.OAUTH:
        return this.sendToSheetsServer(feedbackData, config);

      case INTEGRATION_TYPES.SHEETS.APPS_SCRIPT:
        return this.sendToAppsScript(feedbackData, config);

      case INTEGRATION_TYPES.SHEETS.ZAPIER:
        return this.sendToZapier(feedbackData, config.webhookUrl ?? '', 'sheets');

      default:
        throw new Error(`Unknown Sheets integration type: ${type}`);
    }
  }

  /**
   * Send to our server handler
   */
  private async sendToSheetsServer(
    feedbackData: FeedbackData,
    config: SheetsConfig
  ): Promise<IntegrationResult> {
    const endpoint = config.endpoint ?? '/api/feedback/sheets';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append',
        feedbackData,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const result = (await response.json()) as IntegrationResult;
    this.onSuccess('sheets', result);
    return result;
  }

  /**
   * Send to Google Apps Script deployment
   */
  private async sendToAppsScript(
    feedbackData: FeedbackData,
    config: SheetsConfig
  ): Promise<IntegrationResult> {
    if (!config.deploymentUrl) {
      throw new Error('Google Apps Script deployment URL not configured');
    }

    const response = await fetch(config.deploymentUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append',
        feedbackData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apps Script request failed: ${response.status}`);
    }

    const result = (await response.json()) as IntegrationResult;

    if (!result.success) {
      throw new Error(result.error ?? 'Apps Script returned error');
    }

    this.onSuccess('sheets', result);
    return result;
  }

  /**
   * Send to Zapier webhook
   */
  private async sendToZapier(
    feedbackData: FeedbackData,
    webhookUrl: string,
    type: 'jira' | 'sheets'
  ): Promise<IntegrationResult> {
    if (!webhookUrl) {
      throw new Error(`Zapier webhook URL not configured for ${type}`);
    }

    const payload: ZapierPayload = {
      timestamp: new Date().toISOString(),
      id: feedbackData.id ?? '',
      feedback: feedbackData.feedback ?? '',
      type: feedbackData.type ?? 'bug',
      status: feedbackData.status ?? 'new',
      user_name: feedbackData.userName ?? 'Anonymous',
      user_email: feedbackData.userEmail ?? '',
      page_url: feedbackData.url ?? '',
      viewport: feedbackData.viewport
        ? `${feedbackData.viewport.width}x${feedbackData.viewport.height}`
        : '',
      has_screenshot: Boolean(feedbackData.screenshot),
      has_video: Boolean(feedbackData.video),
      element_selector: feedbackData.elementInfo?.selector ?? '',
      component_name: feedbackData.elementInfo?.componentStack?.[0] ?? '',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status}`);
    }

    const result: IntegrationResult = { success: true, type: 'zapier' };
    this.onSuccess(type, result);
    return result;
  }

  /**
   * Update status in Jira
   */
  async updateJiraStatus(issueKey: string, status: string): Promise<IntegrationResult | null> {
    if (!this.jiraConfig?.enabled || !this.jiraConfig?.syncStatus) {
      return null;
    }

    const endpoint = this.jiraConfig.endpoint ?? '/api/feedback/jira';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateStatus',
        issueKey,
        status,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update Jira status');
    }

    return (await response.json()) as IntegrationResult;
  }

  /**
   * Update status in Sheets
   */
  async updateSheetsStatus(feedbackId: string, status: string): Promise<IntegrationResult | null> {
    if (!this.sheetsConfig?.enabled) {
      return null;
    }

    const type = this.sheetsConfig.type ?? INTEGRATION_TYPES.SHEETS.SERVER;

    if (type === INTEGRATION_TYPES.SHEETS.APPS_SCRIPT && this.sheetsConfig.deploymentUrl) {
      const response = await fetch(this.sheetsConfig.deploymentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          feedbackId,
          status,
        }),
      });
      return (await response.json()) as IntegrationResult;
    }

    const endpoint = this.sheetsConfig.endpoint ?? '/api/feedback/sheets';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateStatus',
        feedbackId,
        status,
      }),
    });

    return (await response.json()) as IntegrationResult;
  }

  /**
   * Get Jira issue status
   */
  async getJiraStatus(issueKey: string): Promise<IntegrationResult | null> {
    if (!this.jiraConfig?.enabled) {
      return null;
    }

    const endpoint = this.jiraConfig.endpoint ?? '/api/feedback/jira';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getStatus',
        issueKey,
      }),
    });

    return (await response.json()) as IntegrationResult;
  }
}

// ============================================
// REACT HOOK
// ============================================

/**
 * React hook for managing integrations
 */
export function useIntegrations(config: IntegrationClientConfig = {}): UseIntegrationsReturn {
  const clientRef = useRef<IntegrationClient | null>(null);
  const [status, setStatus] = useState<IntegrationsStatus>({
    jira: { loading: false, error: null, result: null },
    sheets: { loading: false, error: null, result: null },
  });

  // Initialize client
  useEffect(() => {
    clientRef.current = new IntegrationClient({
      ...config,
      onSuccess: (type, result) => {
        setStatus((prev) => ({
          ...prev,
          [type]: { loading: false, error: null, result },
        }));
      },
      onError: (type, error) => {
        setStatus((prev) => ({
          ...prev,
          [type]: { loading: false, error: error.message, result: null },
        }));
      },
    });
  }, [config.jira?.enabled, config.sheets?.enabled]);

  /**
   * Send feedback to integrations
   */
  const sendFeedback = useCallback(
    async (feedbackData: FeedbackData): Promise<SendFeedbackResults | null> => {
      if (!clientRef.current) return null;

      // Set loading state
      setStatus((prev) => ({
        jira: config.jira?.enabled ? { ...prev.jira, loading: true } : prev.jira,
        sheets: config.sheets?.enabled ? { ...prev.sheets, loading: true } : prev.sheets,
      }));

      try {
        const results = await clientRef.current.sendFeedback(feedbackData);

        // Update status based on results
        setStatus({
          jira: results.jira
            ? { loading: false, error: results.jira.error ?? null, result: results.jira }
            : { loading: false, error: null, result: null },
          sheets: results.sheets
            ? { loading: false, error: results.sheets.error ?? null, result: results.sheets }
            : { loading: false, error: null, result: null },
        });

        return results;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatus((prev) => ({
          jira: { ...prev.jira, loading: false, error: message },
          sheets: { ...prev.sheets, loading: false, error: message },
        }));
        throw error;
      }
    },
    [config.jira?.enabled, config.sheets?.enabled]
  );

  /**
   * Update status in integrations
   */
  const updateStatus = useCallback(
    async (
      feedbackItem: FeedbackData & { jiraKey?: string },
      newStatus: string
    ): Promise<Partial<SendFeedbackResults>> => {
      if (!clientRef.current) return {};

      const results: Partial<SendFeedbackResults> = {};

      if (feedbackItem.jiraKey && config.jira?.syncStatus) {
        results.jira = await clientRef.current.updateJiraStatus(feedbackItem.jiraKey, newStatus);
      }

      if (config.sheets?.enabled) {
        results.sheets = await clientRef.current.updateSheetsStatus(
          feedbackItem.id ?? '',
          newStatus
        );
      }

      return results;
    },
    [config.jira?.syncStatus, config.sheets?.enabled]
  );

  return {
    status,
    sendFeedback,
    updateStatus,
    client: clientRef.current,
  };
}

// ============================================
// RE-EXPORTS
// ============================================

export {
  DEFAULT_SHEET_COLUMNS,
  DEFAULT_JIRA_FIELDS,
  DEFAULT_JIRA_STATUS_MAPPING,
  INTEGRATION_TYPES,
  feedbackToSheetRow,
  getSheetHeaders,
} from './config.js';

// Export Apps Script template getter
export { getAppsScriptTemplate } from './sheets.js';

// Export types from config
export type {
  SheetColumnConfig,
  SheetColumnsMap,
  JiraFieldConfig,
  JiraFieldsMap,
  JiraStatusMapping,
  IntegrationConfig,
  ADFDocument,
  ADFNode,
} from './config.js';
