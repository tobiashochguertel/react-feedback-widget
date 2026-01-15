/**
 * Jira Integration Types
 *
 * TypeScript type definitions specific to the Jira integration.
 *
 * @module integrations/jira/jiraTypes
 */

import type { ADFDocument } from '../config.js';

// ============================================
// CLIENT CONFIGURATION
// ============================================

/**
 * Jira client configuration.
 * Can be provided via constructor or environment variables.
 */
export interface JiraClientConfig {
  /** Jira domain (e.g., 'company.atlassian.net') */
  domain?: string | undefined;
  /** Jira user email */
  email?: string | undefined;
  /** Jira API token */
  apiToken?: string | undefined;
  /** Default project key for issue creation */
  projectKey?: string | undefined;
}

/**
 * Custom field mapping for Jira issues.
 */
export interface JiraFieldsMap {
  /** Custom summary field name */
  summary?: string | undefined;
  /** Custom description field name */
  description?: string | undefined;
  /** Custom type field name */
  issuetype?: string | undefined;
  /** Custom priority field name */
  priority?: string | undefined;
  /** Custom labels field name */
  labels?: string | undefined;
  /** Custom components field name */
  components?: string | undefined;
  /** Custom reporter field name */
  reporter?: string | undefined;
  /** Custom assignee field name */
  assignee?: string | undefined;
}

/**
 * Jira handler configuration.
 * Extends client config with handler-specific options.
 */
export interface JiraHandlerConfig extends JiraClientConfig {
  /** Custom field mapping */
  fields?: JiraFieldsMap | undefined;
  /** Additional custom fields to include */
  customFields?: Record<string, unknown> | undefined;
  /** Whether to include priority in issues */
  includePriority?: boolean | undefined;
  /** Whether to upload attachments (screenshots, videos, logs) */
  uploadAttachments?: boolean | undefined;
  /** Status mapping for bidirectional sync */
  statusMapping?: {
    /** Map local status to Jira status */
    toJira?: Record<string, string> | undefined;
    /** Map Jira status to local status */
    fromJira?: Record<string, string> | undefined;
  } | undefined;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Jira issue creation response.
 */
export interface JiraIssueResponse {
  /** Issue key (e.g., 'PROJ-123') */
  key: string;
  /** Issue numeric ID */
  id: string;
  /** Self URL */
  self: string;
}

/**
 * Jira issue status.
 */
export interface JiraIssueStatus {
  /** Status name */
  name: string;
  /** Status ID */
  id: string;
}

/**
 * Jira issue fields.
 */
export interface JiraIssueFields {
  /** Issue status */
  status: JiraIssueStatus;
  /** Issue summary */
  summary: string;
  /** Issue description in ADF format */
  description: ADFDocument;
}

/**
 * Full Jira issue response.
 */
export interface JiraIssueFullResponse {
  /** Issue key */
  key: string;
  /** Issue ID */
  id: string;
  /** Self URL */
  self: string;
  /** Issue fields */
  fields: JiraIssueFields;
}

/**
 * Jira transition.
 */
export interface JiraTransition {
  /** Transition ID */
  id: string;
  /** Transition name */
  name: string;
  /** Target status */
  to: {
    name: string;
    id: string;
  };
}

/**
 * Jira transitions response.
 */
export interface JiraTransitionsResponse {
  /** Available transitions */
  transitions: JiraTransition[];
}

/**
 * Jira attachment response.
 */
export interface JiraAttachmentResponse {
  /** Attachment ID */
  id: string;
  /** Filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Content URL */
  content: string;
}

// ============================================
// HANDLER TYPES
// ============================================

/**
 * Parsed form data from request.
 */
export interface ParsedFormData {
  /** Action to perform */
  action: 'create' | 'updateStatus' | 'getStatus' | 'addComment';
  /** Feedback data for create action */
  feedbackData?: FeedbackDataWithBuffers | undefined;
  /** Issue key for update/get/comment actions */
  issueKey?: string | undefined;
  /** Status for update action */
  status?: string | undefined;
  /** Comment for addComment action */
  comment?: string | undefined;
}

/**
 * Feedback data with buffer attachments from FormData parsing.
 */
export interface FeedbackDataWithBuffers {
  /** Feedback ID */
  id: string;
  /** Feedback text */
  feedback: string;
  /** Feedback type */
  type?: string | undefined;
  /** Current status */
  status?: string | undefined;
  /** User name */
  userName?: string | undefined;
  /** User email */
  userEmail?: string | undefined;
  /** Page URL */
  url?: string | undefined;
  /** Viewport dimensions */
  viewport?: { width: number; height: number } | undefined;
  /** Screenshot as base64 string */
  screenshot?: string | undefined;
  /** Screenshot as Buffer (from FormData) */
  screenshotBuffer?: Buffer | undefined;
  /** Screenshot MIME type */
  screenshotType?: string | undefined;
  /** Video as base64 data URL */
  video?: string | undefined;
  /** Video as Buffer (from FormData) */
  videoBuffer?: Buffer | undefined;
  /** Video MIME type */
  videoType?: string | undefined;
  /** Video size in bytes */
  videoSize?: number | undefined;
  /** Event logs */
  eventLogs?: import('../../types').EventLog[] | undefined;
  /** Timestamp */
  timestamp?: string | undefined;
  /** Element information */
  elementInfo?: {
    selector?: string | undefined;
    componentStack?: string[] | undefined;
    sourceFile?: string | { fileName: string } | undefined;
  } | undefined;
}

// ============================================
// HANDLER RESULTS
// ============================================

/**
 * Attachment result for handler response.
 */
export interface AttachmentResult {
  /** Attachment type */
  type: 'screenshot' | 'video' | 'logs';
  /** Attachment ID (if successful) */
  id?: string | undefined;
  /** Filename (if successful) */
  filename?: string | undefined;
  /** File size (if successful) */
  size?: number | undefined;
  /** Error message (if failed) */
  error?: string | undefined;
}

/**
 * Create issue handler result.
 */
export interface CreateIssueResult {
  success: true;
  issueKey: string;
  issueId: string;
  issueUrl: string;
  attachments: AttachmentResult[];
  debug: {
    videoBufferReceived: boolean;
    videoBufferSize: number;
    videoBase64Received: boolean;
    videoBase64Length: number;
    screenshotBufferReceived: boolean;
    eventLogsCount: number;
  };
}

/**
 * Status update handler result.
 */
export interface StatusUpdateResult {
  success: true;
  issueKey: string;
  newStatus: string;
}

/**
 * Get status handler result.
 */
export interface GetStatusResult {
  success: true;
  issueKey: string;
  jiraStatus: string;
  localStatus: string;
}

/**
 * Add comment handler result.
 */
export interface AddCommentResult {
  success: true;
  issueKey: string;
}

/**
 * Handler result union type.
 */
export type HandlerResult =
  | CreateIssueResult
  | StatusUpdateResult
  | GetStatusResult
  | AddCommentResult;

/**
 * Error response.
 */
export interface ErrorResponse {
  success: false;
  error: string;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Request object interface.
 * Supports Next.js App Router, Pages Router, and Express.
 */
export interface RequestLike {
  json?: () => Promise<Record<string, unknown>>;
  formData?: () => Promise<FormData>;
  body?: string | Record<string, unknown>;
  headers?: {
    get?: (name: string) => string | null;
    [key: string]: string | ((name: string) => string | null) | undefined;
  };
}

/**
 * Response object interface (Express-style).
 */
export interface ResponseLike {
  json?: (data: unknown) => void;
  status?: (code: number) => ResponseLike;
}

/**
 * Handler function type.
 */
export type JiraHandler = (
  req: RequestLike,
  res: ResponseLike | null
) => Promise<Response | void>;

// ============================================
// WEBHOOK PAYLOAD TYPES
// ============================================

/**
 * Jira Automation webhook payload.
 */
export interface JiraAutomationPayload {
  summary: string;
  description: ADFDocument;
  type: string;
  userName: string;
  userEmail: string;
  url: string;
  hasScreenshot: boolean;
  hasVideo: boolean;
  timestamp: string;
}

/**
 * Zapier webhook payload.
 */
export interface ZapierPayload {
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
  source_file: string;
  timestamp: string;
}
