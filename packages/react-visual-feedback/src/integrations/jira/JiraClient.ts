/**
 * Jira Cloud REST API Client
 *
 * Handles all communication with the Jira REST API.
 *
 * @module integrations/jira/JiraClient
 */

import type {
  JiraClientConfig,
  JiraIssueResponse,
  JiraIssueFullResponse,
  JiraTransitionsResponse,
  JiraAttachmentResponse,
} from './jiraTypes.js';

/**
 * Jira Cloud REST API client.
 *
 * Provides methods for interacting with Jira Cloud API v3.
 *
 * @example
 * ```typescript
 * const client = new JiraClient({
 *   domain: 'company.atlassian.net',
 *   email: 'user@company.com',
 *   apiToken: 'your-api-token',
 *   projectKey: 'PROJ'
 * });
 *
 * const issue = await client.createIssue({ fields: { ... } });
 * console.log(`Created issue: ${issue.key}`);
 * ```
 */
export class JiraClient {
  private domain: string;
  private email: string;
  private apiToken: string;
  private baseUrl: string;
  private authHeader: string;

  /** Default project key for issue creation */
  public projectKey: string;

  /**
   * Create a new Jira client.
   *
   * @param config - Client configuration
   * @throws Error if required configuration is missing
   */
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
   * Make authenticated request to Jira API.
   *
   * @param endpoint - API endpoint (e.g., '/issue')
   * @param options - Fetch options
   * @returns Response data or null for empty responses
   * @throws Error if request fails
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
   * Create a new issue.
   *
   * @param issueData - Issue data in Jira format
   * @returns Created issue with key and ID
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
   * Get issue details.
   *
   * @param issueKey - Issue key (e.g., 'PROJ-123')
   * @returns Full issue details
   */
  async getIssue(issueKey: string): Promise<JiraIssueFullResponse> {
    const result = await this.request<JiraIssueFullResponse>(`/issue/${issueKey}`);
    if (!result) {
      throw new Error(`Failed to get Jira issue: ${issueKey}`);
    }
    return result;
  }

  /**
   * Update issue status via transition.
   *
   * @param issueKey - Issue key
   * @param transitionName - Target status/transition name
   * @returns Transition result
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
   * Add attachment to issue.
   *
   * @param issueKey - Issue key
   * @param filename - Attachment filename
   * @param content - File content (Buffer, base64 string, or Uint8Array)
   * @param contentType - MIME type
   * @returns Attachment details
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
   * Add comment to issue.
   *
   * @param issueKey - Issue key
   * @param comment - Comment text
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
   * Get issue status.
   *
   * @param issueKey - Issue key
   * @returns Current status name
   */
  async getIssueStatus(issueKey: string): Promise<string> {
    const issue = await this.getIssue(issueKey);
    return issue.fields.status.name;
  }

  /**
   * Get domain (for URL building).
   *
   * @returns Jira domain
   */
  getDomain(): string {
    return this.domain;
  }
}
