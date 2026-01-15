/**
 * Google Sheets Integration Types
 *
 * TypeScript type definitions specific to the Sheets integration.
 *
 * @module integrations/sheets/sheetsTypes
 */

import type { FeedbackData } from '../../types/index.js';
import type { SheetColumnsMap } from '../config.js';

// ============================================
// SERVICE ACCOUNT TYPES
// ============================================

/**
 * Service account credentials from Google Cloud Console.
 *
 * Download this JSON from:
 * Google Cloud Console > IAM & Admin > Service Accounts > Keys
 */
export interface GoogleServiceAccountCredentials {
  /** Credential type (always 'service_account') */
  type: 'service_account';
  /** Google Cloud project ID */
  project_id: string;
  /** Private key ID */
  private_key_id: string;
  /** RSA private key (PEM format) */
  private_key: string;
  /** Service account email */
  client_email: string;
  /** OAuth client ID */
  client_id: string;
  /** OAuth authorization URI */
  auth_uri: string;
  /** OAuth token URI */
  token_uri: string;
  /** Auth provider certificate URL */
  auth_provider_x509_cert_url: string;
  /** Client certificate URL */
  client_x509_cert_url: string;
}

// ============================================
// OAUTH TYPES
// ============================================

/**
 * OAuth stored tokens.
 *
 * These are persisted by your application to enable token refresh.
 */
export interface OAuthStoredTokens {
  /** Access token for API requests */
  access_token: string;
  /** Refresh token for obtaining new access tokens */
  refresh_token: string;
  /** Token expiry timestamp (milliseconds since epoch) */
  expiry: number;
}

// ============================================
// CLIENT CONFIGURATION
// ============================================

/**
 * Base Sheets client configuration.
 *
 * Used for Service Account authentication.
 */
export interface SheetsClientConfig {
  /** Google Spreadsheet ID (from URL) */
  spreadsheetId?: string | undefined;
  /** Sheet/tab name within the spreadsheet */
  sheetName?: string | undefined;
  /** Service account credentials (JSON string or object) */
  credentials?: string | GoogleServiceAccountCredentials | undefined;
  /** Custom column mapping */
  columns?: SheetColumnsMap | undefined;
  /** Custom column order */
  columnOrder?: string[] | undefined;
}

/**
 * OAuth client configuration.
 *
 * Used for user-based OAuth 2.0 authentication.
 */
export interface SheetsOAuthClientConfig extends Omit<SheetsClientConfig, 'credentials'> {
  /** Enable OAuth mode */
  oauth: true;
  /** OAuth client ID from Google Cloud Console */
  clientId?: string | undefined;
  /** OAuth client secret */
  clientSecret?: string | undefined;
  /** OAuth redirect URI */
  redirectUri?: string | undefined;
  /** Function to retrieve stored tokens */
  getStoredTokens?: (() => Promise<OAuthStoredTokens | null>) | undefined;
  /** Function to save tokens after refresh */
  saveTokens?: ((tokens: OAuthStoredTokens) => Promise<void>) | undefined;
}

/**
 * Handler configuration union type.
 *
 * Either Service Account or OAuth configuration.
 */
export type SheetsHandlerConfig = SheetsClientConfig | SheetsOAuthClientConfig;

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Request body for Sheets handler.
 */
export interface SheetsRequestBody {
  /** Action to perform */
  action?: 'append' | 'updateStatus' | 'updateRow' | 'getHeaders' | 'ensureHeaders' | 'getAuthUrl' | 'exchangeCode';
  /** Feedback data for append/updateRow */
  feedbackData?: FeedbackData | undefined;
  /** Feedback ID for updateStatus */
  feedbackId?: string | undefined;
  /** New status for updateStatus */
  status?: string | undefined;
  /** Row number for updateRow */
  row?: number | undefined;
  /** OAuth state parameter */
  state?: string | undefined;
  /** OAuth authorization code */
  code?: string | undefined;
}

/**
 * Request object interface.
 *
 * Supports both Next.js App Router and Express.
 */
export interface RequestLike {
  /** JSON body parser (Next.js App Router) */
  json?: () => Promise<SheetsRequestBody>;
  /** Parsed body (Express) */
  body?: string | SheetsRequestBody;
}

/**
 * Response object interface.
 *
 * Express-style response.
 */
export interface ResponseLike {
  /** Send JSON response */
  json?: (data: unknown) => void;
  /** Set response status */
  status?: (code: number) => ResponseLike;
}

// ============================================
// HANDLER RESULT TYPES
// ============================================

/**
 * Append row result.
 */
export interface AppendResult {
  success: true;
  /** Updated range in A1 notation */
  updatedRange?: string | undefined;
  /** Row number of appended data */
  rowNumber?: string | undefined;
}

/**
 * Status update result.
 */
export interface StatusUpdateResult {
  success: true;
  /** Updated row number */
  row: number;
}

/**
 * Headers result.
 */
export interface HeadersResult {
  /** List of header names */
  headers: string[];
}

/**
 * Ensure headers result.
 */
export interface EnsureHeadersResult {
  /** Whether headers were created */
  created: boolean;
  /** Existing headers if not created */
  existing?: string[] | undefined;
}

/**
 * OAuth authorization URL result.
 */
export interface AuthUrlResult {
  /** Authorization URL */
  url: string;
}

/**
 * OAuth token exchange result.
 */
export interface TokenExchangeResult {
  /** Access token */
  access_token: string;
  /** Refresh token (only on initial auth) */
  refresh_token?: string | undefined;
  /** Token expiry in seconds */
  expires_in: number;
  /** Token type (usually 'Bearer') */
  token_type: string;
}

/**
 * Row update result.
 */
export interface RowUpdateResult {
  success: true;
  /** Updated row number */
  row: number;
}

/**
 * Error response.
 */
export interface ErrorResponse {
  success: false;
  /** Error message */
  error: string;
}

/**
 * Handler result union type.
 */
export type HandlerResult =
  | AppendResult
  | StatusUpdateResult
  | HeadersResult
  | EnsureHeadersResult
  | AuthUrlResult
  | TokenExchangeResult
  | RowUpdateResult;

/**
 * Sheets handler function type.
 */
export type SheetsHandler = (
  req: RequestLike,
  res: ResponseLike | null
) => Promise<Response | void>;

// ============================================
// SHEETS API RESPONSE TYPES
// ============================================

/**
 * Sheets API response for values.
 */
export interface SheetsValuesResponse {
  /** Range in A1 notation */
  range: string;
  /** Major dimension (ROWS or COLUMNS) */
  majorDimension: string;
  /** Cell values */
  values?: string[][] | undefined;
}

/**
 * Sheets API update response.
 */
export interface SheetsUpdateResponse {
  /** Spreadsheet ID */
  spreadsheetId: string;
  /** Updated range */
  updatedRange: string;
  /** Number of rows updated */
  updatedRows: number;
  /** Number of columns updated */
  updatedColumns: number;
  /** Number of cells updated */
  updatedCells: number;
}

/**
 * Sheets API append response.
 */
export interface SheetsAppendResponse {
  /** Spreadsheet ID */
  spreadsheetId: string;
  /** Table range */
  tableRange?: string | undefined;
  /** Update details */
  updates?: SheetsUpdateResponse | undefined;
}

// ============================================
// WEBHOOK PAYLOAD TYPES
// ============================================

/**
 * Zapier webhook payload for Sheets.
 */
export interface SheetsZapierPayload {
  /** Timestamp of feedback */
  timestamp: string;
  /** Feedback ID */
  id: string;
  /** Feedback text */
  feedback: string;
  /** Feedback type */
  type: string;
  /** Feedback status */
  status: string;
  /** User name */
  user_name: string;
  /** User email */
  user_email: string;
  /** Page URL */
  page_url: string;
  /** Viewport dimensions */
  viewport: string;
  /** Has screenshot attachment */
  has_screenshot: boolean;
  /** Has video attachment */
  has_video: boolean;
  /** Element selector */
  element_selector: string;
  /** Component name */
  component_name: string;
}
