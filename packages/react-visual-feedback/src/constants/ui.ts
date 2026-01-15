/**
 * UI-related constants
 *
 * @packageDocumentation
 */

/**
 * Z-index layers for overlay components
 *
 * Uses high z-index values to ensure feedback UI appears above application content.
 * Values are organized in ranges to allow flexibility within each layer.
 */
export const Z_INDEX = {
  /** Base layer for content */
  BASE: 1,

  /** Internal component layers (relative positioning) */
  INTERNAL: {
    LOW: 2,
    MEDIUM: 5,
    HIGH: 10,
  },

  /** Dashboard and main UI */
  DASHBOARD: {
    BACKDROP: 9998,
    CONTENT: 9999,
  },

  /** Feedback trigger button */
  TRIGGER: 10000,

  /** Canvas overlay for annotations */
  CANVAS: {
    BASE: 10000,
    CONTROLS: 10001,
    TOOLBAR: 10002,
  },

  /** Recording overlay */
  RECORDING: {
    OVERLAY: 10001,
    CONTROLS: 10002,
  },

  /** Submission queue */
  SUBMISSION_QUEUE: 99997,

  /** Selection overlay (element picker) */
  SELECTION: {
    OVERLAY: 999998,
    HIGHLIGHT: 999999,
    TOOLTIP: 1000000,
  },

  /** Modals and dialogs */
  MODAL: {
    BACKDROP: 99998,
    CONTENT: 99999,
  },

  /** Status dropdown */
  STATUS_DROPDOWN: 100000,

  /** Error toast notifications */
  ERROR_TOAST: 999999,

  /** Dashboard overlays (session replay, etc.) */
  DASHBOARD_OVERLAY: {
    BACKDROP: 100000,
    CONTENT: 100001,
  },

  /** Maximum z-index for critical overlays */
  MAX: 2147483647,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  /** Very fast animations (button feedback) */
  INSTANT: 100,

  /** Fast animations (hover effects) */
  FAST: 150,

  /** Normal animations (transitions) */
  NORMAL: 250,

  /** Toast hide animation */
  TOAST_HIDE: 300,

  /** Slow animations (page transitions) */
  SLOW: 400,

  /** Very slow animations (complex transitions) */
  VERY_SLOW: 600,
} as const;

/**
 * Timing constants in milliseconds
 */
export const TIMING = {
  /** Copy feedback reset delay */
  COPY_FEEDBACK: 2000,

  /** Focus delay for modal content */
  FOCUS_DELAY: 150,

  /** Debounce delay for search/input */
  DEBOUNCE: 300,

  /** Recording chunk interval */
  RECORDING_CHUNK_INTERVAL: 100,

  /** Timer update interval */
  TIMER_INTERVAL: 1000,

  /** Screenshot timeout */
  SCREENSHOT_TIMEOUT: 30000,
} as const;

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
  /** Mobile devices */
  SM: 640,

  /** Tablets */
  MD: 768,

  /** Small laptops */
  LG: 1024,

  /** Desktops */
  XL: 1280,

  /** Large screens */
  XXL: 1536,
} as const;

/**
 * Feedback type icons mapping
 */
export const FEEDBACK_TYPE_ICONS = {
  bug: 'Bug',
  feature: 'Lightbulb',
  improvement: 'Zap',
  general: 'MessageSquare',
} as const;

/**
 * Type for z-index layers
 */
export type ZIndexLayer = keyof typeof Z_INDEX;

/**
 * Type for animation durations
 */
export type AnimationDuration = keyof typeof ANIMATION;

/**
 * Type for timing constants
 */
export type TimingKey = keyof typeof TIMING;
