@feedback-widget @form
Feature: Feedback Form
  As a user
  I want to fill out and submit feedback
  So that I can report bugs or suggest improvements

  Background:
    Given I am on the example app homepage
    And the feedback modal is open

  @form @input
  Scenario: Enter feedback title
    When I enter the title "Test Bug Report"
    Then the title field should contain "Test Bug Report"

  @form @input
  Scenario: Enter feedback description
    When I enter the description "This is a test description for the bug report."
    Then the description field should contain "This is a test description for the bug report."

  @form @type
  Scenario: Select bug feedback type
    When I select the feedback type "bug"
    Then the feedback type should be "bug"

  @form @type
  Scenario: Select feature feedback type
    When I select the feedback type "feature"
    Then the feedback type should be "feature"

  @form @submit
  Scenario: Submit complete feedback
    When I enter the title "Complete Bug Report"
    And I enter the description "This bug causes the application to crash."
    And I select the feedback type "bug"
    And I submit the feedback
    Then the feedback should be submitted successfully

  @form @validation
  Scenario: Submit button is disabled without title
    Then the submit button should be disabled
