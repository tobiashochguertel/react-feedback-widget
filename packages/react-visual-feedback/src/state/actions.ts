/**
 * Action Creators
 *
 * Type-safe action creator functions for the feedback reducer.
 * Using action creators ensures consistent action structure and type safety.
 *
 * @module state/actions
 */

import type {
  FeedbackAction,
  FeedbackState,
  HighlightStyle,
  TooltipStyle,
  ReactComponentInfo,
  RecordingResult,
  IntegrationResults,
  QueuedSubmission,
} from '../types';

// ============================================
// ACTION CREATORS OBJECT
// ============================================

/**
 * Action creators for the feedback reducer
 *
 * Each function creates a properly typed action object.
 * Using these creators ensures type safety and consistent action structure.
 *
 * @example
 * ```typescript
 * dispatch(actions.setIsActive(true));
 * dispatch(actions.startCapture(element));
 * dispatch(actions.completeCapture(screenshotDataUrl));
 * ```
 */
export const actions = {
  // ============================================
  // Generic State Update
  // ============================================

  /**
   * Set arbitrary state values
   * Use sparingly - prefer specific action creators
   */
  setState: (payload: Partial<FeedbackState>): FeedbackAction => ({
    type: 'SET_STATE',
    payload,
  }),

  // ============================================
  // Element Selection Actions
  // ============================================

  /**
   * Start hovering over an element
   */
  startHovering: (
    element: HTMLElement,
    componentInfo: ReactComponentInfo | null,
    highlightStyle: HighlightStyle,
    tooltipStyle: TooltipStyle
  ): FeedbackAction => ({
    type: 'START_HOVERING',
    payload: { element, componentInfo, highlightStyle, tooltipStyle },
  }),

  /**
   * Stop hovering over an element
   */
  stopHovering: (): FeedbackAction => ({
    type: 'STOP_HOVERING',
  }),

  // ============================================
  // Screenshot Capture Actions
  // ============================================

  /**
   * Start capturing a screenshot of the selected element
   */
  startCapture: (element: HTMLElement): FeedbackAction => ({
    type: 'START_CAPTURE',
    payload: element,
  }),

  /**
   * Complete screenshot capture with the captured image
   */
  completeCapture: (screenshot: string | null): FeedbackAction => ({
    type: 'COMPLETE_CAPTURE',
    payload: screenshot,
  }),

  /**
   * Cancel the screenshot capture process
   */
  cancelCapture: (): FeedbackAction => ({
    type: 'CANCEL_CAPTURE',
  }),

  // ============================================
  // Dashboard Actions
  // ============================================

  /**
   * Open the feedback dashboard
   */
  openDashboard: (): FeedbackAction => ({
    type: 'OPEN_DASHBOARD',
  }),

  /**
   * Close the feedback dashboard
   */
  closeDashboard: (): FeedbackAction => ({
    type: 'CLOSE_DASHBOARD',
  }),

  // ============================================
  // Manual Feedback Actions
  // ============================================

  /**
   * Open manual feedback modal (without element selection)
   */
  openManualFeedback: (): FeedbackAction => ({
    type: 'OPEN_MANUAL_FEEDBACK',
  }),

  /**
   * Close manual feedback modal
   */
  closeManualFeedback: (): FeedbackAction => ({
    type: 'CLOSE_MANUAL_FEEDBACK',
  }),

  // ============================================
  // Recording Actions
  // ============================================

  /**
   * Start initializing recording
   */
  startRecordingInit: (): FeedbackAction => ({
    type: 'START_RECORDING_INIT',
  }),

  /**
   * Recording started successfully
   */
  startRecordingSuccess: (): FeedbackAction => ({
    type: 'START_RECORDING_SUCCESS',
  }),

  /**
   * Recording failed to start
   */
  startRecordingFailure: (): FeedbackAction => ({
    type: 'START_RECORDING_FAILURE',
  }),

  /**
   * Pause the current recording
   */
  pauseRecording: (): FeedbackAction => ({
    type: 'PAUSE_RECORDING',
  }),

  /**
   * Resume a paused recording
   */
  resumeRecording: (): FeedbackAction => ({
    type: 'RESUME_RECORDING',
  }),

  /**
   * Cancel the current recording (discards data)
   */
  cancelRecording: (): FeedbackAction => ({
    type: 'CANCEL_RECORDING',
  }),

  /**
   * Stop recording and save the result
   */
  stopRecording: (result: RecordingResult): FeedbackAction => ({
    type: 'STOP_RECORDING',
    payload: result,
  }),

  // ============================================
  // Modal Reset Action
  // ============================================

  /**
   * Reset all modal-related state
   */
  resetModal: (): FeedbackAction => ({
    type: 'RESET_MODAL',
  }),

  // ============================================
  // Integration Actions
  // ============================================

  /**
   * Start integration submission
   */
  integrationStart: (options: {
    jira?: boolean;
    sheets?: boolean;
  }): FeedbackAction => ({
    type: 'INTEGRATION_START',
    payload: options,
  }),

  /**
   * Integration submission succeeded
   */
  integrationSuccess: (results: IntegrationResults): FeedbackAction => ({
    type: 'INTEGRATION_SUCCESS',
    payload: results,
  }),

  /**
   * Integration submission failed
   */
  integrationError: (
    results: Partial<IntegrationResults>
  ): FeedbackAction => ({
    type: 'INTEGRATION_ERROR',
    payload: results,
  }),

  /**
   * Reset integration status
   */
  integrationReset: (): FeedbackAction => ({
    type: 'INTEGRATION_RESET',
  }),

  // ============================================
  // Submission Queue Actions
  // ============================================

  /**
   * Add a submission to the queue
   */
  addSubmission: (submission: QueuedSubmission): FeedbackAction => ({
    type: 'ADD_SUBMISSION',
    payload: submission,
  }),

  /**
   * Update an existing submission in the queue
   */
  updateSubmission: (
    update: Partial<QueuedSubmission> & { id: string }
  ): FeedbackAction => ({
    type: 'UPDATE_SUBMISSION',
    payload: update,
  }),

  /**
   * Remove a submission from the queue
   */
  removeSubmission: (id: string): FeedbackAction => ({
    type: 'REMOVE_SUBMISSION',
    payload: id,
  }),
} as const;

// ============================================
// TYPE EXPORTS
// ============================================

/**
 * Type for the actions object
 */
export type ActionCreators = typeof actions;

/**
 * Helper type to extract action creator return types
 */
export type ActionCreatorReturnType<K extends keyof ActionCreators> =
  ReturnType<ActionCreators[K]>;
