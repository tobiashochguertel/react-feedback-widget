/**
 * React Visual Feedback - Server Integrations
 *
 * This module provides server-side handlers for Jira and Google Sheets integrations.
 * Import from 'react-visual-feedback/server' in your API routes.
 *
 * Quick Start:
 *
 * Next.js App Router:
 *   // app/api/feedback/jira/route.js
 *   import { createJiraHandler } from 'react-visual-feedback/server';
 *   const handler = createJiraHandler({ projectKey: 'BUG' });
 *   export const POST = (req) => handler({ body: await req.json() });
 *
 * Next.js Pages Router:
 *   // pages/api/feedback/jira.js
 *   import { createJiraHandler } from 'react-visual-feedback/server';
 *   export default createJiraHandler({ projectKey: 'BUG' });
 *
 * Express:
 *   import { createJiraMiddleware } from 'react-visual-feedback/server';
 *   app.post('/api/feedback/jira', createJiraMiddleware({ projectKey: 'BUG' }));
 */

// ============================================
// JIRA EXPORTS
// ============================================

export {
  default as createJiraHandler,
  createNextAppHandler as createJiraNextAppHandler,
  createNextPagesHandler as createJiraNextPagesHandler,
  createExpressMiddleware as createJiraMiddleware,
  createGenericHandler as createJiraGenericHandler,
  formatForJiraAutomation,
  formatForZapier as formatJiraForZapier
} from '../jira.js';

// ============================================
// GOOGLE SHEETS EXPORTS
// ============================================

export {
  default as createSheetsHandler,
  createNextAppHandler as createSheetsNextAppHandler,
  createNextPagesHandler as createSheetsNextPagesHandler,
  createExpressMiddleware as createSheetsMiddleware,
  getAppsScriptTemplate,
  formatForZapier as formatSheetsForZapier
} from '../sheets.js';

// ============================================
// CONFIG EXPORTS
// ============================================

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
  INTEGRATION_TYPES
} from '../config.js';

// ============================================
// CONVENIENCE HANDLERS
// ============================================

/**
 * Create both Jira and Sheets handlers with shared config
 */
export async function createIntegrationHandlers(config = {}) {
  const handlers = {};

  if (config.jira) {
    const { default: createJiraHandler } = await import('../jira.js');
    handlers.jira = createJiraHandler(config.jira);
  }

  if (config.sheets) {
    const { default: createSheetsHandler } = await import('../sheets.js');
    handlers.sheets = createSheetsHandler(config.sheets);
  }

  return handlers;
}

/**
 * Create a combined handler that routes to Jira or Sheets based on request
 */
export function createCombinedHandler(config = {}) {
  const handlers = createIntegrationHandlers(config);

  return async (req, res) => {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { integration } = body;

    if (!integration || !handlers[integration]) {
      const error = { success: false, error: `Unknown integration: ${integration}` };
      if (res?.json) {
        return res.status(400).json(error);
      }
      return new Response(JSON.stringify(error), { status: 400 });
    }

    return handlers[integration](req, res);
  };
}
