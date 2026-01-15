/**
 * UI-related constants
 *
 * @packageDocumentation
 */

/**
 * Z-index layers for overlay components
 */
export const Z_INDEX = {
  /** Base layer for content */
  BASE: 1,

  /** Dropdown menus and tooltips */
  DROPDOWN: 1000,

  /** Sticky headers */
  STICKY: 1100,

  /** Fixed navigation */
  FIXED: 1200,

  /** Modals and dialogs */
  MODAL_BACKDROP: 1300,
  MODAL: 1400,

  /** Overlays (selection, highlight) */
  OVERLAY: 1500,

  /** Canvas overlay for annotations */
  CANVAS: 1600,

  /** Recording overlay */
  RECORDING: 1700,

  /** Toast notifications */
  TOAST: 1800,

  /** Maximum z-index for critical overlays */
  MAX: 2147483647,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  /** Fast animations (hover effects) */
  FAST: 150,

  /** Normal animations (transitions) */
  NORMAL: 250,

  /** Slow animations (page transitions) */
  SLOW: 400,

  /** Very slow animations (complex transitions) */
  VERY_SLOW: 600,
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
