@feedback-widget @submission
Feature: Feedback Submission
  As a user
  I want to submit visual feedback about a web page
  So that I can report bugs, suggest improvements, or provide comments

  Background:
    Given I am on the example app homepage
    And the feedback modal is open

  @submit @happy-path
  Scenario: Submit feedback with description
    When I enter the description "Found a typo on the homepage"
    And I submit the feedback
    Then the feedback should be submitted successfully

  @submit @validation
  Scenario: Submit button is disabled without content
    Then the submit button should be disabled

  @cancel
  Scenario: Cancel feedback submission
    When I enter the description "Draft feedback text"
    And I click the close button
    Then the feedback modal should not be visible
