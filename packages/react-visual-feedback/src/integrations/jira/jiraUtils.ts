/**
 * Jira Utility Functions
 *
 * Helper functions for Jira integration.
 *
 * @module integrations/jira/jiraUtils
 */

import type { EventLog } from '../../types/index.js';

/**
 * Format event logs as a readable text file for Jira attachment.
 *
 * @param eventLogs - Array of event logs to format
 * @returns Formatted text content
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

/**
 * Parse multipart form data from request.
 * Works with Next.js App Router, Pages Router, and Express.
 */
export async function parseFormData(
  req: import('./jiraTypes.js').RequestLike
): Promise<import('./jiraTypes.js').ParsedFormData> {
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
        action: (body.action as import('./jiraTypes.js').ParsedFormData['action']) ?? 'create',
        feedbackData: (body.feedbackData ?? body) as import('./jiraTypes.js').FeedbackDataWithBuffers,
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
      const feedbackData = {
        ...(metadata as Partial<import('../../types').FeedbackData>),
        id: (metadata.id as string) ?? '',
        feedback: (metadata.feedback as string) ?? '',
      } as import('./jiraTypes.js').FeedbackDataWithBuffers;

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
          feedbackData.eventLogs = JSON.parse(text) as import('../../types').EventLog[];
        } catch {
          feedbackData.eventLogs = [];
        }
      }

      return { action: action as import('./jiraTypes.js').ParsedFormData['action'], feedbackData };
    }
  }

  // Express/Pages Router with body already parsed (JSON)
  if (req.body) {
    const body =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : req.body;
    return {
      action: (body.action as import('./jiraTypes.js').ParsedFormData['action']) ?? 'create',
      feedbackData: (body.feedbackData ?? body) as import('./jiraTypes.js').FeedbackDataWithBuffers,
      issueKey: body.issueKey as string | undefined,
      status: body.status as string | undefined,
      comment: body.comment as string | undefined,
    };
  }

  throw new Error('Unable to parse request body');
}
