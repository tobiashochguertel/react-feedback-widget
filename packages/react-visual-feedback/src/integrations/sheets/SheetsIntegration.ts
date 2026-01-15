/**
 * Google Sheets Integration Implementation
 *
 * Main integration class that provides handler functions for different frameworks.
 *
 * @module integrations/sheets/SheetsIntegration
 */

import type { FeedbackData } from '../../types/index.js';
import {
  feedbackToSheetRow,
  getSheetHeaders,
  mergeSheetColumns,
} from '../config.js';

import type {
  SheetsClientConfig,
  SheetsOAuthClientConfig,
  SheetsHandlerConfig,
  SheetsRequestBody,
  RequestLike,
  ResponseLike,
  AppendResult,
  StatusUpdateResult,
  HeadersResult,
  AuthUrlResult,
  TokenExchangeResult,
  RowUpdateResult,
  HandlerResult,
  ErrorResponse,
  SheetsHandler,
  SheetsZapierPayload,
} from './sheetsTypes.js';

import { SheetsClient, SheetsOAuthClient } from './SheetsClient.js';

// ============================================
// HANDLER FUNCTIONS
// ============================================

/**
 * Handle append row.
 *
 * @param client - Sheets API client
 * @param feedbackData - Feedback data to append
 * @param config - Handler configuration
 * @returns Append result
 */
async function handleAppend(
  client: SheetsClient,
  feedbackData: FeedbackData,
  config: SheetsHandlerConfig
): Promise<AppendResult> {
  // Ensure headers exist
  const headers = getSheetHeaders(config);
  await client.ensureHeaders(headers);

  // Transform feedback to row
  const row = feedbackToSheetRow(feedbackData, config);

  // Append row
  const result = await client.appendRow(row);

  return {
    success: true,
    updatedRange: result?.updates?.updatedRange,
    rowNumber: result?.updates?.updatedRange?.match(/:(\d+)$/)?.[1],
  };
}

/**
 * Handle status update.
 *
 * @param client - Sheets API client
 * @param feedbackId - Feedback ID
 * @param status - New status
 * @param config - Handler configuration
 * @returns Update result
 */
async function handleUpdateStatus(
  client: SheetsClient,
  feedbackId: string,
  status: string,
  config: SheetsHandlerConfig
): Promise<StatusUpdateResult> {
  // Find status column
  const { order } = mergeSheetColumns(
    'columns' in config ? config.columns : undefined,
    'columnOrder' in config ? config.columnOrder : undefined
  );
  const statusIndex = order.indexOf('status');
  const statusColumn = String.fromCharCode(65 + statusIndex); // A, B, C...

  const result = await client.updateStatus(feedbackId, status, statusColumn);

  return result;
}

/**
 * Handle row update.
 *
 * @param client - Sheets API client
 * @param rowNumber - Row number to update
 * @param feedbackData - Updated feedback data
 * @param config - Handler configuration
 * @returns Update result
 */
async function handleUpdateRow(
  client: SheetsClient,
  rowNumber: number,
  feedbackData: FeedbackData,
  config: SheetsHandlerConfig
): Promise<RowUpdateResult> {
  const row = feedbackToSheetRow(feedbackData, config);
  const range = `${config.sheetName ?? 'Feedback'}!A${rowNumber}`;

  await client.updateValues(range, [row]);

  return { success: true, row: rowNumber };
}

// ============================================
// MAIN HANDLER FACTORY
// ============================================

/**
 * Create Sheets handler with configuration.
 *
 * The returned handler supports multiple actions:
 * - `append`: Add feedback as new row
 * - `updateStatus`: Update status of existing feedback
 * - `updateRow`: Update entire row
 * - `getHeaders`: Get configured headers
 * - `ensureHeaders`: Create headers if missing
 * - `getAuthUrl`: Get OAuth authorization URL (OAuth only)
 * - `exchangeCode`: Exchange OAuth code for tokens (OAuth only)
 *
 * @param config - Handler configuration
 * @returns Handler function
 *
 * @example
 * ```typescript
 * // Service Account
 * const handler = createSheetsHandler({
 *   spreadsheetId: 'abc123...',
 *   credentials: process.env.GOOGLE_SERVICE_ACCOUNT
 * });
 *
 * // OAuth
 * const handler = createSheetsHandler({
 *   oauth: true,
 *   spreadsheetId: 'abc123...',
 *   clientId: '...',
 *   clientSecret: '...',
 *   getStoredTokens: async () => db.getTokens(),
 *   saveTokens: async (tokens) => db.saveTokens(tokens)
 * });
 * ```
 */
export function createSheetsHandler(config: SheetsHandlerConfig = {}): SheetsHandler {
  const handler: SheetsHandler = async (req, res) => {
    try {
      let body: SheetsRequestBody;

      if (typeof req.json === 'function') {
        body = await req.json();
      } else if (req.body) {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } else {
        throw new Error('Unable to parse request body');
      }

      const { action = 'append', feedbackData, feedbackId, status, row } = body;

      // Choose client type based on config
      const isOAuth = 'oauth' in config && config.oauth === true;
      const client = isOAuth
        ? new SheetsOAuthClient(config as SheetsOAuthClientConfig)
        : new SheetsClient(config as SheetsClientConfig);

      let result: HandlerResult;

      switch (action) {
        case 'append':
          if (!feedbackData) {
            throw new Error('feedbackData is required for append action');
          }
          result = await handleAppend(client, feedbackData, config);
          break;

        case 'updateStatus':
          if (!feedbackId || !status) {
            throw new Error('feedbackId and status are required for updateStatus action');
          }
          result = await handleUpdateStatus(client, feedbackId, status, config);
          break;

        case 'updateRow':
          if (!row || !feedbackData) {
            throw new Error('row and feedbackData are required for updateRow action');
          }
          result = await handleUpdateRow(client, row, feedbackData, config);
          break;

        case 'getHeaders':
          result = { headers: getSheetHeaders(config) } as HeadersResult;
          break;

        case 'ensureHeaders': {
          const headers = getSheetHeaders(config);
          result = await client.ensureHeaders(headers);
          break;
        }

        // OAuth specific actions
        case 'getAuthUrl':
          if (!(client instanceof SheetsOAuthClient)) {
            throw new Error('OAuth not configured');
          }
          result = { url: client.getAuthUrl(body.state) } as AuthUrlResult;
          break;

        case 'exchangeCode':
          if (!(client instanceof SheetsOAuthClient)) {
            throw new Error('OAuth not configured');
          }
          if (!body.code) {
            throw new Error('code is required for exchangeCode action');
          }
          result = await client.exchangeCode(body.code) as TokenExchangeResult;
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Send response
      if (res?.json && res?.status) {
        res.status(200).json!(result);
      } else {
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      if (res?.json && res?.status) {
        res.status(500).json!(errorResponse);
      } else {
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  };

  return handler;
}

// ============================================
// FRAMEWORK-SPECIFIC EXPORTS
// ============================================

/**
 * Next.js App Router handler.
 *
 * @param config - Handler configuration
 * @returns Async function for Next.js App Router
 *
 * @example
 * ```typescript
 * // app/api/feedback/sheets/route.ts
 * import { createNextAppHandler } from 'react-visual-feedback/integrations/sheets';
 *
 * export const POST = createNextAppHandler({
 *   spreadsheetId: 'abc123...'
 * });
 * ```
 */
export function createNextAppHandler(
  config: SheetsHandlerConfig = {}
): (request: Request) => Promise<Response> {
  const handler = createSheetsHandler(config);

  return async (request: Request): Promise<Response> => {
    const body = await request.json();
    const result = await handler({ body: body as SheetsRequestBody }, null);
    return result as Response;
  };
}

/**
 * Next.js Pages Router handler.
 *
 * @param config - Handler configuration
 * @returns Handler compatible with Pages Router API routes
 */
export function createNextPagesHandler(config: SheetsHandlerConfig = {}): SheetsHandler {
  return createSheetsHandler(config);
}

/**
 * Express middleware.
 *
 * @param config - Handler configuration
 * @returns Express middleware function
 */
export function createExpressMiddleware(
  config: SheetsHandlerConfig = {}
): (req: RequestLike, res: ResponseLike, next: (error?: Error) => void) => Promise<void> {
  const handler = createSheetsHandler(config);

  return async (req, res, next): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

// ============================================
// GOOGLE APPS SCRIPT TEMPLATE
// ============================================

/**
 * Returns the Google Apps Script code that users paste into their sheet.
 *
 * @param config - Configuration for the script
 * @returns Google Apps Script code as string
 *
 * @example
 * ```typescript
 * const script = getAppsScriptTemplate({ sheetName: 'My Feedback' });
 * console.log(script); // Copy this to Apps Script editor
 * ```
 */
export function getAppsScriptTemplate(config: Partial<SheetsClientConfig> = {}): string {
  const headers = getSheetHeaders(config);

  return `
/**
 * React Visual Feedback - Google Apps Script Handler
 *
 * Setup:
 * 1. Open your Google Sheet
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy > New deployment > Web app
 * 5. Execute as: Me, Who has access: Anyone
 * 6. Copy the URL and use in your React app
 */

// Sheet configuration
const SHEET_NAME = '${config.sheetName ?? 'Feedback'}';
const HEADERS = ${JSON.stringify(headers)};

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'append';

    let result;

    switch (action) {
      case 'append':
        result = appendFeedback(data.feedbackData);
        break;
      case 'updateStatus':
        result = updateStatus(data.feedbackId, data.status);
        break;
      case 'getRows':
        result = getRows(data.limit || 100);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Feedback API ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Append feedback to sheet
 */
function appendFeedback(feedbackData) {
  const sheet = getOrCreateSheet();

  const row = [
    new Date().toISOString(),                           // Timestamp
    feedbackData.id || '',                              // ID
    feedbackData.feedback || '',                        // Feedback
    feedbackData.type || 'bug',                         // Type
    feedbackData.status || 'new',                       // Status
    feedbackData.userName || 'Anonymous',               // User Name
    feedbackData.userEmail || '',                       // User Email
    feedbackData.url || '',                             // Page URL
    feedbackData.viewport ? feedbackData.viewport.width + 'x' + feedbackData.viewport.height : '', // Viewport
    feedbackData.screenshot ? 'Yes' : 'No',             // Screenshot
    feedbackData.video ? 'Yes' : 'No',                  // Video
    feedbackData.jiraKey || ''                          // Jira Key
  ];

  sheet.appendRow(row);

  return {
    success: true,
    row: sheet.getLastRow()
  };
}

/**
 * Update feedback status
 */
function updateStatus(feedbackId, newStatus) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  // Find row with matching ID (column B, index 1)
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === feedbackId) {
      // Update status (column E, index 4)
      sheet.getRange(i + 1, 5).setValue(newStatus);
      return { success: true, row: i + 1 };
    }
  }

  return { success: false, error: 'Feedback not found' };
}

/**
 * Get rows from sheet
 */
function getRows(limit) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  const rows = data.slice(1, limit + 1).map((row, index) => ({
    rowNumber: index + 2,
    timestamp: row[0],
    id: row[1],
    feedback: row[2],
    type: row[3],
    status: row[4],
    userName: row[5],
    userEmail: row[6],
    url: row[7],
    viewport: row[8],
    hasScreenshot: row[9] === 'Yes',
    hasVideo: row[10] === 'Yes',
    jiraKey: row[11]
  }));

  return { success: true, rows };
}

/**
 * Get or create the feedback sheet
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);

    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
  }

  return sheet;
}

/**
 * Update Jira key for a feedback item
 */
function updateJiraKey(feedbackId, jiraKey) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === feedbackId) {
      // Update Jira key (column L, index 11)
      sheet.getRange(i + 1, 12).setValue(jiraKey);
      return { success: true, row: i + 1 };
    }
  }

  return { success: false, error: 'Feedback not found' };
}
`.trim();
}

// ============================================
// WEBHOOK FORMATTERS
// ============================================

/**
 * Format feedback for Zapier webhook.
 *
 * @param feedbackData - Feedback data
 * @returns Payload for Zapier
 */
export function formatForZapier(feedbackData: FeedbackData): SheetsZapierPayload {
  return {
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
}
