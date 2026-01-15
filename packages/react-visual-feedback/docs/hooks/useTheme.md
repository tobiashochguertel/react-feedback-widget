# useTheme

> **Updated:** 2026-01-16  
> **Related:** [Hooks Overview](./README.md), [Theme Configuration](../getting-started/quick-start.md)

## Purpose

Accesses and manages theme configuration for feedback UI components. Provides three related hooks for different use cases.

## Import

```typescript
import { 
  useTheme, 
  useColors, 
  useFeedbackTheme 
} from 'react-visual-feedback';
import type { 
  UseThemeResult,
  UseColorsResult,
  UseFeedbackThemeResult,
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
} from 'react-visual-feedback';
```

## API

### Theme Types

```typescript
interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  zIndex: ThemeZIndex;
}

interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  overlay: string;
  highlight: string;
}

interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  full: string;
}

interface ThemeShadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
}

interface ThemeZIndex {
  modal: number;
  overlay: number;
  dropdown: number;
  tooltip: number;
  toast: number;
}
```

## useTheme

Full theme access with all configuration.

### Return Value

```typescript
interface UseThemeResult {
  /** Complete theme object */
  theme: Theme;
  
  /** Whether using dark mode */
  isDark: boolean;
  
  /** Toggle dark/light mode */
  toggleDarkMode: () => void;
  
  /** Set specific theme values */
  setTheme: (updates: Partial<Theme>) => void;
  
  /** Reset to default theme */
  resetTheme: () => void;
  
  /** Get CSS variable value */
  getCSSVariable: (name: string) => string;
  
  /** Merge custom theme values */
  mergeTheme: (customTheme: DeepPartial<Theme>) => Theme;
}
```

### Usage

```tsx
import { useTheme } from 'react-visual-feedback';

function ThemedComponent() {
  const { theme, isDark, toggleDarkMode } = useTheme();

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <h2 style={{ fontSize: theme.typography.fontSize.lg }}>
        Custom Themed Content
      </h2>
      
      <button onClick={toggleDarkMode}>
        {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
    </div>
  );
}
```

## useColors

Simplified access to theme colors only.

### Return Value

```typescript
interface UseColorsResult {
  /** All color values */
  colors: ThemeColors;
  
  /** Get a specific color */
  getColor: (name: keyof ThemeColors) => string;
  
  /** Primary color */
  primary: string;
  
  /** Success color */
  success: string;
  
  /** Warning color */
  warning: string;
  
  /** Error color */
  error: string;
  
  /** Background color */
  background: string;
  
  /** Text color */
  text: string;
}
```

### Usage

```tsx
import { useColors } from 'react-visual-feedback';

function StatusIndicator({ status }: { status: 'success' | 'warning' | 'error' }) {
  const { success, warning, error } = useColors();

  const colorMap = { success, warning, error };

  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: colorMap[status],
      }}
    />
  );
}
```

## useFeedbackTheme

Access theme via FeedbackContext with component-specific styling helpers.

### Return Value

```typescript
interface UseFeedbackThemeResult {
  /** Complete theme */
  theme: Theme;
  
  /** Get button styles */
  getButtonStyles: (variant?: 'primary' | 'secondary' | 'ghost') => CSSProperties;
  
  /** Get input styles */
  getInputStyles: () => CSSProperties;
  
  /** Get modal styles */
  getModalStyles: () => CSSProperties;
  
  /** Get card styles */
  getCardStyles: () => CSSProperties;
  
  /** Get overlay styles */
  getOverlayStyles: (opacity?: number) => CSSProperties;
  
  /** Get tooltip styles */
  getTooltipStyles: () => CSSProperties;
  
  /** Get badge styles */
  getBadgeStyles: (color?: keyof ThemeColors) => CSSProperties;
}
```

### Usage

```tsx
import { useFeedbackTheme } from 'react-visual-feedback';

function FeedbackButton() {
  const { getButtonStyles } = useFeedbackTheme();

  return (
    <button style={getButtonStyles('primary')}>
      Submit Feedback
    </button>
  );
}

function FeedbackCard() {
  const { getCardStyles, getButtonStyles, getInputStyles } = useFeedbackTheme();

  return (
    <div style={getCardStyles()}>
      <h3>Feedback Form</h3>
      <input style={getInputStyles()} placeholder="Title" />
      <textarea style={getInputStyles()} placeholder="Description" />
      <div>
        <button style={getButtonStyles('ghost')}>Cancel</button>
        <button style={getButtonStyles('primary')}>Submit</button>
      </div>
    </div>
  );
}
```

## Advanced Usage

### Custom Theme Provider

```tsx
import { FeedbackProvider, useTheme } from 'react-visual-feedback';

const customTheme: Partial<Theme> = {
  colors: {
    primary: '#6366f1', // Indigo
    primaryHover: '#4f46e5',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    highlight: 'rgba(99, 102, 241, 0.2)',
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
};

function App() {
  return (
    <FeedbackProvider theme={customTheme}>
      <MainApp />
    </FeedbackProvider>
  );
}
```

### Dynamic Theme Switching

```tsx
import { useTheme } from 'react-visual-feedback';
import { useEffect } from 'react';

function ThemeSwitcher() {
  const { setTheme, resetTheme, isDark, toggleDarkMode } = useTheme();

  const applyBrandTheme = () => {
    setTheme({
      colors: {
        primary: '#ff6b35',
        primaryHover: '#e55a2b',
      },
    });
  };

  const applyAccessibleTheme = () => {
    setTheme({
      colors: {
        primary: '#0066cc',
        primaryHover: '#004d99',
        text: '#000000',
        background: '#ffffff',
      },
      typography: {
        fontSize: {
          xs: '14px',
          sm: '16px',
          md: '18px',
          lg: '22px',
          xl: '28px',
        },
      },
    });
  };

  // Sync with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.matches && !isDark) {
      toggleDarkMode();
    }
  }, []);

  return (
    <div>
      <h3>Theme Options</h3>
      <button onClick={toggleDarkMode}>
        Toggle Dark Mode
      </button>
      <button onClick={applyBrandTheme}>
        Brand Theme
      </button>
      <button onClick={applyAccessibleTheme}>
        High Contrast
      </button>
      <button onClick={resetTheme}>
        Reset to Default
      </button>
    </div>
  );
}
```

### Responsive Typography

```tsx
import { useTheme } from 'react-visual-feedback';

function ResponsiveText() {
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    const updateFontSize = () => {
      const baseSize = window.innerWidth < 768 ? 14 : 16;
      setTheme({
        typography: {
          fontSize: {
            xs: `${baseSize * 0.75}px`,
            sm: `${baseSize * 0.875}px`,
            md: `${baseSize}px`,
            lg: `${baseSize * 1.25}px`,
            xl: `${baseSize * 1.5}px`,
          },
        },
      });
    };
    
    updateFontSize();
    window.addEventListener('resize', updateFontSize);
    return () => window.removeEventListener('resize', updateFontSize);
  }, [setTheme]);

  return (
    <div style={{ fontSize: theme.typography.fontSize.md }}>
      Responsive text content
    </div>
  );
}
```

### Styled Components Integration

```tsx
import styled from 'styled-components';
import { useTheme } from 'react-visual-feedback';

// With styled-components v6 ThemeProvider
const StyledButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.md};
  background-color: ${props => 
    props.$variant === 'primary' 
      ? props.theme.colors.primary 
      : props.theme.colors.secondary
  };
  color: white;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => 
      props.$variant === 'primary' 
        ? props.theme.colors.primaryHover 
        : props.theme.colors.secondaryHover
    };
  }
`;

function ThemedButton({ variant = 'primary', children }) {
  const { theme } = useTheme();
  
  return (
    <ThemeProvider theme={theme}>
      <StyledButton $variant={variant}>
        {children}
      </StyledButton>
    </ThemeProvider>
  );
}
```

### CSS Variables Export

```tsx
import { useTheme } from 'react-visual-feedback';
import { useEffect } from 'react';

function CSSVariablesProvider() {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    
    // Export colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--feedback-color-${key}`, value);
    });
    
    // Export spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--feedback-spacing-${key}`, value);
    });
    
    // Export typography
    root.style.setProperty('--feedback-font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--feedback-font-size-${key}`, value);
    });
  }, [theme]);

  return null;
}

// Usage in CSS
// .my-component {
//   color: var(--feedback-color-primary);
//   padding: var(--feedback-spacing-md);
//   font-family: var(--feedback-font-family);
// }
```

## Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useTheme, useColors, useFeedbackTheme } from 'react-visual-feedback';
import { FeedbackProvider } from 'react-visual-feedback';

const wrapper = ({ children }) => (
  <FeedbackProvider>{children}</FeedbackProvider>
);

describe('useTheme', () => {
  test('provides default theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.theme).toBeDefined();
    expect(result.current.theme.colors.primary).toBeDefined();
    expect(result.current.isDark).toBe(false);
  });

  test('toggles dark mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.isDark).toBe(false);
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(result.current.isDark).toBe(true);
  });

  test('setTheme updates theme values', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    const originalPrimary = result.current.theme.colors.primary;
    
    act(() => {
      result.current.setTheme({
        colors: { primary: '#ff0000' },
      });
    });
    
    expect(result.current.theme.colors.primary).toBe('#ff0000');
    expect(result.current.theme.colors.primary).not.toBe(originalPrimary);
  });

  test('resetTheme restores defaults', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    const originalPrimary = result.current.theme.colors.primary;
    
    act(() => {
      result.current.setTheme({
        colors: { primary: '#ff0000' },
      });
      result.current.resetTheme();
    });
    
    expect(result.current.theme.colors.primary).toBe(originalPrimary);
  });
});

describe('useColors', () => {
  test('provides color values', () => {
    const { result } = renderHook(() => useColors(), { wrapper });
    
    expect(result.current.primary).toBeDefined();
    expect(result.current.success).toBeDefined();
    expect(result.current.error).toBeDefined();
  });

  test('getColor returns specific color', () => {
    const { result } = renderHook(() => useColors(), { wrapper });
    
    const primary = result.current.getColor('primary');
    expect(primary).toBe(result.current.primary);
  });
});

describe('useFeedbackTheme', () => {
  test('provides style helpers', () => {
    const { result } = renderHook(() => useFeedbackTheme(), { wrapper });
    
    expect(result.current.getButtonStyles).toBeDefined();
    expect(result.current.getInputStyles).toBeDefined();
    expect(result.current.getCardStyles).toBeDefined();
  });

  test('getButtonStyles returns valid CSS', () => {
    const { result } = renderHook(() => useFeedbackTheme(), { wrapper });
    
    const primaryStyles = result.current.getButtonStyles('primary');
    
    expect(primaryStyles).toHaveProperty('backgroundColor');
    expect(primaryStyles).toHaveProperty('padding');
    expect(primaryStyles).toHaveProperty('borderRadius');
  });

  test('getOverlayStyles accepts opacity', () => {
    const { result } = renderHook(() => useFeedbackTheme(), { wrapper });
    
    const styles = result.current.getOverlayStyles(0.8);
    
    expect(styles.backgroundColor).toContain('0.8');
  });
});
```

---

*Documentation compiled by GitHub Copilot*  
*For project: react-visual-feedback*
