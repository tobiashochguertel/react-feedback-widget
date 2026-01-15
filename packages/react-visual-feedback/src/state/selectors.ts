/**
 * State Selectors
 *
 * Selector functions for accessing and deriving values from FeedbackState.
 * Selectors provide a consistent way to read state and enable memoization.
 *
 * Property names match the actual FeedbackState interface:
 * - internalIsActive (not isActive)
 * - hoveredElement / hoveredComponentInfo (not isHovering / componentInfo)
 * - isManualFeedbackOpen (not isManualFeedback)
 * - isInitializing (not isRecordingLoading)
 * - isPaused (not isRecordingPaused)
 * - videoBlob / eventLogs (not recordingResult)
 * - IntegrationStatus uses loading/error/result (not status)
 *
 * @module state/selectors
 */

import type { FeedbackState, IntegrationStatusMap, IntegrationStatus } from '../types';

// ============================================
// ACTIVATION SELECTORS
// ============================================

/**
 * Check if feedback widget is active (internal state)
 */
export const selectIsActive = (state: FeedbackState): boolean =>
  state.internalIsActive;

// ============================================
// ELEMENT SELECTION SELECTORS
// ============================================

/**
 * Check if currently hovering over an element
 */
export const selectIsHovering = (state: FeedbackState): boolean =>
  state.hoveredElement !== null;

/**
 * Get the currently hovered element
 */
export const selectHoveredElement = (
  state: FeedbackState
): HTMLElement | null => state.hoveredElement;

/**
 * Get the currently selected element
 */
export const selectSelectedElement = (
  state: FeedbackState
): HTMLElement | null => state.selectedElement;

/**
 * Get React component info for hovered element
 */
export const selectComponentInfo = (
  state: FeedbackState
): FeedbackState['hoveredComponentInfo'] => state.hoveredComponentInfo;

/**
 * Get the highlight style for current element
 */
export const selectHighlightStyle = (
  state: FeedbackState
): FeedbackState['highlightStyle'] => state.highlightStyle;

/**
 * Get the tooltip style for current element
 */
export const selectTooltipStyle = (
  state: FeedbackState
): FeedbackState['tooltipStyle'] => state.tooltipStyle;

// ============================================
// MODAL STATE SELECTORS
// ============================================

/**
 * Check if modal is open
 */
export const selectIsModalOpen = (state: FeedbackState): boolean =>
  state.isModalOpen;

/**
 * Check if this is manual feedback (no element selection)
 */
export const selectIsManualFeedback = (state: FeedbackState): boolean =>
  state.isManualFeedbackOpen;

// ============================================
// CAPTURE STATE SELECTORS
// ============================================

/**
 * Check if screenshot capture is in progress
 */
export const selectIsCapturing = (state: FeedbackState): boolean =>
  state.isCapturing;

/**
 * Get the captured screenshot data URL
 */
export const selectScreenshot = (state: FeedbackState): string | null =>
  state.screenshot;

/**
 * Check if there is a captured screenshot available
 */
export const selectHasScreenshot = (state: FeedbackState): boolean =>
  state.screenshot !== null;

/**
 * Check if canvas is active
 */
export const selectIsCanvasActive = (state: FeedbackState): boolean =>
  state.isCanvasActive;

// ============================================
// RECORDING STATE SELECTORS
// ============================================

/**
 * Check if recording is in progress
 */
export const selectIsRecording = (state: FeedbackState): boolean =>
  state.isRecording;

/**
 * Check if recording is active (broader recording state)
 */
export const selectIsRecordingActive = (state: FeedbackState): boolean =>
  state.isRecordingActive;

/**
 * Check if recording is currently paused
 */
export const selectIsPaused = (state: FeedbackState): boolean =>
  state.isPaused;

/**
 * Check if recording is initializing
 */
export const selectIsInitializing = (state: FeedbackState): boolean =>
  state.isInitializing;

/**
 * Get the recorded video blob
 */
export const selectVideoBlob = (state: FeedbackState): Blob | null =>
  state.videoBlob;

/**
 * Get event logs from recording
 */
export const selectEventLogs = (
  state: FeedbackState
): FeedbackState['eventLogs'] => state.eventLogs;

/**
 * Check if recording is active and not paused
 */
export const selectIsRecordingAndNotPaused = (state: FeedbackState): boolean =>
  state.isRecording && !state.isPaused;

// ============================================
// DASHBOARD STATE SELECTORS
// ============================================

/**
 * Check if dashboard is open
 */
export const selectIsDashboardOpen = (state: FeedbackState): boolean =>
  state.isDashboardOpen;

// ============================================
// INTEGRATION STATE SELECTORS
// ============================================

/**
 * Get the complete integration status map
 */
export const selectIntegrationStatus = (
  state: FeedbackState
): IntegrationStatusMap => state.integrationStatus;

/**
 * Get Jira integration status
 */
export const selectJiraStatus = (state: FeedbackState): IntegrationStatus =>
  state.integrationStatus.jira;

/**
 * Get Sheets integration status
 */
export const selectSheetsStatus = (state: FeedbackState): IntegrationStatus =>
  state.integrationStatus.sheets;

/**
 * Check if Jira integration is loading
 */
export const selectIsJiraLoading = (state: FeedbackState): boolean =>
  state.integrationStatus.jira.loading;

/**
 * Check if Sheets integration is loading
 */
export const selectIsSheetsLoading = (state: FeedbackState): boolean =>
  state.integrationStatus.sheets.loading;

/**
 * Check if any integration is currently loading
 */
export const selectIsAnyIntegrationLoading = (state: FeedbackState): boolean =>
  state.integrationStatus.jira.loading || state.integrationStatus.sheets.loading;

/**
 * Check if any integration has an error
 */
export const selectHasIntegrationError = (state: FeedbackState): boolean =>
  state.integrationStatus.jira.error !== null ||
  state.integrationStatus.sheets.error !== null;

/**
 * Get last integration results
 */
export const selectLastIntegrationResults = (
  state: FeedbackState
): FeedbackState['lastIntegrationResults'] => state.lastIntegrationResults;

// ============================================
// SUBMISSION QUEUE SELECTORS
// ============================================

/**
 * Get the submission queue
 */
export const selectSubmissionQueue = (
  state: FeedbackState
): FeedbackState['submissionQueue'] => state.submissionQueue;

/**
 * Get the number of items in the submission queue
 */
export const selectSubmissionQueueCount = (state: FeedbackState): number =>
  state.submissionQueue.length;

/**
 * Check if submission queue has pending items
 */
export const selectHasPendingSubmissions = (state: FeedbackState): boolean =>
  state.submissionQueue.some((item) => item.status === 'pending');

/**
 * Get all submissions with errors
 */
export const selectErrorSubmissions = (
  state: FeedbackState
): FeedbackState['submissionQueue'] =>
  state.submissionQueue.filter((item) => item.status === 'error');

/**
 * Get submission by ID
 */
export const selectSubmissionById = (
  state: FeedbackState,
  id: string
): FeedbackState['submissionQueue'][0] | undefined =>
  state.submissionQueue.find((item) => item.id === id);

// ============================================
// DERIVED / COMPUTED SELECTORS
// ============================================

/**
 * Check if widget is in an active capture workflow
 * (hovering, capturing, or modal open)
 */
export const selectIsInCaptureWorkflow = (state: FeedbackState): boolean =>
  state.internalIsActive &&
  (state.hoveredElement !== null || state.isCapturing || state.isModalOpen);

/**
 * Check if widget is busy (capturing, recording, or integration loading)
 */
export const selectIsBusy = (state: FeedbackState): boolean =>
  state.isCapturing ||
  state.isRecording ||
  state.isInitializing ||
  state.integrationStatus.jira.loading ||
  state.integrationStatus.sheets.loading;

/**
 * Check if any modal-like UI is visible
 */
export const selectHasVisibleUI = (state: FeedbackState): boolean =>
  state.isModalOpen || state.isDashboardOpen || state.isManualFeedbackOpen;

/**
 * Get the current workflow phase
 */
export const selectWorkflowPhase = (
  state: FeedbackState
): 'idle' | 'selecting' | 'capturing' | 'editing' | 'recording' | 'submitting' => {
  if (state.isRecording || state.isInitializing) return 'recording';
  if (state.integrationStatus.jira.loading || state.integrationStatus.sheets.loading)
    return 'submitting';
  if (state.isModalOpen || state.isManualFeedbackOpen) return 'editing';
  if (state.isCapturing) return 'capturing';
  if (state.internalIsActive && state.hoveredElement !== null) return 'selecting';
  return 'idle';
};

/**
 * Check if can start new feedback capture
 * (not already busy with something)
 */
export const selectCanStartCapture = (state: FeedbackState): boolean =>
  !state.isCapturing &&
  !state.isRecording &&
  !state.isInitializing &&
  !state.isModalOpen &&
  !state.integrationStatus.jira.loading &&
  !state.integrationStatus.sheets.loading;

/**
 * Check if can start recording
 */
export const selectCanStartRecording = (state: FeedbackState): boolean =>
  !state.isRecording &&
  !state.isInitializing &&
  !state.isCapturing &&
  !state.integrationStatus.jira.loading &&
  !state.integrationStatus.sheets.loading;

// ============================================
// SELECTOR FACTORY
// ============================================

/**
 * Create a bound selector that automatically receives state
 *
 * @example
 * ```typescript
 * const getIsActive = createBoundSelector(state, selectIsActive);
 * console.log(getIsActive()); // true
 * ```
 */
export const createBoundSelector =
  <T>(state: FeedbackState, selector: (s: FeedbackState) => T) =>
    (): T =>
      selector(state);

/**
 * Create all bound selectors for a given state
 * Useful for debugging and testing
 */
export const createAllBoundSelectors = (state: FeedbackState) => ({
  isActive: () => selectIsActive(state),
  isHovering: () => selectIsHovering(state),
  hoveredElement: () => selectHoveredElement(state),
  selectedElement: () => selectSelectedElement(state),
  isModalOpen: () => selectIsModalOpen(state),
  isCapturing: () => selectIsCapturing(state),
  screenshot: () => selectScreenshot(state),
  isRecording: () => selectIsRecording(state),
  isDashboardOpen: () => selectIsDashboardOpen(state),
  submissionQueue: () => selectSubmissionQueue(state),
  workflowPhase: () => selectWorkflowPhase(state),
  isBusy: () => selectIsBusy(state),
});
