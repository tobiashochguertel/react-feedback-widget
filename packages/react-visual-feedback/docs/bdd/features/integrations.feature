@integrations @external
Feature: Integrations
  As a developer
  I want to integrate feedback submissions with external systems
  So that feedback automatically flows into my team's workflow tools

  Background:
    Given user is on a page with the feedback widget enabled

  # User Stories: US010 - Submit Feedback to Jira
  #               US011 - Submit Feedback to Google Sheets
  # Priority: Medium

  # Jira Integration (US010)

  @jira @smoke
  Scenario: Submit feedback to Jira
    Given Jira integration is configured
    And user has opened the feedback modal
    When user enters "Login button not working" as title
    And user enters "Clicking the login button shows no response" in the description
    And user captures a screenshot
    And user clicks the submit button
    Then feedback is saved locally
    And a Jira issue is created automatically
    And user sees "Jira issue created" confirmation

  @jira
  Scenario: Jira issue contains all feedback data
    Given Jira integration is configured
    And user submits feedback with screenshot and description
    Then the Jira issue includes:
      | Field       | Content                          |
      | Summary     | Feedback title                   |
      | Description | Feedback description             |
      | Attachments | Screenshot images                |
      | Labels      | Configured project labels        |

  @jira
  Scenario: Jira issue includes page metadata
    Given Jira integration is configured
    And user submits feedback
    Then the Jira issue description includes:
      | Metadata    |
      | Page URL    |
      | Browser     |
      | OS          |
      | Timestamp   |
      | User agent  |

  @jira-priority
  Scenario: Map feedback type to Jira priority
    Given Jira integration is configured with priority mapping
    When user submits feedback with type "Bug - Critical"
    Then the Jira issue is created with "Highest" priority

  @jira-project
  Scenario: Submit to specific Jira project
    Given Jira integration is configured with project key "FEEDBACK"
    When user submits feedback
    Then the issue is created in the "FEEDBACK" project

  @jira-offline
  Scenario: Queue Jira submission when offline
    Given Jira integration is configured
    And user's browser is offline
    When user submits feedback
    Then feedback is saved locally
    And Jira submission is queued
    And user sees "Will sync to Jira when online" message
    When user's browser comes back online
    Then the queued Jira issue is created

  @jira-error
  Scenario: Handle Jira API error gracefully
    Given Jira integration is configured
    And Jira API is temporarily unavailable
    When user submits feedback
    Then feedback is saved locally
    And user sees "Jira sync will retry automatically" message
    And the submission is queued for retry

  @jira-auth-error
  Scenario: Handle Jira authentication error
    Given Jira integration has expired credentials
    When user submits feedback
    Then feedback is saved locally
    And user sees "Jira authentication required" message
    And a link to reconnect Jira is provided

  # Google Sheets Integration (US011)

  @sheets @smoke
  Scenario: Submit feedback to Google Sheets
    Given Google Sheets integration is configured
    And user has opened the feedback modal
    When user enters "Typo on homepage" as title
    And user enters "The word 'receive' is misspelled" in the description
    And user clicks the submit button
    Then feedback is saved locally
    And a new row is added to the configured Google Sheet
    And user sees "Added to Google Sheet" confirmation

  @sheets
  Scenario: Google Sheet row contains all feedback data
    Given Google Sheets integration is configured
    And user submits feedback with all fields
    Then the Google Sheet row includes:
      | Column      | Content                |
      | Timestamp   | Submission time        |
      | Title       | Feedback title         |
      | Description | Feedback description   |
      | Type        | Feedback type          |
      | Status      | Initial status         |
      | Page URL    | Source page URL        |
      | Screenshot  | Link to screenshot     |

  @sheets-columns
  Scenario: Custom column mapping
    Given Google Sheets integration has custom column mapping:
      | Source       | Column |
      | title        | A      |
      | description  | B      |
      | url          | C      |
      | status       | D      |
      | created_at   | E      |
    When user submits feedback
    Then data is written to the correct columns

  @sheets-new-sheet
  Scenario: Create new sheet tab for each month
    Given Google Sheets integration is configured for monthly tabs
    When user submits feedback in January
    Then the feedback is added to "January 2026" sheet tab
    When user submits feedback in February
    Then the feedback is added to "February 2026" sheet tab

  @sheets-offline
  Scenario: Queue Sheets submission when offline
    Given Google Sheets integration is configured
    And user's browser is offline
    When user submits feedback
    Then feedback is saved locally
    And Google Sheets submission is queued
    When user's browser comes back online
    Then the queued row is added to the Sheet

  @sheets-error
  Scenario: Handle Google Sheets API error
    Given Google Sheets integration is configured
    And Google Sheets API rate limit is exceeded
    When user submits feedback
    Then feedback is saved locally
    And user sees "Sheet sync will retry" message
    And the submission is automatically retried with backoff

  # Multiple Integrations

  @multi-integration
  Scenario: Submit to multiple integrations simultaneously
    Given both Jira and Google Sheets integrations are configured
    When user submits feedback
    Then feedback is saved locally
    And a Jira issue is created
    And a Google Sheets row is added
    And user sees confirmation for both integrations

  @integration-toggle
  Scenario: Enable/disable integrations per submission
    Given both Jira and Google Sheets integrations are configured
    And the feedback modal shows integration toggles
    When user unchecks "Create Jira issue"
    And user keeps "Add to Sheet" checked
    And user submits feedback
    Then only Google Sheets receives the submission
    And no Jira issue is created

  # Webhook Integration

  @webhook
  Scenario: Submit feedback via webhook
    Given webhook integration is configured with URL "https://api.example.com/feedback"
    When user submits feedback
    Then a POST request is sent to the webhook URL
    And the request body contains the feedback data in JSON format

  @webhook-custom-headers
  Scenario: Webhook includes custom headers
    Given webhook integration has custom headers:
      | Header        | Value             |
      | Authorization | Bearer token123   |
      | X-Project-ID  | my-project        |
    When user submits feedback
    Then the webhook request includes the custom headers

  @webhook-retry
  Scenario: Retry failed webhook deliveries
    Given webhook integration is configured
    And the webhook endpoint returns a 500 error
    When user submits feedback
    Then the submission is queued for retry
    And retry uses exponential backoff (1s, 2s, 4s, 8s)
    And after 5 failures, the submission is marked as failed

  # Server-Side Integration

  @server-api
  Scenario: Submit to custom server API
    Given server integration is configured with endpoint "/api/feedback"
    When user submits feedback
    Then a POST request is sent to "/api/feedback"
    And the response is processed
    And user sees the server's confirmation message

  @server-upload
  Scenario: Upload attachments to server
    Given server integration supports file uploads
    And user has captured a screenshot
    When user submits feedback
    Then the screenshot is uploaded to the server
    And the server returns a file URL
    And the file URL is included in the feedback data

  # Integration Configuration

  @config
  Scenario: View integration status in settings
    Given user opens the feedback settings
    Then user sees a list of available integrations
    And each integration shows its connection status
    And user can configure or disconnect integrations

  @config-test
  Scenario: Test integration connection
    Given Jira integration is configured
    When user clicks "Test Connection" for Jira
    Then a test API call is made
    And user sees "Connection successful" or error details
