@recording @core
Feature: Screen Recording
  As a user
  I want to record my screen interactions
  So that I can demonstrate complex issues or steps to reproduce bugs

  Background:
    Given user is on a page with the feedback widget enabled
    And user has opened the feedback modal
  # User Story: US003 - Record Screen
  # Priority: Medium

  @happy-path @smoke
  Scenario: Start and stop screen recording
    When user clicks the record button
    Then a recording permission prompt appears
    When user grants recording permission
    Then screen recording starts
    And a recording indicator is visible
    And a recording timer shows elapsed time
    When user clicks the stop recording button
    Then recording stops
    And a video preview is displayed

  @permission @negative
  Scenario: Handle recording permission denial
    When user clicks the record button
    Then a recording permission prompt appears
    When user denies recording permission
    Then user sees a message explaining recording requires permission
    And recording does not start
    And user can continue with other feedback options

  @timer
  Scenario: Recording respects maximum duration
    Given screen recording is configured with a 60 second maximum
    When user clicks the record button
    And user grants recording permission
    Then recording starts
    When 60 seconds have elapsed
    Then recording automatically stops
    And user sees a message that maximum duration was reached
    And the video preview is displayed

  @cancel
  Scenario: Cancel recording in progress
    When user clicks the record button
    And user grants recording permission
    Then recording starts
    When user clicks the cancel recording button
    Then recording stops immediately
    And no video is saved
    And user can start a new recording

  @discard
  Scenario: Discard recorded video
    When user completes a screen recording
    And the video preview is displayed
    When user clicks the discard video button
    Then the video is removed
    And user can record a new video

  @retake
  Scenario: Retake recording
    When user completes a screen recording
    And the video preview is displayed
    When user clicks the retake button
    Then the current video is discarded
    And a new recording session starts

  @preview
  Scenario: Preview recorded video before submission
    When user completes a screen recording
    Then a video preview is displayed
    When user clicks the play button on the preview
    Then the recorded video plays
    And user can pause the playback

  @submit
  Scenario: Submit feedback with screen recording
    When user completes a screen recording
    And user enters "See recording for steps to reproduce" in the description
    And user clicks the submit button
    Then feedback is saved with the video attached
    And user sees a confirmation message

  @with-screenshot @integration
  Scenario: Capture both screenshot and recording
    When user clicks the screenshot button
    Then a screenshot is captured
    When user clicks the record button
    And user grants recording permission
    And user records for 10 seconds
    And user stops recording
    Then both screenshot and video are attached
    When user enters "See screenshot and video" in the description
    And user clicks the submit button
    Then feedback is saved with both attachments

  @audio @optional
  Scenario: Record screen with audio
    Given screen recording is configured to include audio
    When user clicks the record button
    And user grants recording and microphone permissions
    Then recording starts with audio capture
    And an audio level indicator is visible
    When user stops recording
    Then the video includes audio

  @audio-mute @optional
  Scenario: Mute audio during recording
    Given screen recording is configured to include audio
    And user has started a recording with audio
    When user clicks the mute button
    Then audio recording is paused
    And a muted indicator is visible
    When user clicks unmute
    Then audio recording resumes

  @tab-switch
  Scenario: Recording continues when switching tabs
    When user starts a screen recording
    And user switches to a different browser tab
    Then recording continues capturing the other tab
    When user switches back to the original tab
    Then recording is still active
    When user stops recording
    Then the video includes all tab activity

  @minimize
  Scenario: Recording indicator persists when modal minimized
    When user starts a screen recording
    And user minimizes the feedback modal
    Then a compact recording indicator remains visible
    And user can interact with the page
    When user clicks the recording indicator
    Then the modal expands
    And user can stop the recording

  @size-limit @edge-case
  Scenario: Handle large recording file
    Given screen recording has a 50MB file size limit
    When user starts a screen recording
    And recording reaches the file size limit
    Then recording automatically stops
    And user sees a message about the size limit
    And the video up to that point is preserved

  @browser-support @negative
  Scenario: Handle unsupported browser
    Given user is on a browser that doesn't support screen recording
    When user clicks the record button
    Then user sees a message that recording is not supported
    And user is suggested to use a supported browser
    And the record button is disabled
