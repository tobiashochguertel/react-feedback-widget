@feedback-widget @screenshot
Feature: Screenshot Capture
  As a user
  I want to capture screenshots when providing feedback
  So that I can visually show the issue or suggestion

  Background:
    Given I am on the example app homepage

  @capture @element-selection
  Scenario: Screenshot is captured when selecting an element
    When I press the keyboard shortcut "Alt+Q"
    Then the element selection overlay should be visible
    When I click on a page element
    Then the feedback modal should be visible
    And a screenshot preview should be displayed

  @manual-feedback @no-screenshot
  Scenario: Manual feedback modal opens without screenshot
    When I press the keyboard shortcut "Alt+A"
    Then the feedback modal should be visible
    And no screenshot preview should be displayed
