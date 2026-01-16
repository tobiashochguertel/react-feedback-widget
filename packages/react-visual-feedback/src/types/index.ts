/**
 * Core type definitions for react-visual-feedback
 *
 * Following structural typing principles:
 * - Types are compatible based on shape (properties and methods)
 * - Named types for return values, parameters, and domain concepts
 * - Consistent property names across interfaces
 */

import type { ReactNode, CSSProperties, ComponentType } from 'react';

// ============================================
// THEME TYPES
// ============================================

/**
 * Theme mode for the feedback widget.
 * Controls the color scheme of all components.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Color palette for a theme.
 * Contains all color tokens used by the feedback components.
 */
export interface ThemeColors {
  overlayBg: string;
  backdropBg: string;
  modalBg: string;
  modalBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderFocus: string;
  inputBg: string;
  inputDisabledBg: string;
  btnCancelBg: string;
  btnCancelHover: string;
  btnCancelText: string;
  btnPrimaryBg: string;
  btnPrimaryHover: string;
  btnPrimaryText: string;
  btnDisabledBg: string;
  highlightBorder: string;
  highlightBg: string;
  highlightShadow: string;
  tooltipBg: string;
  tooltipText: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  screenshotBorder: string;
  screenshotBg: string;
  shadow: string;
  closeHoverBg: string;
  hoverBg: string;
  cardBg: string;
  headerBg: string;
  contentBg: string;
}

/**
 * Complete theme configuration.
 * Contains the mode and all color tokens.
 *
 * @example
 * ```tsx
 * const theme: Theme = {
 *   mode: 'dark',
 *   colors: darkTheme.colors
 * };
 * ```
 */
export interface Theme {
  /** Current theme mode */
  mode: ThemeMode;
  /** Color palette for this theme */
  colors: ThemeColors;
}

// ============================================
// POSITION & ELEMENT TYPES
// ============================================

/**
 * Position and dimensions of a DOM element.
 * Used for element highlighting and tooltip positioning.
 */
export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computed CSS styles of an element.
 * Captured at the time of element selection.
 */
export interface ElementStyles {
  backgroundColor: string;
  color: string;
  fontSize: string;
  fontFamily: string;
}

/**
 * Information about the browser viewport.
 * Captured when feedback is submitted for context.
 */
export interface ViewportInfo {
  /** Viewport width in pixels */
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  /** Device pixel ratio for high-DPI displays */
  devicePixelRatio: number;
}

/**
 * Source file information for a React component.
 * Available in development mode with source maps.
 */
export interface ReactComponentSourceInfo {
  /** Path to the source file */
  fileName?: string | undefined;
  lineNumber?: number | undefined;
  /** Column number in the source file */
  columnNumber?: number | undefined;
}

/**
 * Information about a React component.
 * Extracted from React DevTools fiber data.
 */
export interface ReactComponentInfo {
  /** Display name of the component */
  componentName: string | null;
  componentStack: string[];
  props: Record<string, unknown> | null;
  /** Source file information (development only) */
  sourceFile: ReactComponentSourceInfo | null;
}

/**
 * Complete information about a selected DOM element.
 * Includes position, styles, and React component details.
 *
 * @example
 * ```tsx
 * const info: ElementInfo = {
 *   tagName: 'button',
 *   id: 'submit-btn',
 *   className: 'primary-button',
 *   textContent: 'Submit',
 *   selector: 'button#submit-btn',
 *   position: { x: 100, y: 200, width: 120, height: 40 },
 *   styles: { backgroundColor: '#3b82f6', color: '#fff', ... }
 * };
 * ```
 */
export interface ElementInfo {
  /** HTML tag name (lowercase) */
  tagName: string;
  id: string | null;
  className: string | null;
  textContent: string | null;
  selector: string;
  position: ElementPosition;
  styles: ElementStyles;
  reactComponent?: ReactComponentInfo | undefined;
  componentStack?: string | undefined;
  sourceFile?: ReactComponentSourceInfo | null | undefined;
}

// ============================================
// FEEDBACK TYPES
// ============================================

/**
 * Type of feedback being submitted.
 * Used to categorize and prioritize feedback items.
 */
export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'question' | 'other';

/**
 * File attachment included with feedback.
 * Supports images, documents, and other file types.
 */
export interface FeedbackAttachment {
  /** File name */
  name: string;
  type: string;
  size: number;
  data: string | Blob;
  /** Preview URL for images */
  preview?: string | undefined;
}

/**
 * Complete feedback data structure.
 * Contains all information captured when feedback is submitted.
 *
 * @example
 * ```tsx
 * const feedback: FeedbackData = {
 *   id: 'fb-123',
 *   feedback: 'Button does not respond to clicks',
 *   type: 'bug',
 *   timestamp: '2026-01-16T12:00:00Z',
 *   url: 'https://example.com/page',
 *   userAgent: navigator.userAgent,
 *   viewport: { width: 1920, height: 1080, ... },
 *   screenshot: 'data:image/png;base64,...',
 *   status: 'new'
 * };
 * ```
 */
export interface FeedbackData {
  /** Unique identifier */
  id: string;
  feedback: string;
  type: FeedbackType;
  timestamp: string;
  url: string;
  userAgent: string;
  viewport: ViewportInfo;
  screenshot?: string | undefined;
  video?: string | undefined;
  videoBlob?: Blob | undefined;
  videoSize?: number | undefined;
  videoType?: string | undefined;
  eventLogs?: EventLog[] | undefined;
  elementInfo?: ElementInfo | undefined;
  userName?: string | undefined;
  userEmail?: string | undefined;
  attachments?: FeedbackAttachment[] | undefined;
  canvasData?: string | undefined;
  status?: string | undefined;
  comment?: string | undefined;
  /** Integration selection flags */
  selectedIntegrations?: {
    local?: boolean | undefined;
    jira?: boolean | undefined;
    sheets?: boolean | undefined;
  } | undefined;
  /** Jira issue key after creation */
  jiraKey?: string | undefined;
  /** Jira issue URL after creation */
  jiraUrl?: string | undefined;
}

/** @deprecated Use FeedbackData instead */
export type Feedback = FeedbackData;

export interface FeedbackSubmitData extends Omit<FeedbackData, 'id' | 'timestamp'> {
  id?: string | undefined;
  timestamp?: string | undefined;
}

// ============================================
// STATUS TYPES
// ============================================

/**
 * Configuration for a feedback status.
 * Defines the appearance and label of a status option.
 */
export interface StatusConfig {
  /** Optional key identifier */
  key?: string | undefined;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string | ComponentType<{ size?: number | undefined }>;
}

/**
 * Pre-defined status keys.
 * Common workflow states for feedback items.
 */
export type StatusKey =
  | 'new'
  | 'open'
  | 'inProgress'
  | 'underReview'
  | 'onHold'
  | 'resolved'
  | 'closed'
  | 'wontFix';

/**
 * Map of status keys to their configurations.
 */
export type StatusConfigs = Record<string, StatusConfig>;

/**
 * Payload for status change events.
 * Sent when a feedback item's status is updated.
 */
export interface StatusChangePayload {
  /** Feedback item ID */
  id: string;
  status: string;
  comment?: string | undefined;
}

export interface StatusData extends StatusConfig {
  key: string;
}

// ============================================
// EVENT LOG TYPES
// ============================================

/**
 * Types of events that can be captured during recording.
 */
export type EventLogType = 'console' | 'network' | 'storage' | 'indexedDB' | 'click' | 'navigation' | 'fetch' | 'xhr';

/**
 * Console log severity levels.
 */
export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

/**
 * Source of network requests.
 */
export type NetworkSource = 'fetch' | 'xhr';

/**
 * Base interface for all event log entries.
 */
export interface BaseEventLog {
  /** Type of event */
  type: EventLogType;
  /** Timestamp when event occurred */
  timestamp: number;
}

/**
 * Console log event captured during recording.
 */
export interface ConsoleEventLog extends BaseEventLog {
  type: 'console';
  /** Log severity level */
  level: ConsoleLevel;
  message: string;
}

/**
 * Network request event captured during recording.
 * Includes both fetch and XHR requests.
 */
export interface NetworkEventLog extends BaseEventLog {
  type: 'network';
  /** Source API (fetch or xhr) */
  source: NetworkSource;
  method: string;
  url: string;
  status?: number | string | undefined;
  statusText?: string | undefined;
  duration?: number | undefined;
  error?: string | undefined;
  request?: {
    headers?: string | undefined;
    body?: string | undefined;
  } | undefined;
  response?: {
    headers?: string | undefined;
    body?: string | undefined;
  } | undefined;
}

export interface StorageEventLog extends BaseEventLog {
  type: 'storage';
  storageType?: 'localStorage' | 'sessionStorage' | undefined;
  storage: 'localStorage' | 'sessionStorage';
  action: 'setItem' | 'removeItem' | 'clear';
  key?: string | undefined;
  value?: string | undefined;
}

export type IndexedDBAction = 'open' | 'add' | 'put' | 'delete' | 'clear' | 'transaction';

export interface IndexedDBEventLog extends BaseEventLog {
  type: 'indexedDB';
  action: IndexedDBAction;
  dbName: string;
  storeName?: string | undefined;
  storeNames?: string[] | undefined;
  version?: number | undefined;
  data?: string | undefined;
  mode?: string | undefined;
}

export type FetchAction = 'request' | 'response' | 'error';

export interface FetchEventLog extends BaseEventLog {
  type: 'fetch';
  action: FetchAction;
  url: string;
  method: string;
  status?: number | undefined;
  error?: string | undefined;
}

export type XHRAction = 'open' | 'send' | 'load' | 'error' | 'abort' | 'timeout' | 'request' | 'response';

export interface XHREventLog extends BaseEventLog {
  type: 'xhr';
  action: XHRAction;
  url: string;
  method: string;
  status?: number | undefined;
  error?: string | undefined;
}

export type EventLog =
  | ConsoleEventLog
  | NetworkEventLog
  | StorageEventLog
  | IndexedDBEventLog
  | FetchEventLog
  | XHREventLog;

// ============================================
// RECORDER TYPES
// ============================================

/**
 * Status of the screen recorder.
 */
export type RecorderStatus = 'idle' | 'starting' | 'recording' | 'paused' | 'stopped';

/**
 * Result of a recording session.
 * Contains the video blob and captured events.
 */
export interface RecordingResult {
  blob: Blob | null;
  events: EventLog[];
}

/**
 * Interface for the session recorder.
 * Provides methods to control screen recording.
 */
export interface SessionRecorderInterface {
  /** Current recorder status */
  status: RecorderStatus;
  events: EventLog[];
  startRecording(): Promise<boolean>;
  pauseRecording(): void;
  resumeRecording(): void;
  stopRecording(): Promise<RecordingResult>;
  cancelRecording(): void;
}

// ============================================
// INTEGRATION TYPES
// ============================================

/**
 * Jira integration types.
 * Determines how feedback is sent to Jira.
 */
export type JiraIntegrationType = 'server' | 'automation' | 'zapier' | 'jira-server' | 'jira-automation' | 'jira-zapier';

/**
 * Google Sheets integration types.
 * Determines how feedback is sent to Sheets.
 */
export type SheetsIntegrationType = 'apps-script' | 'zapier' | 'server' | 'oauth' | 'sheets-zapier' | 'google-apps-script';

export interface JiraStatusMapping {
  [key: string]: string;
}

/**
 * Configuration for Jira integration.
 * Defines how feedback is sent to Jira issues.
 *
 * @example
 * ```tsx
 * const jiraConfig: JiraConfig = {
 *   enabled: true,
 *   type: 'server',
 *   endpoint: '/api/feedback/jira',
 *   projectKey: 'PROJ'
 * };
 * ```
 */
export interface JiraConfig {
  /** Whether Jira integration is enabled */
  enabled: boolean;
  type?: JiraIntegrationType | undefined;
  endpoint?: string | undefined;
  webhookUrl?: string | undefined;
  projectKey?: string | undefined;
  issueType?: string | undefined;
  syncStatus?: boolean | undefined;
  statusMapping?: Record<string, string> | JiraStatusMapping | {
    toJira?: JiraStatusMapping | undefined;
    fromJira?: JiraStatusMapping | undefined;
  } | undefined;
  customFields?: Record<string, unknown> | undefined;
  fields?: Record<string, unknown> | undefined;
}

/**
 * Configuration for Google Sheets integration.
 * Defines how feedback is appended to a spreadsheet.
 *
 * @example
 * ```tsx
 * const sheetsConfig: SheetsConfig = {
 *   enabled: true,
 *   type: 'apps-script',
 *   deploymentUrl: 'https://script.google.com/...'
 * };
 * ```
 */
export interface SheetsConfig {
  /** Whether Sheets integration is enabled */
  enabled: boolean;
  type?: SheetsIntegrationType | undefined;
  endpoint?: string | undefined;
  deploymentUrl?: string | undefined;
  webhookUrl?: string | undefined;
  columns?: string[] | Record<string, unknown> | undefined;
  columnOrder?: string[] | undefined;
  sheetName?: string | undefined;
}

/**
 * Combined configuration for all integrations.
 */
export interface IntegrationsConfig {
  /** Jira integration settings */
  jira?: JiraConfig | undefined;
  /** Sheets integration settings */
  sheets?: SheetsConfig | undefined;
}

/**
 * Result of an integration operation.
 * Contains success status and any relevant response data.
 */
export interface IntegrationResult {
  /** Whether the operation succeeded */
  success: boolean;
  error?: string | undefined;
  issueKey?: string | undefined;
  issueUrl?: string | undefined;
  rowNumber?: number | undefined;
}

export interface IntegrationResults {
  jira: IntegrationResult | null;
  sheets: IntegrationResult | null;
}

export interface IntegrationStatus {
  loading: boolean;
  error: string | null;
  result: IntegrationResult | null;
}

export interface IntegrationStatusMap {
  jira: IntegrationStatus;
  sheets: IntegrationStatus;
}

// ============================================
// SUBMISSION QUEUE TYPES
// ============================================

/**
 * Status of a feedback submission in the queue.
 */
export type SubmissionStatus = 'pending' | 'submitting' | 'success' | 'error';

/**
 * A feedback submission in the offline queue.
 * Used for retry logic when submissions fail.
 */
export interface QueuedSubmission {
  /** Unique identifier */
  id: string;
  feedbackData: FeedbackData;
  status: SubmissionStatus;
  error?: string | undefined;
  retryCount: number;
  createdAt: string;
  exiting?: boolean | undefined;
}

/** @deprecated Use QueuedSubmission instead */
export type SubmissionQueueItem = QueuedSubmission;

// ============================================
// PROVIDER STATE TYPES
// ============================================

/**
 * CSS styles for element highlighting.
 */
export interface HighlightStyle extends CSSProperties {
  top?: number | undefined;
  left?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

/**
 * CSS styles for tooltip positioning.
 */
export interface TooltipStyle extends CSSProperties {
  top?: number | undefined;
  left?: number | undefined;
}

/**
 * Internal state of the FeedbackProvider.
 * Managed by the reducer pattern.
 */
export interface FeedbackState {
  internalIsActive: boolean;
  hoveredElement: HTMLElement | null;
  hoveredComponentInfo: ReactComponentInfo | null;
  selectedElement: HTMLElement | null;
  highlightStyle: HighlightStyle;
  tooltipStyle: TooltipStyle;
  isModalOpen: boolean;
  screenshot: string | null;
  isCapturing: boolean;
  isDashboardOpen: boolean;
  isCanvasActive: boolean;
  isRecordingActive: boolean;
  isRecording: boolean;
  isInitializing: boolean;
  isPaused: boolean;
  videoBlob: Blob | null;
  eventLogs: EventLog[];
  isManualFeedbackOpen: boolean;
  integrationStatus: IntegrationStatusMap;
  lastIntegrationResults: IntegrationResults | Partial<IntegrationResults> | null;
  submissionQueue: QueuedSubmission[];
}

// ============================================
// PROVIDER ACTION TYPES
// ============================================

/**
 * Actions dispatched to the FeedbackProvider reducer.
 * Each action type corresponds to a specific state change.
 */
export type FeedbackAction =
  | { type: 'SET_STATE'; payload: Partial<FeedbackState> }
  | { type: 'START_HOVERING'; payload: { element: HTMLElement; componentInfo: ReactComponentInfo | null; highlightStyle: HighlightStyle; tooltipStyle: TooltipStyle } }
  | { type: 'STOP_HOVERING' }
  | { type: 'START_CAPTURE'; payload: HTMLElement }
  | { type: 'COMPLETE_CAPTURE'; payload: string | null }
  | { type: 'CANCEL_CAPTURE' }
  | { type: 'OPEN_DASHBOARD' }
  | { type: 'CLOSE_DASHBOARD' }
  | { type: 'OPEN_MANUAL_FEEDBACK' }
  | { type: 'CLOSE_MANUAL_FEEDBACK' }
  | { type: 'START_RECORDING_INIT' }
  | { type: 'START_RECORDING_SUCCESS' }
  | { type: 'START_RECORDING_FAILURE' }
  | { type: 'PAUSE_RECORDING' }
  | { type: 'RESUME_RECORDING' }
  | { type: 'CANCEL_RECORDING' }
  | { type: 'STOP_RECORDING'; payload: RecordingResult }
  | { type: 'RESET_MODAL' }
  | { type: 'INTEGRATION_START'; payload: { jira?: boolean | undefined; sheets?: boolean | undefined } }
  | { type: 'INTEGRATION_SUCCESS'; payload: IntegrationResults }
  | { type: 'INTEGRATION_ERROR'; payload: Partial<IntegrationResults> }
  | { type: 'INTEGRATION_RESET' }
  | { type: 'ADD_SUBMISSION'; payload: QueuedSubmission }
  | { type: 'UPDATE_SUBMISSION'; payload: Partial<QueuedSubmission> & { id: string } }
  | { type: 'REMOVE_SUBMISSION'; payload: string };

// ============================================
// CONTEXT & HOOK TYPES
// ============================================

/**
 * Value provided by the FeedbackContext.
 * Accessed via the useFeedback hook.
 *
 * @example
 * ```tsx
 * const { isActive, setIsActive, startRecording } = useFeedback();
 * ```
 */
export interface FeedbackContextValue {
  /** Whether feedback mode is active */
  isActive: boolean;
  setIsActive: (value: boolean | ((prev: boolean) => boolean)) => void;
  isDashboardOpen?: boolean | undefined;
  setIsDashboardOpen: (value: boolean) => void;
  isRecording?: boolean | undefined;
  isPaused?: boolean | undefined;
  isInitializing?: boolean | undefined;
  startRecording: () => Promise<void>;
  pauseRecording?: (() => void) | undefined;
  resumeRecording?: (() => void) | undefined;
  stopRecording?: (() => Promise<void>) | undefined;
  cancelRecording?: (() => void) | undefined;
  openManualFeedback?: (() => void) | undefined;
  closeManualFeedback?: (() => void) | undefined;
  integrationStatus: IntegrationStatusMap;
  lastIntegrationResults?: IntegrationResults | Partial<IntegrationResults> | null | undefined;
  submissionQueue?: QueuedSubmission[] | undefined;
  retrySubmission?: ((id: string) => Promise<void>) | undefined;
  cancelSubmission?: ((id: string) => void) | undefined;
  mode?: ThemeMode | undefined;
  integrations: IntegrationsConfig | null;
  integrationClient?: unknown;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

/**
 * Props for the FeedbackProvider component.
 * Wraps your application and provides feedback context.
 *
 * @example
 * ```tsx
 * <FeedbackProvider
 *   onSubmit={handleSubmit}
 *   integrations={{ jira: { enabled: true, ... } }}
 * >
 *   <App />
 * </FeedbackProvider>
 * ```
 */
export interface FeedbackProviderProps {
  /** Child components to wrap */
  children: ReactNode;
  onSubmit: (data: FeedbackData) => Promise<unknown>;
  isActive?: boolean | undefined;
  onActiveChange?: ((active: boolean) => void) | undefined;
  dashboard?: boolean | undefined;
  dashboardData?: FeedbackData[] | undefined;
  isDeveloper?: boolean | undefined;
  isUser?: boolean | undefined;
  userName?: string | undefined;
  userEmail?: string | undefined;
  onStatusChange?: ((payload: StatusChangePayload) => void) | undefined;
  mode?: ThemeMode | undefined;
  defaultOpen?: boolean | undefined;
  integrations?: IntegrationsConfig | undefined;
  onIntegrationSuccess?: ((type: string, result: IntegrationResult) => void) | undefined;
  onIntegrationError?: ((type: string, error: string) => void) | undefined;
}

/**
 * Props for the FeedbackDashboard component.
 * Displays and manages submitted feedback items.
 */
export interface FeedbackDashboardProps {
  /** Whether the dashboard is open */
  isOpen: boolean;
  onClose: () => void;
  data?: FeedbackData[] | undefined;
  isDeveloper?: boolean | undefined;
  isUser?: boolean | undefined;
  onStatusChange?: ((payload: StatusChangePayload) => void) | undefined;
  mode?: ThemeMode | undefined;
  isLoading?: boolean | undefined;
  onRefresh?: (() => void) | undefined;
  title?: string | undefined;
  statuses?: StatusConfigs | undefined;
  acceptableStatuses?: string[] | undefined;
  showAllStatuses?: boolean | undefined;
  error?: string | undefined;
  integrations?: IntegrationsConfig | null | undefined;
}

/**
 * Props for the FeedbackModal component.
 * Modal for composing and submitting feedback.
 */
export interface FeedbackModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackData) => Promise<unknown>;
  onAsyncSubmit?: ((data: FeedbackData) => Promise<unknown>) | undefined;
  screenshot?: string | null | undefined;
  elementInfo?: ElementInfo | null | undefined;
  mode?: ThemeMode | undefined;
  isManual?: boolean | undefined;
  videoBlob?: Blob | null | undefined;
  eventLogs?: EventLog[] | undefined;
  userName?: string | undefined;
  userEmail?: string | undefined;
  integrations?: IntegrationsConfig | null | undefined;
  integrationStatus?: IntegrationStatusMap | undefined;
  onIntegrationToggle?: ((type: 'jira' | 'sheets', enabled: boolean) => void) | undefined;
}

/**
 * Props for the FeedbackTrigger component.
 * Floating button to open the feedback modal.
 */
export interface FeedbackTriggerProps {
  /** Click handler (optional, uses context by default) */
  onClick?: (() => void) | undefined;
  mode?: ThemeMode | undefined;
  style?: CSSProperties | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
}

/**
 * Props for the CanvasOverlay component.
 * Provides screenshot annotation tools.
 */
export interface CanvasOverlayProps {
  /** Whether the overlay is active */
  isActive?: boolean | undefined;
  screenshot?: string | null | undefined;
  onSave?: ((canvasData: string) => void) | undefined;
  onComplete?: ((screenshot: string | null, feedback: string) => void) | undefined;
  onCancel: () => void;
  mode?: ThemeMode | undefined;
}

/**
 * Props for the RecordingOverlay component.
 * Displays recording controls during screen capture.
 */
export interface RecordingOverlayProps {
  /** Whether currently recording */
  isRecording: boolean;
  isInitializing?: boolean | undefined;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  mode?: ThemeMode | undefined;
}

/**
 * Props for the SessionReplay component.
 * Plays back recorded sessions with event logs.
 */
export interface SessionReplayProps {
  /** Video source URL or Blob */
  videoSrc: string | Blob;
  videoBlob?: Blob | undefined;
  eventLogs?: EventLog[] | undefined;
  mode?: ThemeMode | undefined;
  showLogsButton?: boolean | undefined;
  logsPanelWidth?: string | undefined;
  defaultLogsOpen?: boolean | undefined;
  fullHeight?: boolean | undefined;
  onTimeUpdate?: ((currentTime: number, visibleLogs: EventLog[]) => void) | undefined;
  onClose?: (() => void) | undefined;
}

/**
 * Props for the UpdatesModal component.
 * Displays changelog and release notes.
 */
export interface UpdatesModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  onClose: () => void;
  updates: UpdateItem[];
  mode?: ThemeMode | undefined;
}

/**
 * An update item for the changelog.
 */
export interface UpdateItem {
  /** Unique identifier */
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'fix' | 'improvement';
  date: string;
}

/**
 * Props for the SubmissionQueue component.
 * Displays pending feedback submissions.
 */
export interface SubmissionQueueProps {
  /** List of queued submissions */
  submissions: QueuedSubmission[];
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  mode?: ThemeMode | undefined;
}

/**
 * Props for the ErrorToast component.
 * Displays notification messages.
 */
export interface ErrorToastProps {
  /** Message to display */
  message: string;
  type?: 'error' | 'success' | 'info' | undefined;
  duration?: number | undefined;
  onClose?: (() => void) | undefined;
}

/**
 * Props for the StatusBadge component.
 * Displays a status indicator with icon and label.
 */
export interface StatusBadgeProps {
  /** Current status key */
  status: string;
  /** Custom status configurations */
  statuses?: StatusConfigs | undefined;
}

/**
 * Props for the StatusDropdown component.
 * Allows selecting a new status.
 */
export interface StatusDropdownProps {
  /** Currently selected status */
  currentStatus: string;
  statuses: StatusConfigs;
  onChange: (status: string) => void;
  disabled?: boolean | undefined;
  mode?: ThemeMode | undefined;
}

/**
 * Props for the LogEntry component.
 * Displays a single event log entry.
 */
export interface LogEntryProps {
  /** The event log to display */
  log: EventLog;
  mode?: ThemeMode | undefined;
}

// ============================================
// INTEGRATION CLIENT TYPES
// ============================================

/**
 * Configuration for the IntegrationClient.
 * Used to initialize the client with integration settings.
 */
export interface IntegrationClientConfig {
  /** Jira integration configuration */
  jira?: JiraConfig | undefined;
  sheets?: SheetsConfig | undefined;
  onSuccess?: ((type: string, result: IntegrationResult) => void) | undefined;
  onError?: ((type: string, error: string) => void) | undefined;
}

/**
 * Interface for the integration client.
 * Provides methods to send feedback to external services.
 */
export interface IntegrationClientInterface {
  /**
   * Send feedback to configured integrations.
   * @param feedbackData - The feedback data to send
   * @param options - Which integrations to send to
   */
  sendFeedback(
    feedbackData: FeedbackData,
    options?: { jira?: boolean | undefined; sheets?: boolean | undefined }
  ): Promise<IntegrationResults>;
  sendToJira(feedbackData: FeedbackData): Promise<IntegrationResult>;
  sendToSheets(feedbackData: FeedbackData): Promise<IntegrationResult>;
  updateJiraStatus(issueKey: string, status: string, comment?: string): Promise<IntegrationResult>;
}

// ============================================
// UTILITY FUNCTION TYPES
// ============================================

/** Function to get a CSS selector for an element */
export type GetElementSelectorFn = (element: Element) => string;

/** Function to get complete information about an element */
export type GetElementInfoFn = (element: HTMLElement) => ElementInfo;

/** Function to get React component information for an element */
export type GetReactComponentInfoFn = (element: HTMLElement) => ReactComponentInfo | null;

/** Function to capture a screenshot of an element */
export type CaptureElementScreenshotFn = (element: HTMLElement, scale?: number) => Promise<string>;

/** Function to format a file path for display */
export type FormatPathFn = (path: string) => string;

/** Function to generate a unique ID */
export type GenerateIdFn = () => string;

// ============================================
// HOOK RETURN TYPES
// ============================================

/**
 * Return type of the useIntegrations hook.
 * Provides integration client and helper methods.
 */
export interface UseIntegrationsResult {
  /** The integration client instance */
  client: IntegrationClientInterface | null;
  sendFeedback: (
    feedbackData: FeedbackData,
    options?: { jira?: boolean | undefined; sheets?: boolean | undefined }
  ) => Promise<IntegrationResults>;
  updateStatus: (
    issueKey: string,
    status: string,
    comment?: string
  ) => Promise<IntegrationResult>;
  isConfigured: boolean;
  jiraEnabled: boolean;
  sheetsEnabled: boolean;
}

// ============================================
// CONSTANTS TYPES
// ============================================

/**
 * Configuration object for integration type constants.
 */
export interface IntegrationTypesConfig {
  JIRA: {
    SERVER: 'server';
    AUTOMATION: 'automation';
    ZAPIER: 'zapier';
  };
  SHEETS: {
    APPS_SCRIPT: 'apps-script';
    ZAPIER: 'zapier';
  };
}

/**
 * Column names for Google Sheets export.
 */
export type SheetColumn =
  | 'id'
  | 'timestamp'
  | 'type'
  | 'feedback'
  | 'url'
  | 'userName'
  | 'userEmail'
  | 'status'
  | 'viewport'
  | 'userAgent'
  | 'hasScreenshot'
  | 'hasVideo'
  | 'screenshotUrl'
  | 'videoUrl';

/**
 * Field names for Jira issue creation.
 */
export type JiraField = 'summary' | 'description' | 'type' | 'priority' | 'labels' | 'components';

/**
 * Default mapping of internal status keys to Jira statuses.
 */
export interface DefaultJiraStatusMapping {
  new: string;
  open: string;
  inProgress: string;
  underReview: string;
  onHold: string;
  resolved: string;
  closed: string;
  wontFix: string;
}
