# Jira Integration

> **Updated:** 2026-01-16  
> **Related:** [Integration Guide](./README.md), [useIntegrations Hook](../hooks/useIntegrations.md)

## Overview

Connect feedback directly to Jira Cloud or Jira Server to create and manage issues.

## Prerequisites

- Jira Cloud or Data Center instance
- API token with appropriate permissions (or OAuth 2.0 setup)
- Project key for issue creation

## Quick Start

```tsx
import { FeedbackProvider } from 'react-visual-feedback';

function App() {
  return (
    <FeedbackProvider
      integrations={{
        jira: {
          domain: 'company.atlassian.net',
          email: 'user@company.com',
          apiToken: 'your-api-token',
          projectKey: 'FEEDBACK',
        },
      }}
    >
      <YourApp />
    </FeedbackProvider>
  );
}
```

## Configuration

### JiraHandlerConfig

```typescript
interface JiraHandlerConfig extends JiraClientConfig {
  /** Jira domain (e.g., 'company.atlassian.net') */
  domain?: string;
  
  /** Jira user email */
  email?: string;
  
  /** Jira API token */
  apiToken?: string;
  
  /** Default project key for issue creation */
  projectKey?: string;
  
  /** Custom field mapping */
  fields?: JiraFieldsMap;
  
  /** Additional custom fields to include */
  customFields?: Record<string, unknown>;
  
  /** Whether to include priority in issues (default: true) */
  includePriority?: boolean;
  
  /** Whether to upload attachments (default: true) */
  uploadAttachments?: boolean;
  
  /** Status mapping for bidirectional sync */
  statusMapping?: {
    toJira?: Record<string, string>;
    fromJira?: Record<string, string>;
  };
}
```

### Required Fields

| Option | Type | Description |
|--------|------|-------------|
| `domain` | string | Jira instance domain (e.g., `company.atlassian.net`) |
| `email` | string | User email for authentication |
| `apiToken` | string | Jira API token ([create one](https://id.atlassian.com/manage-profile/security/api-tokens)) |
| `projectKey` | string | Project key for issues (e.g., `PROJ`) |

### Optional Fields

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fields` | JiraFieldsMap | - | Custom field name mappings |
| `customFields` | object | - | Additional custom fields |
| `includePriority` | boolean | `true` | Include priority in issues |
| `uploadAttachments` | boolean | `true` | Upload screenshots/videos |
| `statusMapping` | object | - | Status sync mapping |

## Authentication Methods

### API Token (Recommended for Server-Side)

```typescript
const jiraConfig = {
  domain: 'company.atlassian.net',
  email: 'feedback-bot@company.com',
  apiToken: process.env.JIRA_API_TOKEN,
  projectKey: 'FEEDBACK',
};
```

⚠️ **Security:** Never expose API tokens in client-side code. Use server-side endpoints to proxy Jira API calls.

### OAuth 2.0 (Recommended for Client-Side)

```tsx
import { useIntegrations } from 'react-visual-feedback';

function JiraOAuthSetup() {
  const { jira } = useIntegrations();

  const handleOAuthConnect = async () => {
    await jira.connect({
      domain: 'company.atlassian.net',
      projectKey: 'FEEDBACK',
      // OAuth flow will be initiated
      oauth: {
        clientId: 'your-oauth-client-id',
        redirectUri: `${window.location.origin}/oauth/jira/callback`,
        scopes: ['read:jira-work', 'write:jira-work'],
      },
    });
  };

  return (
    <button onClick={handleOAuthConnect}>
      Connect with Jira
    </button>
  );
}
```

## Custom Field Mapping

Map feedback fields to Jira custom fields:

```typescript
const jiraConfig = {
  domain: 'company.atlassian.net',
  email: 'user@company.com',
  apiToken: 'your-token',
  projectKey: 'FEEDBACK',
  fields: {
    summary: 'summary',           // Standard field
    description: 'description',   // Standard field
    issuetype: 'Bug',             // Default issue type
    priority: 'Medium',           // Default priority
    labels: 'labels',             // Standard field
  },
  customFields: {
    // Map to Jira custom field IDs
    'customfield_10001': 'Browser Info',
    'customfield_10002': 'Screen Resolution',
    'customfield_10003': 'User Agent',
  },
};
```

### Finding Custom Field IDs

1. Go to Jira Project Settings > Issue Types > Fields
2. Or use the API: `GET /rest/api/3/field`

## Issue Type Configuration

Set the default issue type:

```typescript
const jiraConfig = {
  // ...
  fields: {
    issuetype: 'Bug', // or 'Task', 'Story', 'Feature Request', etc.
  },
};
```

### Dynamic Issue Types

```tsx
import { useIntegrations } from 'react-visual-feedback';

function DynamicIssueType() {
  const { jira, submitToJira } = useIntegrations();

  const handleSubmit = async (feedback, issueType) => {
    // Temporarily update config
    jira.updateConfig({
      fields: { issuetype: issueType },
    });

    const result = await submitToJira(feedback);
    return result;
  };

  return (
    <div>
      <button onClick={() => handleSubmit(data, 'Bug')}>Report Bug</button>
      <button onClick={() => handleSubmit(data, 'Feature Request')}>Request Feature</button>
    </div>
  );
}
```

## Attachments

By default, screenshots and recordings are uploaded as attachments:

```typescript
const jiraConfig = {
  // ...
  uploadAttachments: true, // Default

  // Control what gets attached
  attachmentTypes: {
    screenshot: true,
    recording: true,
    consoleLogs: true,
    networkLogs: false,
  },
};
```

### Attachment Size Limits

- Jira Cloud: 10 MB per attachment
- Jira Server: Configurable (default 10 MB)

## Priority Mapping

Map feedback severity to Jira priority:

```typescript
const jiraConfig = {
  // ...
  includePriority: true,
  priorityMapping: {
    // Feedback type -> Jira priority
    bug: 'High',
    feature: 'Medium',
    improvement: 'Medium',
    general: 'Low',
  },
};
```

## Status Synchronization

Enable bidirectional status sync:

```typescript
const jiraConfig = {
  // ...
  statusMapping: {
    // Local status -> Jira status
    toJira: {
      'pending': 'To Do',
      'in-progress': 'In Progress',
      'resolved': 'Done',
    },
    // Jira status -> Local status
    fromJira: {
      'To Do': 'pending',
      'In Progress': 'in-progress',
      'Done': 'resolved',
      'Closed': 'resolved',
    },
  },
};
```

## Labels

Add labels to created issues:

```typescript
const jiraConfig = {
  // ...
  defaultLabels: ['user-feedback', 'from-widget'],
  
  // Dynamic labels based on feedback type
  labelMapping: {
    bug: ['bug-report'],
    feature: ['feature-request'],
  },
};
```

## Components

Assign issues to components:

```typescript
const jiraConfig = {
  // ...
  defaultComponents: ['Frontend', 'User Experience'],
};
```

## Error Handling

Handle Jira-specific errors:

```tsx
import { useIntegrations } from 'react-visual-feedback';

function JiraSubmit() {
  const { submitToJira } = useIntegrations();

  const handleSubmit = async (feedback) => {
    const result = await submitToJira(feedback);

    if (!result.success) {
      switch (result.errorCode) {
        case 'UNAUTHORIZED':
          toast.error('Jira authentication failed. Please reconnect.');
          break;
        case 'PROJECT_NOT_FOUND':
          toast.error('Jira project not found. Check configuration.');
          break;
        case 'RATE_LIMITED':
          toast.warning('Too many requests. Please wait and try again.');
          break;
        case 'ATTACHMENT_TOO_LARGE':
          toast.warning('Attachment exceeds size limit.');
          break;
        default:
          toast.error(`Jira error: ${result.error}`);
      }
      return;
    }

    toast.success(`Created issue: ${result.data.key}`);
  };
}
```

## Server-Side Proxy

For production, proxy Jira API calls through your server:

```typescript
// pages/api/jira/create-issue.ts (Next.js example)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { feedback } = req.body;

  const response = await fetch(
    `https://${process.env.JIRA_DOMAIN}/rest/api/3/issue`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: process.env.JIRA_PROJECT_KEY },
          summary: feedback.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: feedback.description }],
              },
            ],
          },
          issuetype: { name: 'Bug' },
        },
      }),
    }
  );

  const data = await response.json();
  return res.status(response.status).json(data);
}
```

```tsx
// Client-side usage
<FeedbackProvider
  integrations={{
    jira: {
      endpoint: '/api/jira/create-issue',
      mode: 'server', // Use server proxy
    },
  }}
>
```

## Testing

Mock Jira integration in tests:

```tsx
import { renderHook } from '@testing-library/react';
import { FeedbackProvider, useIntegrations } from 'react-visual-feedback';

const mockJiraIntegration = {
  type: 'jira',
  isConfigured: () => true,
  submit: vi.fn().mockResolvedValue({
    success: true,
    data: { key: 'TEST-123', id: '10001' },
  }),
};

describe('Jira Integration', () => {
  test('submits feedback to Jira', async () => {
    const wrapper = ({ children }) => (
      <FeedbackProvider customIntegrations={[mockJiraIntegration]}>
        {children}
      </FeedbackProvider>
    );

    const { result } = renderHook(() => useIntegrations(), { wrapper });

    const submitResult = await result.current.submitToJira({
      type: 'bug',
      title: 'Test Bug',
      description: 'Test description',
    });

    expect(submitResult.success).toBe(true);
    expect(submitResult.data.key).toBe('TEST-123');
  });
});
```

## Troubleshooting

### Issue: 401 Unauthorized

**Cause:** Invalid email/API token combination.

**Solution:**
1. Verify email matches the account that created the token
2. Regenerate API token at [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
3. Ensure token hasn't expired

### Issue: 403 Forbidden

**Cause:** User lacks permissions for the project.

**Solution:**
1. Check user has "Create Issues" permission in Jira
2. Verify project key is correct
3. Ensure account type (atlassian vs. Google) is correct

### Issue: 404 Project Not Found

**Cause:** Project key doesn't exist or user can't access it.

**Solution:**
1. Verify project key in Jira (case-sensitive)
2. Check user can view the project

### Issue: Large Attachments Fail

**Cause:** Attachment exceeds Jira's size limit.

**Solution:**
1. Reduce screenshot quality
2. Limit recording duration
3. Compress attachments before upload

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
