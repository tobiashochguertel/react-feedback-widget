/**
 * React Visual Feedback - Server Integrations
 *
 * This module provides server-side handlers for Jira and Google Sheets integrations.
 * Import from 'react-visual-feedback/server' in your API routes.
 *
 * @packageDocumentation
 *
 * @example Quick Start - Next.js App Router
 * ```typescript
 * // app/api/feedback/jira/route.ts
 * import { createJiraNextAppHandler } from 'react-visual-feedback/server';
 *
 * export const POST = createJiraNextAppHandler({
 *   host: process.env.JIRA_HOST!,
 *   email: process.env.JIRA_EMAIL!,
 *   apiToken: process.env.JIRA_API_TOKEN!,
 *   projectKey: 'BUG',
 * });
 * ```
 *
 * @example Quick Start - Next.js Pages Router
 * ```typescript
 * // pages/api/feedback/jira.ts
 * import { createJiraNextPagesHandler } from 'react-visual-feedback/server';
 *
 * export default createJiraNextPagesHandler({
 *   host: process.env.JIRA_HOST!,
 *   email: process.env.JIRA_EMAIL!,
 *   apiToken: process.env.JIRA_API_TOKEN!,
 *   projectKey: 'BUG',
 * });
 * ```
 *
 * @example Quick Start - Express
 * ```typescript
 * import { createJiraMiddleware } from 'react-visual-feedback/server';
 *
 * app.post('/api/feedback/jira', createJiraMiddleware({
 *   host: process.env.JIRA_HOST!,
 *   email: process.env.JIRA_EMAIL!,
 *   apiToken: process.env.JIRA_API_TOKEN!,
 *   projectKey: 'BUG',
 * }));
 * ```
 */

import type { Feedback, JiraConfig, SheetsConfig } from '../types/index';

// =============================================================================
// JIRA EXPORTS
// =============================================================================

export {
  JiraClient,
  createJiraHandler,
  createNextAppHandler as createJiraNextAppHandler,
  createNextPagesHandler as createJiraNextPagesHandler,
  createExpressMiddleware as createJiraMiddleware,
  formatForJiraAutomation,
  formatForZapier as formatJiraForZapier,
  formatEventLogs,
} from '../jira';

// =============================================================================
// GOOGLE SHEETS EXPORTS
// =============================================================================

export {
  SheetsClient,
  SheetsOAuthClient,
  createSheetsHandler,
  createNextAppHandler as createSheetsNextAppHandler,
  createNextPagesHandler as createSheetsNextPagesHandler,
  createExpressMiddleware as createSheetsMiddleware,
  getAppsScriptTemplate,
  formatForZapier as formatSheetsForZapier,
} from '../sheets';

// =============================================================================
// CONFIG EXPORTS
// =============================================================================

export {
  // Sheet column configuration
  DEFAULT_SHEET_COLUMNS,
  DEFAULT_SHEET_COLUMN_ORDER,
  mergeSheetColumns,
  feedbackToSheetRow,
  getSheetHeaders,

  // Jira field configuration
  DEFAULT_JIRA_FIELDS,
  DEFAULT_JIRA_STATUS_MAPPING,
  mergeJiraFields,
  feedbackToJiraIssue,
  mapJiraStatusToLocal,
  mapLocalStatusToJira,

  // Integration types
  INTEGRATION_TYPES,
} from '../config';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Configuration for creating integration handlers.
 */
export interface IntegrationHandlersConfig {
  /** Jira integration configuration */
  readonly jira?: JiraConfig;
  /** Google Sheets integration configuration */
  readonly sheets?: SheetsConfig;
}

/**
 * Result of createIntegrationHandlers containing configured handlers.
 */
export interface IntegrationHandlers {
  /** Jira handler function, if configured */
  readonly jira?: (feedback: Feedback) => Promise<{ readonly success: boolean; readonly issueKey?: string; readonly error?: string }>;
  /** Sheets handler function, if configured */
  readonly sheets?: (feedback: Feedback) => Promise<{ readonly success: boolean; readonly row?: number; readonly error?: string }>;
}

/**
 * Generic request object for combined handler.
 */
interface CombinedRequest {
  readonly body: string | {
    readonly integration?: 'jira' | 'sheets';
    readonly [key: string]: unknown;
  };
}

/**
 * Generic response object for combined handler.
 */
interface CombinedResponse {
  readonly status?: (code: number) => CombinedResponse;
  readonly json?: (data: unknown) => void;
}

// =============================================================================
// CONVENIENCE HANDLERS
// =============================================================================

/**
 * Create both Jira and Sheets handlers with shared configuration.
 *
 * This is useful when you want to set up multiple integrations at once.
 *
 * @param config - Configuration for both integrations
 * @returns Object containing configured handler functions
 *
 * @example
 * ```typescript
 * const handlers = await createIntegrationHandlers({
 *   jira: {
 *     host: process.env.JIRA_HOST!,
 *     email: process.env.JIRA_EMAIL!,
 *     apiToken: process.env.JIRA_API_TOKEN!,
 *     projectKey: 'BUG',
 *   },
 *   sheets: {
 *     spreadsheetId: process.env.SHEETS_ID!,
 *     credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
 *   },
 * });
 *
 * // Use in API route
 * const result = await handlers.jira?.(feedback);
 * ```
 */
export async function createIntegrationHandlers(
  config: IntegrationHandlersConfig = {}
): Promise<IntegrationHandlers> {
  const handlers: {
    jira?: IntegrationHandlers['jira'];
    sheets?: IntegrationHandlers['sheets'];
  } = {};

  if (config.jira) {
    const { createJiraHandler } = await import('../jira');
    handlers.jira = createJiraHandler(config.jira);
  }

  if (config.sheets) {
    const { createSheetsHandler } = await import('../sheets');
    handlers.sheets = createSheetsHandler(config.sheets);
  }

  return handlers as IntegrationHandlers;
}

/**
 * Create a combined handler that routes to Jira or Sheets based on request body.
 *
 * The request body should include an `integration` field specifying which
 * service to use ('jira' or 'sheets').
 *
 * @param config - Configuration for both integrations
 * @returns Handler function that routes based on request
 *
 * @example
 * ```typescript
 * // Create combined handler
 * const handler = createCombinedHandler({
 *   jira: { ... },
 *   sheets: { ... },
 * });
 *
 * // In API route - request body determines integration
 * // POST /api/feedback { integration: 'jira', title: '...', ... }
 * export const POST = handler;
 * ```
 */
export function createCombinedHandler(
  config: IntegrationHandlersConfig = {}
): (req: CombinedRequest, res?: CombinedResponse) => Promise<Response | void> {
  // Pre-create handlers synchronously to avoid async in the returned function
  let handlersPromise: Promise<IntegrationHandlers> | null = null;

  const getHandlers = async (): Promise<IntegrationHandlers> => {
    if (!handlersPromise) {
      handlersPromise = createIntegrationHandlers(config);
    }
    return handlersPromise;
  };

  return async (req: CombinedRequest, res?: CombinedResponse): Promise<Response | void> => {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body) as { integration?: 'jira' | 'sheets';[key: string]: unknown }
      : req.body;

    const { integration } = body;
    const handlers = await getHandlers();

    if (!integration || !(integration in handlers)) {
      const error = {
        success: false,
        error: `Unknown integration: ${String(integration)}. Expected 'jira' or 'sheets'.`,
      };

      if (res?.json && res?.status) {
        res.status(400).json(error);
        return;
      }

      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Route to appropriate handler
    const handler = handlers[integration];
    if (!handler) {
      const error = {
        success: false,
        error: `Handler for ${integration} not configured`,
      };

      if (res?.json && res?.status) {
        res.status(500).json(error);
        return;
      }

      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // Extract feedback data from body (excluding 'integration' field)
      const { integration: _integration, ...feedbackData } = body;
      const result = await handler(feedbackData as unknown as Feedback);

      if (res?.json) {
        res.json(result);
        return;
      }

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      const error = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };

      if (res?.json && res?.status) {
        res.status(500).json(error);
        return;
      }

      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
