/**
 * Google Sheets Integration API Route
 *
 * Just import and use the handler from the library!
 *
 * Environment variables needed:
 * - GOOGLE_SERVICE_ACCOUNT: JSON string of service account credentials
 * - GOOGLE_SPREADSHEET_ID: ID from the spreadsheet URL
 */

import { createSheetsNextAppHandler } from 'react-visual-feedback/server'

export const POST = createSheetsNextAppHandler()
