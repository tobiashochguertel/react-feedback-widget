@feedback-widget @integrations
Feature: Integrations UI
  As a user
  I want to see integration options in the feedback form
  So that I can choose where my feedback is sent

  Background:
    Given I am on the example app homepage
    And the feedback modal is open

  @integrations @jira
  Scenario: Jira integration toggle is visible when configured
    Then the Jira integration toggle should be visible

  @integrations @sheets
  Scenario: Sheets integration toggle is visible when configured
    Then the Sheets integration toggle should be visible

  @integrations @local
  Scenario: Local storage toggle is visible by default
    Then the local storage toggle should be visible
