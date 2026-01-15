/**
 * Jira Integration Implementation
 *
 * Main integration class that implements the Integration interface
 * and provides handler functions for different frameworks.
 *
 * @module integrations/jira/JiraIntegration
 */

import type { FeedbackData } from '../../types/index.js';
import {
  feedbackToJiraIssue,
  mapLocalStatusToJira,
  mapJiraStatusToLocal,
  ADFDocument,
  IntegrationConfig,
} from '../config.js';

import type {
  JiraClientConfig,
  JiraHandlerConfig,
  FeedbackDataWithBuffers,
  AttachmentResult,
  CreateIssueResult,
  StatusUpdateResult,
  GetStatusResult,
  AddCommentResult,
  HandlerResult,
  ErrorResponse,
  RequestLike,
  ResponseLike,
  JiraHandler,
  JiraAutomationPayload,
  ZapierPayload,
} from './jiraTypes.js';

import { JiraClient } from './JiraClient.js';
import { formatEventLogs, parseFormData } from './jiraUtils.js';

// ============================================
// HANDLER FUNCTIONS
// ============================================

/**
 * Handle issue creation.
 *
 * Creates a Jira issue from feedback data and uploads attachments.
 *
 * @param client - Jira API client
 * @param feedbackData - Feedback data with optional media buffers
 * @param config - Handler configuration
 * @returns Created issue details
 */
async function handleCreate(
  client: JiraClient,
  feedbackData: FeedbackDataWithBuffers,
  config: JiraHandlerConfig
): Promise<CreateIssueResult> {
  // Transform feedback to Jira issue format
  const issueData = feedbackToJiraIssue(feedbackData as FeedbackData, {
    projectKey: config.projectKey ?? client.projectKey,
    fields: config.fields,
    customFields: config.customFields,
    includePriority: config.includePriority,
  } as IntegrationConfig);

  // Create the issue
  const issue = await client.createIssue(issueData as unknown as Record<string, unknown>);
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
        const { size: _attachmentSize, ...restResult } = result[0];
        attachments.push({
          type: 'video',
          size: feedbackData.videoSize ?? feedbackData.videoBuffer.length,
          ...restResult,
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
 * Handle status update (local -> Jira).
 *
 * @param client - Jira API client
 * @param issueKey - Jira issue key
 * @param localStatus - Local status name
 * @param config - Handler configuration
 * @returns Update result
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
 * Handle get status (Jira -> local).
 *
 * @param client - Jira API client
 * @param issueKey - Jira issue key
 * @param config - Handler configuration
 * @returns Status result with both Jira and local status names
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
 * Handle add comment.
 *
 * @param client - Jira API client
 * @param issueKey - Jira issue key
 * @param comment - Comment text
 * @returns Result confirmation
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

// ============================================
// MAIN HANDLER FACTORY
// ============================================

/**
 * Create Jira handler with configuration.
 *
 * The returned handler supports multiple actions:
 * - `create`: Create issue with attachments
 * - `updateStatus`: Transition issue to new status
 * - `getStatus`: Get current issue status
 * - `addComment`: Add comment to issue
 *
 * @param config - Handler configuration
 * @returns Handler function
 *
 * @example
 * ```typescript
 * // Next.js App Router
 * const handler = createJiraHandler({ projectKey: 'BUG' });
 *
 * export async function POST(request: Request) {
 *   return handler(request, null);
 * }
 * ```
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
        res.status(200).json!(result);
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
        res.status(500).json!(errorResponse);
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
 * Next.js App Router handler.
 *
 * Returns a function that can be directly exported as POST.
 *
 * @param config - Handler configuration
 * @returns Async function for Next.js App Router
 *
 * @example
 * ```typescript
 * // app/api/feedback/route.ts
 * import { createNextAppHandler } from 'react-visual-feedback/integrations/jira';
 *
 * export const POST = createNextAppHandler({ projectKey: 'BUG' });
 * ```
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
 * Next.js Pages Router handler.
 *
 * @param config - Handler configuration
 * @returns Handler compatible with Pages Router API routes
 *
 * @example
 * ```typescript
 * // pages/api/feedback.ts
 * import { createNextPagesHandler } from 'react-visual-feedback/integrations/jira';
 *
 * export default createNextPagesHandler({ projectKey: 'BUG' });
 * ```
 */
export function createNextPagesHandler(config: JiraHandlerConfig = {}): JiraHandler {
  return createJiraHandler(config);
}

/**
 * Express middleware.
 *
 * @param config - Handler configuration
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createExpressMiddleware } from 'react-visual-feedback/integrations/jira';
 *
 * const app = express();
 * app.post('/api/feedback', createExpressMiddleware({ projectKey: 'BUG' }));
 * ```
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
 * Generic handler for any framework.
 *
 * @param config - Handler configuration
 * @returns Universal handler function
 */
export function createGenericHandler(config: JiraHandlerConfig = {}): JiraHandler {
  return createJiraHandler(config);
}

// ============================================
// WEBHOOK FORMATTERS
// ============================================

/**
 * Format feedback for Jira Automation webhook.
 *
 * Use this when sending feedback to Jira Automation rules.
 *
 * @param feedbackData - Feedback data
 * @param config - Formatting configuration
 * @returns Payload for Jira Automation
 */
export function formatForJiraAutomation(
  feedbackData: FeedbackData,
  config: Omit<JiraHandlerConfig, keyof JiraClientConfig> = {}
): JiraAutomationPayload {
  const jiraIssue = feedbackToJiraIssue(feedbackData, config as IntegrationConfig);

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
 * Format feedback for Zapier webhook.
 *
 * Use this when sending feedback to Zapier for automation.
 *
 * @param feedbackData - Feedback data
 * @returns Payload for Zapier
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
    source_file:
      typeof feedbackData.elementInfo?.sourceFile === 'string'
        ? feedbackData.elementInfo.sourceFile
        : feedbackData.elementInfo?.sourceFile?.fileName ?? '',
    timestamp: feedbackData.timestamp ?? new Date().toISOString(),
  };
}
