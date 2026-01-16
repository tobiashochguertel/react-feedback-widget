# BDD Testing Documentation

> Behavior-Driven Development tests for React Visual Feedback Widget

**Package:** react-visual-feedback v2.2.5
**Created:** January 16, 2026
**Status:** ✅ IMPLEMENTED (Core scenarios)

---

## 📚 Documentation Structure

```
bdd/
├── README.md                    # This file
├── SETUP.md                     # Test environment setup
├── features/                    # Gherkin feature files
│   ├── feedback-submission.feature
│   ├── screenshot-capture.feature
│   ├── screen-recording.feature
│   ├── element-selection.feature
│   ├── keyboard-shortcuts.feature
│   ├── dashboard.feature
│   └── integrations.feature
└── steps/                       # Step definition templates
    └── README.md
```

---

## 🎯 Purpose

BDD tests verify that the feedback widget behaves correctly from the user's perspective. Tests are written in Gherkin syntax (Given/When/Then) and derived from [User Stories](../spec/005.user-stories/USER-STORIES.md).

---

## 🛠️ Technology Stack

### Recommended Tools

| Tool               | Purpose                           | Install                             |
| ------------------ | --------------------------------- | ----------------------------------- |
| **Playwright**     | Browser automation for React      | `npm install -D @playwright/test`   |
| **Cucumber**       | Gherkin parser and runner         | `npm install -D @cucumber/cucumber` |
| **playwright-bdd** | Playwright + Cucumber integration | `npm install -D playwright-bdd`     |

### Alternative Stacks

| Stack                       | Pros                          | Cons                      |
| --------------------------- | ----------------------------- | ------------------------- |
| Playwright + playwright-bdd | Native React/TypeScript, fast | Newer, less documentation |
| Cypress + cypress-cucumber  | Excellent DX, good debugging  | Heavier, slower           |
| Jest + jest-cucumber        | Already use Jest/Vitest       | Less suitable for E2E     |

---

## 📂 Feature Files

### Core Features

| Feature File                                                          | User Stories | Priority  |
| --------------------------------------------------------------------- | ------------ | --------- |
| [feedback-submission.feature](./features/feedback-submission.feature) | US001        | 🟢 High   |
| [screenshot-capture.feature](./features/screenshot-capture.feature)   | US002        | 🟢 High   |
| [screen-recording.feature](./features/screen-recording.feature)       | US003        | 🟡 Medium |
| [element-selection.feature](./features/element-selection.feature)     | US004        | 🟡 Medium |
| [keyboard-shortcuts.feature](./features/keyboard-shortcuts.feature)   | US005        | 🔴 Low    |

### Dashboard Features

| Feature File                                      | User Stories               | Priority  |
| ------------------------------------------------- | -------------------------- | --------- |
| [dashboard.feature](./features/dashboard.feature) | US006, US007, US008, US009 | 🟡 Medium |

### Integration Features

| Feature File                                            | User Stories | Priority  |
| ------------------------------------------------------- | ------------ | --------- |
| [integrations.feature](./features/integrations.feature) | US010, US011 | 🟡 Medium |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd packages/react-visual-feedback
npm install -D @playwright/test playwright-bdd @cucumber/cucumber
```

### 2. Configure Playwright BDD

Create `playwright-bdd.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "docs/bdd/features/**/*.feature",
  steps: "docs/bdd/steps/**/*.ts",
});

export default defineConfig({
  testDir,
  use: {
    baseURL: "http://localhost:3002",
  },
});
```

### 3. Run Tests

```bash
# Start the example app
cd packages/feedback-example
npm run dev

# Run BDD tests (in another terminal)
cd packages/react-visual-feedback
npx bddgen && npx playwright test
```

---

## 📋 Test Coverage Matrix

### ✅ Implemented Tests (32 scenarios, 160 tests across 5 browsers)

| Feature                 | Scenarios | Status         | Browsers                                                |
| ----------------------- | --------- | -------------- | ------------------------------------------------------- |
| **Feedback Modal**      | 4         | ✅ PASSING     | All 5                                                   |
| **Feedback Form**       | 6         | ✅ PASSING     | All 5                                                   |
| **Screenshot Capture**  | 2         | ✅ PASSING     | All 5                                                   |
| **Screen Recording**    | 3         | ✅ PASSING     | All 5                                                   |
| **Keyboard Shortcuts**  | 3         | ✅ PASSING     | All 5                                                   |
| **Feedback Submission** | 3         | ✅ PASSING     | All 5                                                   |
| **Dashboard**           | 5         | ✅ PASSING     | All 5                                                   |
| **Integrations**        | 4         | ✅ PASSING     | All 5                                                   |
| **Theming**             | 2         | ✅ PASSING     | All 5                                                   |
| **Total**               | **32**    | ✅ **160/160** | Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari |

### ✅ Completed User Story Coverage

| User Story | Feature File        | Scenarios | Status         |
| ---------- | ------------------- | --------- | -------------- |
| US001      | feedback-submission | 3         | ✅ IMPLEMENTED |
| US003      | screen-recording    | 3         | ✅ IMPLEMENTED |
| US005      | keyboard-shortcuts  | 3         | ✅ IMPLEMENTED |
| US006      | dashboard           | 3         | ✅ IMPLEMENTED |
| US007      | dashboard           | 2         | ✅ IMPLEMENTED |
| US010      | integrations        | 3         | ✅ IMPLEMENTED |
| US011      | integrations        | 1         | ✅ IMPLEMENTED |
| US012      | theming             | 2         | ✅ IMPLEMENTED |

### 🔲 Planned Tests (remaining - requires test fixtures/data)

| User Story | Feature File | Scenarios | Status    | Notes                                 |
| ---------- | ------------ | --------- | --------- | ------------------------------------- |
| US008      | dashboard    | 2         | 🔲 FUTURE | Requires pre-populated feedback items |
| US009      | dashboard    | 2         | 🔲 FUTURE | Requires recorded sessions with logs  |

> **Note:** US008 (Update Feedback Status) and US009 (Replay User Session) require test fixtures with pre-populated feedback data and recorded sessions. These scenarios would be implemented as part of integration testing with mock data.

---

## 🔗 Related Documentation

- **User Stories**: [../user-stories/README.md](../spec/005.user-stories/README.md)
- **Setup Guide**: [./SETUP.md](./SETUP.md)
- **Architecture**: [../architecture/README.md](../architecture/README.md)

---

## 🚀 Running the Tests

```bash
# Run all BDD tests
bun run test:bdd

# Run on specific browser
bun run test:bdd -- --project=chromium

# Run specific feature
bun run test:bdd -- --grep "Feedback Modal"

# View HTML report
npx playwright show-report
```

---

**Last Updated:** January 17, 2026
