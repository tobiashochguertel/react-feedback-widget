/**
 * React Visual Feedback - State Management
 *
 * Centralized state management for the feedback widget.
 *
 * This module provides:
 * - Reducer function for state transitions (I010)
 * - Type-safe action creators (I011)
 * - State selectors for reading values (I012)
 * - Future: XState state machine (I013)
 *
 * @packageDocumentation
 */

// ============================================
// Reducer and Initial State (I010)
// ============================================

export {
  feedbackReducer,
  initialState,
  createInitialState,
} from './feedbackReducer';

// ============================================
// Action Creators (I011)
// ============================================

export { actions } from './actions';
export type { ActionCreators, ActionCreatorReturnType } from './actions';

// ============================================
// Selectors (I012)
// ============================================

// Activation
export { selectIsActive } from './selectors';

// Element Selection
export {
  selectIsHovering,
  selectHoveredElement,
  selectSelectedElement,
  selectComponentInfo,
  selectHighlightStyle,
  selectTooltipStyle,
} from './selectors';

// Modal
export { selectIsModalOpen, selectIsManualFeedback } from './selectors';

// Capture
export {
  selectIsCapturing,
  selectScreenshot,
  selectHasScreenshot,
  selectIsCanvasActive,
} from './selectors';

// Recording
export {
  selectIsRecording,
  selectIsRecordingActive,
  selectIsPaused,
  selectIsInitializing,
  selectVideoBlob,
  selectEventLogs,
  selectIsRecordingAndNotPaused,
} from './selectors';

// Dashboard
export { selectIsDashboardOpen } from './selectors';

// Integration
export {
  selectIntegrationStatus,
  selectJiraStatus,
  selectSheetsStatus,
  selectIsJiraLoading,
  selectIsSheetsLoading,
  selectIsAnyIntegrationLoading,
  selectHasIntegrationError,
  selectLastIntegrationResults,
} from './selectors';

// Submission Queue
export {
  selectSubmissionQueue,
  selectSubmissionQueueCount,
  selectHasPendingSubmissions,
  selectErrorSubmissions,
  selectSubmissionById,
} from './selectors';

// Derived/Computed
export {
  selectIsInCaptureWorkflow,
  selectIsBusy,
  selectHasVisibleUI,
  selectWorkflowPhase,
  selectCanStartCapture,
  selectCanStartRecording,
} from './selectors';

// Selector Utilities
export { createBoundSelector, createAllBoundSelectors } from './selectors';

// ============================================
// XState Machine (I013)
// ============================================

export {
  feedbackMachine,
  initialContext,
  createInitialContext,
  getContextFromSnapshot,
} from './feedbackMachine';

export type {
  FeedbackContext,
  FeedbackEvent,
  FeedbackActorRef,
  FeedbackSnapshot,
} from './feedbackMachine';
