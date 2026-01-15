/**
 * React Visual Feedback - Hooks
 *
 * Custom hooks for accessing feedback functionality.
 * These hooks implement the Interface Segregation Principle by
 * providing focused APIs for specific concerns.
 *
 * @packageDocumentation
 */

// Theme hooks (I028)
export {
  useTheme,
  useColors,
  useFeedbackTheme,
  useSystemThemePreference,
  cssVar,
  cssVarWithFallback,
  getSystemTheme,
  type UseThemeResult,
  type UseColorsResult,
  type UseFeedbackThemeResult,
  type ThemeHookOptions,
} from './useTheme.js';

// Core hooks (T001-T008)
export {
  useActivation,
  type UseActivationOptions,
  type UseActivationReturn,
} from './useActivation.js';

export {
  useDashboard,
  type UseDashboardOptions,
  type UseDashboardReturn,
} from './useDashboard.js';

// Recording hooks (T003)
export {
  useRecording,
  type UseRecordingOptions,
  type UseRecordingReturn,
  type RecordingService,
  type RecordingState,
  type EventLogEntry,
} from './useRecording.js';

// Screen capture hooks (T004)
export {
  useScreenCapture,
  type UseScreenCaptureOptions,
  type UseScreenCaptureReturn,
  type ScreenshotService,
  type CaptureState,
} from './useScreenCapture.js';

// Element selection hooks (T005)
export {
  useElementSelection,
  type UseElementSelectionOptions,
  type UseElementSelectionReturn,
  type ElementInfo,
  type ComponentInfo,
  type HighlightStyle,
  type TooltipStyle,
} from './useElementSelection.js';

// UI hooks - Keyboard shortcuts (T006)
export {
  useKeyboardShortcuts,
  formatShortcut,
  type UseKeyboardShortcutsOptions,
  type UseKeyboardShortcutsReturn,
  type KeyboardShortcut,
  type ModifierKey,
} from './useKeyboardShortcuts.js';

// Feedback submission hooks (T007)
export {
  useFeedbackSubmission,
  type UseFeedbackSubmissionOptions,
  type UseFeedbackSubmissionReturn,
  type FeedbackData,
  type SubmissionStatus,
  type SubmissionQueueItem,
  type SubmissionResult,
  type SubmissionService,
} from './useFeedbackSubmission.js';

// Integration hooks - TODO: Implement in T008
// export { useIntegrations } from './useIntegrations';
