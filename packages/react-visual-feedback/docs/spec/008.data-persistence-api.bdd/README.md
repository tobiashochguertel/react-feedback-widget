# Data Persistence API - BDD Testing Documentation

**Source Specification**: [008.data-persistence-api/README.md](../008.data-persistence-api/README.md)
**User Stories**: [008.data-persistence-api.user-stories/](../008.data-persistence-api.user-stories/)
**Created**: 2026-01-16
**Updated**: 2026-01-16

---

## Overview

This document defines the BDD test specifications for the Data Persistence API feature. Tests are written in Gherkin format for Playwright E2E testing.

### Testing Approach

| Layer       | Framework            | Location                         |
| ----------- | -------------------- | -------------------------------- |
| E2E         | Playwright + Gherkin | `tests/e2e/persistence/`         |
| Integration | Vitest               | `tests/integration/persistence/` |
| Unit        | Vitest               | `tests/unit/persistence/`        |

### Feature Files

| File                      | User Stories   | Scenarios |
| ------------------------- | -------------- | --------- |
| `export-feedback.feature` | US-001         | 5         |
| `import-feedback.feature` | US-002         | 6         |
| `test-fixtures.feature`   | US-003, US-004 | 6         |
| `data-transfer.feature`   | US-005, US-006 | 4         |

**Total**: 4 feature files, 21 scenarios

---

## Feature: Export Feedback Data

**File**: `tests/e2e/persistence/export-feedback.feature`

```gherkin
@US-001
Feature: Export Feedback Data
  As a user
  I want to export all my feedback data to a file
  So that I can create backups and transfer data to other browsers

  Background:
    Given the application is loaded
    And the feedback trigger is visible

  @export @happy-path
  Scenario: Export all feedback items to JSON file
    Given I have submitted the following feedback:
      | type    | description          | status      |
      | bug     | Button not working   | open        |
      | feature | Dark mode support    | in-progress |
      | bug     | Page loads slowly    | closed      |
    When I open the Feedback Dashboard
    And I click the Export button
    Then a JSON file should be downloaded
    And the filename should contain the current date
    And the file should contain 3 feedback items
    And the file should contain version "1.0.0"

  @export @with-videos
  Scenario: Export feedback items with recorded videos
    Given I have submitted feedback with a recorded session:
      | type | description       | hasVideo |
      | bug  | Video demo of bug | true     |
    When I open the Feedback Dashboard
    And I click the Export button
    Then a JSON file should be downloaded
    And the file should contain 1 feedback item
    And the file should contain 1 video as base64 data
    And the video data should be valid base64

  @export @empty-state
  Scenario: Export when no feedback exists
    Given I have no feedback items in storage
    When I open the Feedback Dashboard
    And I click the Export button
    Then a JSON file should be downloaded
    And the file should contain 0 feedback items
    And the file should contain 0 videos
    And the file metadata should show feedbackCount: 0

  @export @filtered
  Scenario: Export only selected feedback items
    Given I have submitted the following feedback:
      | type    | description        |
      | bug     | Bug report 1       |
      | bug     | Bug report 2       |
      | feature | Feature request 1  |
    When I open the Feedback Dashboard
    And I select only bug reports for export
    And I click the Export Selected button
    Then a JSON file should be downloaded
    And the file should contain 2 feedback items
    And all items in the file should have type "bug"

  @export @accessibility
  Scenario: Export button is accessible
    Given I have submitted at least one feedback item
    When I open the Feedback Dashboard
    Then the Export button should be visible
    And the Export button should have accessible name "Export"
    And the Export button should be keyboard focusable
    And the Export button should have role "button"
```

---

## Feature: Import Feedback Data

**File**: `tests/e2e/persistence/import-feedback.feature`

```gherkin
@US-002
Feature: Import Feedback Data
  As a user
  I want to import feedback data from a previously exported file
  So that I can restore backups or transfer data from another browser

  Background:
    Given the application is loaded
    And the feedback trigger is visible

  @import @happy-path
  Scenario: Import valid feedback file
    Given I have an exported feedback file with:
      | type    | description        | status |
      | bug     | Imported bug       | open   |
      | feature | Imported feature   | closed |
    When I open the Feedback Dashboard
    And I click the Import button
    And I select the exported feedback file
    Then I should see a success notification
    And the notification should say "Imported 2 items"
    And the dashboard should show 2 feedback items
    And I should see "Imported bug" in the list
    And I should see "Imported feature" in the list

  @import @with-videos
  Scenario: Import feedback file with videos
    Given I have an exported feedback file with videos:
      | type | description    | videoId     |
      | bug  | Bug with video | test-vid-01 |
    When I open the Feedback Dashboard
    And I click the Import button
    And I select the exported feedback file
    Then I should see "Imported 1 item"
    And the dashboard should show 1 feedback item
    When I click on the imported feedback item
    Then I should see the Session Replay component
    And the video should be playable

  @import @duplicates-skip
  Scenario: Import file with duplicate items (skip mode)
    Given I have submitted feedback with ID "existing-001"
    And I have an exported file with the same ID "existing-001"
    When I open the Feedback Dashboard
    And I click the Import button
    And I select the exported feedback file
    Then I should see "Imported 0 items, skipped 1 duplicate"
    And the dashboard should still show only 1 feedback item
    And the original data should be preserved

  @import @duplicates-replace
  Scenario: Import file with duplicate items (replace mode)
    Given I have submitted feedback:
      | id          | description    |
      | existing-01 | Original text  |
    And I have an exported file with:
      | id          | description    |
      | existing-01 | Updated text   |
    When I open the Feedback Dashboard
    And I click the Import button
    And I select "Replace duplicates" option
    And I select the exported feedback file
    Then I should see "Imported 1 item"
    And the dashboard should show "Updated text"
    And "Original text" should not be visible

  @import @invalid-file
  Scenario: Import invalid file shows error
    Given I have a text file that is not valid JSON
    When I open the Feedback Dashboard
    And I click the Import button
    And I select the invalid file
    Then I should see an error notification
    And the error should say "Invalid feedback file format"
    And the dashboard should not be affected
    And no items should be added

  @import @accessibility
  Scenario: Import button is accessible
    When I open the Feedback Dashboard
    Then the Import button should be visible
    And the Import button should have accessible name "Import"
    And the Import button should be keyboard focusable
    When I press Enter on the Import button
    Then the file picker should open
```

---

## Feature: Test Fixtures

**File**: `tests/e2e/persistence/test-fixtures.feature`

```gherkin
@US-003 @US-004
Feature: Test Fixtures for BDD Testing
  As a tester
  I want to load test fixtures into the application
  So that I can test specific scenarios with known data

  Background:
    Given the application is loaded

  @fixtures @load
  Scenario: Load fixture with multiple feedback items
    Given I load fixture "multiple-items.json" with:
      | id       | type    | status      |
      | test-001 | bug     | open        |
      | test-002 | feature | in-progress |
      | test-003 | bug     | closed      |
    When I open the Feedback Dashboard
    Then I should see 3 feedback items
    And I should see an item with status "open"
    And I should see an item with status "in-progress"
    And I should see an item with status "closed"

  @fixtures @load-videos
  Scenario: Load fixture with recorded session for replay testing
    Given I load fixture "with-video.json" containing:
      | id           | type | hasVideo | eventLogEntries |
      | vid-test-001 | bug  | true     | 5               |
    When I open the Feedback Dashboard
    And I click on the item "vid-test-001"
    Then I should see the Session Replay component
    And the video should be loaded and playable
    And the event log should show 5 entries

  @fixtures @status-update
  Scenario: Test status update with pre-loaded fixture
    Given I load fixture "open-bug.json" with status "open"
    When I open the Feedback Dashboard
    And I click on the status dropdown
    And I change the status to "in-progress"
    Then the item status should be "in-progress"
    And the status change should be persisted

  @fixtures @empty
  Scenario: Load empty fixture for empty state testing
    Given I load fixture "empty-state.json"
    When I open the Feedback Dashboard
    Then I should see "No feedback yet"
    And the Export button should still be visible
    And the Import button should still be visible

  @fixtures @isolation
  Scenario: Fixtures are isolated between tests
    Given I load fixture "test-data.json" with 5 items
    When I open the Feedback Dashboard
    Then I should see 5 feedback items
    # After this test, the next test should start fresh

  @fixtures @clear
  Scenario: Clear fixtures after test
    Given I load fixture "test-data.json" with 10 items
    When the test completes
    And fixtures are cleared
    Then localStorage should be empty
    And IndexedDB should be empty
```

---

## Feature: Data Transfer

**File**: `tests/e2e/persistence/data-transfer.feature`

```gherkin
@US-005 @US-006
Feature: Data Transfer and Backup
  As a user
  I want to transfer data between browsers and create backups
  So that I don't lose my feedback history

  Background:
    Given the application is loaded
    And the feedback trigger is visible

  @transfer @roundtrip
  Scenario: Export and reimport data preserves all information
    Given I have submitted the following feedback:
      | type    | description          | status      |
      | bug     | Critical bug         | open        |
      | feature | Nice to have         | in-progress |
    And I have recorded a video for "Critical bug"
    When I export all feedback to a file
    And I clear all feedback from storage
    And I import the exported file
    Then all feedback items should be restored
    And the video for "Critical bug" should be playable
    And statuses should match the original

  @backup @before-clear
  Scenario: Prompt to backup before clearing data
    Given I have submitted 5 feedback items
    When I click the "Clear All" button
    Then I should see a confirmation dialog
    And the dialog should offer to backup first
    When I click "Backup and Clear"
    Then a backup file should be downloaded
    And all feedback should be cleared
    And the dashboard should show "No feedback yet"

  @backup @restore
  Scenario: Restore data from backup after accidental clear
    Given I have submitted 3 feedback items
    And I have exported a backup file
    And I have cleared all feedback
    When I import the backup file
    Then all 3 items should be restored
    And I should see "Imported 3 items"

  @backup @skip
  Scenario: Clear without backup when user chooses
    Given I have submitted 3 feedback items
    When I click the "Clear All" button
    And I click "Clear without backup"
    Then no file should be downloaded
    And all feedback should be cleared
    And the dashboard should show "No feedback yet"
```

---

## Step Definitions

### Fixture Loading Steps

**File**: `tests/e2e/steps/fixture.steps.ts`

```typescript
import { Given, When, Then } from "@cucumber/cucumber";
import { expect, type Page } from "@playwright/test";
import {
  loadFixture,
  clearFixtures,
  loadFixtureWithVideos,
} from "../helpers/fixtures";

Given(
  "I load fixture {string} with:",
  async function (fixtureName: string, table: DataTable) {
    const data = table.hashes();
    const fixture = createFixtureFromTable(data);
    await loadFixture(this.page, fixture);
  },
);

Given(
  "I load fixture {string} containing:",
  async function (fixtureName: string, table: DataTable) {
    const data = table.hashes();
    const fixture = createFixtureFromTable(data, { includeVideos: true });
    await loadFixtureWithVideos(this.page, fixture);
  },
);

Given(
  "I load fixture {string} with status {string}",
  async function (fixtureName: string, status: string) {
    const fixture = createFixture({
      feedback: [
        {
          id: "fixture-001",
          type: "bug",
          description: "Fixture item",
          status,
          timestamp: Date.now(),
        },
      ],
    });
    await loadFixture(this.page, fixture);
  },
);

When("fixtures are cleared", async function () {
  await clearFixtures(this.page);
});

Then("localStorage should be empty", async function () {
  const data = await this.page.evaluate(() => {
    return localStorage.getItem("react-feedback-data");
  });
  expect(data).toBeNull();
});

Then("IndexedDB should be empty", async function () {
  const hasData = await this.page.evaluate(async () => {
    return new Promise<boolean>((resolve) => {
      const request = indexedDB.open("FeedbackVideoDB", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("videos", "readonly");
        const store = tx.objectStore("videos");
        const countRequest = store.count();
        countRequest.onsuccess = () => {
          resolve(countRequest.result > 0);
        };
      };
      request.onerror = () => resolve(false);
    });
  });
  expect(hasData).toBe(false);
});
```

### Export Steps

**File**: `tests/e2e/steps/export.steps.ts`

```typescript
import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

When("I click the Export button", async function () {
  const [download] = await Promise.all([
    this.page.waitForEvent("download"),
    this.page.click('[data-testid="export-button"]'),
  ]);
  this.lastDownload = download;
});

Then("a JSON file should be downloaded", async function () {
  expect(this.lastDownload).toBeDefined();
  const filename = this.lastDownload.suggestedFilename();
  expect(filename).toMatch(/\.json$/);
});

Then("the filename should contain the current date", async function () {
  const filename = this.lastDownload.suggestedFilename();
  const today = new Date().toISOString().split("T")[0];
  expect(filename).toContain(today.replace(/-/g, ""));
});

Then(
  "the file should contain {int} feedback items",
  async function (count: number) {
    const content = await this.lastDownload.createReadStream();
    const data = JSON.parse(await streamToString(content));
    expect(data.feedback).toHaveLength(count);
  },
);

Then(
  "the file should contain {int} video(s) as base64 data",
  async function (count: number) {
    const content = await this.lastDownload.createReadStream();
    const data = JSON.parse(await streamToString(content));
    expect(data.videos).toHaveLength(count);
    for (const video of data.videos) {
      expect(video.data).toMatch(/^data:video\/\w+;base64,/);
    }
  },
);
```

### Import Steps

**File**: `tests/e2e/steps/import.steps.ts`

```typescript
import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

When("I click the Import button", async function () {
  await this.page.click('[data-testid="import-button"]');
});

When("I select the exported feedback file", async function () {
  const fileInput = this.page.locator('[data-testid="import-file-input"]');
  await fileInput.setInputFiles(this.lastExportPath);
});

When("I select the invalid file", async function () {
  const fileInput = this.page.locator('[data-testid="import-file-input"]');
  await fileInput.setInputFiles(this.invalidFilePath);
});

Then("I should see a success notification", async function () {
  await expect(this.page.locator('[role="alert"]')).toBeVisible();
  await expect(this.page.locator('[role="alert"]')).toContainText(/imported/i);
});

Then("I should see an error notification", async function () {
  await expect(this.page.locator('[role="alert"]')).toBeVisible();
  await expect(this.page.locator('[role="alert"]')).toHaveClass(/error/);
});

Then("the notification should say {string}", async function (text: string) {
  await expect(this.page.locator('[role="alert"]')).toContainText(text);
});
```

---

## Fixture Helper Functions

**File**: `tests/e2e/helpers/fixtures.ts`

```typescript
import type { Page } from "@playwright/test";
import type {
  FeedbackBundle,
  FeedbackData,
  SerializedVideo,
} from "../../../src/types";

export interface FixtureOptions {
  includeVideos?: boolean;
}

export async function loadFixture(
  page: Page,
  fixture: FeedbackBundle,
): Promise<void> {
  await page.evaluate((data) => {
    localStorage.setItem("react-feedback-data", JSON.stringify(data.feedback));
  }, fixture);
}

export async function loadFixtureWithVideos(
  page: Page,
  fixture: FeedbackBundle,
): Promise<void> {
  await page.evaluate(async (data) => {
    // Load feedback metadata
    localStorage.setItem("react-feedback-data", JSON.stringify(data.feedback));

    // Load videos into IndexedDB
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("FeedbackVideoDB", 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("videos")) {
          db.createObjectStore("videos", { keyPath: "id" });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        const tx = db.transaction("videos", "readwrite");
        const store = tx.objectStore("videos");

        for (const video of data.videos) {
          // Convert base64 to Blob
          const base64 = video.data.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: video.mimeType });

          store.put({
            id: video.id,
            blob,
            duration: video.duration || 5000,
          });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };

      request.onerror = () => reject(request.error);
    });
  }, fixture);
}

export async function clearFixtures(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("react-feedback-data");
    indexedDB.deleteDatabase("FeedbackVideoDB");
  });
}

export function createFixture(
  options: Partial<FeedbackBundle>,
): FeedbackBundle {
  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    source: "test-fixture",
    feedback: options.feedback || [],
    videos: options.videos || [],
    metadata: {
      feedbackCount: options.feedback?.length || 0,
      videoCount: options.videos?.length || 0,
      totalVideoSize: options.videos?.reduce((sum, v) => sum + v.size, 0) || 0,
      userAgent: "Playwright Test",
      exportUrl: "http://localhost:3000",
    },
  };
}

export function createFixtureFromTable(
  data: Array<Record<string, string>>,
  options: FixtureOptions = {},
): FeedbackBundle {
  const feedback: FeedbackData[] = data.map((row, index) => ({
    id: row.id || `test-${index + 1}`,
    type: (row.type as FeedbackData["type"]) || "bug",
    description: row.description || `Test item ${index + 1}`,
    status: row.status || "open",
    timestamp: Date.now(),
    screenshot: null,
    video: row.hasVideo === "true" ? `video:test-video-${index + 1}` : null,
    url: "http://localhost:3000",
    userAgent: "Playwright Test",
    eventLog: row.eventLogEntries
      ? generateEventLog(parseInt(row.eventLogEntries, 10))
      : [],
  }));

  const videos: SerializedVideo[] = options.includeVideos
    ? data
        .filter((row) => row.hasVideo === "true")
        .map((row, index) => ({
          id: row.videoId || `test-video-${index + 1}`,
          data: generateMinimalVideo(),
          mimeType: "video/webm",
          size: 1000,
          duration: 5000,
        }))
    : [];

  return createFixture({ feedback, videos });
}

function generateEventLog(
  count: number,
): Array<{ type: string; timestamp: number }> {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push({
      type: i % 2 === 0 ? "click" : "scroll",
      timestamp: i * 1000,
      x: Math.random() * 800,
      y: Math.random() * 600,
    });
  }
  return events;
}

function generateMinimalVideo(): string {
  // Minimal valid WebM base64 (1-frame placeholder)
  return "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OssHEP";
}
```

---

## Test Configuration

**File**: `tests/e2e/persistence/playwright.config.ts`

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e/persistence",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Summary

| Feature File              | User Stories   | Scenarios | Priority |
| ------------------------- | -------------- | --------- | -------- |
| `export-feedback.feature` | US-001         | 5         | High     |
| `import-feedback.feature` | US-002         | 6         | High     |
| `test-fixtures.feature`   | US-003, US-004 | 6         | High     |
| `data-transfer.feature`   | US-005, US-006 | 4         | Medium   |
| **Total**                 | **6**          | **21**    |          |

---

**Documentation compiled by:** GitHub Copilot
**For project:** react-visual-feedback
**Date:** January 16, 2026
