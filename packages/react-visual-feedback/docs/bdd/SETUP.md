# BDD Test Environment Setup

> Configuration guide for running BDD tests with Playwright and Cucumber

**Package:** react-visual-feedback v2.2.5
**Created:** January 16, 2026

---

## 📋 Prerequisites

- Node.js 18+
- npm or bun
- Chrome/Firefox/Safari browser

---

## 🛠️ Installation

### Step 1: Install Dependencies

```bash
cd packages/react-visual-feedback

# Install Playwright
npm install -D @playwright/test

# Install Playwright BDD (Cucumber integration)
npm install -D playwright-bdd @cucumber/cucumber

# Install browsers
npx playwright install
```

### Step 2: Create Configuration

Create `playwright-bdd.config.ts` in the package root:

```typescript
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "docs/bdd/features/**/*.feature",
  steps: "docs/bdd/steps/**/*.ts",
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "cd ../feedback-example && npm run dev",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Step 3: Add npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:bdd": "npx bddgen && npx playwright test --config=playwright-bdd.config.ts",
    "test:bdd:ui": "npx bddgen && npx playwright test --config=playwright-bdd.config.ts --ui",
    "test:bdd:headed": "npx bddgen && npx playwright test --config=playwright-bdd.config.ts --headed"
  }
}
```

---

## 📂 Directory Structure

```
packages/react-visual-feedback/
├── docs/
│   └── bdd/
│       ├── README.md
│       ├── SETUP.md                    # This file
│       ├── features/
│       │   ├── feedback-submission.feature
│       │   ├── screenshot-capture.feature
│       │   ├── screen-recording.feature
│       │   ├── element-selection.feature
│       │   ├── keyboard-shortcuts.feature
│       │   ├── dashboard.feature
│       │   └── integrations.feature
│       └── steps/
│           ├── README.md
│           ├── common.steps.ts
│           ├── feedback.steps.ts
│           ├── screenshot.steps.ts
│           └── dashboard.steps.ts
├── playwright-bdd.config.ts            # BDD config
└── .features-gen/                      # Generated test files (gitignored)
```

---

## 🚀 Running Tests

### Run All BDD Tests

```bash
npm run test:bdd
```

### Run with UI (Interactive Mode)

```bash
npm run test:bdd:ui
```

### Run Specific Feature

```bash
npx bddgen && npx playwright test --config=playwright-bdd.config.ts --grep "Feedback Submission"
```

### Run with Headed Browser

```bash
npm run test:bdd:headed
```

---

## 📝 Writing Step Definitions

### Step Definition Template

Create step definitions in `docs/bdd/steps/`:

```typescript
// docs/bdd/steps/feedback.steps.ts
import { expect } from "@playwright/test";
import { Given, When, Then } from "playwright-bdd";

Given(
  "user is on a page with the feedback widget enabled",
  async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-testid="feedback-trigger"]'),
    ).toBeVisible();
  },
);

When("user clicks the feedback trigger button", async ({ page }) => {
  await page.click('[data-testid="feedback-trigger"]');
});

Then("a feedback form modal opens", async ({ page }) => {
  await expect(page.locator('[data-testid="feedback-modal"]')).toBeVisible();
});

When(
  "user enters {string} in the description",
  async ({ page }, text: string) => {
    await page.fill('[data-testid="feedback-description"]', text);
  },
);

When("user clicks the submit button", async ({ page }) => {
  await page.click('[data-testid="feedback-submit"]');
});

Then("feedback is saved successfully", async ({ page }) => {
  // Check localStorage or API response
  const feedback = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("feedback_list") || "[]"),
  );
  expect(feedback.length).toBeGreaterThan(0);
});

Then("user sees a confirmation message", async ({ page }) => {
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

Then("the modal closes", async ({ page }) => {
  await expect(
    page.locator('[data-testid="feedback-modal"]'),
  ).not.toBeVisible();
});
```

---

## 🎯 Test Data Attributes

Add these data-testid attributes to components for reliable test selectors:

| Component             | Attribute                             |
| --------------------- | ------------------------------------- |
| Feedback Trigger      | `data-testid="feedback-trigger"`      |
| Feedback Modal        | `data-testid="feedback-modal"`        |
| Description Input     | `data-testid="feedback-description"`  |
| Submit Button         | `data-testid="feedback-submit"`       |
| Close Button          | `data-testid="feedback-close"`        |
| Screenshot Button     | `data-testid="screenshot-button"`     |
| Screenshot Preview    | `data-testid="screenshot-preview"`    |
| Record Button         | `data-testid="record-button"`         |
| Stop Record Button    | `data-testid="stop-record-button"`    |
| Element Select Button | `data-testid="element-select-button"` |
| Dashboard Button      | `data-testid="dashboard-button"`      |
| Dashboard Modal       | `data-testid="dashboard-modal"`       |
| Feedback List         | `data-testid="feedback-list"`         |
| Feedback Card         | `data-testid="feedback-card"`         |
| Status Dropdown       | `data-testid="status-dropdown"`       |
| Search Input          | `data-testid="dashboard-search"`      |
| Success Message       | `data-testid="success-message"`       |
| Error Message         | `data-testid="error-message"`         |

---

## 🐛 Debugging

### View Test Report

```bash
npx playwright show-report
```

### Debug Mode

```bash
PWDEBUG=1 npm run test:bdd
```

### Trace Viewer

```bash
npx playwright show-trace trace.zip
```

---

## 📊 CI Integration

### GitHub Actions Example

```yaml
# .github/workflows/bdd-tests.yml
name: BDD Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: |
          cd packages/react-visual-feedback
          npm ci
          npx playwright install --with-deps

      - name: Build package
        run: |
          cd packages/react-visual-feedback
          npm run build

      - name: Run BDD tests
        run: |
          cd packages/react-visual-feedback
          npm run test:bdd

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: packages/react-visual-feedback/playwright-report/
          retention-days: 30
```

---

## 🔗 Related Documentation

- **BDD Overview**: [./README.md](./README.md)
- **Feature Files**: [./features/](./features/)
- **User Stories**: [../user-stories/README.md](../user-stories/README.md)
- **Playwright Docs**: <https://playwright.dev/>
- **playwright-bdd Docs**: <https://vitalets.github.io/playwright-bdd/>

---

**Last Updated:** January 16, 2026
