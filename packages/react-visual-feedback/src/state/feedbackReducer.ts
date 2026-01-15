/**
 * Feedback Reducer
 *
 * Extracted from FeedbackProvider.tsx for better maintainability and testability.
 * Handles all state transitions for the feedback system.
 *
 * @module state/feedbackReducer
 */

import type {
  FeedbackState,
  FeedbackAction,
  IntegrationStatusMap,
} from '../types';

// ============================================
// INITIAL STATE
// ============================================

/**
 * Initial integration status state
 */
const initialIntegrationStatus: IntegrationStatusMap = {
  jira: { loading: false, error: null, result: null },
  sheets: { loading: false, error: null, result: null },
};

/**
 * Initial state for the feedback system
 *
 * All state properties are initialized with sensible defaults.
 * This is the single source of truth for the initial application state.
 */
export const initialState: FeedbackState = {
  // Activation state
  internalIsActive: false,

  // Element selection state
  hoveredElement: null,
  hoveredComponentInfo: null,
  selectedElement: null,
  highlightStyle: {},
  tooltipStyle: {},

  // Modal state
  isModalOpen: false,
  isManualFeedbackOpen: false,

  // Capture state
  isCapturing: false,
  screenshot: null,
  isCanvasActive: false,

  // Recording state
  isRecordingActive: false,
  isRecording: false,
  isInitializing: false,
  isPaused: false,
  videoBlob: null,
  eventLogs: [],

  // Dashboard state
  isDashboardOpen: false,

  // Integration state
  integrationStatus: initialIntegrationStatus,
  lastIntegrationResults: null,

  // Submission queue state
  submissionQueue: [],
};

// ============================================
// REDUCER
// ============================================

/**
 * Feedback reducer function
 *
 * Handles all state transitions for the feedback system.
 * Each action type is handled immutably, returning a new state object.
 *
 * Action Types:
 * - SET_STATE: Generic state update (use sparingly)
 * - START_HOVERING/STOP_HOVERING: Element hover tracking
 * - START_CAPTURE/COMPLETE_CAPTURE/CANCEL_CAPTURE: Screenshot workflow
 * - OPEN_DASHBOARD/CLOSE_DASHBOARD: Dashboard visibility
 * - OPEN_MANUAL_FEEDBACK/CLOSE_MANUAL_FEEDBACK: Manual feedback modal
 * - START_RECORDING_INIT/SUCCESS/FAILURE, PAUSE/RESUME/STOP/CANCEL_RECORDING: Recording workflow
 * - RESET_MODAL: Clear all modal/capture state
 * - INTEGRATION_START/SUCCESS/ERROR/RESET: Integration status management
 * - ADD_SUBMISSION/UPDATE_SUBMISSION/REMOVE_SUBMISSION: Queue management
 *
 * @param state - Current state
 * @param action - Action to process
 * @returns New state
 */
export function feedbackReducer(
  state: FeedbackState,
  action: FeedbackAction
): FeedbackState {
  switch (action.type) {
    // ============================================
    // Generic State Update
    // ============================================
    case 'SET_STATE':
      return { ...state, ...action.payload };

    // ============================================
    // Element Selection Actions
    // ============================================
    case 'START_HOVERING':
      return {
        ...state,
        hoveredElement: action.payload.element,
        hoveredComponentInfo: action.payload.componentInfo,
        highlightStyle: action.payload.highlightStyle,
        tooltipStyle: action.payload.tooltipStyle,
      };

    case 'STOP_HOVERING':
      return {
        ...state,
        hoveredElement: null,
        hoveredComponentInfo: null,
      };

    // ============================================
    // Screenshot Capture Actions
    // ============================================
    case 'START_CAPTURE':
      return {
        ...state,
        isCapturing: true,
        selectedElement: action.payload,
      };

    case 'COMPLETE_CAPTURE':
      return {
        ...state,
        isCapturing: false,
        screenshot: action.payload,
        isModalOpen: true,
        hoveredElement: null,
        hoveredComponentInfo: null,
      };

    case 'CANCEL_CAPTURE':
      return {
        ...state,
        isCapturing: false,
        hoveredElement: null,
        hoveredComponentInfo: null,
      };

    // ============================================
    // Dashboard Actions
    // ============================================
    case 'OPEN_DASHBOARD':
      return { ...state, isDashboardOpen: true };

    case 'CLOSE_DASHBOARD':
      return { ...state, isDashboardOpen: false };

    // ============================================
    // Manual Feedback Actions
    // ============================================
    case 'OPEN_MANUAL_FEEDBACK':
      return {
        ...state,
        isManualFeedbackOpen: true,
        isModalOpen: true,
        screenshot: null,
        videoBlob: null,
      };

    case 'CLOSE_MANUAL_FEEDBACK':
      return {
        ...state,
        isManualFeedbackOpen: false,
        isModalOpen: false,
      };

    // ============================================
    // Recording Actions
    // ============================================
    case 'START_RECORDING_INIT':
      return { ...state, isInitializing: true };

    case 'START_RECORDING_SUCCESS':
      return {
        ...state,
        isInitializing: false,
        isRecordingActive: true,
        isRecording: true,
        isPaused: false,
      };

    case 'START_RECORDING_FAILURE':
      return {
        ...state,
        isInitializing: false,
        isRecording: false,
        isRecordingActive: false,
      };

    case 'PAUSE_RECORDING':
      return { ...state, isPaused: true };

    case 'RESUME_RECORDING':
      return { ...state, isPaused: false };

    case 'CANCEL_RECORDING':
      return {
        ...state,
        isRecordingActive: false,
        isRecording: false,
        isInitializing: false,
        isPaused: false,
        videoBlob: null,
        eventLogs: [],
      };

    case 'STOP_RECORDING':
      return {
        ...state,
        isRecordingActive: false,
        isRecording: false,
        isInitializing: false,
        isPaused: false,
        videoBlob: action.payload.blob,
        eventLogs: action.payload.events,
        isModalOpen: !!(action.payload.blob && action.payload.blob.size > 0),
      };

    // ============================================
    // Modal Reset Action
    // ============================================
    case 'RESET_MODAL':
      return {
        ...state,
        isModalOpen: false,
        isManualFeedbackOpen: false,
        selectedElement: null,
        screenshot: null,
        hoveredElement: null,
        hoveredComponentInfo: null,
        isCanvasActive: false,
        videoBlob: null,
        eventLogs: [],
        lastIntegrationResults: null,
      };

    // ============================================
    // Integration Actions
    // ============================================
    case 'INTEGRATION_START':
      return {
        ...state,
        integrationStatus: {
          jira: action.payload.jira
            ? { loading: true, error: null, result: null }
            : state.integrationStatus.jira,
          sheets: action.payload.sheets
            ? { loading: true, error: null, result: null }
            : state.integrationStatus.sheets,
        },
      };

    case 'INTEGRATION_SUCCESS':
      return {
        ...state,
        integrationStatus: {
          jira: action.payload.jira
            ? { loading: false, error: null, result: action.payload.jira }
            : state.integrationStatus.jira,
          sheets: action.payload.sheets
            ? { loading: false, error: null, result: action.payload.sheets }
            : state.integrationStatus.sheets,
        },
        lastIntegrationResults: action.payload,
      };

    case 'INTEGRATION_ERROR':
      return {
        ...state,
        integrationStatus: {
          jira: action.payload.jira?.error
            ? { loading: false, error: action.payload.jira.error, result: null }
            : state.integrationStatus.jira,
          sheets: action.payload.sheets?.error
            ? { loading: false, error: action.payload.sheets.error, result: null }
            : state.integrationStatus.sheets,
        },
        lastIntegrationResults: action.payload,
      };

    case 'INTEGRATION_RESET':
      return {
        ...state,
        integrationStatus: initialIntegrationStatus,
        lastIntegrationResults: null,
      };

    // ============================================
    // Submission Queue Actions
    // ============================================
    case 'ADD_SUBMISSION':
      return {
        ...state,
        submissionQueue: [...state.submissionQueue, action.payload],
      };

    case 'UPDATE_SUBMISSION':
      return {
        ...state,
        submissionQueue: state.submissionQueue.map((sub) =>
          sub.id === action.payload.id ? { ...sub, ...action.payload } : sub
        ),
      };

    case 'REMOVE_SUBMISSION':
      return {
        ...state,
        submissionQueue: state.submissionQueue.filter(
          (sub) => sub.id !== action.payload
        ),
      };

    // ============================================
    // Default Case
    // ============================================
    default:
      // Return unchanged state for unknown actions
      return state;
  }
}

/**
 * Create a fresh copy of the initial state
 *
 * Useful for testing or resetting state to initial values.
 *
 * @returns Deep copy of initial state
 */
export function createInitialState(): FeedbackState {
  return {
    ...initialState,
    integrationStatus: {
      jira: { ...initialIntegrationStatus.jira },
      sheets: { ...initialIntegrationStatus.sheets },
    },
    submissionQueue: [],
    eventLogs: [],
  };
}
