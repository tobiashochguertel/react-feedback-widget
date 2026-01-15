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

// TODO: Implement in T002
// export { useDashboard } from './useDashboard';
// TODO: Implement in T005
// export { useFeedbackSubmission } from './useFeedbackSubmission';

// Recording hooks - TODO: Implement in T003, T004
// export { useRecording } from './useRecording';
// export { useScreenCapture } from './useScreenCapture';

// UI hooks - TODO: Implement in T006, T007
// export { useElementSelection } from './useElementSelection';
// export { useKeyboardShortcuts } from './useKeyboardShortcuts';

// Integration hooks - TODO: Implement in T008
// export { useIntegrations } from './useIntegrations';
