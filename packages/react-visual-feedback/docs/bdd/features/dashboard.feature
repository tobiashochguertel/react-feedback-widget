@dashboard @management
Feature: Feedback Dashboard
  As a feedback reviewer
  I want to view and manage all submitted feedback
  So that I can track issues and update their status

  Background:
    Given user is on a page with the feedback widget enabled
    And user has appropriate permissions to access the dashboard

  # User Stories: US006 - View Feedback Dashboard
  #               US007 - Filter and Search Feedback
  #               US008 - Update Feedback Status
  #               US009 - Replay User Session
  # Priority: Medium

  @happy-path @smoke
  Scenario: Open feedback dashboard
    When user clicks the dashboard trigger button
    Then the feedback dashboard modal opens
    And a list of submitted feedback is displayed
    And each feedback shows its title, status, and date

  @empty-state
  Scenario: View empty dashboard
    Given no feedback has been submitted
    When user opens the feedback dashboard
    Then a message "No feedback yet" is displayed
    And a call-to-action to submit first feedback is shown

  @list-view
  Scenario: View feedback list with details
    Given multiple feedbacks have been submitted
    When user opens the feedback dashboard
    Then each feedback card shows:
      | Field       |
      | Title       |
      | Status      |
      | Date        |
      | Type        |
      | Thumbnail   |

  @detail-view
  Scenario: View feedback details
    Given feedback has been submitted with attachments
    When user opens the feedback dashboard
    And user clicks on a feedback card
    Then the feedback detail view opens
    And user sees the full description
    And user sees attached screenshots
    And user sees attached recordings
    And user sees selected element information

  # Filtering and Search (US007)

  @filter @smoke
  Scenario: Filter feedback by status
    Given multiple feedbacks with different statuses exist
    When user opens the feedback dashboard
    And user selects "Open" from the status filter
    Then only feedbacks with "Open" status are displayed

  @filter
  Scenario: Filter feedback by type
    Given multiple feedbacks with different types exist
    When user opens the feedback dashboard
    And user selects "Bug" from the type filter
    Then only feedbacks with "Bug" type are displayed

  @filter-combine
  Scenario: Apply multiple filters
    Given multiple feedbacks exist
    When user opens the feedback dashboard
    And user selects "Open" status filter
    And user selects "Bug" type filter
    Then only feedbacks matching both criteria are displayed

  @filter-clear
  Scenario: Clear all filters
    Given user has applied multiple filters
    When user clicks "Clear filters"
    Then all filters are reset
    And all feedbacks are displayed

  @search
  Scenario: Search feedback by keyword
    Given multiple feedbacks have been submitted
    When user opens the feedback dashboard
    And user types "button" in the search box
    Then only feedbacks containing "button" are displayed
    And matching text is highlighted

  @search-empty
  Scenario: Search returns no results
    Given multiple feedbacks have been submitted
    When user opens the feedback dashboard
    And user types "xyz123nonexistent" in the search box
    Then a "No matching feedback found" message is displayed
    And a suggestion to clear the search is shown

  @sort
  Scenario: Sort feedback by date
    Given multiple feedbacks have been submitted
    When user opens the feedback dashboard
    And user clicks "Sort by Date"
    Then feedbacks are sorted by submission date
    And user can toggle between newest and oldest first

  # Status Management (US008)

  @status @smoke
  Scenario: Update feedback status
    Given feedback exists with "Open" status
    When user opens the feedback dashboard
    And user clicks on the feedback's status dropdown
    And user selects "In Progress"
    Then the feedback status changes to "In Progress"
    And a success message confirms the update

  @status-all
  Scenario Outline: Change to any valid status
    Given feedback exists with "Open" status
    When user changes the status to "<new_status>"
    Then the feedback status updates to "<new_status>"
    And the status badge shows the correct color

    Examples:
      | new_status  |
      | Open        |
      | In Progress |
      | Resolved    |
      | Closed      |
      | Won't Fix   |

  @status-color
  Scenario: Status badges have distinct colors
    Given feedbacks with all different statuses exist
    When user opens the feedback dashboard
    Then each status has a visually distinct color:
      | Status      | Color  |
      | Open        | Blue   |
      | In Progress | Yellow |
      | Resolved    | Green  |
      | Closed      | Gray   |
      | Won't Fix   | Red    |

  @status-history
  Scenario: View status change history
    Given feedback has had multiple status changes
    When user views the feedback detail
    And user expands "Status History"
    Then user sees a list of all status changes
    And each entry shows the old status, new status, and timestamp

  # Session Replay (US009)

  @replay @smoke
  Scenario: Replay recorded session
    Given feedback has an attached screen recording
    When user opens the feedback detail
    And user clicks the play button on the recording
    Then the session replay player opens
    And the recording plays from the beginning

  @replay-controls
  Scenario: Control session replay playback
    Given user is playing a session recording
    Then user can pause the playback
    And user can seek to any position
    And user can adjust playback speed
    And user can toggle fullscreen mode

  @replay-speed
  Scenario Outline: Adjust playback speed
    Given user is playing a session recording
    When user selects "<speed>" playback speed
    Then the recording plays at <speed> speed

    Examples:
      | speed |
      | 0.5x  |
      | 1x    |
      | 1.5x  |
      | 2x    |

  # Additional Dashboard Features

  @pagination
  Scenario: Navigate paginated feedback list
    Given more than 10 feedbacks have been submitted
    When user opens the feedback dashboard
    Then only the first 10 feedbacks are shown
    And pagination controls are visible
    When user clicks "Next page"
    Then the next 10 feedbacks are shown

  @export
  Scenario: Export feedback data
    Given feedbacks have been submitted
    When user opens the feedback dashboard
    And user clicks "Export"
    Then user can download feedback data as JSON or CSV

  @delete
  Scenario: Delete feedback
    Given feedback exists
    When user opens the feedback dashboard
    And user selects a feedback
    And user clicks "Delete"
    And user confirms the deletion
    Then the feedback is removed
    And it no longer appears in the list

  @bulk-actions
  Scenario: Perform bulk status update
    Given multiple feedbacks exist
    When user opens the feedback dashboard
    And user selects multiple feedbacks
    And user selects "Mark as Resolved" from bulk actions
    Then all selected feedbacks are updated to "Resolved" status

  @keyboard @accessibility
  Scenario: Navigate dashboard with keyboard
    When user opens the feedback dashboard with keyboard shortcut
    Then focus is on the first feedback item
    When user presses arrow keys
    Then focus moves between feedback items
    When user presses Enter
    Then the selected feedback details open

  @close
  Scenario: Close dashboard
    Given the feedback dashboard is open
    When user clicks the close button
    Then the dashboard closes
    When user presses Escape
    Then the dashboard closes

  @refresh
  Scenario: Refresh feedback list
    Given the feedback dashboard is open
    When new feedback is submitted in another session
    And user clicks "Refresh"
    Then the new feedback appears in the list
