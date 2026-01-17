# Feedback Server - User Stories

**Source Specification**: [001.server-software-specification/README.md](../001.server-software-specification/README.md)
**Created**: 2026-01-16
**Updated**: 2026-01-17

---

## 📋 Quick Status Overview

| Epic                      | Stories | Done | TODO | Status  |
| ------------------------- | ------- | ---- | ---- | ------- |
| E001: Feedback Submission | 3       | 3    | 0    | ✅ Done |
| E002: Feedback Management | 4       | 4    | 0    | ✅ Done |
| E003: Real-time Sync      | 2       | 2    | 0    | ✅ Done |
| E004: Data Portability    | 3       | 3    | 0    | ✅ Done |
| E005: Security            | 2       | 2    | 0    | ✅ Done |
| E006: Deployment          | 2       | 2    | 0    | ✅ Done |
| **Total**                 | **16**  | 16   | 0    | ✅ Done |

---

## 🎯 User Story Summary by Epic

### Epic E001: Feedback Submission

| Story | Name                         | Priority  | Status  | BDD Tests |
| ----- | ---------------------------- | --------- | ------- | --------- |
| US001 | Submit Feedback via API      | 🟢 High   | ✅ Done | 3/3       |
| US002 | Submit Video Recording       | 🟢 High   | ✅ Done | 3/3       |
| US003 | Identify Client Application  | 🟡 Medium | ✅ Done | 2/2       |

### Epic E002: Feedback Management

| Story | Name                  | Priority | Status  | BDD Tests |
| ----- | --------------------- | -------- | ------- | --------- |
| US004 | List All Feedback     | 🟢 High  | ✅ Done | 2/2       |
| US005 | View Single Feedback  | 🟢 High  | ✅ Done | 2/2       |
| US006 | Update Feedback Status| 🟢 High  | ✅ Done | 2/2       |
| US007 | Delete Feedback       | 🟡 Medium| ✅ Done | 2/2       |

### Epic E003: Real-time Sync

| Story | Name                     | Priority  | Status  | BDD Tests |
| ----- | ------------------------ | --------- | ------- | --------- |
| US008 | List Connected Clients   | 🟡 Medium | ✅ Done | 3/3       |
| US009 | Receive Feedback Updates | 🔴 Low    | ✅ Done | 3/3       |

### Epic E004: Data Portability

| Story | Name                   | Priority  | Status  | BDD Tests |
| ----- | ---------------------- | --------- | ------- | --------- |
| US010 | Export All Feedback    | 🟡 Medium | ✅ Done | 2/2       |
| US011 | Import Feedback Bundle | 🟡 Medium | ✅ Done | 2/2       |
| US012 | Bulk Delete Feedback   | 🟡 Medium | ✅ Done | 2/2       |

### Epic E005: Security

| Story | Name                    | Priority  | Status  | BDD Tests |
| ----- | ----------------------- | --------- | ------- | --------- |
| US013 | Authenticate with API Key | 🟡 Medium | ✅ Done | 4/4       |
| US014 | Rate Limit Requests     | 🔴 Low    | ✅ Done | 4/4       |

### Epic E006: Deployment

| Story | Name                        | Priority | Status  | BDD Tests |
| ----- | --------------------------- | -------- | ------- | --------- |
| US015 | Health Check Endpoint       | 🟢 High  | ✅ Done | 6/6       |
| US016 | Graceful Shutdown           | 🟢 High  | ✅ Done | 5/5       |

---

## 📊 Test Coverage Summary

| Test Type   | Files | Tests | Status  |
| ----------- | ----- | ----- | ------- |
| BDD         | 6     | 49    | ✅ Pass |
| Unit        | 3     | 62    | ✅ Pass |
| Integration | 2     | 20    | ✅ Pass |
| **Total**   | **11**| **131**| ✅ Pass |

---

## 🎯 Epics & User Stories

### E001: Feedback Submission

**As a** frontend developer
**I want** to send feedback from my web application to a central server
**So that** feedback is persisted and accessible from anywhere

---

#### US001: Submit Feedback via API

**As a** frontend developer
**I want** to POST feedback data to the server API
**So that** user feedback is stored centrally

**Acceptance Criteria**:

```gherkin
Scenario: Submit new feedback successfully
  Given I have a valid feedback payload
  When I POST to /api/feedback
  Then the response status should be 201
  And the response should contain the created feedback with an ID
  And the feedback should be stored in the database

Scenario: Submit feedback with screenshot
  Given I have feedback data with a screenshot blob
  When I POST the screenshot to /api/video
  And I POST the feedback with the screenshot URL
  Then the feedback should reference the uploaded screenshot

Scenario: Submit feedback with validation error
  Given I have an invalid feedback payload (missing message)
  When I POST to /api/feedback
  Then the response status should be 400
  And the response should describe the validation error
```

**Priority**: 🟢 High
**Related Tasks**: F002, F003

---

#### US002: Submit Video Recording

**As a** frontend developer
**I want** to upload video recordings with feedback
**So that** developers can see exactly what the user experienced

**Acceptance Criteria**:

```gherkin
Scenario: Upload video blob
  Given I have a video blob (webm format)
  When I POST to /api/video with the blob
  Then the response status should be 201
  And the response should contain the video URL
  And the video should be stored in blob storage

Scenario: Reject oversized video
  Given I have a video blob larger than 50MB
  When I POST to /api/video
  Then the response status should be 413
  And the response should indicate the size limit

Scenario: Reject invalid video format
  Given I have a file that is not a video
  When I POST to /api/video
  Then the response status should be 415
  And the response should indicate valid formats
```

**Priority**: 🟢 High
**Related Tasks**: F003, T003

---

#### US003: Identify Client Application

**As a** platform administrator
**I want** each feedback submission to include a client identifier
**So that** I can distinguish feedback from different applications

**Acceptance Criteria**:

```gherkin
Scenario: Feedback includes client ID
  Given feedback is submitted from "app-dashboard"
  When I query feedback for client "app-dashboard"
  Then I should only see feedback from that application

Scenario: Query feedback by client
  Given I have feedback from multiple clients
  When I GET /api/feedback?clientId=app-dashboard
  Then I should only see feedback from "app-dashboard"
```

**Priority**: 🟡 Medium
**Related Tasks**: F002, F006

---

### E002: Feedback Management

**As a** product manager
**I want** to view, update, and manage feedback items
**So that** I can track and resolve user issues

---

#### US004: List All Feedback

**As a** product manager
**I want** to see a list of all feedback items
**So that** I can review what users have reported

**Acceptance Criteria**:

```gherkin
Scenario: List all feedback
  Given there are 25 feedback items in the database
  When I GET /api/feedback
  Then I should receive a paginated list
  And the default page size should be 20
  And pagination metadata should be included

Scenario: Paginate feedback
  Given there are 50 feedback items
  When I GET /api/feedback?page=2&limit=10
  Then I should receive items 11-20
  And the response should include total count
```

**Priority**: 🟢 High
**Related Tasks**: F002

---

#### US005: View Single Feedback

**As a** developer
**I want** to view the details of a specific feedback item
**So that** I can understand the issue and reproduce it

**Acceptance Criteria**:

```gherkin
Scenario: Get feedback by ID
  Given a feedback item exists with ID "fb-123"
  When I GET /api/feedback/fb-123
  Then I should receive the complete feedback data
  And it should include screenshot URL if present
  And it should include video URL if present
  And it should include browser metadata

Scenario: Feedback not found
  Given no feedback exists with ID "fb-nonexistent"
  When I GET /api/feedback/fb-nonexistent
  Then the response status should be 404
```

**Priority**: 🟢 High
**Related Tasks**: F002

---

#### US006: Update Feedback Status

**As a** product manager
**I want** to update the status of feedback items
**So that** I can track progress on resolving issues

**Acceptance Criteria**:

```gherkin
Scenario: Update feedback status
  Given a feedback item with status "open"
  When I PATCH /api/feedback/:id with status "inProgress"
  Then the feedback status should be updated
  And the updatedAt timestamp should change

Scenario: Update multiple fields
  Given a feedback item
  When I PATCH with status and notes
  Then both fields should be updated
```

**Priority**: 🟢 High
**Related Tasks**: F002

---

#### US007: Delete Feedback

**As a** administrator
**I want** to delete feedback items
**So that** I can remove spam or duplicates

**Acceptance Criteria**:

```gherkin
Scenario: Delete feedback
  Given a feedback item exists
  When I DELETE /api/feedback/:id
  Then the feedback should be removed
  And associated videos should be deleted
  And associated screenshots should be deleted

Scenario: Delete non-existent feedback
  When I DELETE /api/feedback/nonexistent
  Then the response status should be 404
```

**Priority**: 🟡 Medium
**Related Tasks**: F002, F003

---

### E003: Real-time Sync

**As a** dashboard user
**I want** to see new feedback in real-time
**So that** I can respond quickly to user reports

---

#### US008: Receive Real-time Updates

**As a** dashboard user
**I want** to receive instant notifications when new feedback arrives
**So that** I don't need to manually refresh

**Acceptance Criteria**:

```gherkin
Scenario: Receive new feedback notification
  Given I am connected to the WebSocket server
  When a new feedback item is created
  Then I should receive a "feedback:created" event
  And the event should contain the feedback data

Scenario: Receive update notification
  Given I am connected to the WebSocket server
  When a feedback item is updated
  Then I should receive a "feedback:updated" event

Scenario: Receive deletion notification
  Given I am connected to the WebSocket server
  When a feedback item is deleted
  Then I should receive a "feedback:deleted" event
```

**Priority**: 🟡 Medium
**Related Tasks**: R001, R002

---

#### US009: Filter Real-time Updates by Client

**As a** dashboard user
**I want** to receive updates only for my application
**So that** I'm not overwhelmed with notifications

**Acceptance Criteria**:

```gherkin
Scenario: Subscribe to specific client
  Given I connect with clientId filter "my-app"
  When feedback is created for "my-app"
  Then I should receive the notification
  When feedback is created for "other-app"
  Then I should NOT receive the notification
```

**Priority**: 🔴 Low
**Related Tasks**: R002

---

### E004: Data Portability

**As a** administrator
**I want** to import and export feedback data
**So that** I can backup data or migrate between environments

---

#### US010: Export All Feedback

**As a** administrator
**I want** to export all feedback to a JSON file
**So that** I can create backups

**Acceptance Criteria**:

```gherkin
Scenario: Export all feedback
  Given there are 10 feedback items
  When I GET /api/feedback/export
  Then I should receive a JSON file
  And it should contain all 10 items
  And videos should be included as base64

Scenario: Export filtered feedback
  When I GET /api/feedback/export?clientId=my-app
  Then the export should only include "my-app" feedback
```

**Priority**: 🟡 Medium
**Related Tasks**: F005

---

#### US011: Import Feedback Bundle

**As a** administrator
**I want** to import a feedback bundle
**So that** I can restore from backup or migrate data

**Acceptance Criteria**:

```gherkin
Scenario: Import feedback bundle
  Given I have a valid feedback bundle JSON
  When I POST to /api/feedback/bulk
  Then all items should be imported
  And I should receive an import summary

Scenario: Handle duplicate feedback
  Given some feedback IDs already exist
  When I import with duplicateHandling: "skip"
  Then existing items should not be modified
  And new items should be added
```

**Priority**: 🟡 Medium
**Related Tasks**: F004

---

#### US012: Validate Import Bundle

**As a** administrator
**I want** invalid bundles to be rejected
**So that** I don't corrupt my data

**Acceptance Criteria**:

```gherkin
Scenario: Reject invalid bundle
  Given I have a malformed JSON bundle
  When I POST to /api/feedback/bulk
  Then the response status should be 400
  And the response should describe the validation error

Scenario: Reject incompatible version
  Given I have a bundle with version "99.0.0"
  When I POST to /api/feedback/bulk
  Then the response should indicate version incompatibility
```

**Priority**: 🟡 Medium
**Related Tasks**: F004

---

### E005: Security

**As a** administrator
**I want** to secure the API
**So that** only authorized clients can access feedback

---

#### US013: Authenticate with API Key

**As a** API consumer
**I want** to authenticate using an API key
**So that** my requests are authorized

**Acceptance Criteria**:

```gherkin
Scenario: Request with valid API key
  Given AUTH_ENABLED is true
  And I have a valid API key
  When I include the key in X-API-Key header
  Then my request should be authorized

Scenario: Request without API key
  Given AUTH_ENABLED is true
  When I make a request without API key
  Then the response status should be 401

Scenario: Request with invalid API key
  Given AUTH_ENABLED is true
  When I include an invalid API key
  Then the response status should be 403
```

**Priority**: 🟡 Medium
**Related Tasks**: A001

---

#### US014: Rate Limit Requests

**As a** administrator
**I want** to limit request rates
**So that** the server is protected from abuse

**Acceptance Criteria**:

```gherkin
Scenario: Allow requests within limit
  Given rate limit is 100 per minute
  When I make 50 requests
  Then all should succeed

Scenario: Reject excessive requests
  Given rate limit is 100 per minute
  When I make 150 requests
  Then the last 50 should return 429
  And response should include retry-after header
```

**Priority**: 🔴 Low
**Related Tasks**: Middleware (implicit)

---

### E006: Deployment

**As a** DevOps engineer
**I want** easy deployment options
**So that** I can run the server in any environment

---

#### US015: Run as Docker Container

**As a** DevOps engineer
**I want** to run the server as a Docker container
**So that** deployment is consistent across environments

**Acceptance Criteria**:

```gherkin
Scenario: Build Docker image
  Given I have the source code
  When I run "docker build"
  Then a working image should be created
  And the image should be less than 200MB

Scenario: Run with environment variables
  Given I have the Docker image
  When I run with DATABASE_URL environment variable
  Then the server should connect to that database
```

**Priority**: 🟢 High
**Related Tasks**: D001

---

#### US016: Health Check for Orchestration

**As a** DevOps engineer
**I want** a health check endpoint
**So that** Kubernetes/Docker can monitor the service

**Acceptance Criteria**:

```gherkin
Scenario: Health check succeeds
  Given the server is running
  And the database is connected
  When I GET /api/health
  Then the response status should be 200
  And the response should include db status

Scenario: Health check fails
  Given the database is unreachable
  When I GET /api/health
  Then the response status should be 503
  And the response should indicate db issue
```

**Priority**: 🟢 High
**Related Tasks**: F001

---

## 📊 Priority Matrix

| Priority  | User Stories                                    |
| --------- | ----------------------------------------------- |
| 🟢 High   | US001, US002, US004, US005, US006, US015, US016 |
| 🟡 Medium | US003, US007, US008, US010, US011, US012, US013 |
| 🔴 Low    | US009, US014                                    |

---

## 🔗 Related Documentation

- **Software Specification**: [001.server-software-specification/README.md](../001.server-software-specification/README.md)
- **Tasks**: [002.server-tasks/TASKS-OVERVIEW.md](../002.server-tasks/TASKS-OVERVIEW.md)
- **BDD Tests**: [../../../tests/bdd/](../../../tests/bdd/)

---

**Documentation compiled by:** GitHub Copilot
**For project:** react-visual-feedback / feedback-server
**Date:** January 17, 2026
