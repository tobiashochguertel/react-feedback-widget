/**
 * Media/Recording-related constants
 *
 * @packageDocumentation
 */

/**
 * Default video dimensions
 */
export const VIDEO_DIMENSIONS = {
  /** Default width for video recording */
  WIDTH: 1920,

  /** Default height for video recording */
  HEIGHT: 1080,

  /** Default fallback width when window size unavailable */
  FALLBACK_WIDTH: 1920,

  /** Default fallback height when window size unavailable */
  FALLBACK_HEIGHT: 1080,
} as const;

/**
 * Recording quality settings
 */
export const RECORDING_QUALITY = {
  /** Default video bitrate (2.5 Mbps) */
  VIDEO_BITRATE: 2500000,

  /** Video frame rate */
  FRAME_RATE: 30,

  /** Audio bitrate for screen recording with audio */
  AUDIO_BITRATE: 128000,
} as const;

/**
 * Screenshot service settings
 */
export const SCREENSHOT_SETTINGS = {
  /** Default timeout for screenshot capture in ms */
  TIMEOUT: 30000,

  /** JPEG quality (0-1) */
  JPEG_QUALITY: 0.92,

  /** PNG compression level (0-9) */
  PNG_COMPRESSION: 6,
} as const;

/**
 * Default element dimensions (fallback when element is not available)
 */
export const DEFAULT_ELEMENT_DIMENSIONS = {
  /** Default width for mock elements */
  WIDTH: 100,

  /** Default height for mock elements */
  HEIGHT: 100,
} as const;

/**
 * Type for video dimension keys
 */
export type VideoDimensionKey = keyof typeof VIDEO_DIMENSIONS;

/**
 * Type for recording quality keys
 */
export type RecordingQualityKey = keyof typeof RECORDING_QUALITY;
