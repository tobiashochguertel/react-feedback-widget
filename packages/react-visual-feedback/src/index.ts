/**
 * react-visual-feedback
 *
 * A comprehensive React library for collecting visual feedback with
 * screenshot annotation, screen recording, and integration support.
 *
 * @packageDocumentation
 */

// =============================================================================
// CORE COMPONENTS
// =============================================================================

/**
 * Main feedback provider component that wraps your application
 * and provides feedback context to all child components.
 */
export { FeedbackProvider } from './FeedbackProvider';

/**
 * React hook to access feedback functionality from any component.
 * Provides methods for capturing screenshots, recording, and submitting feedback.
 */
export { useFeedback } from './FeedbackProvider';

/**
 * Modal component for composing and submitting feedback.
 * Includes annotation tools, screen recording, and form fields.
 */
export { FeedbackModal } from './FeedbackModal';

/**
 * Dashboard component for viewing and managing submitted feedback.
 * Includes filtering, status updates, and session replay.
 */
export { FeedbackDashboard, saveFeedbackToLocalStorage, DEFAULT_STATUSES } from './FeedbackDashboard';

/**
 * Floating action button or custom trigger for opening feedback modal.
 */
export { FeedbackTrigger } from './FeedbackTrigger';

/**
 * Canvas overlay component for screenshot annotation.
 * Provides drawing, highlighting, and text tools.
 */
export { CanvasOverlay } from './CanvasOverlay';

/**
 * Modal for displaying update changelogs and release notes.
 */
export { UpdatesModal } from './UpdatesModal';

/**
 * Component for managing offline feedback submission queue.
 * Automatically retries failed submissions when connection is restored.
 */
export { SubmissionQueue } from './SubmissionQueue';

/**
 * Recording overlay component displayed during screen capture.
 */
export { RecordingOverlay } from './RecordingOverlay';

/**
 * Component for replaying recorded feedback sessions.
 */
export { SessionReplay } from './SessionReplay';

/**
 * Toast component for displaying error messages.
 */
export { default as ErrorToast, showToast, showError, showSuccess, showInfo } from './ErrorToast';

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Status badge component for displaying feedback status.
 */
export {
  StatusBadge,
  StatusBadgeStyled,
  getIconComponent,
  normalizeStatusKey,
  getStatusData,
} from './components/StatusBadge';

/**
 * Dropdown component for selecting feedback status.
 */
export { StatusDropdown } from './components/StatusDropdown';

/**
 * Component for displaying individual log entries.
 */
export { LogEntry } from './components/LogEntry';

// =============================================================================
// THEME & UTILITIES
// =============================================================================

/**
 * Theme utilities for customizing component appearance.
 * Supports light and dark modes with custom color schemes.
 */
export { getTheme, lightTheme, darkTheme } from './theme';

/**
 * Utility functions for common operations.
 */
export {
  generateId,
  formatPath,
  formatTimestamp,
  formatFileSize,
  downloadBlob,
  dataURLToBlob,
  getViewportInfo,
  getElementSelector,
  getElementInfo,
  getReactComponentInfo,
  captureElementScreenshot,
} from './utils';

// =============================================================================
// RECORDING UTILITIES
// =============================================================================

/**
 * Recording utilities for screen capture and video handling.
 * The SessionRecorder class provides full recording capabilities.
 */
export { default as sessionRecorder, SessionRecorder, type RecordingResult } from './recorder';

// =============================================================================
// CLIENT-SIDE INTEGRATIONS
// =============================================================================

/**
 * Client-side integration manager for sending feedback to external services.
 * Use this in browser/client contexts.
 */
export { IntegrationClient } from './integrations/index';

/**
 * React hook for managing integrations within components.
 */
export { useIntegrations } from './integrations/index';

/**
 * Integration constants and defaults.
 */
export {
  DEFAULT_SHEET_COLUMNS,
  DEFAULT_JIRA_FIELDS,
  DEFAULT_JIRA_STATUS_MAPPING,
  INTEGRATION_TYPES,
  getSheetHeaders,
} from './integrations/config';

// =============================================================================
// SERVER-SIDE INTEGRATIONS (for API routes/handlers)
// =============================================================================

/**
 * Jira Cloud integration client.
 * Use this in server-side API routes to create issues and handle webhooks.
 *
 * @example
 * ```typescript
 * // In Next.js API route
 * import { createJiraHandler } from 'react-visual-feedback/integrations';
 *
 * export const POST = createNextAppHandler(createJiraHandler({
 *   host: process.env.JIRA_HOST!,
 *   email: process.env.JIRA_EMAIL!,
 *   apiToken: process.env.JIRA_API_TOKEN!,
 *   projectKey: process.env.JIRA_PROJECT_KEY!,
 * }));
 * ```
 */
export {
  JiraClient,
  createJiraHandler,
  createNextAppHandler as createJiraNextAppHandler,
  createNextPagesHandler as createJiraNextPagesHandler,
  createExpressMiddleware as createJiraExpressMiddleware,
  formatForJiraAutomation,
  formatForZapier as formatJiraForZapier,
  formatEventLogs,
} from './integrations/jira';

/**
 * Google Sheets integration client.
 * Use this in server-side API routes to append feedback to sheets.
 *
 * @example
 * ```typescript
 * // In Next.js API route
 * import { createSheetsHandler } from 'react-visual-feedback/integrations';
 *
 * export const POST = createSheetsHandler({
 *   spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
 *   credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!),
 * });
 * ```
 */
export {
  SheetsClient,
  SheetsOAuthClient,
  createSheetsHandler,
  createNextAppHandler as createSheetsNextAppHandler,
  createNextPagesHandler as createSheetsNextPagesHandler,
  createExpressMiddleware as createSheetsExpressMiddleware,
  getAppsScriptTemplate,
  formatForZapier as formatSheetsForZapier,
} from './integrations/sheets';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Type definitions for TypeScript users.
 * All types are re-exported for convenience.
 */
export type {
  // Core feedback types
  FeedbackType,
  FeedbackData,
  FeedbackAttachment,

  // Element types
  ElementInfo,
  ElementPosition,
  ElementStyles,
  ViewportInfo,
  ReactComponentInfo,
  ReactComponentSourceInfo,

  // Component props
  FeedbackProviderProps,
  FeedbackModalProps,
  FeedbackDashboardProps,
  FeedbackTriggerProps,
  CanvasOverlayProps,
  UpdatesModalProps,
  SubmissionQueueProps,
  RecordingOverlayProps,
  SessionReplayProps,
  ErrorToastProps,
  StatusBadgeProps,
  StatusDropdownProps,
  LogEntryProps,

  // Context types
  FeedbackContextValue,
  FeedbackState,
  FeedbackAction,
  HighlightStyle,
  TooltipStyle,

  // Theme types
  Theme,
  ThemeColors,
  ThemeMode,

  // Integration types
  IntegrationsConfig,
  JiraConfig,
  SheetsConfig,
  JiraIntegrationType,
  SheetsIntegrationType,
  IntegrationResult,
  IntegrationResults,
  IntegrationStatus,
  IntegrationStatusMap,
  IntegrationClientConfig,
  IntegrationClientInterface,
  UseIntegrationsResult,

  // Recording types
  RecorderStatus,
  SessionRecorderInterface,

  // Event types
  EventLog,
  EventLogType,
  ConsoleEventLog,
  NetworkEventLog,
  StorageEventLog,
  IndexedDBEventLog,

  // Status types
  StatusConfig,
  StatusKey,
  StatusConfigs,
  StatusChangePayload,

  // Submission queue types
  SubmissionStatus,
  QueuedSubmission,

  // Update/changelog types
  UpdateItem,

  // Utility function types
  GetElementSelectorFn,
  GetElementInfoFn,
  GetReactComponentInfoFn,
  CaptureElementScreenshotFn,
  FormatPathFn,
  GenerateIdFn,

  // Constants types
  IntegrationTypesConfig,
  SheetColumn,
  JiraField,
  DefaultJiraStatusMapping,
} from './types/index';

// =============================================================================
// VERSION
// =============================================================================

/**
 * Package version for debugging and compatibility checks.
 */
export const VERSION = '1.0.0';
