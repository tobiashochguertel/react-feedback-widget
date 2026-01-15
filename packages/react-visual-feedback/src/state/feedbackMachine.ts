/**
 * Feedback State Machine
 *
 * XState v5 state machine for managing the feedback widget state.
 * This replaces the useReducer pattern in FeedbackProvider with a
 * proper state machine that makes state transitions explicit.
 *
 * @module state/feedbackMachine
 */

import { setup, assign, type ActorRefFrom, type SnapshotFrom } from 'xstate';
import type {
  FeedbackState,
  ReactComponentInfo,
  HighlightStyle,
  TooltipStyle,
  IntegrationStatusMap,
  IntegrationResults,
  RecordingResult,
  QueuedSubmission,
  EventLog,
} from '../types';

// ============================================
// CONTEXT TYPE (same as FeedbackState)
// ============================================

/**
 * The context (extended state) of the feedback machine.
 * This directly maps to the existing FeedbackState interface.
 */
export type FeedbackContext = FeedbackState;

// ============================================
// EVENT TYPES
// ============================================

/**
 * All events that the feedback machine can receive.
 * These map to the existing FeedbackAction types.
 */
export type FeedbackEvent =
  | { type: 'SET_STATE'; payload: Partial<FeedbackState> }
  | {
      type: 'START_HOVERING';
      payload: {
        element: HTMLElement;
        componentInfo: ReactComponentInfo | null;
        highlightStyle: HighlightStyle;
        tooltipStyle: TooltipStyle;
      };
    }
  | { type: 'STOP_HOVERING' }
  | { type: 'START_CAPTURE'; payload: HTMLElement }
  | { type: 'COMPLETE_CAPTURE'; payload: string | null }
  | { type: 'CANCEL_CAPTURE' }
  | { type: 'OPEN_DASHBOARD' }
  | { type: 'CLOSE_DASHBOARD' }
  | { type: 'OPEN_MANUAL_FEEDBACK' }
  | { type: 'CLOSE_MANUAL_FEEDBACK' }
  | { type: 'START_RECORDING_INIT' }
  | { type: 'START_RECORDING_SUCCESS' }
  | { type: 'START_RECORDING_FAILURE' }
  | { type: 'PAUSE_RECORDING' }
  | { type: 'RESUME_RECORDING' }
  | { type: 'CANCEL_RECORDING' }
  | { type: 'STOP_RECORDING'; payload: RecordingResult }
  | { type: 'RESET_MODAL' }
  | {
      type: 'INTEGRATION_START';
      payload: { jira?: boolean | undefined; sheets?: boolean | undefined };
    }
  | { type: 'INTEGRATION_SUCCESS'; payload: IntegrationResults }
  | { type: 'INTEGRATION_ERROR'; payload: Partial<IntegrationResults> }
  | { type: 'INTEGRATION_RESET' }
  | { type: 'ADD_SUBMISSION'; payload: QueuedSubmission }
  | { type: 'UPDATE_SUBMISSION'; payload: Partial<QueuedSubmission> & { id: string } }
  | { type: 'REMOVE_SUBMISSION'; payload: string };

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
 * Initial context for the feedback machine
 */
export const initialContext: FeedbackContext = {
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
// STATE MACHINE
// ============================================

/**
 * The feedback state machine.
 *
 * Uses a flat structure with actions that modify context to maintain
 * backward compatibility with the existing reducer pattern.
 *
 * The machine responds to the same events as the reducer and produces
 * the same state transitions, making the migration seamless.
 *
 * Future improvements could introduce hierarchical states:
 * - inactive / active
 * - active.idle / active.capturing / active.recording / active.modal
 * - active.recording.initializing / active.recording.active / active.recording.paused
 */
export const feedbackMachine = setup({
  types: {
    context: {} as FeedbackContext,
    events: {} as FeedbackEvent,
  },
  actions: {
    // ============================================
    // Generic State Update
    // ============================================
    setState: assign(({ event }) => {
      if (event.type !== 'SET_STATE') return {};
      return { ...event.payload };
    }),

    // ============================================
    // Element Selection Actions
    // ============================================
    startHovering: assign(({ event }) => {
      if (event.type !== 'START_HOVERING') return {};
      return {
        hoveredElement: event.payload.element,
        hoveredComponentInfo: event.payload.componentInfo,
        highlightStyle: event.payload.highlightStyle,
        tooltipStyle: event.payload.tooltipStyle,
      };
    }),

    stopHovering: assign({
      hoveredElement: null,
      hoveredComponentInfo: null,
    }),

    // ============================================
    // Screenshot Capture Actions
    // ============================================
    startCapture: assign(({ event }) => {
      if (event.type !== 'START_CAPTURE') return {};
      return {
        isCapturing: true,
        selectedElement: event.payload,
      };
    }),

    completeCapture: assign(({ event }) => {
      if (event.type !== 'COMPLETE_CAPTURE') return {};
      return {
        isCapturing: false,
        screenshot: event.payload,
        isModalOpen: true,
        hoveredElement: null,
        hoveredComponentInfo: null,
      };
    }),

    cancelCapture: assign({
      isCapturing: false,
      hoveredElement: null,
      hoveredComponentInfo: null,
    }),

    // ============================================
    // Dashboard Actions
    // ============================================
    openDashboard: assign({
      isDashboardOpen: true,
    }),

    closeDashboard: assign({
      isDashboardOpen: false,
    }),

    // ============================================
    // Manual Feedback Actions
    // ============================================
    openManualFeedback: assign({
      isManualFeedbackOpen: true,
      isModalOpen: true,
      screenshot: null,
      videoBlob: null,
    }),

    closeManualFeedback: assign({
      isManualFeedbackOpen: false,
      isModalOpen: false,
    }),

    // ============================================
    // Recording Actions
    // ============================================
    startRecordingInit: assign({
      isInitializing: true,
    }),

    startRecordingSuccess: assign({
      isInitializing: false,
      isRecordingActive: true,
      isRecording: true,
      isPaused: false,
    }),

    startRecordingFailure: assign({
      isInitializing: false,
      isRecording: false,
      isRecordingActive: false,
    }),

    pauseRecording: assign({
      isPaused: true,
    }),

    resumeRecording: assign({
      isPaused: false,
    }),

    cancelRecording: assign({
      isRecordingActive: false,
      isRecording: false,
      isInitializing: false,
      isPaused: false,
      videoBlob: null,
      eventLogs: [] as EventLog[],
    }),

    stopRecording: assign(({ event }) => {
      if (event.type !== 'STOP_RECORDING') return {};
      return {
        isRecordingActive: false,
        isRecording: false,
        isInitializing: false,
        isPaused: false,
        videoBlob: event.payload.blob,
        eventLogs: event.payload.events,
        isModalOpen: !!(event.payload.blob && event.payload.blob.size > 0),
      };
    }),

    // ============================================
    // Modal Reset Action
    // ============================================
    resetModal: assign({
      isModalOpen: false,
      isManualFeedbackOpen: false,
      selectedElement: null,
      screenshot: null,
      hoveredElement: null,
      hoveredComponentInfo: null,
      isCanvasActive: false,
      videoBlob: null,
      eventLogs: [] as EventLog[],
      lastIntegrationResults: null,
    }),

    // ============================================
    // Integration Actions
    // ============================================
    integrationStart: assign(({ context, event }) => {
      if (event.type !== 'INTEGRATION_START') return {};
      return {
        integrationStatus: {
          jira: event.payload.jira
            ? { loading: true, error: null, result: null }
            : context.integrationStatus.jira,
          sheets: event.payload.sheets
            ? { loading: true, error: null, result: null }
            : context.integrationStatus.sheets,
        },
      };
    }),

    integrationSuccess: assign(({ context, event }) => {
      if (event.type !== 'INTEGRATION_SUCCESS') return {};
      return {
        integrationStatus: {
          jira: event.payload.jira
            ? { loading: false, error: null, result: event.payload.jira }
            : context.integrationStatus.jira,
          sheets: event.payload.sheets
            ? { loading: false, error: null, result: event.payload.sheets }
            : context.integrationStatus.sheets,
        },
        lastIntegrationResults: event.payload,
      };
    }),

    integrationError: assign(({ context, event }) => {
      if (event.type !== 'INTEGRATION_ERROR') return {};
      return {
        integrationStatus: {
          jira: event.payload.jira?.error
            ? { loading: false, error: event.payload.jira.error, result: null }
            : context.integrationStatus.jira,
          sheets: event.payload.sheets?.error
            ? { loading: false, error: event.payload.sheets.error, result: null }
            : context.integrationStatus.sheets,
        },
        lastIntegrationResults: event.payload,
      };
    }),

    integrationReset: assign({
      integrationStatus: initialIntegrationStatus,
      lastIntegrationResults: null,
    }),

    // ============================================
    // Submission Queue Actions
    // ============================================
    addSubmission: assign(({ context, event }) => {
      if (event.type !== 'ADD_SUBMISSION') return {};
      return {
        submissionQueue: [...context.submissionQueue, event.payload],
      };
    }),

    updateSubmission: assign(({ context, event }) => {
      if (event.type !== 'UPDATE_SUBMISSION') return {};
      return {
        submissionQueue: context.submissionQueue.map((sub) =>
          sub.id === event.payload.id ? { ...sub, ...event.payload } : sub
        ),
      };
    }),

    removeSubmission: assign(({ context, event }) => {
      if (event.type !== 'REMOVE_SUBMISSION') return {};
      return {
        submissionQueue: context.submissionQueue.filter(
          (sub) => sub.id !== event.payload
        ),
      };
    }),
  },
}).createMachine({
  id: 'feedback',
  context: initialContext,

  // Handle all events at the top level for now
  // This maintains backward compatibility with the existing reducer
  on: {
    SET_STATE: {
      actions: 'setState',
    },

    // Element selection
    START_HOVERING: {
      actions: 'startHovering',
    },
    STOP_HOVERING: {
      actions: 'stopHovering',
    },

    // Screenshot capture
    START_CAPTURE: {
      actions: 'startCapture',
    },
    COMPLETE_CAPTURE: {
      actions: 'completeCapture',
    },
    CANCEL_CAPTURE: {
      actions: 'cancelCapture',
    },

    // Dashboard
    OPEN_DASHBOARD: {
      actions: 'openDashboard',
    },
    CLOSE_DASHBOARD: {
      actions: 'closeDashboard',
    },

    // Manual feedback
    OPEN_MANUAL_FEEDBACK: {
      actions: 'openManualFeedback',
    },
    CLOSE_MANUAL_FEEDBACK: {
      actions: 'closeManualFeedback',
    },

    // Recording
    START_RECORDING_INIT: {
      actions: 'startRecordingInit',
    },
    START_RECORDING_SUCCESS: {
      actions: 'startRecordingSuccess',
    },
    START_RECORDING_FAILURE: {
      actions: 'startRecordingFailure',
    },
    PAUSE_RECORDING: {
      actions: 'pauseRecording',
    },
    RESUME_RECORDING: {
      actions: 'resumeRecording',
    },
    CANCEL_RECORDING: {
      actions: 'cancelRecording',
    },
    STOP_RECORDING: {
      actions: 'stopRecording',
    },

    // Modal
    RESET_MODAL: {
      actions: 'resetModal',
    },

    // Integrations
    INTEGRATION_START: {
      actions: 'integrationStart',
    },
    INTEGRATION_SUCCESS: {
      actions: 'integrationSuccess',
    },
    INTEGRATION_ERROR: {
      actions: 'integrationError',
    },
    INTEGRATION_RESET: {
      actions: 'integrationReset',
    },

    // Submission queue
    ADD_SUBMISSION: {
      actions: 'addSubmission',
    },
    UPDATE_SUBMISSION: {
      actions: 'updateSubmission',
    },
    REMOVE_SUBMISSION: {
      actions: 'removeSubmission',
    },
  },
});

// ============================================
// TYPE EXPORTS
// ============================================

/**
 * Type for the feedback machine actor reference
 */
export type FeedbackActorRef = ActorRefFrom<typeof feedbackMachine>;

/**
 * Type for the feedback machine snapshot
 */
export type FeedbackSnapshot = SnapshotFrom<typeof feedbackMachine>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a fresh copy of the initial context
 *
 * Useful for testing or resetting state to initial values.
 *
 * @returns Deep copy of initial context
 */
export function createInitialContext(): FeedbackContext {
  return {
    ...initialContext,
    integrationStatus: {
      jira: { ...initialIntegrationStatus.jira },
      sheets: { ...initialIntegrationStatus.sheets },
    },
    submissionQueue: [],
    eventLogs: [],
  };
}

/**
 * Get context from a snapshot
 *
 * Helper to extract context from a machine snapshot.
 *
 * @param snapshot - Machine snapshot
 * @returns Current context
 */
export function getContextFromSnapshot(snapshot: FeedbackSnapshot): FeedbackContext {
  return snapshot.context;
}
