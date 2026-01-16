@feedback-widget @dashboard
Feature: Feedback Dashboard
  As a feedback reviewer
  I want to view and manage submitted feedback
  So that I can track issues and update their status

  Background:
    Given I am on the example app homepage

  @dashboard @open
  Scenario: Open feedback dashboard
    When I click the dashboard button
    Then the feedback dashboard should be visible

  @dashboard @close
  Scenario: Close feedback dashboard
    Given the feedback dashboard is open
    When I close the dashboard
    Then the feedback dashboard should not be visible

  @dashboard @empty
  Scenario: View empty dashboard
    When I click the dashboard button
    Then the feedback dashboard should be visible
    And an empty state message should be displayed
