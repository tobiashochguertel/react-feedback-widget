# Feedback Server CLI - User Stories

> **Version:** 0.1.0
> **Last Updated:** 2025-01-20
> **BDD Tests Status:** ✅ Implemented

## 🎯 Implementation Status

All user stories in this document have corresponding BDD tests implemented in `tests/bdd/`.

| Epic ID | Epic Name           | Stories | Test File                       | Status          |
| ------- | ------------------- | ------- | ------------------------------- | --------------- |
| E001    | Authentication      | 3       | `authentication.test.ts`        | ✅ Implemented  |
| E002    | Feedback Management | 5       | `feedback-management.test.ts`   | ✅ Implemented  |
| E003    | Data Export         | 3       | `data-export.test.ts`           | ✅ Implemented  |
| E004    | Configuration       | 3       | `configuration.test.ts`         | ✅ Implemented  |
| E005    | Shell Integration   | 2       | `shell-integration.test.ts`     | ✅ Implemented  |
| E006    | CI/CD Integration   | 2       | `cicd-integration.test.ts`      | ✅ Implemented  |

### Running BDD Tests

```bash
# Run all BDD tests
task test:bdd

# Run with server (starts server, runs tests, stops server)
task test:with-server

# Run specific epic
bun vitest run tests/bdd/authentication.test.ts
```

---

## 📋 Epic Overview

| Epic ID | Epic Name           | Stories | Priority |
| ------- | ------------------- | ------- | -------- |
| E001    | Authentication      | 3       | P0       |
| E002    | Feedback Management | 5       | P0       |
| E003    | Data Export         | 3       | P1       |
| E004    | Configuration       | 3       | P0       |
| E005    | Shell Integration   | 2       | P2       |
| E006    | CI/CD Integration   | 2       | P1       |

---

## 🔐 Epic E001: Authentication

### US-CLI-001: CLI Authentication

**As a** user
**I want to** authenticate with the Feedback Server via CLI
**So that** I can access protected resources

**Priority:** P0 - Critical

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: CLI Authentication

  Scenario: Interactive login with username and password
    Given I have not authenticated before
    When I run "feedback-cli auth login"
    Then I should be prompted for the server URL
    And I should be prompted for my email
    And I should be prompted for my password
    And upon successful authentication I should see "Login successful!"
    And my credentials should be stored securely

  Scenario: Login with API key
    Given I have an API key
    When I run "feedback-cli auth login --api-key sk_live_xxxxx"
    Then I should be authenticated using the API key
    And the API key should be stored securely

  Scenario: Login with environment variable
    Given the environment variable FEEDBACK_API_KEY is set
    When I run "feedback-cli feedback list"
    Then the CLI should use the API key from the environment
    And the request should be authenticated

  Scenario: Login failure with invalid credentials
    Given I have not authenticated
    When I run "feedback-cli auth login"
    And I enter invalid credentials
    Then I should see an error "Invalid credentials"
    And I should be prompted to try again
```

---

### US-CLI-002: View Current User

**As an** authenticated user
**I want to** see who I am logged in as
**So that** I can verify my authentication status

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: View Current User

  Scenario: View authenticated user information
    Given I am authenticated
    When I run "feedback-cli auth whoami"
    Then I should see my email address
    And I should see the server URL
    And I should see my role

  Scenario: View when not authenticated
    Given I am not authenticated
    When I run "feedback-cli auth whoami"
    Then I should see "Not logged in"
    And I should see a hint to run "feedback-cli auth login"
```

---

### US-CLI-003: Logout

**As an** authenticated user
**I want to** log out from the CLI
**So that** my credentials are no longer stored

**Priority:** P0 - Critical

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: CLI Logout

  Scenario: Successful logout
    Given I am authenticated
    When I run "feedback-cli auth logout"
    Then I should see "Logged out successfully"
    And my stored credentials should be cleared

  Scenario: Logout when not logged in
    Given I am not authenticated
    When I run "feedback-cli auth logout"
    Then I should see "Not currently logged in"
```

---

## 📋 Epic E002: Feedback Management

### US-CLI-004: List Feedback

**As a** user
**I want to** list feedback items from the command line
**So that** I can quickly review feedback without a browser

**Priority:** P0 - Critical

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: List Feedback

  Scenario: List all feedback in table format
    Given I am authenticated
    When I run "feedback-cli feedback list"
    Then I should see a table with columns: ID, Title, Type, Status, Created
    And I should see up to 20 items by default
    And I should see pagination info at the bottom

  Scenario: List feedback with filters
    Given I am authenticated
    When I run "feedback-cli feedback list --status pending --type bug"
    Then I should see only pending bugs
    And the table should reflect the filtered results

  Scenario: List feedback in JSON format
    Given I am authenticated
    When I run "feedback-cli feedback list --output json"
    Then I should see valid JSON output
    And the output should be suitable for piping to jq

  Scenario: List feedback with date filter
    Given I am authenticated
    When I run "feedback-cli feedback list --since 2025-01-01"
    Then I should see only feedback created after January 1, 2025

  Scenario: Search feedback by keyword
    Given I am authenticated
    When I run "feedback-cli feedback list --query 'login button'"
    Then I should see feedback containing "login button"
```

---

### US-CLI-005: Get Feedback Details

**As a** user
**I want to** view detailed information about a specific feedback item
**So that** I can understand the full context

**Priority:** P0 - Critical

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Get Feedback Details

  Scenario: View feedback details
    Given I am authenticated
    And feedback "fb_123abc" exists
    When I run "feedback-cli feedback get fb_123abc"
    Then I should see the feedback title
    And I should see the full description
    And I should see the status, type, and priority
    And I should see the creation date
    And I should see the environment information

  Scenario: View feedback with attachments info
    Given I am authenticated
    And feedback "fb_123abc" has screenshots attached
    When I run "feedback-cli feedback get fb_123abc --include screenshots"
    Then I should see a list of attached screenshots
    And I should see their URLs

  Scenario: Download feedback media
    Given I am authenticated
    And feedback "fb_123abc" has screenshots attached
    When I run "feedback-cli feedback get fb_123abc --download-media"
    Then the screenshots should be downloaded to the current directory
    And I should see "Downloaded 2 files"

  Scenario: Feedback not found
    Given I am authenticated
    When I run "feedback-cli feedback get fb_nonexistent"
    Then I should see an error "Feedback not found: fb_nonexistent"
    And the exit code should be 4
```

---

### US-CLI-006: Create Feedback

**As a** user
**I want to** create feedback from the command line
**So that** I can automate feedback submission

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Create Feedback

  Scenario: Create feedback with minimal options
    Given I am authenticated
    When I run "feedback-cli feedback create --title 'Test feedback'"
    Then a new feedback should be created
    And I should see "Created feedback: fb_xxxxxx"

  Scenario: Create feedback with all options
    Given I am authenticated
    When I run:
      """
      feedback-cli feedback create \
        --title "Login button broken" \
        --description "The login button does not respond to clicks" \
        --type bug \
        --priority high \
        --tags "login,urgent"
      """
    Then a new feedback should be created with all specified fields
    And I should see the created feedback ID

  Scenario: Create feedback interactively
    Given I am authenticated
    When I run "feedback-cli feedback create --interactive"
    Then I should be prompted for the title
    And I should be prompted to select the type
    And I should be prompted to select the priority
    And I should be prompted for the description
    And the feedback should be created with my inputs

  Scenario: Create feedback from JSON file
    Given I am authenticated
    And I have a file "feedback.json" with valid feedback data
    When I run "feedback-cli feedback create --from-file feedback.json"
    Then a new feedback should be created from the file
```

---

### US-CLI-007: Update Feedback

**As a** user
**I want to** update feedback properties from the command line
**So that** I can manage feedback without the WebUI

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Update Feedback

  Scenario: Update feedback status
    Given I am authenticated
    And feedback "fb_123abc" exists with status "pending"
    When I run "feedback-cli feedback update fb_123abc --status resolved"
    Then the feedback status should be updated to "resolved"
    And I should see "Updated feedback fb_123abc"

  Scenario: Update feedback priority
    Given I am authenticated
    And feedback "fb_123abc" exists
    When I run "feedback-cli feedback update fb_123abc --priority high"
    Then the feedback priority should be updated to "high"

  Scenario: Add tags to feedback
    Given I am authenticated
    And feedback "fb_123abc" exists with no tags
    When I run "feedback-cli feedback update fb_123abc --tags urgent,reviewed"
    Then the feedback should have tags "urgent" and "reviewed"

  Scenario: Update feedback interactively
    Given I am authenticated
    And feedback "fb_123abc" exists
    When I run "feedback-cli feedback update fb_123abc --interactive"
    Then I should see the current values
    And I should be able to modify each field
    And only changed fields should be updated
```

---

### US-CLI-008: Delete Feedback

**As a** user
**I want to** delete feedback from the command line
**So that** I can remove unwanted items

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Delete Feedback

  Scenario: Delete feedback with confirmation
    Given I am authenticated
    And feedback "fb_123abc" exists
    When I run "feedback-cli feedback delete fb_123abc"
    Then I should see "Are you sure you want to delete fb_123abc? (y/N)"
    When I enter "y"
    Then the feedback should be deleted
    And I should see "Deleted feedback fb_123abc"

  Scenario: Delete feedback with force flag
    Given I am authenticated
    And feedback "fb_123abc" exists
    When I run "feedback-cli feedback delete fb_123abc --force"
    Then the feedback should be deleted without confirmation
    And I should see "Deleted feedback fb_123abc"

  Scenario: Cancel deletion
    Given I am authenticated
    And feedback "fb_123abc" exists
    When I run "feedback-cli feedback delete fb_123abc"
    And I enter "n" at the confirmation prompt
    Then the feedback should not be deleted
    And I should see "Deletion cancelled"
```

---

## 📤 Epic E003: Data Export

### US-CLI-009: Export to JSON

**As a** user
**I want to** export feedback data to a JSON file
**So that** I can backup or process the data externally

**Priority:** P0 - Critical

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Export to JSON

  Scenario: Export all feedback to JSON
    Given I am authenticated
    When I run "feedback-cli export json --output feedback.json"
    Then a file "feedback.json" should be created
    And it should contain valid JSON with all feedback items

  Scenario: Export filtered feedback to JSON
    Given I am authenticated
    When I run "feedback-cli export json --status pending --output pending.json"
    Then only pending feedback should be exported

  Scenario: Export with media
    Given I am authenticated
    And some feedback items have screenshots
    When I run "feedback-cli export json --include-media --output full-export.json"
    Then the JSON should include base64-encoded screenshot data

  Scenario: Handle file exists
    Given I am authenticated
    And "feedback.json" already exists
    When I run "feedback-cli export json --output feedback.json"
    Then I should see "File exists. Overwrite? (y/N)"
```

---

### US-CLI-010: Export to CSV

**As a** user
**I want to** export feedback data to a CSV file
**So that** I can open it in Excel or Google Sheets

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Export to CSV

  Scenario: Export all feedback to CSV
    Given I am authenticated
    When I run "feedback-cli export csv --output feedback.csv"
    Then a file "feedback.csv" should be created
    And it should have a header row with column names
    And each feedback item should be on its own row

  Scenario: CSV handles special characters
    Given I am authenticated
    And feedback contains titles with commas and quotes
    When I run "feedback-cli export csv --output feedback.csv"
    Then the CSV should be properly escaped
    And it should be valid CSV format
```

---

### US-CLI-011: Export to Markdown

**As a** user
**I want to** export feedback data to Markdown
**So that** I can include it in documentation

**Priority:** P2 - Low

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Export to Markdown

  Scenario: Export feedback to Markdown
    Given I am authenticated
    When I run "feedback-cli export markdown --output FEEDBACK.md"
    Then a Markdown file should be created
    And it should have a summary table
    And each feedback should have its own section
    And the formatting should be readable
```

---

## ⚙️ Epic E004: Configuration

### US-CLI-012: Initialize Configuration

**As a** user
**I want to** set up CLI configuration interactively
**So that** I don't have to specify options every time

**Priority:** P0 - Critical

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Initialize Configuration

  Scenario: Interactive configuration setup
    Given I have not configured the CLI before
    When I run "feedback-cli config init"
    Then I should be prompted for the server URL
    And I should be prompted for default output format
    And I should be prompted for default page size
    And a config file should be created

  Scenario: Config already exists
    Given a config file already exists
    When I run "feedback-cli config init"
    Then I should see "Configuration already exists"
    And I should be asked if I want to overwrite
```

---

### US-CLI-013: Manage Configuration Values

**As a** user
**I want to** get and set individual configuration values
**So that** I can customize CLI behavior

**Priority:** P0 - Critical

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Manage Configuration

  Scenario: Get configuration value
    Given I have a configured CLI
    When I run "feedback-cli config get server.url"
    Then I should see the server URL value

  Scenario: Set configuration value
    Given I have a configured CLI
    When I run "feedback-cli config set output.format json"
    Then the output format should be set to "json"
    And I should see "Config updated: output.format = json"

  Scenario: List all configuration
    Given I have a configured CLI
    When I run "feedback-cli config list"
    Then I should see all configuration values
    And sensitive values should be masked

  Scenario: Get non-existent key
    Given I have a configured CLI
    When I run "feedback-cli config get nonexistent.key"
    Then I should see "Key not found: nonexistent.key"
```

---

### US-CLI-014: Use Environment Variables

**As a** DevOps engineer
**I want to** configure the CLI via environment variables
**So that** I can use it in CI/CD pipelines

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Environment Variable Configuration

  Scenario: Override server URL with environment variable
    Given FEEDBACK_SERVER_URL is set to "https://staging.example.com"
    When I run "feedback-cli feedback list"
    Then the request should be sent to "https://staging.example.com"

  Scenario: Use API key from environment
    Given FEEDBACK_API_KEY is set
    When I run "feedback-cli feedback list"
    Then the request should be authenticated with the API key
    And no prompt for login should appear

  Scenario: Environment variables override config file
    Given I have a config file with server.url = "https://prod.example.com"
    And FEEDBACK_SERVER_URL is set to "https://staging.example.com"
    When I run "feedback-cli feedback list"
    Then the request should use the environment variable value
```

---

## 🐚 Epic E005: Shell Integration

### US-CLI-015: Shell Completion

**As a** power user
**I want to** have tab completion for CLI commands
**So that** I can type commands faster

**Priority:** P2 - Low

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Shell Completion

  Scenario: Generate bash completion script
    When I run "feedback-cli completion bash"
    Then I should see a bash completion script
    And the script should complete command names
    And the script should complete option names

  Scenario: Generate zsh completion script
    When I run "feedback-cli completion zsh"
    Then I should see a zsh completion script
    And it should include descriptions for commands

  Scenario: Install completion
    When I run "feedback-cli completion bash >> ~/.bashrc"
    And I source my bashrc
    Then pressing Tab after "feedback-cli " should show available commands
```

---

### US-CLI-016: Interactive Browser Mode

**As a** user
**I want to** browse feedback interactively in the terminal
**So that** I can quickly navigate without memorizing IDs

**Priority:** P2 - Low

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Interactive Browser

  Scenario: Open interactive browser
    Given I am authenticated
    When I run "feedback-cli feedback list --interactive"
    Then I should see a scrollable list of feedback
    And I should be able to navigate with arrow keys

  Scenario: View feedback details in interactive mode
    Given I am in interactive browser mode
    When I press Enter on a feedback item
    Then I should see the full details
    And I should be able to press 'b' to go back

  Scenario: Update status in interactive mode
    Given I am viewing feedback details in interactive mode
    When I press 's' to change status
    Then I should see a menu of status options
    And selecting one should update the feedback
```

---

## 🔧 Epic E006: CI/CD Integration

### US-CLI-017: CI-Friendly Output

**As a** DevOps engineer
**I want** the CLI to work well in CI environments
**So that** I can automate feedback workflows

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: CI-Friendly Output

  Scenario: Detect CI environment
    Given the CI environment variable is set
    When I run "feedback-cli feedback list"
    Then the output should not include colors
    And the output should not include spinners
    And the output should be plain text

  Scenario: Exit codes for scripting
    Given I am authenticated
    When I run "feedback-cli feedback get fb_nonexistent"
    Then the exit code should be 4 (not found)

  Scenario: JSON output for parsing
    Given I am authenticated
    When I run "feedback-cli feedback list --output json"
    Then the output should be valid JSON
    And it should be parseable by jq
```

---

### US-CLI-018: Create Feedback from Pipeline

**As a** DevOps engineer
**I want to** create feedback from CI pipelines
**So that** I can report issues automatically

**Priority:** P1 - High

**Acceptance Criteria (Gherkin):**

```gherkin
Feature: Pipeline Integration

  Scenario: Create feedback from failed test
    Given I have FEEDBACK_API_KEY set in CI
    When a test fails
    And I run:
      """
      feedback-cli feedback create \
        --title "CI: Test failure in main branch" \
        --type bug \
        --priority high \
        --tags "ci,test-failure,$CI_JOB_ID"
      """
    Then feedback should be created
    And I should see the feedback ID for logging

  Scenario: Attach logs to feedback
    Given I have captured test logs
    When I run "feedback-cli feedback create --title 'CI failure' --from-file test-results.json"
    Then feedback should be created with the log data
```

---

## 📊 Story Point Summary

| Epic                      | Stories | Total Points |
| ------------------------- | ------- | ------------ |
| E001: Authentication      | 3       | 8            |
| E002: Feedback Management | 5       | 21           |
| E003: Data Export         | 3       | 8            |
| E004: Configuration       | 3       | 8            |
| E005: Shell Integration   | 2       | 8            |
| E006: CI/CD Integration   | 2       | 5            |
| **Total**                 | **18**  | **58**       |

---

**Document Status:** Draft
**Author:** GitHub Copilot
**Created:** January 2025
