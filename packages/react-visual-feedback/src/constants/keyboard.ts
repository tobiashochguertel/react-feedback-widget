/**
 * Keyboard-related constants
 *
 * @packageDocumentation
 */

/**
 * Key codes for keyboard events
 */
export const KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const;

/**
 * Modifier keys
 */
export const MODIFIERS = {
  CTRL: 'ctrl',
  SHIFT: 'shift',
  ALT: 'alt',
  META: 'meta',
} as const;

/**
 * Default keyboard shortcuts configuration
 */
export const DEFAULT_SHORTCUTS = {
  /** Cancel current operation */
  CANCEL: { key: KEYS.ESCAPE, modifiers: [] as string[] },

  /** Submit feedback */
  SUBMIT: { key: KEYS.ENTER, modifiers: [MODIFIERS.CTRL] },

  /** Toggle feedback mode */
  TOGGLE: { key: 'f', modifiers: [MODIFIERS.CTRL, MODIFIERS.SHIFT] },

  /** Open dashboard */
  DASHBOARD: { key: 'd', modifiers: [MODIFIERS.CTRL, MODIFIERS.SHIFT] },

  /** Start recording */
  RECORD: { key: 'r', modifiers: [MODIFIERS.CTRL, MODIFIERS.SHIFT] },
} as const;

/**
 * Type for shortcut configuration
 */
export interface ShortcutConfig {
  key: string;
  modifiers: string[];
}

/**
 * Type for default shortcut keys
 */
export type ShortcutKey = keyof typeof DEFAULT_SHORTCUTS;
