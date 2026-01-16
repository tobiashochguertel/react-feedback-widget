@feedback-widget
Feature: Feedback Widget Modal
  As a user
  I want to open and close the feedback widget
  So that I can provide feedback on the application

  Background:
    Given I am on the example app homepage

  @modal @open @keyboard
  Scenario: Open feedback modal via keyboard shortcut Alt+A
    When I press the keyboard shortcut "Alt+A"
    Then the feedback modal should be visible

  @modal @open @select-element
  Scenario: Open element selection mode via button
    When I click the select element button
    Then the element selection overlay should be visible

  @modal @close
  Scenario: Close feedback modal via close button
    Given the feedback modal is open
    When I click the close button
    Then the feedback modal should not be visible

  @modal @close @keyboard
  Scenario: Close feedback modal via Escape key
    Given the feedback modal is open
    When I press the Escape key
    Then the feedback modal should not be visible
