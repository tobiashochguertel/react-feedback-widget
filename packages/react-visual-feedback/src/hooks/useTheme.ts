/**
 * React Visual Feedback - Theme Hooks
 *
 * Custom hooks for accessing and managing theme state.
 * These hooks provide a type-safe way to interact with the theme system.
 *
 * @packageDocumentation
 */

import { useContext, useMemo, useCallback } from 'react';
import { ThemeContext } from 'styled-components';
import type { Theme, ThemeMode, ThemeColors } from '../types/index.js';
import { lightTheme, darkTheme, getTheme as getThemeConfig } from '../theme.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of the useTheme hook
 */
export interface UseThemeResult {
  /** Current theme object */
  theme: Theme;
  /** Current theme mode ('light' or 'dark') */
  mode: ThemeMode;
  /** Whether the current theme is dark mode */
  isDarkMode: boolean;
  /** Get a specific color from the theme */
  getColor: (key: keyof ThemeColors) => string;
  /** All theme colors */
  colors: ThemeColors;
}

/**
 * Result of the useColors hook
 */
export interface UseColorsResult extends ThemeColors {
  /** Get a color value by key */
  get: (key: keyof ThemeColors) => string;
  /** Get multiple colors as an object */
  pick: <K extends keyof ThemeColors>(...keys: K[]) => Pick<ThemeColors, K>;
}

/**
 * Result of the useFeedbackTheme hook
 */
export interface UseFeedbackThemeResult {
  /** Current theme */
  theme: Theme;
  /** Current mode */
  mode: ThemeMode;
  /** Whether dark mode is active */
  isDarkMode: boolean;
  /** Colors object */
  colors: ThemeColors;
  /** Get a specific theme for a given mode */
  getTheme: (mode: ThemeMode) => Theme;
  /** CSS custom properties object for the theme */
  cssVariables: Record<string, string>;
}

/**
 * Options for theme hooks
 */
export interface ThemeHookOptions {
  /** Fallback theme to use if no theme context is available */
  fallbackTheme?: Theme;
}

// ============================================================================
// useTheme Hook
// ============================================================================

/**
 * Hook to access the current theme and theme utilities
 *
 * @param options - Hook options
 * @returns Theme state and utilities
 *
 * @example
 * Basic usage:
 * ```tsx
 * function MyComponent() {
 *   const { theme, mode, isDarkMode, colors } = useTheme();
 *
 *   return (
 *     <div style={{ background: colors.modalBg }}>
 *       Current mode: {mode}
 *       Dark mode: {isDarkMode ? 'Yes' : 'No'}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * Using getColor:
 * ```tsx
 * function MyComponent() {
 *   const { getColor } = useTheme();
 *
 *   return (
 *     <div style={{
 *       background: getColor('modalBg'),
 *       color: getColor('textPrimary'),
 *       borderColor: getColor('border'),
 *     }}>
 *       Themed content
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(options: ThemeHookOptions = {}): UseThemeResult {
  const { fallbackTheme = lightTheme } = options;

  // Try to get theme from styled-components context
  const contextTheme = useContext(ThemeContext);

  // Determine the active theme
  const theme: Theme = useMemo(() => {
    if (contextTheme && typeof contextTheme === 'object' && 'mode' in contextTheme && 'colors' in contextTheme) {
      return contextTheme as Theme;
    }
    return fallbackTheme;
  }, [contextTheme, fallbackTheme]);

  const mode = theme.mode;
  const isDarkMode = mode === 'dark';
  const colors = theme.colors;

  const getColor = useCallback(
    (key: keyof ThemeColors): string => {
      return colors[key];
    },
    [colors]
  );

  return {
    theme,
    mode,
    isDarkMode,
    getColor,
    colors,
  };
}

// ============================================================================
// useColors Hook
// ============================================================================

/**
 * Hook to access theme colors with utility functions
 *
 * @param options - Hook options
 * @returns Color values and utilities
 *
 * @example
 * Basic usage:
 * ```tsx
 * function MyComponent() {
 *   const colors = useColors();
 *
 *   return (
 *     <div style={{
 *       background: colors.modalBg,
 *       color: colors.textPrimary,
 *       border: `1px solid ${colors.border}`,
 *     }}>
 *       Styled content
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * Using get and pick:
 * ```tsx
 * function MyComponent() {
 *   const colors = useColors();
 *
 *   // Get single color
 *   const primary = colors.get('textPrimary');
 *
 *   // Pick multiple colors
 *   const buttonColors = colors.pick('btnPrimaryBg', 'btnPrimaryText', 'btnPrimaryHover');
 *
 *   return (
 *     <button style={{
 *       background: buttonColors.btnPrimaryBg,
 *       color: buttonColors.btnPrimaryText,
 *     }}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useColors(options: ThemeHookOptions = {}): UseColorsResult {
  const { colors } = useTheme(options);

  const get = useCallback(
    (key: keyof ThemeColors): string => {
      return colors[key];
    },
    [colors]
  );

  const pick = useCallback(
    <K extends keyof ThemeColors>(...keys: K[]): Pick<ThemeColors, K> => {
      const result = {} as Pick<ThemeColors, K>;
      for (const key of keys) {
        result[key] = colors[key];
      }
      return result;
    },
    [colors]
  );

  return useMemo(
    () => ({
      ...colors,
      get,
      pick,
    }),
    [colors, get, pick]
  );
}

// ============================================================================
// useFeedbackTheme Hook
// ============================================================================

/**
 * Hook for comprehensive theme access with CSS variables support
 *
 * @param options - Hook options
 * @returns Theme state, utilities, and CSS variables
 *
 * @example
 * Basic usage:
 * ```tsx
 * function MyComponent() {
 *   const { theme, cssVariables } = useFeedbackTheme();
 *
 *   return (
 *     <div style={cssVariables as React.CSSProperties}>
 *       Content with CSS variables available
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * Getting theme for specific mode:
 * ```tsx
 * function ThemePreview() {
 *   const { getTheme } = useFeedbackTheme();
 *
 *   const lightColors = getTheme('light').colors;
 *   const darkColors = getTheme('dark').colors;
 *
 *   return (
 *     <div style={{ display: 'flex', gap: '16px' }}>
 *       <div style={{ background: lightColors.modalBg, padding: '16px' }}>
 *         Light Preview
 *       </div>
 *       <div style={{ background: darkColors.modalBg, padding: '16px' }}>
 *         Dark Preview
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeedbackTheme(options: ThemeHookOptions = {}): UseFeedbackThemeResult {
  const { theme, mode, isDarkMode, colors } = useTheme(options);

  const getTheme = useCallback((targetMode: ThemeMode): Theme => {
    return getThemeConfig(targetMode);
  }, []);

  // Generate CSS custom properties from theme colors
  const cssVariables = useMemo(() => {
    const variables: Record<string, string> = {};

    for (const [key, value] of Object.entries(colors)) {
      // Convert camelCase to kebab-case for CSS variables
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      variables[`--feedback-${cssKey}`] = value;
    }

    // Add mode variable
    variables['--feedback-mode'] = mode;

    return variables;
  }, [colors, mode]);

  return {
    theme,
    mode,
    isDarkMode,
    colors,
    getTheme,
    cssVariables,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a color function that reads from CSS variables
 * Useful for creating styles that respond to theme changes
 *
 * @param colorKey - The theme color key
 * @returns CSS variable reference string
 *
 * @example
 * ```tsx
 * const buttonStyles = {
 *   background: cssVar('btnPrimaryBg'),
 *   color: cssVar('btnPrimaryText'),
 * };
 * // Results in: { background: 'var(--feedback-btn-primary-bg)', ... }
 * ```
 */
export function cssVar(colorKey: keyof ThemeColors): string {
  const cssKey = colorKey.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `var(--feedback-${cssKey})`;
}

/**
 * Creates a CSS variable with a fallback value
 *
 * @param colorKey - The theme color key
 * @param fallback - Fallback value if variable is not defined
 * @returns CSS variable reference with fallback
 *
 * @example
 * ```tsx
 * const buttonStyles = {
 *   background: cssVarWithFallback('btnPrimaryBg', '#3b82f6'),
 * };
 * // Results in: { background: 'var(--feedback-btn-primary-bg, #3b82f6)' }
 * ```
 */
export function cssVarWithFallback(colorKey: keyof ThemeColors, fallback: string): string {
  const cssKey = colorKey.replace(/([A-Z])/g, '-$1').toLowerCase();
  return `var(--feedback-${cssKey}, ${fallback})`;
}

/**
 * Gets the appropriate theme based on system preferences
 *
 * @returns Theme matching system color scheme preference
 *
 * @example
 * ```tsx
 * const systemTheme = getSystemTheme();
 * console.log(systemTheme.mode); // 'light' or 'dark'
 * ```
 */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return lightTheme;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? darkTheme : lightTheme;
}

/**
 * Hook to track system color scheme preference
 *
 * @returns Current system preference ('light' or 'dark')
 *
 * @example
 * ```tsx
 * function ThemeAwareComponent() {
 *   const systemMode = useSystemThemePreference();
 *
 *   return (
 *     <div>
 *       System prefers: {systemMode}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSystemThemePreference(): ThemeMode {
  const [mode, setMode] = React.useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent): void => {
      setMode(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return mode;
}

// Need React for useState and useEffect in useSystemThemePreference
import React from 'react';

export default {
  useTheme,
  useColors,
  useFeedbackTheme,
  useSystemThemePreference,
  cssVar,
  cssVarWithFallback,
  getSystemTheme,
};
