/**
 * React Visual Feedback - ErrorBoundary Component
 *
 * A reusable error boundary component that catches JavaScript errors
 * in child component trees, logs them, and displays a fallback UI.
 *
 * @packageDocumentation
 */

import React, { Component, ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Error information passed to error handlers and fallback components
 */
export interface ErrorInfo {
  /** The error that was caught */
  error: Error;
  /** React component stack trace */
  componentStack: string;
  /** Timestamp when the error occurred */
  timestamp: Date;
}

/**
 * Props for custom fallback components
 */
export interface FallbackProps {
  /** Error information */
  errorInfo: ErrorInfo;
  /** Function to reset the error boundary and retry */
  onRetry: () => void;
}

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback component to render when an error occurs */
  fallback?: React.ComponentType<FallbackProps>;
  /** Callback when an error is caught */
  onError?: (errorInfo: ErrorInfo) => void;
  /** Whether to show the retry button in the default fallback */
  showRetry?: boolean;
  /** Custom title for the default fallback */
  title?: string;
  /** Custom message for the default fallback */
  message?: string;
  /** Whether to show error details in the default fallback */
  showDetails?: boolean;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Styled Components
// ============================================================================

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 200px;
  background: linear-gradient(135deg, #fef3f3 0%, #fefafa 100%);
  border: 1px solid #fee2e2;
  border-radius: 12px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ErrorIcon = styled.div`
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fee2e2;
  border-radius: 50%;
  color: #dc2626;
  font-size: 32px;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #991b1b;
  text-align: center;
`;

const ErrorMessage = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #7f1d1d;
  text-align: center;
  max-width: 400px;
  line-height: 1.5;
`;

const ErrorDetails = styled.details`
  width: 100%;
  max-width: 600px;
  margin-top: 16px;
`;

const ErrorSummary = styled.summary`
  cursor: pointer;
  font-size: 12px;
  color: #991b1b;
  margin-bottom: 8px;

  &:hover {
    color: #7f1d1d;
  }
`;

const ErrorStack = styled.pre`
  margin: 0;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  font-size: 11px;
  color: #7f1d1d;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #b91c1c;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.3);
  }
`;

// ============================================================================
// Default Fallback Component
// ============================================================================

/**
 * Default fallback UI shown when an error is caught
 */
function DefaultFallback({
  errorInfo,
  onRetry,
  showRetry = true,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again or refresh the page.',
  showDetails = false,
}: FallbackProps & {
  showRetry?: boolean;
  title?: string;
  message?: string;
  showDetails?: boolean;
}): JSX.Element {
  return (
    <ErrorContainer role="alert" aria-live="assertive">
      <ErrorIcon aria-hidden="true">⚠️</ErrorIcon>
      <ErrorTitle>{title}</ErrorTitle>
      <ErrorMessage>{message}</ErrorMessage>

      {showRetry && (
        <RetryButton onClick={onRetry} aria-label="Try again">
          <span aria-hidden="true">↻</span>
          Try Again
        </RetryButton>
      )}

      {showDetails && errorInfo && (
        <ErrorDetails>
          <ErrorSummary>Show error details</ErrorSummary>
          <ErrorStack>
            <strong>Error:</strong> {errorInfo.error.message}
            {'\n\n'}
            <strong>Component Stack:</strong>
            {errorInfo.componentStack}
            {'\n\n'}
            <strong>Time:</strong> {errorInfo.timestamp.toISOString()}
          </ErrorStack>
        </ErrorDetails>
      )}
    </ErrorContainer>
  );
}

// ============================================================================
// ErrorBoundary Component
// ============================================================================

/**
 * Error boundary component that catches JavaScript errors in child components
 *
 * @example
 * Basic usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * With custom fallback:
 * ```tsx
 * const CustomFallback = ({ errorInfo, onRetry }) => (
 *   <div>
 *     <h2>Oops! {errorInfo.error.message}</h2>
 *     <button onClick={onRetry}>Retry</button>
 *   </div>
 * );
 *
 * <ErrorBoundary fallback={CustomFallback}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * With error callback:
 * ```tsx
 * <ErrorBoundary
 *   onError={(errorInfo) => {
 *     // Log to error tracking service
 *     Sentry.captureException(errorInfo.error);
 *   }}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * With customized default fallback:
 * ```tsx
 * <ErrorBoundary
 *   title="Failed to load feedback widget"
 *   message="Please refresh the page to try again."
 *   showRetry={true}
 *   showDetails={process.env.NODE_ENV === 'development'}
 * >
 *   <FeedbackWidget />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  /**
   * Log error and call onError callback
   */
  componentDidCatch(error: Error, reactErrorInfo: React.ErrorInfo): void {
    const errorInfo: ErrorInfo = {
      error,
      componentStack: reactErrorInfo.componentStack || '',
      timestamp: new Date(),
    };

    this.setState({ errorInfo });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', reactErrorInfo.componentStack);
    }

    // Call custom error handler
    if (this.props.onError) {
      try {
        this.props.onError(errorInfo);
      } catch (handlerError) {
        console.error('Error in onError handler:', handlerError);
      }
    }
  }

  /**
   * Reset error state and retry rendering children
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, errorInfo } = this.state;
    const {
      children,
      fallback: CustomFallback,
      showRetry = true,
      title = 'Something went wrong',
      message = 'An unexpected error occurred. Please try again or refresh the page.',
      showDetails = false,
    } = this.props;

    if (hasError && errorInfo) {
      // Use custom fallback if provided
      if (CustomFallback) {
        return <CustomFallback errorInfo={errorInfo} onRetry={this.handleRetry} />;
      }

      // Use default fallback
      return (
        <DefaultFallback
          errorInfo={errorInfo}
          onRetry={this.handleRetry}
          showRetry={showRetry}
          title={title}
          message={message}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// Utility Hook for Functional Components
// ============================================================================

/**
 * Hook to imperatively trigger error boundary from within a component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const throwError = useErrorHandler();
 *
 *   const handleClick = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       throwError(error as Error);
 *     }
 *   };
 *
 *   return <button onClick={handleClick}>Do risky thing</button>;
 * }
 * ```
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

// ============================================================================
// Higher-Order Component
// ============================================================================

/**
 * Higher-order component to wrap a component with an error boundary
 *
 * @param WrappedComponent - Component to wrap
 * @param errorBoundaryProps - Props to pass to the ErrorBoundary
 * @returns Wrapped component with error boundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   title: 'Failed to load component',
 *   onError: (errorInfo) => console.error(errorInfo),
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

export default ErrorBoundary;
