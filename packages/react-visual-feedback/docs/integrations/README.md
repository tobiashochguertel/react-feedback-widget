# Integration Guide

> **Updated:** 2026-01-16  
> **Related:** [useIntegrations Hook](../hooks/useIntegrations.md)

## Overview

React Visual Feedback supports multiple integrations for storing and managing feedback. This guide covers built-in integrations and how to create custom ones.

## Quick Navigation

| Integration | Purpose | Documentation |
|-------------|---------|---------------|
| Jira | Create issues in Jira Cloud/Server | [jira.md](./jira.md) |
| Google Sheets | Append feedback to spreadsheets | [sheets.md](./sheets.md) |
| Custom Server | Send to your own API endpoint | [server.md](./server.md) |
| Custom Integration | Build your own integration | [custom.md](./custom.md) |

## Architecture

The integration system uses the **Strategy Pattern** for interchangeable integration behaviors:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FeedbackProvider                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              IntegrationFactory                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │  Jira   │  │ Sheets  │  │ Server  │  │ Custom  │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  │       │            │            │            │           │   │
│  │       └────────────┴────────────┴────────────┘           │   │
│  │                         │                                 │   │
│  │              Integration<TConfig, TResult>                │   │
│  │                     (Interface)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Interface

All integrations implement the `Integration` interface:

```typescript
interface Integration<TConfig = unknown, TResult = unknown> {
  /** Unique type identifier */
  readonly type: IntegrationType;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description of the integration */
  readonly description: string;
  
  /** Check if configured and ready */
  isConfigured(): boolean;
  
  /** Validate configuration */
  validateConfig(config: TConfig): ValidationResult;
  
  /** Submit feedback */
  submit(data: FeedbackData, options?: SubmissionOptions): Promise<SubmissionResult<TResult>>;
  
  /** Get configuration modal component */
  getConfigModal(): ComponentType<ConfigModalProps<TConfig>>;
  
  /** Get current configuration */
  getConfig(): TConfig | undefined;
  
  /** Update configuration */
  setConfig(config: TConfig): void;
}
```

## Basic Setup

### Provider Configuration

```tsx
import { FeedbackProvider } from 'react-visual-feedback';

function App() {
  return (
    <FeedbackProvider
      integrations={{
        jira: {
          domain: 'company.atlassian.net',
          projectKey: 'FEEDBACK',
          email: 'user@company.com',
          apiToken: process.env.JIRA_API_TOKEN,
        },
        sheets: {
          spreadsheetId: '1234567890abcdef',
          sheetName: 'Feedback',
          credentials: process.env.GOOGLE_SERVICE_ACCOUNT,
        },
      }}
      onIntegrationError={(type, error) => {
        console.error(`${type} integration error:`, error);
      }}
    >
      <YourApp />
    </FeedbackProvider>
  );
}
```

### Using the Hook

```tsx
import { useIntegrations } from 'react-visual-feedback';

function FeedbackSubmitter() {
  const { 
    connectedIntegrations,
    submitToJira,
    submitToSheets,
    submitToAll,
    isLoading,
  } = useIntegrations();

  const handleSubmit = async (feedback: FeedbackData) => {
    // Submit to all connected integrations
    const results = await submitToAll(feedback);
    
    results.forEach(result => {
      if (result.success) {
        console.log(`${result.type}: submitted successfully`);
      } else {
        console.error(`${result.type}: ${result.error}`);
      }
    });
  };

  return (
    <div>
      <p>{connectedIntegrations.length} integration(s) connected</p>
      <button onClick={handleSubmit} disabled={isLoading}>
        Submit Feedback
      </button>
    </div>
  );
}
```

## Integration Factory

Use the factory to dynamically create and manage integrations:

```typescript
import { IntegrationFactory, JiraIntegration, SheetsIntegration } from 'react-visual-feedback';

const factory = new IntegrationFactory();

// Register integrations
factory.register(JiraIntegration, {
  type: 'jira',
  name: 'Jira',
  description: 'Create issues in Jira Cloud',
});

factory.register(SheetsIntegration, {
  type: 'sheets',
  name: 'Google Sheets',
  description: 'Append to spreadsheet',
});

// Create instance
const jira = factory.create('jira', jiraConfig);

// Check availability
const available = factory.getAvailable(); // ['jira', 'sheets']
factory.has('jira'); // true

// Get metadata
const metadata = factory.getMetadata('jira');
// { type: 'jira', name: 'Jira', description: '...' }
```

## Validation

Integrations validate their configuration before use:

```typescript
const validation = integration.validateConfig({
  domain: 'company.atlassian.net',
  projectKey: '', // Missing required field
});

if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`);
    // projectKey: Project key is required
  });
}
```

## Submission Options

Configure submission behavior:

```typescript
const result = await integration.submit(feedbackData, {
  retry: true,        // Enable automatic retry
  maxRetries: 3,      // Maximum retry attempts
  timeout: 30000,     // Timeout in milliseconds
});
```

## Submission Result

All integrations return a consistent result structure:

```typescript
interface SubmissionResult<TData = unknown> {
  success: boolean;
  data?: TData;       // Integration-specific result
  error?: string;     // Error message
  errorCode?: string; // Programmatic error code
}

// Jira example
const jiraResult: SubmissionResult<JiraIssueResponse> = {
  success: true,
  data: {
    key: 'PROJ-123',
    id: '10001',
    self: 'https://company.atlassian.net/rest/api/3/issue/10001',
  },
};

// Sheets example
const sheetsResult: SubmissionResult<SheetsAppendResult> = {
  success: true,
  data: {
    spreadsheetId: '1234567890',
    updatedRange: 'Feedback!A15:H15',
    updatedRows: 1,
  },
};
```

## Error Handling

Handle integration errors gracefully:

```tsx
import { useIntegrations } from 'react-visual-feedback';

function ErrorAwareFeedback() {
  const { submitToAll } = useIntegrations({
    onSubmitError: (type, error) => {
      // Log to error tracking
      Sentry.captureException(error, {
        tags: { integration: type },
      });
      
      // Show user-friendly message
      toast.error(`Failed to submit to ${type}: ${error.message}`);
    },
  });

  const handleSubmit = async (data) => {
    try {
      const results = await submitToAll(data);
      
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        // Partial failure - some integrations succeeded
        toast.warning(`${failures.length} integration(s) failed`);
      }
    } catch (error) {
      // Total failure - no integrations worked
      toast.error('Failed to submit feedback');
    }
  };
}
```

## Environment Variables

Best practice for storing credentials:

```bash
# .env.local (never commit!)
JIRA_DOMAIN=company.atlassian.net
JIRA_EMAIL=feedback-bot@company.com
JIRA_API_TOKEN=your-api-token-here
JIRA_PROJECT_KEY=FEEDBACK

GOOGLE_SPREADSHEET_ID=1234567890abcdef
GOOGLE_SERVICE_ACCOUNT={"type":"service_account",...}
```

```tsx
// Access in Next.js
<FeedbackProvider
  integrations={{
    jira: {
      domain: process.env.NEXT_PUBLIC_JIRA_DOMAIN,
      // API token should only be used server-side!
    },
  }}
>
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never expose API tokens in client-side code**
   - Use server-side endpoints to proxy API calls
   - Keep credentials in environment variables

2. **Use OAuth where possible**
   - Jira Cloud supports OAuth 2.0
   - Google Sheets supports OAuth 2.0 for user-level access

3. **Validate input before submission**
   - Sanitize feedback content
   - Limit file sizes for attachments

4. **Implement rate limiting**
   - Prevent abuse of integration APIs
   - Handle rate limit errors gracefully

## Integration Comparison

| Feature | Jira | Sheets | Server | Custom |
|---------|------|--------|--------|--------|
| Setup Complexity | Medium | Medium | Low | Variable |
| OAuth Support | ✅ | ✅ | N/A | Optional |
| File Attachments | ✅ | ❌ | ✅ | Optional |
| Bidirectional Sync | ✅ | ❌ | ✅ | Optional |
| Offline Support | ❌ | ❌ | ❌ | Optional |
| Custom Fields | ✅ | ✅ | ✅ | ✅ |

## Next Steps

- [Configure Jira Integration](./jira.md)
- [Configure Google Sheets Integration](./sheets.md)
- [Set Up Custom Server](./server.md)
- [Build a Custom Integration](./custom.md)

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
