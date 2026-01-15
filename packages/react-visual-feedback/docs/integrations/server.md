# Server Integration

> **Updated:** 2026-01-16
> **Related:** [Integration Guide](./README.md), [Jira Integration](./jira.md), [Sheets Integration](./sheets.md)

## Overview

Server-side handlers for Jira and Google Sheets integrations. These handlers keep credentials secure and provide server-to-server communication with external APIs.

## Why Server-Side?

- **Security:** API tokens and credentials never exposed to client
- **CORS:** Avoid cross-origin issues with external APIs
- **Rate Limiting:** Control and throttle requests centrally
- **Validation:** Server-side validation before sending to external services
- **Auditing:** Log all submissions for compliance

## Quick Start

### Next.js App Router

```typescript
// app/api/feedback/jira/route.ts
import { createJiraNextAppHandler } from 'react-visual-feedback/server';

export const POST = createJiraNextAppHandler({
  host: process.env.JIRA_HOST!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: 'BUG',
});
```

### Next.js Pages Router

```typescript
// pages/api/feedback/jira.ts
import { createJiraNextPagesHandler } from 'react-visual-feedback/server';

export default createJiraNextPagesHandler({
  host: process.env.JIRA_HOST!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: 'BUG',
});
```

### Express.js

```typescript
import express from 'express';
import { createJiraMiddleware } from 'react-visual-feedback/server';

const app = express();
app.use(express.json());

app.post('/api/feedback/jira', createJiraMiddleware({
  host: process.env.JIRA_HOST!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: 'BUG',
}));
```

## Available Exports

Import from `'react-visual-feedback/server'`:

### Jira Handlers

| Export | Description |
|--------|-------------|
| `JiraClient` | Low-level Jira API client |
| `createJiraHandler` | Generic handler function |
| `createJiraNextAppHandler` | Next.js App Router handler |
| `createJiraNextPagesHandler` | Next.js Pages Router handler |
| `createJiraMiddleware` | Express middleware |
| `formatForJiraAutomation` | Format data for Jira Automation |
| `formatJiraForZapier` | Format data for Zapier integration |
| `formatEventLogs` | Format console/event logs |

### Sheets Handlers

| Export | Description |
|--------|-------------|
| `SheetsClient` | Low-level Sheets API client |
| `SheetsOAuthClient` | OAuth-based Sheets client |
| `createSheetsHandler` | Generic handler function |
| `createSheetsNextAppHandler` | Next.js App Router handler |
| `createSheetsNextPagesHandler` | Next.js Pages Router handler |
| `createSheetsMiddleware` | Express middleware |
| `getAppsScriptTemplate` | Google Apps Script template |
| `formatSheetsForZapier` | Format data for Zapier |

### Configuration Helpers

| Export | Description |
|--------|-------------|
| `DEFAULT_SHEET_COLUMNS` | Default column mapping |
| `DEFAULT_SHEET_COLUMN_ORDER` | Default column order |
| `mergeSheetColumns` | Merge custom columns with defaults |
| `feedbackToSheetRow` | Convert feedback to sheet row |
| `getSheetHeaders` | Get column headers |
| `DEFAULT_JIRA_FIELDS` | Default Jira field mapping |
| `DEFAULT_JIRA_STATUS_MAPPING` | Status mapping defaults |
| `mergeJiraFields` | Merge custom fields with defaults |
| `feedbackToJiraIssue` | Convert feedback to Jira issue |
| `mapJiraStatusToLocal` | Map Jira status to local |
| `mapLocalStatusToJira` | Map local status to Jira |
| `INTEGRATION_TYPES` | Available integration types |

## Combined Handler

Use a single endpoint for multiple integrations:

```typescript
import { createCombinedHandler } from 'react-visual-feedback/server';

// Create combined handler
const handler = createCombinedHandler({
  jira: {
    host: process.env.JIRA_HOST!,
    email: process.env.JIRA_EMAIL!,
    apiToken: process.env.JIRA_API_TOKEN!,
    projectKey: 'BUG',
  },
  sheets: {
    spreadsheetId: process.env.SHEETS_ID!,
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
  },
});

// Next.js App Router
export const POST = handler;
```

### Client Usage

Specify integration in request body:

```typescript
// Submit to Jira
fetch('/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    integration: 'jira',
    title: 'Bug Report',
    description: 'Details here...',
    // ...feedback data
  }),
});

// Submit to Sheets
fetch('/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    integration: 'sheets',
    title: 'Feature Request',
    // ...feedback data
  }),
});
```

## Multi-Handler Setup

Create handlers separately for more control:

```typescript
import {
  createIntegrationHandlers,
  type IntegrationHandlersConfig,
} from 'react-visual-feedback/server';

const config: IntegrationHandlersConfig = {
  jira: {
    host: process.env.JIRA_HOST!,
    email: process.env.JIRA_EMAIL!,
    apiToken: process.env.JIRA_API_TOKEN!,
    projectKey: 'BUG',
  },
  sheets: {
    spreadsheetId: process.env.SHEETS_ID!,
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
  },
};

async function handleFeedback(feedback) {
  const handlers = await createIntegrationHandlers(config);

  // Submit to both
  const [jiraResult, sheetsResult] = await Promise.all([
    handlers.jira?.(feedback),
    handlers.sheets?.(feedback),
  ]);

  return { jira: jiraResult, sheets: sheetsResult };
}
```

## Framework Examples

### Next.js App Router (Full Example)

```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createIntegrationHandlers,
} from 'react-visual-feedback/server';

const handlersPromise = createIntegrationHandlers({
  jira: {
    host: process.env.JIRA_HOST!,
    email: process.env.JIRA_EMAIL!,
    apiToken: process.env.JIRA_API_TOKEN!,
    projectKey: process.env.JIRA_PROJECT_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const feedback = await req.json();
    const handlers = await handlersPromise;

    const result = await handlers.jira?.(feedback);

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Submission failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      issueKey: result.issueKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Express.js (Full Example)

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import {
  createJiraMiddleware,
  createSheetsMiddleware,
} from 'react-visual-feedback/server';

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: '10mb' })); // For screenshots

// Jira endpoint
app.post('/api/feedback/jira', createJiraMiddleware({
  host: process.env.JIRA_HOST!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: 'BUG',
}));

// Sheets endpoint
app.post('/api/feedback/sheets', createSheetsMiddleware({
  spreadsheetId: process.env.SHEETS_ID!,
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
}));

// Error handler
app.use((err, req, res, next) => {
  console.error('Feedback error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.listen(3001);
```

### Fastify

```typescript
import Fastify from 'fastify';
import {
  createIntegrationHandlers,
} from 'react-visual-feedback/server';

const fastify = Fastify({ logger: true });

let handlers: Awaited<ReturnType<typeof createIntegrationHandlers>>;

fastify.addHook('onReady', async () => {
  handlers = await createIntegrationHandlers({
    jira: {
      host: process.env.JIRA_HOST!,
      email: process.env.JIRA_EMAIL!,
      apiToken: process.env.JIRA_API_TOKEN!,
      projectKey: 'BUG',
    },
  });
});

fastify.post('/api/feedback/jira', async (request, reply) => {
  const result = await handlers.jira?.(request.body);
  return result;
});

fastify.listen({ port: 3001 });
```

### Hono

```typescript
import { Hono } from 'hono';
import { createIntegrationHandlers } from 'react-visual-feedback/server';

const app = new Hono();

const handlersPromise = createIntegrationHandlers({
  jira: {
    host: process.env.JIRA_HOST!,
    email: process.env.JIRA_EMAIL!,
    apiToken: process.env.JIRA_API_TOKEN!,
    projectKey: 'BUG',
  },
});

app.post('/api/feedback/jira', async (c) => {
  const feedback = await c.req.json();
  const handlers = await handlersPromise;
  const result = await handlers.jira?.(feedback);
  return c.json(result);
});

export default app;
```

## Low-Level Clients

Use clients directly for custom implementations:

### JiraClient

```typescript
import { JiraClient } from 'react-visual-feedback/server';

const client = new JiraClient({
  host: 'your-domain.atlassian.net',
  email: 'you@example.com',
  apiToken: 'your-api-token',
});

// Create issue
const issue = await client.createIssue({
  projectKey: 'BUG',
  issueType: 'Bug',
  summary: 'Issue title',
  description: 'Issue description',
});

// Attach file
await client.addAttachment(issue.key, screenshot);

// Add comment
await client.addComment(issue.key, 'Additional context');
```

### SheetsClient

```typescript
import { SheetsClient } from 'react-visual-feedback/server';

const client = new SheetsClient({
  spreadsheetId: '1234567890abcdef',
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
});

// Append row
const result = await client.appendRow([
  new Date().toISOString(),
  'Bug',
  'Title',
  'Description',
]);

// Batch append
await client.batchAppend([
  ['2024-01-01', 'Bug', 'Bug 1', 'Desc 1'],
  ['2024-01-02', 'Feature', 'Feature 1', 'Desc 2'],
]);
```

## Middleware Options

### Request Validation

Add custom validation:

```typescript
import { createJiraHandler } from 'react-visual-feedback/server';

const jiraHandler = createJiraHandler({
  host: process.env.JIRA_HOST!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!,
  projectKey: 'BUG',

  // Custom validation
  validate: (feedback) => {
    if (!feedback.title) {
      return { valid: false, error: 'Title required' };
    }
    if (feedback.title.length < 10) {
      return { valid: false, error: 'Title too short' };
    }
    return { valid: true };
  },
});
```

### Rate Limiting

Implement rate limiting:

```typescript
import rateLimit from 'express-rate-limit';
import { createJiraMiddleware } from 'react-visual-feedback/server';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { error: 'Too many submissions, try again later' },
});

app.post(
  '/api/feedback/jira',
  limiter,
  createJiraMiddleware({ /* config */ })
);
```

### Authentication

Require authentication:

```typescript
// auth-middleware.ts
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// Usage
app.post(
  '/api/feedback/jira',
  requireAuth,
  createJiraMiddleware({ /* config */ })
);
```

## Error Handling

### Handler Errors

```typescript
const handler = createJiraHandler({
  // config...
  onError: (error, feedback) => {
    console.error('Jira submission failed:', error);
    // Send to error monitoring
    Sentry.captureException(error, {
      extra: { feedback },
    });
  },
});
```

### Response Types

```typescript
interface SubmissionResult {
  success: boolean;
  issueKey?: string; // Jira
  row?: number; // Sheets
  error?: string;
  errorCode?: string;
}
```

## Client Configuration

Configure client-side to use server endpoints:

```tsx
import { FeedbackProvider } from 'react-visual-feedback';

function App() {
  return (
    <FeedbackProvider
      integrations={{
        jira: {
          endpoint: '/api/feedback/jira',
          mode: 'server',
        },
        sheets: {
          endpoint: '/api/feedback/sheets',
          mode: 'server',
        },
      }}
    >
      <YourApp />
    </FeedbackProvider>
  );
}
```

## Testing Server Handlers

### Mock Handler

```typescript
import { vi } from 'vitest';

const mockJiraHandler = vi.fn().mockResolvedValue({
  success: true,
  issueKey: 'BUG-123',
});

// In test
vi.mock('react-visual-feedback/server', () => ({
  createJiraHandler: () => mockJiraHandler,
}));

// Assert
expect(mockJiraHandler).toHaveBeenCalledWith(
  expect.objectContaining({
    title: 'Test Bug',
  })
);
```

### Integration Test

```typescript
import request from 'supertest';
import app from './server';

describe('Feedback API', () => {
  test('POST /api/feedback/jira creates issue', async () => {
    const response = await request(app)
      .post('/api/feedback/jira')
      .send({
        title: 'Test Bug',
        description: 'Test description',
        type: 'bug',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.issueKey).toMatch(/^BUG-\d+$/);
  });
});
```

## Environment Variables

### Required Variables

```bash
# Jira
JIRA_HOST=your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=BUG

# Google Sheets
GOOGLE_SPREADSHEET_ID=1234567890abcdef
GOOGLE_CREDENTIALS='{"type":"service_account",...}'
```

### Validation

```typescript
// config.ts
const requiredEnv = [
  'JIRA_HOST',
  'JIRA_EMAIL',
  'JIRA_API_TOKEN',
  'JIRA_PROJECT_KEY',
] as const;

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Server-side handler timing out.

**Solution:**

- Increase timeout for API routes
- Use async screenshot upload
- Add retry logic

### Issue: Large Payload Rejected

**Cause:** Screenshot data too large for default limits.

**Solution:**

```typescript
// Next.js
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

// Express
app.use(express.json({ limit: '10mb' }));
```

### Issue: Handler Not Found

**Cause:** Import path incorrect.

**Solution:**

- Verify `react-visual-feedback/server` is the correct import
- Check package.json exports field
- Ensure build includes server exports

---

*Documentation compiled by GitHub Copilot*
*For project: react-visual-feedback*
