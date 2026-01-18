/**
 * Toast Notification Component
 *
 * Displays toast notifications with:
 * - Multiple variants (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Action button support
 * - Stack management with animations
 *
 * TASK-WUI-023
 */

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { useNotifications, type Notification, type NotificationType } from "../stores";

// ============================================================================
// Types
// ============================================================================

export interface ToastProps {
  /** Toast data */
  notification: Notification;
  /** Remove callback */
  onRemove: (id: string) => void;
}

export interface ToastContainerProps {
  /** Position of the toast container */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  /** Maximum number of toasts to show */
  maxToasts?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Icons
// ============================================================================

const SuccessIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const WarningIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// ============================================================================
// Helpers
// ============================================================================

const TOAST_ICONS: Record<NotificationType, ReactNode> = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
};

const TOAST_STYLES: Record<NotificationType, string> = {
  success:
    "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  error:
    "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  warning:
    "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
  info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
};

const ICON_STYLES: Record<NotificationType, string> = {
  success: "text-green-500 dark:text-green-400",
  error: "text-red-500 dark:text-red-400",
  warning: "text-yellow-500 dark:text-yellow-400",
  info: "text-blue-500 dark:text-blue-400",
};

const BUTTON_STYLES: Record<NotificationType, string> = {
  success:
    "text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50",
  error:
    "text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/50",
  warning:
    "text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/50",
  info: "text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50",
};

const POSITION_STYLES: Record<NonNullable<ToastContainerProps["position"]>, string> = {
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

const DEFAULT_DURATION = 5000; // 5 seconds

// ============================================================================
// Toast Component
// ============================================================================

/**
 * Individual toast notification
 */
export function Toast({ notification, onRemove }: ToastProps) {
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const remainingRef = useRef(notification.duration ?? DEFAULT_DURATION);
  const startTimeRef = useRef(Date.now());

  const { id, type, title, description, action, dismissible = true } = notification;
  const duration = notification.duration ?? DEFAULT_DURATION;

  // Setup auto-dismiss timer
  useEffect(() => {
    if (duration === 0) return; // Permanent toast

    const startTimer = () => {
      if (pausedRef.current) return;
      startTimeRef.current = Date.now();
      timerRef.current = window.setTimeout(() => {
        onRemove(id);
      }, remainingRef.current);
    };

    startTimer();

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, id, onRemove]);

  // Pause timer on hover
  const handleMouseEnter = useCallback(() => {
    if (duration === 0) return;
    pausedRef.current = true;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Calculate remaining time
    remainingRef.current -= Date.now() - startTimeRef.current;
    if (remainingRef.current < 0) remainingRef.current = 0;
  }, [duration]);

  // Resume timer on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (duration === 0 || remainingRef.current <= 0) return;
    pausedRef.current = false;
    startTimeRef.current = Date.now();
    timerRef.current = window.setTimeout(() => {
      onRemove(id);
    }, remainingRef.current);
  }, [duration, id, onRemove]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    onRemove(id);
  }, [id, onRemove]);

  // Handle action click
  const handleAction = useCallback(() => {
    action?.onClick();
    onRemove(id);
  }, [action, id, onRemove]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border shadow-lg
        transform transition-all duration-300 ease-out
        animate-in slide-in-from-right-full
        ${TOAST_STYLES[type]}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${ICON_STYLES[type]}`}>
        {TOAST_ICONS[type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="mt-1 text-sm opacity-90">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={handleAction}
            className={`mt-2 text-sm font-medium px-2 py-1 rounded transition-colors ${BUTTON_STYLES[type]}`}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={`flex-shrink-0 p-1 rounded transition-colors ${BUTTON_STYLES[type]}`}
          aria-label="Dismiss notification"
        >
          <CloseIcon />
        </button>
      )}

      {/* Progress bar (for timed toasts) */}
      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg"
          style={{
            animation: `shrink ${duration}ms linear forwards`,
            width: "100%",
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Toast Container
// ============================================================================

/**
 * Container for managing toast stack
 */
export function ToastContainer({
  position = "bottom-right",
  maxToasts = 5,
  className = "",
}: ToastContainerProps) {
  const { notifications, removeNotification } = useNotifications();

  // Limit displayed toasts
  const visibleToasts = notifications.slice(0, maxToasts);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed z-50 flex flex-col gap-2 w-full max-w-sm
        ${POSITION_STYLES[position]}
        ${className}
      `}
      aria-label="Notifications"
    >
      {visibleToasts.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}

      {/* Overflow indicator */}
      {notifications.length > maxToasts && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          +{notifications.length - maxToasts} more notifications
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Hook for easy toast creation
// ============================================================================

export interface UseToastReturn {
  /** Show a success toast */
  success: (title: string, options?: ToastOptions) => string;
  /** Show an error toast */
  error: (title: string, options?: ToastOptions) => string;
  /** Show a warning toast */
  warning: (title: string, options?: ToastOptions) => string;
  /** Show an info toast */
  info: (title: string, options?: ToastOptions) => string;
  /** Show a custom toast */
  show: (options: ShowToastOptions) => string;
  /** Dismiss a toast by ID */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

export interface ToastOptions {
  /** Optional description */
  description?: string;
  /** Duration in ms (0 = permanent) */
  duration?: number;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Whether the toast is dismissible */
  dismissible?: boolean;
}

export interface ShowToastOptions extends ToastOptions {
  /** Toast type */
  type: NotificationType;
  /** Toast title */
  title: string;
}

/**
 * Hook for creating toast notifications
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * // Simple success toast
 * toast.success("Changes saved!");
 *
 * // Toast with description
 * toast.error("Failed to save", { description: "Please try again" });
 *
 * // Toast with action
 * toast.info("New version available", {
 *   action: { label: "Refresh", onClick: () => window.location.reload() }
 * });
 * ```
 */
export function useToast(): UseToastReturn {
  const { addNotification, removeNotification, clearAllNotifications } =
    useNotifications();

  const show = useCallback(
    (options: ShowToastOptions): string => {
      return addNotification({
        type: options.type,
        title: options.title,
        description: options.description,
        duration: options.duration,
        action: options.action,
        dismissible: options.dismissible,
      });
    },
    [addNotification]
  );

  const success = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show({ type: "success", title, ...options });
    },
    [show]
  );

  const error = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show({ type: "error", title, ...options });
    },
    [show]
  );

  const warning = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show({ type: "warning", title, ...options });
    },
    [show]
  );

  const info = useCallback(
    (title: string, options?: ToastOptions): string => {
      return show({ type: "info", title, ...options });
    },
    [show]
  );

  const dismiss = useCallback(
    (id: string): void => {
      removeNotification(id);
    },
    [removeNotification]
  );

  const dismissAll = useCallback((): void => {
    clearAllNotifications();
  }, [clearAllNotifications]);

  return {
    success,
    error,
    warning,
    info,
    show,
    dismiss,
    dismissAll,
  };
}
