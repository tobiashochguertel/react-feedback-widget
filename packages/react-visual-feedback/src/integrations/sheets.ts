/**
 * Google Sheets Integration
 *
 * This module re-exports from the modular sheets integration.
 * See ./sheets/ for the implementation.
 *
 * @module integrations/sheets
 *
 * @example
 * ```typescript
 * // Service Account
 * import { SheetsClient, createNextAppHandler } from 'react-visual-feedback/integrations/sheets';
 *
 * export const POST = createNextAppHandler({
 *   spreadsheetId: 'your-spreadsheet-id'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // OAuth 2.0
 * import { SheetsOAuthClient, createSheetsHandler } from 'react-visual-feedback/integrations/sheets';
 *
 * const handler = createSheetsHandler({
 *   oauth: true,
 *   spreadsheetId: 'user-spreadsheet-id',
 *   clientId: process.env.GOOGLE_CLIENT_ID,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET
 * });
 * ```
 */

// Re-export everything from modular sheets integration
export * from './sheets/index.js';
