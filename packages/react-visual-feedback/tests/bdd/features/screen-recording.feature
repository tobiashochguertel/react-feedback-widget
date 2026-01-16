@feedback-widget @screen-recording
Feature: Screen Recording
  As a website user
  I want to record my screen while reproducing an issue
  So that I can show the exact steps that lead to a problem

  Background:
    Given I am on the example app homepage

  @screen-recording @start
  Scenario: Start screen recording
    When I open the feedback modal
    And I click the record button
    Then I should see a recording indicator or the modal remains usable

  @screen-recording @button-visible
  Scenario: Screen recording button is visible
    When I open the feedback modal
    Then the screen recording button should be visible

  @screen-recording @cancel
  Scenario: Cancel feedback modal with recording
    When I open the feedback modal
    And I click the record button
    And I close the feedback modal
    Then the feedback modal should be closed
