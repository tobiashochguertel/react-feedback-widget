# Data Persistence API - Documentation Tasks

**Source Specification**: [008.data-persistence-api/README.md](../008.data-persistence-api/README.md)
**Created**: 2026-01-16
**Updated**: 2026-01-16

---

## D001 - API Documentation

**Status**: ✅ DONE
**Priority**: 🟡 Medium
**Dependencies**: T001, T002, T003, T004

### Description

Create comprehensive API documentation for the Data Persistence API, including all types, functions, and usage examples.

### Implementation

**Location**: `docs/api/persistence.md`
**Commit**: `9863a0e`

### Document Structure

```markdown
# Data Persistence API

## Overview

The Data Persistence API enables export and import of feedback data...

## Installation

The persistence services are included in the main package...

## Quick Start

### Exporting Data

\`\`\`typescript
import { createPersistenceServices } from 'react-visual-feedback/services/persistence';

const { exportService } = createPersistenceServices();

// Export to file (triggers download)
await exportService.exportToFile();

// Export to bundle (returns object)
const bundle = await exportService.exportToBundle();
\`\`\`

### Importing Data

\`\`\`typescript
import { createPersistenceServices } from 'react-visual-feedback/services/persistence';

const { importService } = createPersistenceServices();

// Import from file
const result = await importService.importFromFile(file);
console.log(\`Imported \${result.importedCount} items\`);

// Import from bundle
const result = await importService.importFromBundle(bundle);
\`\`\`

## Types

### FeedbackBundle

\`\`\`typescript
interface FeedbackBundle {
version: string;
exportedAt: string;
source: string;
feedback: FeedbackData[];
videos: SerializedVideo[];
metadata: BundleMetadata;
}
\`\`\`

### ExportOptions

\`\`\`typescript
interface ExportOptions {
includeVideos?: boolean; // Default: true
feedbackIds?: string[]; // Filter by IDs
typeFilter?: FeedbackType[]; // Filter by type
}
\`\`\`

### ImportOptions

\`\`\`typescript
interface ImportOptions {
duplicateHandling?: 'skip' | 'replace' | 'rename'; // Default: 'skip'
includeVideos?: boolean; // Default: true
}
\`\`\`

### ImportResult

\`\`\`typescript
interface ImportResult {
success: boolean;
importedCount: number;
skippedCount: number;
errors: string[];
warnings: string[];
}
\`\`\`

## Services

### ExportService

#### exportToBundle(options?)

Creates a FeedbackBundle from current storage...

#### exportToFile(options?)

Exports data and triggers browser download...

#### downloadBundle(bundle, filename?)

Downloads an existing bundle as a file...

### ImportService

#### importFromFile(file, options?)

Reads and imports data from a File object...

#### importFromBundle(bundle, options?)

Imports data from a FeedbackBundle...

#### validateBundle(bundle)

Validates bundle structure...

## Examples

### Export with Filters

\`\`\`typescript
// Export only bugs
await exportService.exportToFile({
typeFilter: ['bug'],
});

// Export specific items without videos
await exportService.exportToFile({
feedbackIds: ['id1', 'id2'],
includeVideos: false,
});
\`\`\`

### Import with Duplicate Handling

\`\`\`typescript
// Replace existing items with same ID
const result = await importService.importFromFile(file, {
duplicateHandling: 'replace',
});

// Create new IDs for duplicates
const result = await importService.importFromFile(file, {
duplicateHandling: 'rename',
});
\`\`\`

## Error Handling

...

## Best Practices

...
```

### Acceptance Criteria

- [ ] Document covers all public types
- [ ] Document covers all public functions
- [ ] Examples are tested and working
- [ ] Error handling is documented
- [ ] Best practices are included
- [ ] TypeScript code examples are valid
- [ ] Document follows existing docs style

### Testing

- [ ] All code examples compile without errors
- [ ] All code examples run successfully
- [ ] Links to related docs work
- [ ] Table of contents is accurate

---

## D002 - Test Fixtures Guide

**Status**: 🔲 TODO
**Priority**: 🟢 High
**Dependencies**: T001

### Description

Create a guide for using the Data Persistence API to create and load test fixtures for BDD/E2E testing.

### Implementation

**Location**: `docs/testing/fixtures.md`

### Document Structure

```markdown
# Test Fixtures Guide

## Overview

This guide explains how to create and use test fixtures with the Data Persistence API for BDD and E2E testing.

## Creating Test Fixtures

### Step 1: Create Sample Data

First, use the application to create feedback items with various types and states:

1. Open the application
2. Create feedback items (bugs, features, questions)
3. Record some videos for session replay testing
4. Set different statuses (open, in-progress, closed)

### Step 2: Export Fixtures

Use the Export button in the dashboard, or programmatically:

\`\`\`typescript
const { exportService } = createPersistenceServices();
const bundle = await exportService.exportToBundle();

// Save to file
await exportService.exportToFile(); // Downloads feedback-export-<timestamp>.json
\`\`\`

### Step 3: Organize Fixtures

Create fixture files in your test directory:

\`\`\`
tests/
├── fixtures/
│ ├── empty-state.json # No feedback items
│ ├── single-bug.json # One bug report
│ ├── multiple-items.json # Various feedback types
│ ├── with-videos.json # Includes recorded sessions
│ └── dashboard-scenarios.json # For dashboard testing
\`\`\`

## Loading Fixtures in Tests

### Playwright (E2E Tests)

\`\`\`typescript
import { test, expect } from '@playwright/test';
import fixtureData from '../fixtures/multiple-items.json';

test.beforeEach(async ({ page }) => {
// Load fixture into browser storage
await page.evaluate((data) => {
// Load feedback data
localStorage.setItem('react-feedback-data', JSON.stringify(data.feedback));

    // Load videos into IndexedDB
    return new Promise<void>((resolve) => {
      const request = indexedDB.open('FeedbackVideoDB', 1);
      request.onsuccess = async () => {
        const db = request.result;
        const tx = db.transaction('videos', 'readwrite');
        const store = tx.objectStore('videos');

        for (const video of data.videos) {
          // Convert base64 back to Blob
          const base64 = video.data.split(',')[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: video.mimeType });
          store.put({ id: video.id, blob, duration: video.duration });
        }

        tx.oncomplete = () => resolve();
      };
    });

}, fixtureData);
});

test('should display feedback items', async ({ page }) => {
await page.goto('/');
await page.click('[data-testid="feedback-trigger"]');
await expect(page.locator('[data-testid="feedback-list"]')).toBeVisible();
await expect(page.locator('[data-testid="feedback-item"]')).toHaveCount(3);
});
\`\`\`

### Vitest (Unit/Integration Tests)

\`\`\`typescript
import { describe, test, beforeEach, expect } from 'vitest';
import { createTestPersistenceServices } from './services/persistence';
import fixtureData from '../fixtures/multiple-items.json';

describe('FeedbackDashboard', () => {
beforeEach(async () => {
const { importService } = createTestPersistenceServices();
await importService.importFromBundle(fixtureData);
});

test('should list all feedback items', () => {
// Test implementation
});
});
\`\`\`

## Fixture File Format

### Minimal Fixture

\`\`\`json
{
"version": "1.0.0",
"exportedAt": "2026-01-16T12:00:00.000Z",
"source": "test-fixture",
"feedback": [
{
"id": "test-bug-001",
"type": "bug",
"description": "Test bug report",
"status": "open",
"timestamp": 1705404800000,
"screenshot": null,
"video": null,
"url": "http://localhost:3000",
"userAgent": "Mozilla/5.0..."
}
],
"videos": [],
"metadata": {
"feedbackCount": 1,
"videoCount": 0,
"totalVideoSize": 0
}
}
\`\`\`

### Fixture with Video

\`\`\`json
{
"version": "1.0.0",
"exportedAt": "2026-01-16T12:00:00.000Z",
"source": "test-fixture",
"feedback": [
{
"id": "test-recording-001",
"type": "bug",
"description": "Bug with video",
"status": "open",
"timestamp": 1705404800000,
"video": "video:test-video-001",
"eventLog": [
{ "type": "click", "x": 100, "y": 200, "timestamp": 0 },
{ "type": "scroll", "y": 500, "timestamp": 1000 }
]
}
],
"videos": [
{
"id": "test-video-001",
"data": "data:video/webm;base64,GkXfo59ChoEB...",
"mimeType": "video/webm",
"size": 12345,
"duration": 5000
}
],
"metadata": {
"feedbackCount": 1,
"videoCount": 1,
"totalVideoSize": 12345
}
}
\`\`\`

## Fixture Helper Functions

### TypeScript Helpers

Create reusable helpers in your test setup:

\`\`\`typescript
// tests/helpers/fixtures.ts

import type { FeedbackBundle } from 'react-visual-feedback';

export async function loadFixture(page: Page, fixture: FeedbackBundle) {
await page.evaluate((data) => {
localStorage.setItem('react-feedback-data', JSON.stringify(data.feedback));
}, fixture);
}

export async function loadFixtureWithVideos(page: Page, fixture: FeedbackBundle) {
await page.evaluate(async (data) => {
// Load feedback
localStorage.setItem('react-feedback-data', JSON.stringify(data.feedback));

    // Load videos (implementation as shown above)

}, fixture);
}

export async function clearFixtures(page: Page) {
await page.evaluate(() => {
localStorage.removeItem('react-feedback-data');
indexedDB.deleteDatabase('FeedbackVideoDB');
});
}
\`\`\`

### BDD Step Definitions

\`\`\`typescript
// tests/steps/fixture.steps.ts

import { Given } from '@cucumber/cucumber';
import emptyFixture from '../fixtures/empty-state.json';
import multipleItemsFixture from '../fixtures/multiple-items.json';

Given('the feedback storage is empty', async function() {
await loadFixture(this.page, emptyFixture);
});

Given('the feedback storage contains multiple items', async function() {
await loadFixture(this.page, multipleItemsFixture);
});

Given('the feedback storage contains a recorded session', async function() {
await loadFixtureWithVideos(this.page, withVideosFixture);
});
\`\`\`

## Predefined Fixtures

The library includes predefined fixtures for common scenarios:

| Fixture               | Description               | Items | Videos |
| --------------------- | ------------------------- | ----- | ------ |
| `empty-state.json`    | No feedback items         | 0     | 0      |
| `single-bug.json`     | One bug report            | 1     | 0      |
| `single-feature.json` | One feature request       | 1     | 0      |
| `multiple-items.json` | Mix of types              | 5     | 0      |
| `with-recording.json` | Bug with video            | 1     | 1      |
| `dashboard-full.json` | Many items for pagination | 20    | 3      |

## Best Practices

1. **Keep fixtures minimal** - Include only data needed for the test
2. **Use descriptive IDs** - Makes debugging easier
3. **Version fixtures** - Update when data format changes
4. **Avoid real data** - Use synthetic/mocked data
5. **Document dependencies** - Note which fixtures are needed

## Troubleshooting

### Fixture not loading

Check that:

1. JSON is valid
2. Bundle version matches
3. Page context is ready before evaluate

### Videos not playing

Check that:

1. base64 data is complete
2. MIME type is correct
3. IndexedDB transaction completed

### Stale data between tests

Always clear storage in beforeEach/afterEach hooks.
```

### Acceptance Criteria

- [ ] Guide explains fixture creation workflow
- [ ] Guide includes Playwright examples
- [ ] Guide includes Vitest examples
- [ ] Fixture format is documented with examples
- [ ] Helper functions are provided
- [ ] BDD step definition examples included
- [ ] Predefined fixtures are listed
- [ ] Best practices are included
- [ ] Troubleshooting section helps debug issues

### Testing

- [ ] All code examples work correctly
- [ ] Fixture files are valid JSON
- [ ] Helper functions are tested
- [ ] Guide renders correctly in docs site

---

**Documentation compiled by:** GitHub Copilot
**For project:** react-visual-feedback
**Date:** January 16, 2026
