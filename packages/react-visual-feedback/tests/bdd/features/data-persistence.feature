@feedback-widget @persistence @data-persistence
Feature: Data Persistence - Export and Import
  As a user
  I want to export and import feedback data
  So that I can backup, transfer, or pre-populate test data

  Background:
    Given I am on the example app homepage

  # ============================================
  # EXPORT SCENARIOS
  # ============================================

  @persistence @export @US-DP001
  Scenario: Export button is visible in dashboard
    Given the feedback dashboard is open
    Then the export button should be visible

  @persistence @export @US-DP001
  Scenario: Export feedback when no feedback exists
    Given the feedback dashboard is open
    When I click the export button
    Then a bundle file should be downloaded
    And the bundle should contain zero feedback items

  @persistence @export @US-DP001 @with-data
  Scenario: Export feedback with existing items
    Given there are 3 feedback items in storage
    And the feedback dashboard is open
    When I click the export button
    Then a bundle file should be downloaded
    And the bundle should contain 3 feedback items

  @persistence @export @video @US-DP001
  Scenario: Export includes video recordings
    Given there is feedback with a video recording
    And the feedback dashboard is open
    When I click the export button
    Then a bundle file should be downloaded
    And the bundle should contain video data

  # ============================================
  # IMPORT SCENARIOS
  # ============================================

  @persistence @import @US-DP002
  Scenario: Import button is visible in dashboard
    Given the feedback dashboard is open
    Then the import button should be visible

  @persistence @import @US-DP002
  Scenario: Import feedback from valid bundle
    Given the feedback dashboard is open
    When I import a bundle with 2 feedback items
    Then the dashboard should show 2 feedback items
    And a success message should appear

  @persistence @import @duplicate @US-DP002
  Scenario: Import skips duplicate feedback
    Given there is 1 feedback item in storage
    And the feedback dashboard is open
    When I import a bundle with the same feedback item
    Then the dashboard should show 1 feedback item
    And a warning about skipped duplicates should appear

  @persistence @import @invalid @US-DP002
  Scenario: Import rejects invalid file format
    Given the feedback dashboard is open
    When I try to import an invalid file
    Then an error message should appear
    And no feedback should be added

  # ============================================
  # ROUNDTRIP SCENARIOS
  # ============================================

  @persistence @roundtrip @US-DP003
  Scenario: Export and reimport preserves data
    Given there are 5 feedback items in storage
    And the feedback dashboard is open
    When I export all feedback
    And I clear all feedback
    And I import the exported bundle
    Then the dashboard should show 5 feedback items

  @persistence @roundtrip @video @US-DP003
  Scenario: Export and reimport preserves videos
    Given there is feedback with a video recording
    And the feedback dashboard is open
    When I export all feedback
    And I clear all feedback
    And I import the exported bundle
    Then the feedback should have a playable video

  # ============================================
  # TEST FIXTURE SCENARIOS (for BDD infrastructure)
  # ============================================

  @persistence @fixtures @test-infrastructure
  Scenario: Pre-populate storage with test fixtures
    Given I load the standard test fixtures
    When I open the feedback dashboard
    Then the dashboard should show multiple feedback items
    And feedback with video should be available
    And feedback with events should be available

  @persistence @fixtures @status @test-infrastructure
  Scenario: Test fixtures include various statuses
    Given I load the standard test fixtures
    When I open the feedback dashboard
    Then feedback with status "pending" should exist
    And feedback with status "in-progress" should exist
    And feedback with status "completed" should exist

  @persistence @fixtures @types @test-infrastructure
  Scenario: Test fixtures include various feedback types
    Given I load the standard test fixtures
    When I open the feedback dashboard
    Then feedback of type "bug" should exist
    And feedback of type "feature" should exist
    And feedback of type "improvement" should exist
