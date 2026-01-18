/**
 * WebSocket Message Validator
 *
 * Provides runtime validation for incoming WebSocket commands.
 * Uses TypeScript type guards for type-safe validation.
 *
 * @module websocket/validator
 */

import type {
  ClientCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  PingCommand,
  AuthenticateCommand,
  SubscriptionFilters,
} from '@feedback/api-types';

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Result of command validation
 */
export type ValidationResult<T = ClientCommand> =
  | { success: true; command: T }
  | { success: false; error: string; code: ValidationErrorCode };

/**
 * Error codes for validation failures
 */
export type ValidationErrorCode =
  | 'INVALID_JSON'
  | 'MISSING_TYPE'
  | 'UNKNOWN_COMMAND'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FIELD_TYPE';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Check if value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is an array of strings
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

/**
 * Validate SubscriptionFilters
 */
function validateFilters(filters: unknown): SubscriptionFilters | undefined {
  if (filters === undefined || filters === null) {
    return undefined;
  }

  if (!isObject(filters)) {
    return undefined;
  }

  const result: SubscriptionFilters = {};

  if ('types' in filters && isStringArray(filters.types)) {
    result.status = filters.types;
  }

  if ('statuses' in filters && isStringArray(filters.statuses)) {
    result.status = filters.statuses;
  }

  if ('priorities' in filters && isStringArray(filters.priorities)) {
    result.priority = filters.priorities;
  }

  if ('projectId' in filters && isString(filters.projectId)) {
    // Store project filter in tags for now
    result.tags = [filters.projectId];
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// ============================================================================
// Command Validators
// ============================================================================

/**
 * Validate a subscribe command
 */
function validateSubscribeCommand(data: Record<string, unknown>): ValidationResult<SubscribeCommand> {
  if (!('channel' in data) || !isString(data.channel)) {
    return {
      success: false,
      error: 'Subscribe command requires a "channel" string field',
      code: 'MISSING_REQUIRED_FIELD',
    };
  }

  const command: SubscribeCommand = {
    type: 'subscribe',
    channel: data.channel,
  };

  if ('filters' in data) {
    const filters = validateFilters(data.filters);
    if (filters) {
      command.filters = filters;
    }
  }

  return { success: true, command };
}

/**
 * Validate an unsubscribe command
 */
function validateUnsubscribeCommand(data: Record<string, unknown>): ValidationResult<UnsubscribeCommand> {
  if (!('channel' in data) || !isString(data.channel)) {
    return {
      success: false,
      error: 'Unsubscribe command requires a "channel" string field',
      code: 'MISSING_REQUIRED_FIELD',
    };
  }

  return {
    success: true,
    command: {
      type: 'unsubscribe',
      channel: data.channel,
    },
  };
}

/**
 * Validate a ping command
 */
function validatePingCommand(_data: Record<string, unknown>): ValidationResult<PingCommand> {
  // Ping command has no required fields
  return {
    success: true,
    command: { type: 'ping' },
  };
}

/**
 * Validate an authenticate command
 */
function validateAuthenticateCommand(data: Record<string, unknown>): ValidationResult<AuthenticateCommand> {
  // Check for either token or apiKey
  const token = 'token' in data && isString(data.token) ? data.token : undefined;
  const apiKey = 'apiKey' in data && isString(data.apiKey) ? data.apiKey : undefined;

  if (!token && !apiKey) {
    return {
      success: false,
      error: 'Authenticate command requires either "token" or "apiKey" string field',
      code: 'MISSING_REQUIRED_FIELD',
    };
  }

  return {
    success: true,
    command: {
      type: 'authenticate',
      token: token ?? apiKey ?? '',
    },
  };
}

// ============================================================================
// Main Validation Functions
// ============================================================================

/**
 * Parse and validate a WebSocket command from raw string data.
 *
 * @param data - Raw message string (expected to be JSON)
 * @returns Validation result with parsed command or error
 *
 * @example
 * ```typescript
 * const result = parseAndValidateCommand('{"type":"subscribe","channel":"feedback"}');
 * if (result.success) {
 *   // result.command is typed as ClientCommand
 *   handleCommand(result.command);
 * } else {
 *   // result.error contains the error message
 *   console.error(result.error);
 * }
 * ```
 */
export function parseAndValidateCommand(data: string): ValidationResult {
  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`,
      code: 'INVALID_JSON',
    };
  }

  // Check if it's an object
  if (!isObject(parsed)) {
    return {
      success: false,
      error: 'Message must be a JSON object',
      code: 'INVALID_JSON',
    };
  }

  // Check for type field
  if (!('type' in parsed) || !isString(parsed.type)) {
    return {
      success: false,
      error: 'Message must have a "type" string field',
      code: 'MISSING_TYPE',
    };
  }

  // Route to specific validators
  switch (parsed.type) {
    case 'subscribe':
      return validateSubscribeCommand(parsed);

    case 'unsubscribe':
      return validateUnsubscribeCommand(parsed);

    case 'ping':
      return validatePingCommand(parsed);

    case 'authenticate':
      return validateAuthenticateCommand(parsed);

    default:
      return {
        success: false,
        error: `Unknown command type: "${parsed.type}"`,
        code: 'UNKNOWN_COMMAND',
      };
  }
}

/**
 * Validate a pre-parsed object as a ClientCommand
 *
 * @param data - Pre-parsed object to validate
 * @returns Validation result with typed command or error
 */
export function validateCommand(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return {
      success: false,
      error: 'Command must be an object',
      code: 'INVALID_JSON',
    };
  }

  if (!('type' in data) || !isString(data.type)) {
    return {
      success: false,
      error: 'Command must have a "type" string field',
      code: 'MISSING_TYPE',
    };
  }

  switch (data.type) {
    case 'subscribe':
      return validateSubscribeCommand(data);
    case 'unsubscribe':
      return validateUnsubscribeCommand(data);
    case 'ping':
      return validatePingCommand(data);
    case 'authenticate':
      return validateAuthenticateCommand(data);
    default:
      return {
        success: false,
        error: `Unknown command type: "${data.type}"`,
        code: 'UNKNOWN_COMMAND',
      };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a command is of a specific type
 */
export function isCommandOfType<T extends ClientCommand['type']>(
  command: ClientCommand,
  type: T
): command is Extract<ClientCommand, { type: T }> {
  return command.type === type;
}

/**
 * Get a human-readable description of a validation error
 */
export function getErrorDescription(code: ValidationErrorCode): string {
  switch (code) {
    case 'INVALID_JSON':
      return 'The message is not valid JSON';
    case 'MISSING_TYPE':
      return 'The message is missing the required "type" field';
    case 'UNKNOWN_COMMAND':
      return 'The command type is not recognized';
    case 'MISSING_REQUIRED_FIELD':
      return 'The command is missing a required field';
    case 'INVALID_FIELD_TYPE':
      return 'A field has an invalid type';
    default:
      return 'Unknown validation error';
  }
}
