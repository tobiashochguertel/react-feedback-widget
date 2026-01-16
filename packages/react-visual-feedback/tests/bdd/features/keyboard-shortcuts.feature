@feedback-widget @keyboard
Feature: Keyboard Shortcuts
  As a power user
  I want to use keyboard shortcuts for common actions
  So that I can provide feedback more efficiently

  Background:
    Given I am on the example app homepage

  @modal @keyboard @open
  Scenario: Open feedback modal with Alt+A keyboard shortcut
    When I press the keyboard shortcut "Alt+A"
    Then the feedback modal should be visible

  @modal @keyboard @close
  Scenario: Close modal with Escape key
    Given the feedback modal is open
    When I press the Escape key
    Then the feedback modal should not be visible

  @keyboard @navigation
  Scenario: Navigate form with Tab key
    Given the feedback modal is open
    When I press the Tab key
    Then focus should move to the next interactive element
