@feedback @core
Feature: Feedback Submission
  As a user
  I want to submit visual feedback about a web page
  So that I can report bugs, suggest improvements, or provide comments

  Background:
    Given user is on a page with the feedback widget enabled
  # User Story: US001 - Provide Visual Feedback
  # Priority: High

  @happy-path @smoke
  Scenario: Submit feedback with description only
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user enters "Found a typo on the homepage" in the description
    And user clicks the submit button
    Then feedback is saved successfully
    And user sees a confirmation message
    And the modal closes

  @happy-path
  Scenario: Submit feedback with title and description
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user enters "Typo Report" in the title field
    And user enters "The word 'receive' is misspelled as 'recieve' in the footer" in the description
    And user clicks the submit button
    Then feedback is saved successfully
    And user sees a confirmation message

  @edge-case
  Scenario: Submit feedback with all fields populated
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user enters "UI Suggestion" in the title field
    And user enters "Consider adding a dark mode toggle" in the description
    And user selects "enhancement" as the feedback type
    And user attaches a screenshot
    And user clicks the submit button
    Then feedback is saved successfully
    And the feedback includes the attached screenshot

  @validation @negative
  Scenario: Attempt to submit empty feedback
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user clicks the submit button without entering any text
    Then user sees a validation error message
    And the modal remains open
    And no feedback is submitted

  @keyboard @accessibility
  Scenario: Submit feedback using keyboard navigation
    When user presses the keyboard shortcut to open feedback
    Then a feedback form modal opens
    When user navigates to the description field using Tab
    And user types "Keyboard navigation test"
    And user presses Tab to reach the submit button
    And user presses Enter
    Then feedback is saved successfully
    And user sees a confirmation message

  @cancel
  Scenario: Cancel feedback submission
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user enters "Draft feedback text" in the description
    And user clicks the close button
    Then the modal closes
    And no feedback is submitted

  @escape-key @keyboard
  Scenario: Close modal with Escape key
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user presses the Escape key
    Then the modal closes

  @persistence @edge-case
  Scenario: Feedback form retains data when switching tabs
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user enters "Work in progress feedback" in the description
    And user clicks the screenshot tab
    And user clicks the description tab
    Then the description field contains "Work in progress feedback"

  @theme
  Scenario: Submit feedback with custom theme
    Given the feedback widget is configured with a custom theme
    When user clicks the feedback trigger button
    Then a feedback form modal opens with the custom theme colors
    When user enters "Theme looks great!" in the description
    And user clicks the submit button
    Then feedback is saved successfully

  @submission-queue @offline
  Scenario: Feedback queued when offline
    Given user's browser is offline
    When user clicks the feedback trigger button
    Then a feedback form modal opens
    When user enters "Offline feedback test" in the description
    And user clicks the submit button
    Then feedback is queued for later submission
    And user sees an offline submission notice
    When user's browser comes back online
    Then queued feedback is automatically submitted
