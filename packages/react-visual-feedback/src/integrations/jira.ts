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
 *
 * @deprecated Import from 'react-visual-feedback/integrations/jira' instead.
 * This file re-exports for backward compatibility.
 */

// Re-export everything from the modular structure
export * from './jira/index.js';

// Default export
export { default } from './jira/index.js';
