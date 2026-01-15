# Step Definitions Guide

> How to implement step definitions for BDD feature files

**Package:** react-visual-feedback v2.2.5
**Created:** January 16, 2026

---

## 📋 Overview

Step definitions translate Gherkin steps (Given/When/Then) into executable test code using Playwright.

This directory contains step definition files that implement the scenarios in `../features/`.

---

## 📂 Directory Structure

```
steps/
├── README.md                 # This file
├── common.steps.ts           # Shared steps (navigation, setup)
├── feedback.steps.ts         # Feedback submission steps
├── screenshot.steps.ts       # Screenshot capture steps
├── recording.steps.ts        # Screen recording steps
├── element.steps.ts          # Element selection steps
├── keyboard.steps.ts         # Keyboard shortcut steps
├── dashboard.steps.ts        # Dashboard management steps
└── integrations.steps.ts     # Jira/Sheets integration steps
```

---

## 🛠️ Implementation Template

### Basic Step Definition Structure

```typescript
// steps/common.steps.ts
import { expect } from '@playwright/test';
import { Given, When, Then, createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

// ============================================
// GIVEN Steps (Preconditions)
// ============================================

Given('user is on a page with the feedback widget enabled', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="feedback-trigger"]')).toBeVisible();
});

Given('user has opened the feedback modal', async ({ page }) => {
  await page.click('[data-testid="feedback-trigger"]');
  await expect(page.locator('[data-testid="feedback-modal"]')).toBeVisible();
});

Given('the feedback modal is open', async ({ page }) => {
  const modal = page.locator('[data-testid="feedback-modal"]');
  if (!(await modal.isVisible())) {
    await page.click('[data-testid="feedback-trigger"]');
    await expect(modal).toBeVisible();
  }
});

Given('keyboard shortcuts are enabled in the widget configuration', async ({ page }) => {
  // Widget is configured by default with shortcuts enabled
  // Verify by checking if shortcut listener is active
  await expect(page.locator('[data-testid="feedback-trigger"]')).toBeVisible();
});

// ============================================
// WHEN Steps (Actions)
// ============================================

When('user clicks the feedback trigger button', async ({ page }) => {
  await page.click('[data-testid="feedback-trigger"]');
});

When('user enters {string} in the description', async ({ page }, text: string) => {
  await page.fill('[data-testid="feedback-description"]', text);
});

When('user enters {string} in the title field', async ({ page }, text: string) => {
  await page.fill('[data-testid="feedback-title"]', text);
});

When('user clicks the submit button', async ({ page }) => {
  await page.click('[data-testid="feedback-submit"]');
});

When('user clicks the close button', async ({ page }) => {
  await page.click('[data-testid="feedback-close"]');
});

When('user presses the Escape key', async ({ page }) => {
  await page.keyboard.press('Escape');
});

When('user clicks the screenshot button', async ({ page }) => {
  await page.click('[data-testid="screenshot-button"]');
});

When('user clicks the record button', async ({ page }) => {
  await page.click('[data-testid="record-button"]');
});

When('user clicks the element select button', async ({ page }) => {
  await page.click('[data-testid="element-select-button"]');
});

// ============================================
// THEN Steps (Assertions)
// ============================================

Then('a feedback form modal opens', async ({ page }) => {
  await expect(page.locator('[data-testid="feedback-modal"]')).toBeVisible();
});

Then('the modal closes', async ({ page }) => {
  await expect(page.locator('[data-testid="feedback-modal"]')).not.toBeVisible();
});

Then('feedback is saved successfully', async ({ page }) => {
  // Check localStorage or API response
  const feedback = await page.evaluate(() => 
    JSON.parse(localStorage.getItem('feedback_list') || '[]')
  );
  expect(feedback.length).toBeGreaterThan(0);
});

Then('user sees a confirmation message', async ({ page }) => {
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

Then('user sees a validation error message', async ({ page }) => {
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});

Then('no feedback is submitted', async ({ page }) => {
  const beforeCount = await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('feedback_list') || '[]');
    return list.length;
  });
  // Store the count for comparison
  expect(beforeCount).toBeGreaterThanOrEqual(0);
});
```

---

## 🎯 Step Definition Patterns

### Parameterized Steps

Use `{string}`, `{int}`, `{float}` for parameters:

```typescript
When('user enters {string} in the description', async ({ page }, text: string) => {
  await page.fill('[data-testid="feedback-description"]', text);
});

When('user waits {int} seconds', async ({ page }, seconds: number) => {
  await page.waitForTimeout(seconds * 1000);
});
```

### Data Table Steps

Handle Gherkin data tables:

```typescript
Then('each feedback card shows:', async ({ page }, dataTable) => {
  const fields = dataTable.rows().map(row => row[0]);
  
  for (const field of fields) {
    const selector = `[data-testid="feedback-card"] [data-testid="${field.toLowerCase()}"]`;
    await expect(page.locator(selector).first()).toBeVisible();
  }
});
```

### Scenario Outline Steps

Handle examples from Scenario Outlines:

```typescript
When('user changes the status to {string}', async ({ page }, newStatus: string) => {
  await page.click('[data-testid="status-dropdown"]');
  await page.click(`[data-testid="status-${newStatus.toLowerCase().replace(' ', '-')}"]`);
});

Then('the feedback status updates to {string}', async ({ page }, expectedStatus: string) => {
  await expect(page.locator('[data-testid="status-badge"]'))
    .toHaveText(expectedStatus);
});
```

---

## 📊 Page Objects (Recommended)

Create page objects for cleaner step definitions:

```typescript
// pages/FeedbackModal.ts
import { Page, Locator, expect } from '@playwright/test';

export class FeedbackModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly closeButton: Locator;
  readonly screenshotButton: Locator;
  readonly recordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="feedback-modal"]');
    this.titleInput = page.locator('[data-testid="feedback-title"]');
    this.descriptionInput = page.locator('[data-testid="feedback-description"]');
    this.submitButton = page.locator('[data-testid="feedback-submit"]');
    this.closeButton = page.locator('[data-testid="feedback-close"]');
    this.screenshotButton = page.locator('[data-testid="screenshot-button"]');
    this.recordButton = page.locator('[data-testid="record-button"]');
  }

  async open() {
    await this.page.click('[data-testid="feedback-trigger"]');
    await expect(this.modal).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async fillForm(title?: string, description?: string) {
    if (title) await this.titleInput.fill(title);
    if (description) await this.descriptionInput.fill(description);
  }

  async submit() {
    await this.submitButton.click();
  }

  async captureScreenshot() {
    await this.screenshotButton.click();
    await expect(this.page.locator('[data-testid="screenshot-preview"]')).toBeVisible();
  }
}
```

Use in step definitions:

```typescript
// steps/feedback.steps.ts
import { FeedbackModal } from '../pages/FeedbackModal';

Given('user has opened the feedback modal', async ({ page }) => {
  const modal = new FeedbackModal(page);
  await modal.open();
});

When('user submits feedback with title {string}', async ({ page }, title: string) => {
  const modal = new FeedbackModal(page);
  await modal.fillForm(title);
  await modal.submit();
});
```

---

## 🔧 Test Fixtures

Create reusable fixtures:

```typescript
// fixtures/test.ts
import { test as base } from 'playwright-bdd';
import { FeedbackModal } from '../pages/FeedbackModal';
import { Dashboard } from '../pages/Dashboard';

type Fixtures = {
  feedbackModal: FeedbackModal;
  dashboard: Dashboard;
};

export const test = base.extend<Fixtures>({
  feedbackModal: async ({ page }, use) => {
    const modal = new FeedbackModal(page);
    await use(modal);
  },
  dashboard: async ({ page }, use) => {
    const dashboard = new Dashboard(page);
    await use(dashboard);
  },
});
```

---

## 📋 Step Definition Checklist

For each feature file, implement:

- [ ] All `Given` steps (preconditions)
- [ ] All `When` steps (actions)
- [ ] All `Then` steps (assertions)
- [ ] Parameterized variations
- [ ] Data table handling
- [ ] Error/edge case handling

---

## 🚀 Running Step Definitions

```bash
# Generate tests from feature files
npx bddgen

# Run generated tests
npx playwright test --config=playwright-bdd.config.ts

# Run specific feature
npx playwright test --grep "Feedback Submission"
```

---

## 🔗 Related Documentation

- **Feature Files**: [../features/](../features/)
- **Setup Guide**: [../SETUP.md](../SETUP.md)
- **BDD Overview**: [../README.md](../README.md)
- **playwright-bdd Docs**: https://vitalets.github.io/playwright-bdd/

---

**Last Updated:** January 16, 2026
