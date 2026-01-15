/**
 * Google Sheets API Client
 *
 * Handles authentication and API requests to Google Sheets.
 *
 * @module integrations/sheets/SheetsClient
 */

import type {
  SheetsClientConfig,
  SheetsOAuthClientConfig,
  GoogleServiceAccountCredentials,
  OAuthStoredTokens,
  SheetsValuesResponse,
  SheetsUpdateResponse,
  SheetsAppendResponse,
  EnsureHeadersResult,
  StatusUpdateResult,
  TokenExchangeResult,
} from './sheetsTypes.js';

// ============================================
// SERVICE ACCOUNT CLIENT
// ============================================

/**
 * Google Sheets API client using Service Account authentication.
 *
 * @example
 * ```typescript
 * const client = new SheetsClient({
 *   spreadsheetId: 'abc123...',
 *   sheetName: 'Feedback',
 *   credentials: process.env.GOOGLE_SERVICE_ACCOUNT
 * });
 *
 * await client.appendRow(['value1', 'value2']);
 * ```
 */
export class SheetsClient {
  protected spreadsheetId: string;
  protected sheetName: string;
  protected credentials: GoogleServiceAccountCredentials;
  protected accessToken: string | null = null;
  protected tokenExpiry: number | null = null;

  /**
   * Create a new Sheets client with Service Account authentication.
   *
   * @param config - Client configuration
   * @throws Error if required configuration is missing
   */
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
   * Get access token using Service Account JWT.
   *
   * @returns Access token
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
   * Create JWT for Service Account auth.
   *
   * @param header - JWT header
   * @param payload - JWT payload
   * @param privateKey - RSA private key
   * @returns Signed JWT string
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
   * Base64 URL encode.
   *
   * @param data - Data to encode
   * @returns Base64 URL encoded string
   */
  private base64UrlEncode(data: string | Buffer): string {
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Make authenticated request to Sheets API.
   *
   * @param endpoint - API endpoint
   * @param options - Fetch options
   * @returns Response data or null
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
   * Append row to sheet.
   *
   * @param values - Row values to append
   * @param sheetName - Optional sheet name override
   * @returns Append response
   */
  async appendRow(
    values: (string | number | boolean)[],
    sheetName?: string
  ): Promise<SheetsAppendResponse | null> {
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
   * Get sheet values.
   *
   * @param range - Range in A1 notation
   * @returns Values response
   */
  async getValues(range: string): Promise<SheetsValuesResponse> {
    const result = await this.request<SheetsValuesResponse>(
      `/values/${encodeURIComponent(range)}`
    );
    return result ?? { range, majorDimension: 'ROWS', values: [] };
  }

  /**
   * Update specific cell/range.
   *
   * @param range - Range in A1 notation
   * @param values - Values to write
   * @returns Update response
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
   * Check if headers exist, create if not.
   *
   * @param headers - Header values
   * @returns Whether headers were created
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
   * Find row by feedback ID.
   *
   * @param feedbackId - Feedback ID to search for
   * @param idColumn - Column containing IDs (default: B)
   * @returns Row number (1-indexed) or null
   */
  async findRowByFeedbackId(feedbackId: string, idColumn = 'B'): Promise<number | null> {
    const values = await this.getValues(`${this.sheetName}!${idColumn}:${idColumn}`);

    if (!values.values) return null;

    const rowIndex = values.values.findIndex((row) => row[0] === feedbackId);
    return rowIndex >= 0 ? rowIndex + 1 : null; // 1-indexed
  }

  /**
   * Update feedback status in sheet.
   *
   * @param feedbackId - Feedback ID
   * @param newStatus - New status value
   * @param statusColumn - Column containing status (default: E)
   * @returns Update result
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

  /**
   * Get sheet name.
   *
   * @returns Sheet name
   */
  getSheetName(): string {
    return this.sheetName;
  }

  /**
   * Get spreadsheet ID.
   *
   * @returns Spreadsheet ID
   */
  getSpreadsheetId(): string {
    return this.spreadsheetId;
  }
}

// ============================================
// OAUTH CLIENT
// ============================================

/**
 * Google Sheets API client using OAuth 2.0 authentication.
 *
 * Used for user-based authentication where users grant access to their sheets.
 *
 * @example
 * ```typescript
 * const client = new SheetsOAuthClient({
 *   oauth: true,
 *   spreadsheetId: 'abc123...',
 *   clientId: 'xxx.apps.googleusercontent.com',
 *   clientSecret: 'xxx',
 *   getStoredTokens: async () => db.getTokens(),
 *   saveTokens: async (tokens) => db.saveTokens(tokens)
 * });
 *
 * // First time: get auth URL
 * const authUrl = client.getAuthUrl();
 *
 * // After user authorizes: exchange code
 * await client.exchangeCode(code);
 *
 * // Now can make API calls
 * await client.appendRow(['value1', 'value2']);
 * ```
 */
export class SheetsOAuthClient extends SheetsClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private getStoredTokens?: (() => Promise<OAuthStoredTokens | null>) | undefined;
  private saveTokens?: ((tokens: OAuthStoredTokens) => Promise<void>) | undefined;

  /**
   * Create a new Sheets client with OAuth authentication.
   *
   * @param config - OAuth client configuration
   * @throws Error if required configuration is missing
   */
  constructor(config: SheetsOAuthClientConfig) {
    // Pass empty credentials to parent - we'll override getAccessToken
    super({
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      credentials: {
        client_email: '',
        private_key: '',
      } as unknown as GoogleServiceAccountCredentials,
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
   * Get OAuth authorization URL.
   *
   * @param state - Optional state parameter for CSRF protection
   * @returns Authorization URL
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
   * Exchange authorization code for tokens.
   *
   * @param code - Authorization code from OAuth callback
   * @returns Token exchange result
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
   * Refresh access token using refresh token.
   *
   * @param refreshToken - Refresh token
   * @returns New access token
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
   * Override getAccessToken to use OAuth.
   *
   * @returns Access token
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
