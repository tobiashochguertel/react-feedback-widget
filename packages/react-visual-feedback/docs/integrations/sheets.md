# Google Sheets Integration

> **Updated:** 2026-01-16  
> **Related:** [Integration Guide](./README.md), [useIntegrations Hook](../hooks/useIntegrations.md)

## Overview

Append feedback to Google Sheets for easy tracking and analysis. Supports both Service Account and OAuth 2.0 authentication.

## Prerequisites

- Google Cloud Project with Sheets API enabled
- Spreadsheet with appropriate sharing permissions
- Service Account credentials (server-side) or OAuth 2.0 setup (client-side)

## Quick Start

```tsx
import { FeedbackProvider } from 'react-visual-feedback';

function App() {
  return (
    <FeedbackProvider
      integrations={{
        sheets: {
          spreadsheetId: '1234567890abcdef',
          sheetName: 'Feedback',
          credentials: process.env.GOOGLE_SERVICE_ACCOUNT,
        },
      }}
    >
      <YourApp />
    </FeedbackProvider>
  );
}
```

## Configuration

### SheetsClientConfig

```typescript
interface SheetsClientConfig {
  /** Google Spreadsheet ID (from URL) */
  spreadsheetId?: string;
  
  /** Sheet/tab name within the spreadsheet */
  sheetName?: string;
  
  /** Service account credentials (JSON string or object) */
  credentials?: string | GoogleServiceAccountCredentials;
  
  /** Custom column mapping */
  columns?: SheetColumnsMap;
  
  /** Custom column order */
  columnOrder?: string[];
}
```

### OAuth Configuration

```typescript
interface SheetsOAuthClientConfig extends Omit<SheetsClientConfig, 'credentials'> {
  /** Enable OAuth mode */
  oauth: true;
  
  /** OAuth client ID from Google Cloud Console */
  clientId?: string;
  
  /** OAuth client secret */
  clientSecret?: string;
  
  /** OAuth redirect URI */
  redirectUri?: string;
  
  /** Function to retrieve stored tokens */
  getStoredTokens?: () => Promise<OAuthStoredTokens | null>;
  
  /** Function to store new tokens */
  storeTokens?: (tokens: OAuthStoredTokens) => Promise<void>;
}
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `spreadsheetId` | string | Yes | Spreadsheet ID from URL |
| `sheetName` | string | No | Tab name (default: first sheet) |
| `credentials` | object/string | Yes* | Service account credentials |
| `columns` | object | No | Custom column mapping |
| `columnOrder` | string[] | No | Column order preference |

*Required for Service Account auth; OAuth uses tokens instead.

## Authentication Methods

### Service Account (Server-Side)

Best for automated submissions without user interaction.

#### 1. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable Google Sheets API
4. Go to IAM & Admin > Service Accounts
5. Create service account
6. Generate JSON key

#### 2. Share Spreadsheet

Share the spreadsheet with the service account email:
- Find email in credentials JSON (`client_email`)
- Add as Editor on the spreadsheet

#### 3. Configure Integration

```typescript
const sheetsConfig = {
  spreadsheetId: '1234567890abcdef',
  sheetName: 'Feedback',
  credentials: {
    type: 'service_account',
    project_id: 'your-project',
    private_key_id: '...',
    private_key: '-----BEGIN PRIVATE KEY-----\n...',
    client_email: 'feedback@your-project.iam.gserviceaccount.com',
    client_id: '...',
    // ... other fields
  },
};
```

⚠️ **Security:** Store credentials in environment variables, never in code.

### OAuth 2.0 (Client-Side)

Best for user-authenticated access.

```tsx
import { useIntegrations } from 'react-visual-feedback';

function SheetsOAuthSetup() {
  const { sheets } = useIntegrations();

  const handleOAuthConnect = async () => {
    await sheets.connect({
      spreadsheetId: '1234567890abcdef',
      sheetName: 'Feedback',
      oauth: true,
      clientId: 'your-oauth-client-id.apps.googleusercontent.com',
      redirectUri: `${window.location.origin}/oauth/sheets/callback`,
    });
  };

  return (
    <button onClick={handleOAuthConnect}>
      Connect with Google Sheets
    </button>
  );
}
```

## Column Mapping

Customize how feedback data maps to spreadsheet columns:

```typescript
interface SheetColumnsMap {
  /** Timestamp column */
  timestamp?: string;
  /** Feedback type column */
  type?: string;
  /** Title/summary column */
  title?: string;
  /** Description column */
  description?: string;
  /** Screenshot URL column */
  screenshot?: string;
  /** Recording URL column */
  recording?: string;
  /** User info column */
  user?: string;
  /** Browser info column */
  browser?: string;
  /** Page URL column */
  url?: string;
  /** Status column */
  status?: string;
}

// Example configuration
const sheetsConfig = {
  spreadsheetId: '1234567890abcdef',
  columns: {
    timestamp: 'A',
    type: 'B',
    title: 'C',
    description: 'D',
    screenshot: 'E',
    user: 'F',
    browser: 'G',
    url: 'H',
    status: 'I',
  },
};
```

## Column Order

Specify the order of columns:

```typescript
const sheetsConfig = {
  spreadsheetId: '1234567890abcdef',
  columnOrder: [
    'timestamp',
    'type',
    'title',
    'description',
    'screenshot',
    'recording',
    'user',
    'browser',
    'url',
    'status',
  ],
};
```

## Spreadsheet Setup

### Recommended Headers

Create a spreadsheet with these column headers:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Timestamp | Type | Title | Description | Screenshot | User | Browser | URL | Status |

### Auto-Create Headers

The integration can auto-create headers on first submission:

```typescript
const sheetsConfig = {
  spreadsheetId: '1234567890abcdef',
  autoCreateHeaders: true,
  headerRow: 1, // Row number for headers
};
```

## Data Formatting

### Timestamp Format

```typescript
const sheetsConfig = {
  // ...
  formatting: {
    timestamp: 'YYYY-MM-DD HH:mm:ss', // ISO format
    // or
    timestamp: 'locale', // Use user's locale
  },
};
```

### Cell Formatting

```typescript
const sheetsConfig = {
  // ...
  formatting: {
    // Wrap text in description column
    description: { wrapText: true },
    // Format status as colored badge (requires Apps Script)
    status: { conditional: true },
  },
};
```

## Screenshot Handling

Screenshots can be stored in different ways:

### 1. Google Drive Upload

Upload to Drive and insert link:

```typescript
const sheetsConfig = {
  // ...
  screenshotStorage: 'drive',
  driveFolderId: 'your-folder-id', // Optional: specific folder
};
```

### 2. External URL

Store externally and insert URL:

```typescript
const sheetsConfig = {
  // ...
  screenshotStorage: 'external',
  screenshotUploader: async (blob) => {
    // Upload to your storage
    const url = await uploadToStorage(blob);
    return url;
  },
};
```

### 3. Base64 in Cell

Insert base64 data directly (not recommended for large images):

```typescript
const sheetsConfig = {
  // ...
  screenshotStorage: 'inline',
  maxInlineSize: 50000, // Max base64 length
};
```

## Using with Apps Script

Extend functionality with Google Apps Script:

```javascript
// Code.gs
function onEdit(e) {
  // Auto-notify on status change
  if (e.range.getColumn() === 9) { // Status column
    const newStatus = e.value;
    const row = e.range.getRow();
    const email = e.source.getRange(row, 6).getValue();
    
    if (email && newStatus === 'Resolved') {
      GmailApp.sendEmail(email, 'Feedback Update', 
        'Your feedback has been resolved!');
    }
  }
}

function appendFeedback(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Feedback');
  
  sheet.appendRow([
    new Date(),
    data.type,
    data.title,
    data.description,
    data.screenshot,
    data.user,
    data.browser,
    data.url,
    'New',
  ]);
  
  return { success: true, row: sheet.getLastRow() };
}
```

Configure to use Apps Script endpoint:

```typescript
const sheetsConfig = {
  mode: 'apps_script',
  scriptUrl: 'https://script.google.com/macros/s/.../exec',
};
```

## Batch Append

Optimize for multiple submissions:

```typescript
import { useIntegrations, useFeedbackSubmission } from 'react-visual-feedback';

function BatchSubmit() {
  const { sheets } = useIntegrations();
  const { queue, submit } = useFeedbackSubmission();

  // Queue multiple feedback items
  const queueFeedback = (data) => {
    submit(data);
  };

  // Batch submit all queued items
  const submitBatch = async () => {
    const results = await sheets.batchAppend(queue.map(q => q.data));
    console.log(`Submitted ${results.updatedRows} rows`);
  };
}
```

## Error Handling

Handle Sheets-specific errors:

```tsx
import { useIntegrations } from 'react-visual-feedback';

function SheetsSubmit() {
  const { submitToSheets } = useIntegrations();

  const handleSubmit = async (feedback) => {
    const result = await submitToSheets(feedback);

    if (!result.success) {
      switch (result.errorCode) {
        case 'UNAUTHORIZED':
          toast.error('Google authentication expired. Please reconnect.');
          break;
        case 'SPREADSHEET_NOT_FOUND':
          toast.error('Spreadsheet not found. Check configuration.');
          break;
        case 'PERMISSION_DENIED':
          toast.error('No access to spreadsheet. Share with service account.');
          break;
        case 'QUOTA_EXCEEDED':
          toast.warning('API quota exceeded. Try again later.');
          break;
        case 'SHEET_NOT_FOUND':
          toast.error('Sheet tab not found. Check sheet name.');
          break;
        default:
          toast.error(`Sheets error: ${result.error}`);
      }
      return;
    }

    toast.success(`Added to row ${result.data.updatedRange}`);
  };
}
```

## Server-Side Proxy

For production, proxy Sheets API calls through your server:

```typescript
// pages/api/sheets/append.ts (Next.js example)
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { feedback } = req.body;

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Feedback!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          feedback.type,
          feedback.title,
          feedback.description,
          feedback.screenshot || '',
          feedback.user || '',
          feedback.browser || '',
          feedback.url || '',
          'New',
        ]],
      },
    });

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

```tsx
// Client-side usage
<FeedbackProvider
  integrations={{
    sheets: {
      endpoint: '/api/sheets/append',
      mode: 'server', // Use server proxy
    },
  }}
>
```

## Testing

Mock Sheets integration in tests:

```tsx
import { renderHook } from '@testing-library/react';
import { FeedbackProvider, useIntegrations } from 'react-visual-feedback';

const mockSheetsIntegration = {
  type: 'sheets',
  isConfigured: () => true,
  submit: vi.fn().mockResolvedValue({
    success: true,
    data: {
      spreadsheetId: '123',
      updatedRange: 'Feedback!A10:I10',
      updatedRows: 1,
    },
  }),
};

describe('Sheets Integration', () => {
  test('submits feedback to Sheets', async () => {
    const wrapper = ({ children }) => (
      <FeedbackProvider customIntegrations={[mockSheetsIntegration]}>
        {children}
      </FeedbackProvider>
    );

    const { result } = renderHook(() => useIntegrations(), { wrapper });

    const submitResult = await result.current.submitToSheets({
      type: 'bug',
      title: 'Test Bug',
      description: 'Test description',
    });

    expect(submitResult.success).toBe(true);
    expect(submitResult.data.updatedRows).toBe(1);
  });
});
```

## Troubleshooting

### Issue: 403 Permission Denied

**Cause:** Service account doesn't have access to spreadsheet.

**Solution:**
1. Share spreadsheet with service account email
2. Grant "Editor" access
3. Wait a few minutes for permissions to propagate

### Issue: 404 Spreadsheet Not Found

**Cause:** Invalid spreadsheet ID or access issue.

**Solution:**
1. Verify spreadsheet ID from URL: `docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/`
2. Ensure spreadsheet exists
3. Check service account has access

### Issue: Sheet Tab Not Found

**Cause:** Specified sheet name doesn't exist.

**Solution:**
1. Check exact sheet/tab name (case-sensitive)
2. Use default sheet by omitting `sheetName`
3. Create the tab if it doesn't exist

### Issue: Quota Exceeded

**Cause:** Hit Google Sheets API rate limits.

**Solution:**
1. Implement request batching
2. Add retry with exponential backoff
3. Upgrade to higher quota tier if needed

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
