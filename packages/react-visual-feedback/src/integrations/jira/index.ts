/**
 * Jira Integration Module
 *
 * Provides integration with Jira Cloud for feedback management.
 *
 * @module integrations/jira
 *
 * @example
 * ```typescript
 * // Server handler (Next.js App Router)
 * import { createNextAppHandler } from 'react-visual-feedback/integrations/jira';
 *
 * export const POST = createNextAppHandler({ projectKey: 'BUG' });
 * ```
 *
 * @example
 * ```typescript
 * // Express middleware
 * import { createExpressMiddleware } from 'react-visual-feedback/integrations/jira';
 *
 * app.post('/api/feedback', createExpressMiddleware({ projectKey: 'BUG' }));
 * ```
 *
 * @example
 * ```typescript
 * // Direct client usage
 * import { JiraClient } from 'react-visual-feedback/integrations/jira';
 *
 * const client = new JiraClient({
 *   domain: 'company.atlassian.net',
 *   email: 'user@company.com',
 *   apiToken: 'your-api-token',
 *   projectKey: 'PROJ'
 * });
 *
 * const issue = await client.createIssue({ fields: { ... } });
 * ```
 */

// Types
export type {
  JiraClientConfig,
  JiraHandlerConfig,
  ParsedFormData,
  FeedbackDataWithBuffers,
  JiraIssueResponse,
  JiraIssueFields,
  JiraIssueFullResponse,
  JiraTransition,
  JiraTransitionsResponse,
  JiraAttachmentResponse,
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

// Client
export { JiraClient } from './JiraClient.js';

// Utilities
export { formatEventLogs, parseFormData } from './jiraUtils.js';

// Validation
export {
  validateJiraClientConfig,
  validateJiraHandlerConfig,
  validateFeedbackForSubmission,
  isJiraConfigured,
} from './jiraValidation.js';

// Integration handlers
export {
  createJiraHandler,
  createNextAppHandler,
  createNextPagesHandler,
  createExpressMiddleware,
  createGenericHandler,
  formatForJiraAutomation,
  formatForZapier,
} from './JiraIntegration.js';

// Default export - the main handler factory
export { createJiraHandler as default } from './JiraIntegration.js';
