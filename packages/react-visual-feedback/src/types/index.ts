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

export type ThemeMode = 'light' | 'dark';

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

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

// ============================================
// POSITION & ELEMENT TYPES
// ============================================

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementStyles {
  backgroundColor: string;
  color: string;
  fontSize: string;
  fontFamily: string;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  devicePixelRatio: number;
}

export interface ReactComponentSourceInfo {
  fileName?: string | undefined;
  lineNumber?: number | undefined;
  columnNumber?: number | undefined;
}

export interface ReactComponentInfo {
  componentName: string | null;
  componentStack: string[];
  props: Record<string, unknown> | null;
  sourceFile: ReactComponentSourceInfo | null;
}

export interface ElementInfo {
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

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'question' | 'other';

export interface FeedbackAttachment {
  name: string;
  type: string;
  size: number;
  data: string | Blob;
  preview?: string | undefined;
}

export interface FeedbackData {
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

export interface FeedbackSubmitData extends Omit<FeedbackData, 'id' | 'timestamp'> {
  id?: string | undefined;
  timestamp?: string | undefined;
}

// ============================================
// STATUS TYPES
// ============================================

export interface StatusConfig {
  key?: string | undefined;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string | ComponentType<{ size?: number | undefined }>;
}

export type StatusKey =
  | 'new'
  | 'open'
  | 'inProgress'
  | 'underReview'
  | 'onHold'
  | 'resolved'
  | 'closed'
  | 'wontFix';

export type StatusConfigs = Record<string, StatusConfig>;

export interface StatusChangePayload {
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

export type EventLogType = 'console' | 'network' | 'storage' | 'indexedDB' | 'click' | 'navigation' | 'fetch' | 'xhr';
export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';
export type NetworkSource = 'fetch' | 'xhr';

export interface BaseEventLog {
  type: EventLogType;
  timestamp: number;
}

export interface ConsoleEventLog extends BaseEventLog {
  type: 'console';
  level: ConsoleLevel;
  message: string;
}

export interface NetworkEventLog extends BaseEventLog {
  type: 'network';
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

export type RecorderStatus = 'idle' | 'starting' | 'recording' | 'paused' | 'stopped';

export interface RecordingResult {
  blob: Blob | null;
  events: EventLog[];
}

export interface SessionRecorderInterface {
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

export type JiraIntegrationType = 'server' | 'automation' | 'zapier' | 'jira-server' | 'jira-automation' | 'jira-zapier';
export type SheetsIntegrationType = 'apps-script' | 'zapier' | 'server' | 'oauth' | 'sheets-zapier' | 'google-apps-script';

export interface JiraStatusMapping {
  [key: string]: string;
}

export interface JiraConfig {
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

export interface SheetsConfig {
  enabled: boolean;
  type?: SheetsIntegrationType | undefined;
  endpoint?: string | undefined;
  deploymentUrl?: string | undefined;
  webhookUrl?: string | undefined;
  columns?: string[] | Record<string, unknown> | undefined;
  columnOrder?: string[] | undefined;
  sheetName?: string | undefined;
}

export interface IntegrationsConfig {
  jira?: JiraConfig | undefined;
  sheets?: SheetsConfig | undefined;
}

export interface IntegrationResult {
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

export type SubmissionStatus = 'pending' | 'submitting' | 'success' | 'error';

export interface QueuedSubmission {
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

export interface HighlightStyle extends CSSProperties {
  top?: number | undefined;
  left?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

export interface TooltipStyle extends CSSProperties {
  top?: number | undefined;
  left?: number | undefined;
}

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

export interface FeedbackContextValue {
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

export interface FeedbackProviderProps {
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

export interface FeedbackDashboardProps {
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

export interface FeedbackModalProps {
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

export interface FeedbackTriggerProps {
  onClick?: (() => void) | undefined;
  mode?: ThemeMode | undefined;
  style?: CSSProperties | undefined;
  className?: string | undefined;
  children?: ReactNode | undefined;
}

export interface CanvasOverlayProps {
  isActive?: boolean | undefined;
  screenshot?: string | null | undefined;
  onSave?: ((canvasData: string) => void) | undefined;
  onComplete?: ((screenshot: string | null, feedback: string) => void) | undefined;
  onCancel: () => void;
  mode?: ThemeMode | undefined;
}

export interface RecordingOverlayProps {
  isRecording: boolean;
  isInitializing?: boolean | undefined;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  mode?: ThemeMode | undefined;
}

export interface SessionReplayProps {
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

export interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  updates: UpdateItem[];
  mode?: ThemeMode | undefined;
}

export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'fix' | 'improvement';
  date: string;
}

export interface SubmissionQueueProps {
  submissions: QueuedSubmission[];
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  mode?: ThemeMode | undefined;
}

export interface ErrorToastProps {
  message: string;
  type?: 'error' | 'success' | 'info' | undefined;
  duration?: number | undefined;
  onClose?: (() => void) | undefined;
}

export interface StatusBadgeProps {
  status: string;
  statuses?: StatusConfigs | undefined;
}

export interface StatusDropdownProps {
  currentStatus: string;
  statuses: StatusConfigs;
  onChange: (status: string) => void;
  disabled?: boolean | undefined;
  mode?: ThemeMode | undefined;
}

export interface LogEntryProps {
  log: EventLog;
  mode?: ThemeMode | undefined;
}

// ============================================
// INTEGRATION CLIENT TYPES
// ============================================

export interface IntegrationClientConfig {
  jira?: JiraConfig | undefined;
  sheets?: SheetsConfig | undefined;
  onSuccess?: ((type: string, result: IntegrationResult) => void) | undefined;
  onError?: ((type: string, error: string) => void) | undefined;
}

export interface IntegrationClientInterface {
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

export type GetElementSelectorFn = (element: Element) => string;
export type GetElementInfoFn = (element: HTMLElement) => ElementInfo;
export type GetReactComponentInfoFn = (element: HTMLElement) => ReactComponentInfo | null;
export type CaptureElementScreenshotFn = (element: HTMLElement, scale?: number) => Promise<string>;
export type FormatPathFn = (path: string) => string;
export type GenerateIdFn = () => string;

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseIntegrationsResult {
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

export type JiraField = 'summary' | 'description' | 'type' | 'priority' | 'labels' | 'components';

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
