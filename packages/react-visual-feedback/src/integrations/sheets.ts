/**
 * Google Sheets Integration Server Handler
 *
 * Supports:
 * - Service Account authentication (recommended for servers)
 * - OAuth 2.0 with automatic token refresh
 * - Google Apps Script (no server needed)
 *
 * Usage (Next.js App Router):
 *   export { POST } from 'react-visual-feedback/server/sheets';
 *
 * Usage (Express):
 *   app.post('/api/sheets', sheetsHandler({ spreadsheetId: '...' }));
 */

import type { FeedbackData } from '../types/index.js';
import {
  feedbackToSheetRow,
  getSheetHeaders,
  mergeSheetColumns,
  SheetColumnsMap,
} from './config.js';

// ============================================
// TYPES
// ============================================

/** Service account credentials from Google Cloud Console */
export interface GoogleServiceAccountCredentials {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

/** OAuth stored tokens */
export interface OAuthStoredTokens {
  access_token: string;
  refresh_token: string;
  expiry: number;
}

/** Base Sheets client configuration */
export interface SheetsClientConfig {
  spreadsheetId?: string;
  sheetName?: string;
  credentials?: string | GoogleServiceAccountCredentials;
  columns?: SheetColumnsMap;
  columnOrder?: string[];
}

/** OAuth client configuration extends base config */
export interface SheetsOAuthClientConfig extends Omit<SheetsClientConfig, 'credentials'> {
  oauth: true;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  getStoredTokens?: () => Promise<OAuthStoredTokens | null>;
  saveTokens?: (tokens: OAuthStoredTokens) => Promise<void>;
}

/** Handler configuration union */
export type SheetsHandlerConfig = SheetsClientConfig | SheetsOAuthClientConfig;

/** Request body for Sheets handler */
interface SheetsRequestBody {
  action?: 'append' | 'updateStatus' | 'updateRow' | 'getHeaders' | 'ensureHeaders' | 'getAuthUrl' | 'exchangeCode';
  feedbackData?: FeedbackData;
  feedbackId?: string;
  status?: string;
  row?: number;
  state?: string;
  code?: string;
}

/** Request object interface */
interface RequestLike {
  json?: () => Promise<SheetsRequestBody>;
  body?: string | SheetsRequestBody;
}

/** Response object interface */
interface ResponseLike {
  json?: (data: unknown) => void;
  status?: (code: number) => ResponseLike;
}

/** Append result */
interface AppendResult {
  success: true;
  updatedRange?: string;
  rowNumber?: string;
}

/** Status update result */
interface StatusUpdateResult {
  success: true;
  row: number;
}

/** Headers result */
interface HeadersResult {
  headers: string[];
}

/** Ensure headers result */
interface EnsureHeadersResult {
  created: boolean;
  existing?: string[];
}

/** OAuth URL result */
interface AuthUrlResult {
  url: string;
}

/** OAuth token exchange result */
interface TokenExchangeResult {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/** Error response */
interface ErrorResponse {
  success: false;
  error: string;
}

/** Handler result union */
type HandlerResult =
  | AppendResult
  | StatusUpdateResult
  | HeadersResult
  | EnsureHeadersResult
  | AuthUrlResult
  | TokenExchangeResult
  | { success: true; row: number };

/** Handler function type */
type SheetsHandler = (
  req: RequestLike,
  res: ResponseLike | null
) => Promise<Response | void>;

/** Sheets API response for values */
interface SheetsValuesResponse {
  range: string;
  majorDimension: string;
  values?: string[][];
}

/** Sheets API update response */
interface SheetsUpdateResponse {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

/** Sheets API append response */
interface SheetsAppendResponse {
  spreadsheetId: string;
  tableRange?: string;
  updates?: SheetsUpdateResponse;
}

// ============================================
// GOOGLE SHEETS CLIENT (Service Account)
// ============================================

/**
 * Google Sheets API client using Service Account authentication
 */
export class SheetsClient {
  protected spreadsheetId: string;
  protected sheetName: string;
  protected credentials: GoogleServiceAccountCredentials;
  protected accessToken: string | null = null;
  protected tokenExpiry: number | null = null;

  constructor(config: SheetsClientConfig) {
    this.spreadsheetId = config.spreadsheetId ?? process.env.GOOGLE_SPREADSHEET_ID ?? '';
    this.sheetName = config.sheetName ?? 'Feedback';

    // Service Account credentials
    const credentials = config.credentials ?? process.env.GOOGLE_SERVICE_ACCOUNT;

    if (!credentials) {
      throw new Error(
        'Google credentials missing. Set GOOGLE_SERVICE_ACCOUNT environment variable.'
      );
    }

    this.credentials =
      typeof credentials === 'string'
        ? (JSON.parse(credentials) as GoogleServiceAccountCredentials)
        : credentials;

    if (!this.spreadsheetId) {
      throw new Error(
        'Spreadsheet ID missing. Set GOOGLE_SPREADSHEET_ID environment variable.'
      );
    }
  }

  /**
   * Get access token using Service Account JWT
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const { client_email, private_key } = this.credentials;

    // Create JWT
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const jwt = await this.createJWT(header, payload, private_key);

    // Exchange JWT for access token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early

    return this.accessToken;
  }

  /**
   * Create JWT for Service Account auth
   */
  private async createJWT(
    header: { alg: string; typ: string },
    payload: Record<string, unknown>,
    privateKey: string
  ): Promise<string> {
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerB64}.${payloadB64}`;

    // Use Node.js crypto for signing
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    sign.end();

    const signature = sign.sign({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    });

    const signatureB64 = this.base64UrlEncode(signature);

    return `${signatureInput}.${signatureB64}`;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(data: string | Buffer): string {
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Make authenticated request to Sheets API
   */
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const token = await this.getAccessToken();
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

    const response = await fetch(`${baseUrl}/${this.spreadsheetId}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sheets API error (${response.status}): ${error}`);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  }

  /**
   * Append row to sheet
   */
  async appendRow(values: (string | number | boolean)[], sheetName?: string): Promise<SheetsAppendResponse | null> {
    const range = `${sheetName ?? this.sheetName}!A:Z`;

    return this.request<SheetsAppendResponse>(
      `/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        body: JSON.stringify({
          values: [values],
          majorDimension: 'ROWS',
        }),
      }
    );
  }

  /**
   * Get sheet values
   */
  async getValues(range: string): Promise<SheetsValuesResponse> {
    const result = await this.request<SheetsValuesResponse>(
      `/values/${encodeURIComponent(range)}`
    );
    return result ?? { range, majorDimension: 'ROWS', values: [] };
  }

  /**
   * Update specific cell/range
   */
  async updateValues(
    range: string,
    values: (string | number | boolean)[][]
  ): Promise<SheetsUpdateResponse | null> {
    return this.request<SheetsUpdateResponse>(
      `/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({
          values,
          majorDimension: 'ROWS',
        }),
      }
    );
  }

  /**
   * Check if headers exist, create if not
   */
  async ensureHeaders(headers: string[]): Promise<EnsureHeadersResult> {
    try {
      const existing = await this.getValues(`${this.sheetName}!1:1`);

      if (!existing.values || existing.values.length === 0) {
        // No headers, add them
        await this.updateValues(`${this.sheetName}!A1`, [headers]);
        return { created: true };
      }

      return { created: false, existing: existing.values[0] };
    } catch {
      // Sheet might not exist, try to create headers anyway
      try {
        await this.updateValues(`${this.sheetName}!A1`, [headers]);
        return { created: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        throw new Error(`Failed to set up headers: ${message}`);
      }
    }
  }

  /**
   * Find row by feedback ID
   */
  async findRowByFeedbackId(feedbackId: string, idColumn = 'B'): Promise<number | null> {
    const values = await this.getValues(`${this.sheetName}!${idColumn}:${idColumn}`);

    if (!values.values) return null;

    const rowIndex = values.values.findIndex((row) => row[0] === feedbackId);
    return rowIndex >= 0 ? rowIndex + 1 : null; // 1-indexed
  }

  /**
   * Update feedback status in sheet
   */
  async updateStatus(
    feedbackId: string,
    newStatus: string,
    statusColumn = 'E'
  ): Promise<StatusUpdateResult> {
    const rowNumber = await this.findRowByFeedbackId(feedbackId);

    if (!rowNumber) {
      throw new Error(`Feedback ${feedbackId} not found in sheet`);
    }

    await this.updateValues(`${this.sheetName}!${statusColumn}${rowNumber}`, [[newStatus]]);

    return { success: true, row: rowNumber };
  }
}

// ============================================
// OAUTH CLIENT (User Authentication)
// ============================================

/**
 * Google Sheets API client using OAuth 2.0 authentication
 */
export class SheetsOAuthClient extends SheetsClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private getStoredTokens?: () => Promise<OAuthStoredTokens | null>;
  private saveTokens?: (tokens: OAuthStoredTokens) => Promise<void>;

  constructor(config: SheetsOAuthClientConfig) {
    // Pass empty credentials to parent - we'll override getAccessToken
    super({
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      credentials: { client_email: '', private_key: '' } as unknown as GoogleServiceAccountCredentials,
    });

    this.clientId = config.clientId ?? process.env.GOOGLE_CLIENT_ID ?? '';
    this.clientSecret = config.clientSecret ?? process.env.GOOGLE_CLIENT_SECRET ?? '';
    this.redirectUri = config.redirectUri ?? process.env.GOOGLE_REDIRECT_URI ?? '';

    // Token storage (user must provide storage mechanism)
    this.getStoredTokens = config.getStoredTokens;
    this.saveTokens = config.saveTokens;

    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'OAuth configuration missing. Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET'
      );
    }
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state = ''): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<TokenExchangeResult> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = (await response.json()) as TokenExchangeResult;

    // Save tokens
    if (this.saveTokens && tokens.refresh_token) {
      await this.saveTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry: Date.now() + tokens.expires_in * 1000,
      });
    }

    return tokens;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };

    // Save new access token
    if (this.saveTokens && this.getStoredTokens) {
      const stored = await this.getStoredTokens();
      if (stored) {
        await this.saveTokens({
          access_token: data.access_token,
          refresh_token: stored.refresh_token, // Keep existing refresh token
          expiry: Date.now() + data.expires_in * 1000,
        });
      }
    }

    return data.access_token;
  }

  /**
   * Override getAccessToken to use OAuth
   */
  async getAccessToken(): Promise<string> {
    if (!this.getStoredTokens) {
      throw new Error(
        'Token storage not configured. Provide getStoredTokens and saveTokens functions.'
      );
    }

    const stored = await this.getStoredTokens();

    if (!stored?.refresh_token) {
      throw new Error('Not authenticated. User needs to complete OAuth flow.');
    }

    // Check if access token is still valid
    if (stored.access_token && stored.expiry && Date.now() < stored.expiry - 60000) {
      return stored.access_token;
    }

    // Refresh the token
    return this.refreshAccessToken(stored.refresh_token);
  }
}

// ============================================
// REQUEST HANDLERS
// ============================================

/**
 * Handle append row
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
 * Handle status update
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
 * Handle row update
 */
async function handleUpdateRow(
  client: SheetsClient,
  rowNumber: number,
  feedbackData: FeedbackData,
  config: SheetsHandlerConfig
): Promise<{ success: true; row: number }> {
  const row = feedbackToSheetRow(feedbackData, config);
  const range = `${config.sheetName ?? 'Feedback'}!A${rowNumber}`;

  await client.updateValues(range, [row]);

  return { success: true, row: rowNumber };
}

/**
 * Create Sheets handler with configuration
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
          result = { headers: getSheetHeaders(config) };
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
          result = { url: client.getAuthUrl(body.state) };
          break;

        case 'exchangeCode':
          if (!(client instanceof SheetsOAuthClient)) {
            throw new Error('OAuth not configured');
          }
          if (!body.code) {
            throw new Error('code is required for exchangeCode action');
          }
          result = await client.exchangeCode(body.code);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Send response
      if (res?.json && res?.status) {
        res.status(200).json(result);
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
        res.status(500).json(errorResponse);
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
 * Next.js App Router handler
 * Returns a function that can be directly exported as POST
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
 * Next.js Pages Router handler
 */
export function createNextPagesHandler(config: SheetsHandlerConfig = {}): SheetsHandler {
  return createSheetsHandler(config);
}

/**
 * Express middleware
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
 * Returns the Google Apps Script code that users paste into their sheet
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
// ZAPIER / WEBHOOK FORMATTERS
// ============================================

/** Zapier webhook payload for Sheets */
export interface SheetsZapierPayload {
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

/**
 * Format feedback for Zapier webhook
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

// Default export
export default createSheetsHandler;
