# Feedback Integrations Example (Next.js)

This example demonstrates all integration options for `react-visual-feedback`:

1. **Server Integration** - Jira API + Google Sheets API (via Service Account)
2. **Google Apps Script** - No server needed, runs on Google's infrastructure
3. **Zapier Webhooks** - No server needed, uses Zapier automation

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Setup Instructions

### Option 1: Server Integration (Jira + Sheets API)

This is the most feature-rich option with full control.

#### Jira Setup

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create an API token
3. Add to `.env.local`:

```env
JIRA_DOMAIN=yourcompany.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=BUG
```

#### Google Sheets Setup (Service Account)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to IAM & Admin → Service Accounts
   - Create Service Account
   - Download the JSON key
5. Share your Google Sheet with the service account email (found in the JSON)
6. Add to `.env.local`:

```env
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

The spreadsheet ID is in the URL:
`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### Option 2: Google Apps Script (No Server)

Perfect for simple setups without a backend.

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code and paste this:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "ID",
      "Feedback",
      "Type",
      "Status",
      "User Name",
      "User Email",
      "URL",
      "Viewport",
      "Screenshot",
      "Video",
    ]);
  }

  const row = [
    new Date().toISOString(),
    data.feedbackData?.id || "",
    data.feedbackData?.feedback || "",
    data.feedbackData?.type || "bug",
    data.feedbackData?.status || "new",
    data.feedbackData?.userName || "Anonymous",
    data.feedbackData?.userEmail || "",
    data.feedbackData?.url || "",
    data.feedbackData?.viewport
      ? data.feedbackData.viewport.width +
        "x" +
        data.feedbackData.viewport.height
      : "",
    data.feedbackData?.screenshot ? "Yes" : "No",
    data.feedbackData?.video ? "Yes" : "No",
  ];

  sheet.appendRow(row);

  return ContentService.createTextOutput(
    JSON.stringify({ success: true, row: sheet.getLastRow() }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "ok" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy → New deployment**
5. Select type: **Web app**
6. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** and copy the URL
8. Add to `.env.local`:

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

### Option 3: Zapier Webhooks (No Server)

Perfect for connecting to any app Zapier supports.

#### Jira via Zapier

1. Go to [Zapier](https://zapier.com) and create an account
2. Create a new Zap:
   - **Trigger**: Webhooks by Zapier → Catch Hook
   - **Action**: Jira Software Cloud → Create Issue
3. Map the fields:
   - Summary: `{{feedback}}`
   - Description: `{{feedback}}\n\nUser: {{user_name}}\nURL: {{page_url}}`
   - Issue Type: Bug (or use `{{type}}`)
4. Copy the webhook URL
5. Add to `.env.local`:

```env
NEXT_PUBLIC_ZAPIER_JIRA_WEBHOOK=https://hooks.zapier.com/hooks/catch/123456/abcdef
```

#### Google Sheets via Zapier

1. Create another Zap:
   - **Trigger**: Webhooks by Zapier → Catch Hook
   - **Action**: Google Sheets → Create Spreadsheet Row
2. Map the fields to columns
3. Copy the webhook URL
4. Add to `.env.local`:

```env
NEXT_PUBLIC_ZAPIER_SHEETS_WEBHOOK=https://hooks.zapier.com/hooks/catch/123456/ghijkl
```

## Testing

1. Run `npm run dev`
2. Open http://localhost:3000
3. Use the dropdown in the top-left to select integration type
4. Press `Alt+Q` to select an element and submit feedback
5. Check your Jira project and/or Google Sheet for the new entry

## Keyboard Shortcuts

| Shortcut          | Action                    |
| ----------------- | ------------------------- |
| `Alt + Q`         | Select element mode       |
| `Alt + A`         | Open manual feedback form |
| `Alt + W`         | Start screen recording    |
| `Alt + Shift + Q` | Open dashboard            |
| `Esc`             | Cancel/close              |

## File Structure

```
example-nextjs/
├── src/
│   └── app/
│       ├── layout.tsx        # Root layout with FeedbackProvider
│       ├── page.tsx          # Demo page
│       ├── providers.tsx     # FeedbackProvider with integrations
│       ├── globals.css       # Global styles
│       └── api/
│           └── feedback/
│               ├── jira/
│               │   └── route.ts   # Jira API handler
│               └── sheets/
│                   └── route.ts   # Sheets API handler
├── .env.example              # Environment variables template
├── package.json
└── README.md
```

## Troubleshooting

### Jira: "Jira configuration missing"

Make sure all JIRA\_\* environment variables are set in `.env.local`.

### Sheets: "GOOGLE_SERVICE_ACCOUNT environment variable not set"

Make sure the entire JSON is on one line in `.env.local`.

### Sheets: "The caller does not have permission"

Share your Google Sheet with the service account email (ends in `.iam.gserviceaccount.com`).

### Apps Script: "Script function not found: doPost"

Make sure you saved the script and deployed it as a web app.

### Zapier: No data received

Check that the webhook URL is correct and the Zap is turned on.

## 🐳 Docker

Run the example app in a Docker container.

### Quick Start

```bash
# Using Taskfile (recommended)
task docker:build
task docker:run

# Or directly with Docker Compose
docker compose up -d
```

### Build Commands

```bash
# Build the Docker image
docker build -t feedback-example:latest .

# Run standalone container
docker run -d -p 3002:3002 \
  -e FEEDBACK_SERVER_URL=http://localhost:3001 \
  feedback-example:latest
```

### Environment Variables

| Variable              | Description               | Default                     |
| --------------------- | ------------------------- | --------------------------- |
| `NODE_ENV`            | Node environment          | `production`                |
| `PORT`                | Server port               | `3002`                      |
| `FEEDBACK_SERVER_URL` | Feedback API server URL   | `http://localhost:3001/api` |
| `NEXT_PUBLIC_API_URL` | Public API URL for client | `http://localhost:3001/api` |

### Docker Compose

```bash
# Start with dependencies
docker compose up -d

# View logs
docker compose logs -f

# Stop and remove
docker compose down
```

> **📖 Full Deployment Guide:** See [docs/deployment/README.md](../../docs/deployment/README.md) for complete Docker deployment documentation including full-stack setup.

## 📄 License

MIT
