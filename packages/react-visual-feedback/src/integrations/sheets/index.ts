/**
 * Google Sheets Integration Module
 *
 * Provides comprehensive Google Sheets integration with support for:
 * - Service Account authentication (server-to-server)
 * - OAuth 2.0 authentication (user-based)
 * - Multiple framework integrations (Next.js App Router, Pages Router, Express)
 * - Google Apps Script deployment
 * - Zapier webhook formatting
 *
 * @module integrations/sheets
 *
 * @example
 * ```typescript
 * // Service Account (recommended for server-side)
 * import { SheetsClient, createNextAppHandler } from 'react-visual-feedback/integrations/sheets';
 *
 * const client = new SheetsClient({
 *   spreadsheetId: 'your-spreadsheet-id',
 *   credentials: process.env.GOOGLE_SERVICE_ACCOUNT
 * });
 *
 * // Or use handler
 * export const POST = createNextAppHandler({
 *   spreadsheetId: 'your-spreadsheet-id'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // OAuth 2.0 (for user-specific spreadsheets)
 * import { SheetsOAuthClient, createSheetsHandler } from 'react-visual-feedback/integrations/sheets';
 *
 * const handler = createSheetsHandler({
 *   oauth: true,
 *   spreadsheetId: 'user-spreadsheet-id',
 *   clientId: process.env.GOOGLE_CLIENT_ID,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 *   getStoredTokens: async () => getTokensFromDB(),
 *   saveTokens: async (tokens) => saveTokensToDB(tokens)
 * });
 * ```
 */

// Types
export type {
  // Core configuration types
  GoogleServiceAccountCredentials,
  OAuthStoredTokens,
  SheetsClientConfig,
  SheetsOAuthClientConfig,
  SheetsHandlerConfig,

  // Request/Response types
  SheetsRequestBody,
  RequestLike,
  ResponseLike,

  // Result types
  AppendResult,
  StatusUpdateResult,
  HeadersResult,
  EnsureHeadersResult,
  AuthUrlResult,
  TokenExchangeResult,
  RowUpdateResult,
  ErrorResponse,
  HandlerResult,

  // API Response types
  SheetsValuesResponse,
  SheetsUpdateResponse,
  SheetsAppendResponse,

  // Handler type
  SheetsHandler,

  // Webhook types
  SheetsZapierPayload,
} from './sheetsTypes.js';

// Validation functions
export {
  validateSheetsClientConfig,
  validateSheetsOAuthConfig,
  validateSheetsHandlerConfig,
  isSheetsConfigured,
  isOAuthConfig,
  isValidSpreadsheetId,
  extractSpreadsheetId,
} from './sheetsValidation.js';

// Client classes
export { SheetsClient, SheetsOAuthClient } from './SheetsClient.js';

// Integration functions
export {
  createSheetsHandler,
  createNextAppHandler,
  createNextPagesHandler,
  createExpressMiddleware,
  getAppsScriptTemplate,
  formatForZapier,
} from './SheetsIntegration.js';
