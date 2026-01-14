/**
 * Jira Integration API Route
 *
 * Just import and use the handler from the library!
 *
 * Environment variables needed:
 * - JIRA_DOMAIN: yourcompany.atlassian.net
 * - JIRA_EMAIL: your-email@company.com
 * - JIRA_API_TOKEN: your-api-token
 * - JIRA_PROJECT_KEY: BUG (or your project key)
 */

import { createJiraNextAppHandler } from 'react-visual-feedback/server'

export const POST = createJiraNextAppHandler()
