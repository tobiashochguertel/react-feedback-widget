/**
 * Google Sheets Integration Validation
 *
 * Validation functions for Sheets configuration and data.
 *
 * @module integrations/sheets/sheetsValidation
 */

import type {
  SheetsClientConfig,
  SheetsOAuthClientConfig,
  SheetsHandlerConfig,
  GoogleServiceAccountCredentials,
} from './sheetsTypes.js';
import type { ValidationResult, ValidationError } from '../types.js';

/**
 * Validate Sheets client configuration (Service Account).
 *
 * @param config - Configuration to validate
 * @returns Validation result with any errors
 */
export function validateSheetsClientConfig(
  config: Partial<SheetsClientConfig> = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check spreadsheet ID
  const spreadsheetId = config.spreadsheetId ?? process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    errors.push({
      field: 'spreadsheetId',
      message: 'Spreadsheet ID is required. Set GOOGLE_SPREADSHEET_ID or provide spreadsheetId.',
    });
  }

  // Check credentials
  const credentials = config.credentials ?? process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!credentials) {
    errors.push({
      field: 'credentials',
      message: 'Service account credentials are required. Set GOOGLE_SERVICE_ACCOUNT or provide credentials.',
    });
  } else {
    // Validate credentials structure
    try {
      const creds: GoogleServiceAccountCredentials =
        typeof credentials === 'string' ? JSON.parse(credentials) : credentials;

      if (!creds.client_email) {
        errors.push({
          field: 'credentials.client_email',
          message: 'Credentials missing client_email.',
        });
      }
      if (!creds.private_key) {
        errors.push({
          field: 'credentials.private_key',
          message: 'Credentials missing private_key.',
        });
      }
      if (creds.type !== 'service_account') {
        errors.push({
          field: 'credentials.type',
          message: 'Credentials must be of type "service_account".',
        });
      }
    } catch {
      errors.push({
        field: 'credentials',
        message: 'Invalid credentials JSON format.',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Sheets OAuth client configuration.
 *
 * @param config - OAuth configuration to validate
 * @returns Validation result with any errors
 */
export function validateSheetsOAuthConfig(
  config: Partial<SheetsOAuthClientConfig> = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check spreadsheet ID
  const spreadsheetId = config.spreadsheetId ?? process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    errors.push({
      field: 'spreadsheetId',
      message: 'Spreadsheet ID is required. Set GOOGLE_SPREADSHEET_ID or provide spreadsheetId.',
    });
  }

  // Check OAuth credentials
  const clientId = config.clientId ?? process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    errors.push({
      field: 'clientId',
      message: 'OAuth client ID is required. Set GOOGLE_CLIENT_ID or provide clientId.',
    });
  }

  const clientSecret = config.clientSecret ?? process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    errors.push({
      field: 'clientSecret',
      message: 'OAuth client secret is required. Set GOOGLE_CLIENT_SECRET or provide clientSecret.',
    });
  }

  // Check token storage functions
  if (!config.getStoredTokens) {
    errors.push({
      field: 'getStoredTokens',
      message: 'getStoredTokens function is required for OAuth.',
    });
  }

  if (!config.saveTokens) {
    errors.push({
      field: 'saveTokens',
      message: 'saveTokens function is required for OAuth.',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Sheets handler configuration (auto-detect type).
 *
 * @param config - Configuration to validate
 * @returns Validation result with any errors
 */
export function validateSheetsHandlerConfig(
  config: Partial<SheetsHandlerConfig> = {}
): ValidationResult {
  const isOAuth = 'oauth' in config && config.oauth === true;

  if (isOAuth) {
    return validateSheetsOAuthConfig(config as SheetsOAuthClientConfig);
  }

  return validateSheetsClientConfig(config as SheetsClientConfig);
}

/**
 * Check if Sheets integration is configured.
 *
 * Returns true if minimum configuration is present.
 *
 * @returns Whether Sheets is configured
 */
export function isSheetsConfigured(): boolean {
  const hasSpreadsheetId = Boolean(process.env.GOOGLE_SPREADSHEET_ID);
  const hasServiceAccount = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT);
  const hasOAuth = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return hasSpreadsheetId && (hasServiceAccount || hasOAuth);
}

/**
 * Type guard to check if config is OAuth config.
 *
 * @param config - Configuration to check
 * @returns Whether config is OAuth configuration
 */
export function isOAuthConfig(
  config: SheetsHandlerConfig
): config is SheetsOAuthClientConfig {
  return 'oauth' in config && config.oauth === true;
}

/**
 * Validate spreadsheet ID format.
 *
 * @param spreadsheetId - Spreadsheet ID to validate
 * @returns Whether the ID appears valid
 */
export function isValidSpreadsheetId(spreadsheetId: string): boolean {
  // Google Spreadsheet IDs are typically 44 characters
  // and contain alphanumeric characters, underscores, and hyphens
  return /^[a-zA-Z0-9_-]{20,50}$/.test(spreadsheetId);
}

/**
 * Extract spreadsheet ID from URL.
 *
 * @param url - Google Sheets URL
 * @returns Extracted spreadsheet ID or null
 *
 * @example
 * ```typescript
 * extractSpreadsheetId('https://docs.google.com/spreadsheets/d/abc123/edit');
 * // Returns: 'abc123'
 * ```
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
