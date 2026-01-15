@screenshot @core
Feature: Screenshot Capture
  As a user
  I want to capture screenshots with my feedback
  So that I can visually document the issue I'm reporting

  Background:
    Given user is on a page with the feedback widget enabled
    And user has opened the feedback modal

  # User Story: US002 - Capture Screenshot
  # Priority: High

  @happy-path @smoke
  Scenario: Capture screenshot of current page
    When user clicks the screenshot button
    Then a screenshot is captured of the current page
    And a preview thumbnail is displayed in the modal
    And user sees a "Screenshot captured" confirmation

  @annotation
  Scenario: Annotate screenshot with drawing
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks on the screenshot preview
    Then the annotation editor opens
    When user draws a circle around an element
    And user clicks "Done annotating"
    Then the annotated screenshot is saved
    And the preview shows the annotations

  @annotation
  Scenario: Annotate screenshot with highlight
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks on the screenshot preview
    Then the annotation editor opens
    When user selects the highlight tool
    And user highlights a section of text
    And user clicks "Done annotating"
    Then the annotated screenshot is saved

  @annotation
  Scenario: Annotate screenshot with arrow
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks on the screenshot preview
    Then the annotation editor opens
    When user selects the arrow tool
    And user draws an arrow pointing to an element
    And user clicks "Done annotating"
    Then the annotated screenshot is saved

  @annotation
  Scenario: Annotate screenshot with text
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks on the screenshot preview
    Then the annotation editor opens
    When user selects the text tool
    And user adds text "This button is misaligned"
    And user clicks "Done annotating"
    Then the annotated screenshot is saved

  @cancel
  Scenario: Cancel screenshot annotation
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks on the screenshot preview
    Then the annotation editor opens
    When user draws some annotations
    And user clicks "Cancel"
    Then the annotations are discarded
    And the original screenshot is preserved

  @retake
  Scenario: Retake screenshot
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks the retake button
    Then the previous screenshot is discarded
    And a new screenshot is captured
    And the new preview is displayed

  @remove
  Scenario: Remove screenshot before submission
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks the remove screenshot button
    Then the screenshot is removed
    And the screenshot preview is no longer visible

  @multiple
  Scenario: Capture multiple screenshots
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks the screenshot button again
    Then a second screenshot is captured
    And both screenshots are displayed in the preview area

  @keyboard @accessibility
  Scenario: Capture screenshot with keyboard shortcut
    When user presses the screenshot keyboard shortcut
    Then a screenshot is captured
    And a preview thumbnail is displayed

  @full-page
  Scenario: Capture full page screenshot
    Given user is on a page with scrollable content
    When user clicks the screenshot button
    And user selects "Full page" option
    Then a full-page screenshot is captured including content below the fold
    And the preview shows the entire page

  @viewport
  Scenario: Capture viewport screenshot only
    Given user is on a page with scrollable content
    When user clicks the screenshot button
    And user selects "Viewport only" option
    Then only the visible viewport is captured
    And content below the fold is not included

  @submit-with-screenshot
  Scenario: Submit feedback with screenshot
    When user clicks the screenshot button
    Then a screenshot is captured
    When user enters "See attached screenshot for issue" in the description
    And user clicks the submit button
    Then feedback is saved with the screenshot attached
    And user sees a confirmation message

  @element-overlay @integration
  Scenario: Screenshot captures element selection overlay
    When user clicks the element select button
    And user selects a specific page element
    Then the element is highlighted
    When user clicks the screenshot button
    Then the screenshot includes the element highlight overlay
