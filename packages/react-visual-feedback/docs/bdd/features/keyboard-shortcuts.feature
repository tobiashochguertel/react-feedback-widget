@keyboard @accessibility
Feature: Keyboard Shortcuts
  As a power user
  I want to use keyboard shortcuts for common actions
  So that I can provide feedback more efficiently without using the mouse

  Background:
    Given user is on a page with the feedback widget enabled
    And keyboard shortcuts are enabled in the widget configuration

  # User Story: US005 - Use Keyboard Shortcuts
  # Priority: Low

  @happy-path @smoke
  Scenario: Open feedback modal with keyboard shortcut
    When user presses Ctrl+Shift+F (or Cmd+Shift+F on Mac)
    Then the feedback form modal opens
    And focus is on the description field

  @close
  Scenario: Close feedback modal with Escape
    Given the feedback modal is open
    When user presses the Escape key
    Then the modal closes
    And focus returns to the previously focused element

  @screenshot
  Scenario: Capture screenshot with keyboard shortcut
    Given the feedback modal is open
    When user presses Ctrl+Shift+S (or Cmd+Shift+S on Mac)
    Then a screenshot is captured
    And a preview thumbnail appears

  @record
  Scenario: Start screen recording with keyboard shortcut
    Given the feedback modal is open
    When user presses Ctrl+Shift+R (or Cmd+Shift+R on Mac)
    Then screen recording starts (after permission)
    And a recording indicator appears

  @stop-record
  Scenario: Stop screen recording with keyboard shortcut
    Given screen recording is in progress
    When user presses Ctrl+Shift+R (or Cmd+Shift+R on Mac)
    Then recording stops
    And a video preview is displayed

  @element
  Scenario: Activate element selection with keyboard shortcut
    Given the feedback modal is open
    When user presses Ctrl+Shift+E (or Cmd+Shift+E on Mac)
    Then element selection mode is activated

  @submit
  Scenario: Submit feedback with keyboard shortcut
    Given the feedback modal is open
    And user has entered feedback text
    When user presses Ctrl+Enter (or Cmd+Enter on Mac)
    Then feedback is submitted
    And user sees a confirmation message

  @dashboard
  Scenario: Open dashboard with keyboard shortcut
    When user presses Ctrl+Shift+D (or Cmd+Shift+D on Mac)
    Then the feedback dashboard opens

  @tab-navigation
  Scenario: Navigate feedback form with Tab key
    Given the feedback modal is open
    When user presses Tab
    Then focus moves to the next form element
    When user presses Shift+Tab
    Then focus moves to the previous form element

  @accessible-focus
  Scenario: Focus indicators are visible
    Given the feedback modal is open
    When user navigates with Tab key
    Then each focused element has a visible focus indicator
    And the focus indicator meets WCAG contrast requirements

  @conflict-prevention
  Scenario: Shortcuts don't conflict with browser defaults
    Given user is typing in an input field on the page
    When user presses Ctrl+S (browser save shortcut)
    Then the browser's default action occurs
    And the feedback widget does not intercept the shortcut

  @custom-shortcuts
  Scenario: Use custom keyboard shortcuts
    Given keyboard shortcuts are customized in the configuration
    And the trigger shortcut is set to "Alt+F"
    When user presses Alt+F
    Then the feedback form modal opens

  @disabled-shortcuts
  Scenario: Shortcuts work when widget has focus
    Given the feedback modal is open
    And focus is on the description textarea
    When user presses Ctrl+Shift+S (screenshot shortcut)
    Then a screenshot is captured
    And the modal remains open

  @help-panel
  Scenario: View keyboard shortcuts help
    Given the feedback modal is open
    When user presses "?" key
    Then a keyboard shortcuts help panel appears
    And all available shortcuts are listed

  @modifier-keys
  Scenario: Modifier key combinations work correctly
    When user holds Ctrl (or Cmd)
    And user holds Shift
    And user presses F
    Then the shortcut is recognized as a complete combination
    And the feedback modal opens

  @no-modifier
  Scenario: Shortcuts require modifier keys to prevent accidental triggers
    Given the feedback modal is closed
    When user presses just "F" key while focused on page content
    Then nothing happens
    And the feedback modal does not open
    And the character "F" is not typed anywhere

  @screen-reader @a11y
  Scenario: Shortcuts are announced to screen readers
    Given user is using a screen reader
    When user opens the feedback modal with keyboard shortcut
    Then the screen reader announces "Feedback form opened"
    And the modal role and contents are announced

  @focus-trap
  Scenario: Focus is trapped within open modal
    Given the feedback modal is open
    When user presses Tab multiple times
    Then focus cycles through modal elements only
    And focus does not escape to the background page

  @disabled-config
  Scenario: Keyboard shortcuts can be disabled
    Given keyboard shortcuts are disabled in the widget configuration
    When user presses Ctrl+Shift+F
    Then nothing happens
    And the feedback modal does not open

  @quick-actions
  Scenario: Quick actions work in rapid succession
    When user presses Ctrl+Shift+F to open modal
    And immediately presses Ctrl+Shift+S for screenshot
    Then the modal opens
    And a screenshot is captured without delay
