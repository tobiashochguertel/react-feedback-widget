/**
 * Jira Integration Server Handler
 *
 * Supports:
 * - Creating issues with attachments
 * - Bidirectional status sync
 * - Custom field mapping
 *
 * Usage (Next.js App Router):
 *   export { POST } from 'react-visual-feedback/server/jira';
 *
 * Usage (Express):
 *   app.post('/api/jira', jiraHandler({ projectKey: 'BUG' }));
 */

import type { FeedbackData, EventLog } from '../types/index.js';
import {
  feedbackToJiraIssue,
  mapLocalStatusToJira,
  mapJiraStatusToLocal,
  JiraStatusMapping,
  JiraFieldsMap,
  ADFDocument,
} from './config.js';

// ============================================
// TYPES
// ============================================

/** Jira client configuration */
export interface JiraClientConfig {
  domain?: string;
  email?: string;
  apiToken?: string;
  projectKey?: string;
}

/** Jira handler configuration */
export interface JiraHandlerConfig extends JiraClientConfig {
  fields?: JiraFieldsMap;
  customFields?: Record<string, unknown>;
  includePriority?: boolean;
  uploadAttachments?: boolean;
  statusMapping?: {
    toJira?: JiraStatusMapping;
    fromJira?: JiraStatusMapping;
  };
}

/** Parsed form data from request */
interface ParsedFormData {
  action: 'create' | 'updateStatus' | 'getStatus' | 'addComment';
  feedbackData?: FeedbackDataWithBuffers | undefined;
  issueKey?: string | undefined;
  status?: string | undefined;
  comment?: string | undefined;
}

/** Feedback data with buffer attachments from FormData parsing */
interface FeedbackDataWithBuffers extends FeedbackData {
  screenshotBuffer?: Buffer;
  screenshotType?: string;
  videoBuffer?: Buffer;
  videoType?: string;
  videoSize?: number;
}

/** Jira issue creation response */
interface JiraIssueResponse {
  key: string;
  id: string;
  self: string;
}

/** Jira issue fields */
interface JiraIssueFields {
  status: {
    name: string;
    id: string;
  };
  summary: string;
  description: ADFDocument;
}

/** Full Jira issue response */
interface JiraIssueFullResponse {
  key: string;
  id: string;
  self: string;
  fields: JiraIssueFields;
}

/** Jira transition */
interface JiraTransition {
  id: string;
  name: string;
  to: {
    name: string;
    id: string;
  };
}

/** Jira transitions response */
interface JiraTransitionsResponse {
  transitions: JiraTransition[];
}

/** Jira attachment response */
interface JiraAttachmentResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  content: string;
}

/** Attachment result for handler response */
interface AttachmentResult {
  type: 'screenshot' | 'video' | 'logs';
  id?: string;
  filename?: string;
  size?: number;
  error?: string;
}

/** Create issue handler result */
interface CreateIssueResult {
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

/** Status update handler result */
interface StatusUpdateResult {
  success: true;
  issueKey: string;
  newStatus: string;
}

/** Get status handler result */
interface GetStatusResult {
  success: true;
  issueKey: string;
  jiraStatus: string;
  localStatus: string;
}

/** Add comment handler result */
interface AddCommentResult {
  success: true;
  issueKey: string;
}

/** Handler result union type */
type HandlerResult = CreateIssueResult | StatusUpdateResult | GetStatusResult | AddCommentResult;

/** Error response */
interface ErrorResponse {
  success: false;
  error: string;
}

/** Request object interface (supports Next.js App Router and Express) */
interface RequestLike {
  json?: () => Promise<Record<string, unknown>>;
  formData?: () => Promise<FormData>;
  body?: string | Record<string, unknown>;
  headers?: {
    get?: (name: string) => string | null;
    [key: string]: string | ((name: string) => string | null) | undefined;
  };
}

/** Response object interface (Express-style) */
interface ResponseLike {
  json?: (data: unknown) => void;
  status?: (code: number) => ResponseLike;
}

/** Handler function type */
type JiraHandler = (
  req: RequestLike,
  res: ResponseLike | null
) => Promise<Response | void>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format event logs as a readable text file
 */
export function formatEventLogs(eventLogs: EventLog[]): string {
  if (!eventLogs || eventLogs.length === 0) {
    return 'No event logs recorded.';
  }

  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    '                    SESSION EVENT LOGS',
    '═══════════════════════════════════════════════════════════════',
    `Generated: ${new Date().toISOString()}`,
    `Total Events: ${eventLogs.length}`,
    '═══════════════════════════════════════════════════════════════',
    '',
  ];

  eventLogs.forEach((event) => {
    const timestamp = event.timestamp
      ? `[${(event.timestamp / 1000).toFixed(2)}s]`
      : '[--]';

    switch (event.type) {
      case 'console': {
        const level = event.level ?? 'log';
        lines.push(`${timestamp} [CONSOLE.${level.toUpperCase()}]`);
        lines.push(`   ${event.message ?? 'No message'}`);
        break;
      }

      case 'network': {
        const status = event.status ?? 'pending';
        const duration = event.duration ? `(${event.duration}ms)` : '';
        lines.push(`${timestamp} [NETWORK] ${event.method ?? 'GET'} ${event.url ?? ''}`);
        lines.push(`   Status: ${status} ${duration}`);
        if (
          event.request?.body &&
          event.request.body !== 'null' &&
          event.request.body !== 'undefined'
        ) {
          const body = event.request.body;
          lines.push(
            `   Request: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`
          );
        }
        if (
          event.response?.body &&
          event.response.body !== 'null' &&
          event.response.body !== 'undefined'
        ) {
          const body = event.response.body;
          lines.push(
            `   Response: ${body.substring(0, 200)}${body.length > 200 ? '...' : ''}`
          );
        }
        break;
      }

      case 'storage': {
        const storageType = event.storageType ?? 'storage';
        lines.push(`${timestamp} [${storageType.toUpperCase()}] ${event.action ?? ''}`);
        if (event.key) lines.push(`   Key: ${event.key}`);
        if (event.value) {
          lines.push(
            `   Value: ${event.value.substring(0, 100)}${event.value.length > 100 ? '...' : ''}`
          );
        }
        break;
      }

      case 'indexedDB': {
        lines.push(
          `${timestamp} [INDEXEDDB] ${event.action ?? ''} on ${event.dbName ?? 'unknown'}${event.storeName ? '.' + event.storeName : ''}`
        );
        if (event.data) {
          lines.push(
            `   Data: ${event.data.substring(0, 100)}${event.data.length > 100 ? '...' : ''}`
          );
        }
        break;
      }

      default: {
        const eventType = event.type ?? 'EVENT';
        lines.push(`${timestamp} [${eventType.toUpperCase()}]`);
        lines.push(`   ${JSON.stringify(event).substring(0, 200)}`);
      }
    }

    lines.push(''); // Empty line between events
  });

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                      END OF LOGS');
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// ============================================
// JIRA API CLIENT
// ============================================

/**
 * Jira Cloud REST API client
 */
export class JiraClient {
  private domain: string;
  private email: string;
  private apiToken: string;
  private baseUrl: string;
  private authHeader: string;

  public projectKey: string;

  constructor(config: JiraClientConfig) {
    let domain = config.domain ?? process.env.JIRA_DOMAIN;
    this.email = config.email ?? process.env.JIRA_EMAIL ?? '';
    this.apiToken = config.apiToken ?? process.env.JIRA_API_TOKEN ?? '';
    this.projectKey = config.projectKey ?? process.env.JIRA_PROJECT_KEY ?? '';

    if (!domain || !this.email || !this.apiToken) {
      throw new Error(
        'Jira configuration missing. Required: JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN'
      );
    }

    // Strip protocol and trailing slashes from domain
    this.domain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    this.baseUrl = `https://${this.domain}/rest/api/3`;
    this.authHeader =
      'Basic ' + Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
  }

  /**
   * Make authenticated request to Jira API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    // Some endpoints return empty response
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  }

  /**
   * Create a new issue
   */
  async createIssue(issueData: Record<string, unknown>): Promise<JiraIssueResponse> {
    const result = await this.request<JiraIssueResponse>('/issue', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
    if (!result) {
      throw new Error('Failed to create Jira issue');
    }
    return result;
  }

  /**
   * Get issue details
   */
  async getIssue(issueKey: string): Promise<JiraIssueFullResponse> {
    const result = await this.request<JiraIssueFullResponse>(`/issue/${issueKey}`);
    if (!result) {
      throw new Error(`Failed to get Jira issue: ${issueKey}`);
    }
    return result;
  }

  /**
   * Update issue status via transition
   */
  async transitionIssue(
    issueKey: string,
    transitionName: string
  ): Promise<{ success: true; transitionId: string }> {
    // First get available transitions
    const transitions = await this.request<JiraTransitionsResponse>(
      `/issue/${issueKey}/transitions`
    );

    if (!transitions) {
      throw new Error(`Failed to get transitions for issue ${issueKey}`);
    }

    const transition = transitions.transitions.find(
      (t) =>
        t.name.toLowerCase() === transitionName.toLowerCase() ||
        t.to.name.toLowerCase() === transitionName.toLowerCase()
    );

    if (!transition) {
      throw new Error(`Transition "${transitionName}" not found for issue ${issueKey}`);
    }

    await this.request(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: { id: transition.id },
      }),
    });

    return { success: true, transitionId: transition.id };
  }

  /**
   * Add attachment to issue
   */
  async addAttachment(
    issueKey: string,
    filename: string,
    content: Buffer | string | Uint8Array,
    contentType: string
  ): Promise<JiraAttachmentResponse[]> {
    const url = `${this.baseUrl}/issue/${issueKey}/attachments`;

    // Convert content to buffer
    let buffer: Buffer;

    if (Buffer.isBuffer(content)) {
      // Already a buffer
      buffer = content;
    } else if (typeof content === 'string') {
      if (content.startsWith('data:')) {
        // Data URL format: data:video/webm;base64,AAAA...
        const commaIndex = content.indexOf(',');
        if (commaIndex !== -1) {
          const base64Data = content.substring(commaIndex + 1);
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          throw new Error('Invalid data URL format - missing comma separator');
        }
      } else {
        // Assume raw base64 string
        buffer = Buffer.from(content, 'base64');
      }
    } else if (content instanceof Uint8Array) {
      buffer = Buffer.from(content);
    } else {
      throw new Error(`Unsupported content type: ${typeof content}`);
    }

    // Validate buffer has content
    if (!buffer || buffer.length === 0) {
      throw new Error('Attachment content is empty');
    }

    // Create form data manually for Node.js
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    const formData = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${contentType}\r\n\r\n`
      ),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'X-Atlassian-Token': 'no-check',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload attachment (${response.status}): ${error}`);
    }

    return response.json() as Promise<JiraAttachmentResponse[]>;
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.request(`/issue/${issueKey}/comment`, {
      method: 'POST',
      body: JSON.stringify({
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      }),
    });
  }

  /**
   * Get issue status
   */
  async getIssueStatus(issueKey: string): Promise<string> {
    const issue = await this.getIssue(issueKey);
    return issue.fields.status.name;
  }

  /**
   * Get domain (for URL building)
   */
  getDomain(): string {
    return this.domain;
  }
}

// ============================================
// REQUEST HANDLERS
// ============================================

/**
 * Parse multipart form data from request
 * Works with Next.js App Router, Pages Router, and Express
 */
async function parseFormData(req: RequestLike): Promise<ParsedFormData> {
  // Next.js App Router - req is a Request object
  if (typeof req.json === 'function' || typeof req.formData === 'function') {
    // Check Content-Type to determine how to parse
    const contentType =
      (typeof req.headers?.get === 'function'
        ? req.headers.get('content-type')
        : typeof req.headers?.['content-type'] === 'string'
          ? req.headers['content-type']
          : '') ?? '';

    // Handle JSON requests (e.g., getStatus, updateStatus)
    if (contentType.includes('application/json') && typeof req.json === 'function') {
      const body = await req.json();
      return {
        action: (body.action as ParsedFormData['action']) ?? 'create',
        feedbackData: (body.feedbackData ?? body) as FeedbackDataWithBuffers,
        issueKey: body.issueKey as string | undefined,
        status: body.status as string | undefined,
        comment: body.comment as string | undefined,
      };
    }

    // Handle FormData requests (e.g., create with attachments)
    if (typeof req.formData === 'function') {
      const formData = await req.formData();
      const action = (formData.get('action') as string) ?? 'create';
      const metadataStr = formData.get('metadata') as string | null;
      const metadata: Record<string, unknown> = metadataStr
        ? JSON.parse(metadataStr)
        : {};

      // Get files
      const screenshot = formData.get('screenshot');
      const video = formData.get('video');
      const eventLogsFile = formData.get('eventLogs');

      // Convert files to buffers
      const feedbackData: FeedbackDataWithBuffers = {
        ...(metadata as Partial<FeedbackData>),
        id: (metadata.id as string) ?? '',
        feedback: (metadata.feedback as string) ?? '',
      };

      if (screenshot instanceof Blob) {
        const arrayBuffer = await screenshot.arrayBuffer();
        feedbackData.screenshotBuffer = Buffer.from(arrayBuffer);
        feedbackData.screenshotType = screenshot.type || 'image/png';
      }

      if (video instanceof Blob) {
        const arrayBuffer = await video.arrayBuffer();
        feedbackData.videoBuffer = Buffer.from(arrayBuffer);
        feedbackData.videoType = video.type || 'video/webm';
        feedbackData.videoSize = video.size;
      }

      if (eventLogsFile instanceof Blob) {
        const text = await eventLogsFile.text();
        try {
          feedbackData.eventLogs = JSON.parse(text) as EventLog[];
        } catch {
          feedbackData.eventLogs = [];
        }
      }

      return { action: action as ParsedFormData['action'], feedbackData };
    }
  }

  // Express/Pages Router with body already parsed (JSON)
  if (req.body) {
    const body =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : req.body;
    return {
      action: (body.action as ParsedFormData['action']) ?? 'create',
      feedbackData: (body.feedbackData ?? body) as FeedbackDataWithBuffers,
      issueKey: body.issueKey as string | undefined,
      status: body.status as string | undefined,
      comment: body.comment as string | undefined,
    };
  }

  throw new Error('Unable to parse request body');
}

/**
 * Handle issue creation
 */
async function handleCreate(
  client: JiraClient,
  feedbackData: FeedbackDataWithBuffers,
  config: JiraHandlerConfig
): Promise<CreateIssueResult> {
  // Transform feedback to Jira issue format
  const issueData = feedbackToJiraIssue(feedbackData, {
    projectKey: config.projectKey ?? client.projectKey,
    fields: config.fields,
    customFields: config.customFields,
    includePriority: config.includePriority,
  });

  // Create the issue
  const issue = await client.createIssue(issueData);
  const issueKey = issue.key;

  // Upload attachments
  const attachments: AttachmentResult[] = [];

  // Handle screenshot - support both Buffer (from FormData) and base64 string
  if (config.uploadAttachments !== false) {
    if (feedbackData.screenshotBuffer) {
      // Screenshot came as Buffer from FormData
      try {
        const result = await client.addAttachment(
          issueKey,
          `screenshot-${feedbackData.id || Date.now()}.png`,
          feedbackData.screenshotBuffer,
          feedbackData.screenshotType ?? 'image/png'
        );
        attachments.push({ type: 'screenshot', ...result[0] });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attachments.push({ type: 'screenshot', error: message });
      }
    } else if (feedbackData.screenshot && typeof feedbackData.screenshot === 'string') {
      // Screenshot is base64 string (legacy JSON format)
      try {
        const result = await client.addAttachment(
          issueKey,
          `screenshot-${feedbackData.id || Date.now()}.png`,
          feedbackData.screenshot,
          'image/png'
        );
        attachments.push({ type: 'screenshot', ...result[0] });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attachments.push({ type: 'screenshot', error: message });
      }
    }
  }

  // Handle video - support both Buffer (from FormData) and base64 string
  if (config.uploadAttachments !== false) {
    if (feedbackData.videoBuffer) {
      // Video came as Buffer from FormData - most efficient!
      try {
        const videoType = feedbackData.videoType ?? 'video/webm';
        const extension = videoType.includes('mp4') ? 'mp4' : 'webm';

        const result = await client.addAttachment(
          issueKey,
          `recording-${feedbackData.id || Date.now()}.${extension}`,
          feedbackData.videoBuffer,
          videoType
        );
        attachments.push({
          type: 'video',
          size: feedbackData.videoSize ?? feedbackData.videoBuffer.length,
          ...result[0],
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attachments.push({ type: 'video', error: message });
      }
    } else if (feedbackData.video && typeof feedbackData.video === 'string') {
      // Video is base64 string (legacy JSON format)
      try {
        const videoData = feedbackData.video;

        if (!videoData.startsWith('data:')) {
          throw new Error('Video data is not a valid data URL');
        }

        if (videoData.length < 1000) {
          throw new Error(`Video data appears truncated (only ${videoData.length} chars)`);
        }

        let videoType = 'video/webm';
        let extension = 'webm';
        if (videoData.includes('video/mp4')) {
          videoType = 'video/mp4';
          extension = 'mp4';
        }

        const result = await client.addAttachment(
          issueKey,
          `recording-${feedbackData.id || Date.now()}.${extension}`,
          videoData,
          videoType
        );
        attachments.push({ type: 'video', ...result[0] });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attachments.push({ type: 'video', error: message });
      }
    }
  }

  // Upload event logs as a formatted text file
  if (
    feedbackData.eventLogs &&
    feedbackData.eventLogs.length > 0 &&
    config.uploadAttachments !== false
  ) {
    try {
      const logsText = formatEventLogs(feedbackData.eventLogs);
      const logsBuffer = Buffer.from(logsText, 'utf-8');
      const result = await client.addAttachment(
        issueKey,
        `session-logs-${feedbackData.id || Date.now()}.txt`,
        logsBuffer,
        'text/plain'
      );
      attachments.push({ type: 'logs', ...result[0] });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      attachments.push({ type: 'logs', error: message });
    }
  }

  // Include debug info
  const debugInfo = {
    videoBufferReceived: Boolean(feedbackData.videoBuffer),
    videoBufferSize: feedbackData.videoBuffer?.length ?? 0,
    videoBase64Received: Boolean(feedbackData.video),
    videoBase64Length: feedbackData.video?.length ?? 0,
    screenshotBufferReceived: Boolean(feedbackData.screenshotBuffer),
    eventLogsCount: feedbackData.eventLogs?.length ?? 0,
  };

  return {
    success: true,
    issueKey,
    issueId: issue.id,
    issueUrl: `https://${client.getDomain()}/browse/${issueKey}`,
    attachments,
    debug: debugInfo,
  };
}

/**
 * Handle status update (local -> Jira)
 */
async function handleStatusUpdate(
  client: JiraClient,
  issueKey: string,
  localStatus: string,
  config: JiraHandlerConfig
): Promise<StatusUpdateResult> {
  const jiraStatus = mapLocalStatusToJira(localStatus, config.statusMapping?.toJira);

  await client.transitionIssue(issueKey, jiraStatus);

  return {
    success: true,
    issueKey,
    newStatus: jiraStatus,
  };
}

/**
 * Handle get status (Jira -> local)
 */
async function handleGetStatus(
  client: JiraClient,
  issueKey: string,
  config: JiraHandlerConfig
): Promise<GetStatusResult> {
  const jiraStatus = await client.getIssueStatus(issueKey);
  const localStatus = mapJiraStatusToLocal(jiraStatus, config.statusMapping?.fromJira);

  return {
    success: true,
    issueKey,
    jiraStatus,
    localStatus,
  };
}

/**
 * Handle add comment
 */
async function handleAddComment(
  client: JiraClient,
  issueKey: string,
  comment: string
): Promise<AddCommentResult> {
  await client.addComment(issueKey, comment);

  return {
    success: true,
    issueKey,
  };
}

/**
 * Create Jira handler with configuration
 */
export function createJiraHandler(config: JiraHandlerConfig = {}): JiraHandler {
  const handler: JiraHandler = async (req, res) => {
    try {
      // Parse body - supports both JSON and FormData
      const {
        action = 'create',
        feedbackData,
        issueKey,
        status,
        comment,
      } = await parseFormData(req);

      const client = new JiraClient(config);

      let result: HandlerResult;

      switch (action) {
        case 'create':
          if (!feedbackData) {
            throw new Error('feedbackData is required for create action');
          }
          result = await handleCreate(client, feedbackData, config);
          break;

        case 'updateStatus':
          if (!issueKey || !status) {
            throw new Error('issueKey and status are required for updateStatus action');
          }
          result = await handleStatusUpdate(client, issueKey, status, config);
          break;

        case 'getStatus':
          if (!issueKey) {
            throw new Error('issueKey is required for getStatus action');
          }
          result = await handleGetStatus(client, issueKey, config);
          break;

        case 'addComment':
          if (!issueKey || !comment) {
            throw new Error('issueKey and comment are required for addComment action');
          }
          result = await handleAddComment(client, issueKey, comment);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Send response based on environment
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
  config: JiraHandlerConfig = {}
): (request: Request) => Promise<Response> {
  const handler = createJiraHandler(config);

  return async (request: Request): Promise<Response> => {
    // Pass the request directly - parseFormData handles both FormData and JSON
    const result = await handler(request as unknown as RequestLike, null);
    return result as Response;
  };
}

/**
 * Next.js Pages Router handler
 */
export function createNextPagesHandler(config: JiraHandlerConfig = {}): JiraHandler {
  return createJiraHandler(config);
}

/**
 * Express middleware
 */
export function createExpressMiddleware(
  config: JiraHandlerConfig = {}
): (req: RequestLike, res: ResponseLike, next: (error?: Error) => void) => Promise<void> {
  const handler = createJiraHandler(config);

  return async (req, res, next): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * Generic handler for any framework
 */
export function createGenericHandler(config: JiraHandlerConfig = {}): JiraHandler {
  return createJiraHandler(config);
}

// ============================================
// WEBHOOK HANDLERS (For Jira Automation / Zapier)
// ============================================

/** Jira Automation webhook payload */
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

/** Zapier webhook payload */
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

/**
 * Format feedback for Jira Automation webhook
 */
export function formatForJiraAutomation(
  feedbackData: FeedbackData,
  config: Omit<JiraHandlerConfig, keyof JiraClientConfig> = {}
): JiraAutomationPayload {
  const jiraIssue = feedbackToJiraIssue(feedbackData, config);

  return {
    summary: `[Feedback] ${(feedbackData.feedback ?? '').substring(0, 200)}`,
    description: jiraIssue.fields.description as ADFDocument,
    type: feedbackData.type ?? 'bug',
    userName: feedbackData.userName ?? 'Anonymous',
    userEmail: feedbackData.userEmail ?? '',
    url: feedbackData.url ?? '',
    hasScreenshot: Boolean(feedbackData.screenshot),
    hasVideo: Boolean(feedbackData.video),
    timestamp: feedbackData.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Format feedback for Zapier webhook
 */
export function formatForZapier(feedbackData: FeedbackData): ZapierPayload {
  return {
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
    source_file: feedbackData.elementInfo?.sourceFile ?? '',
    timestamp: feedbackData.timestamp ?? new Date().toISOString(),
  };
}

// Default export for easy importing
export default createJiraHandler;
