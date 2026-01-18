/**
 * @file useLogout Hook
 *
 * Hook for handling complete logout flow with cleanup.
 *
 * TASK-WUI-026: Implement Logout Flow
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth";
import { useUIStore } from "../stores/ui";

/**
 * Options for logout behavior
 */
interface LogoutOptions {
  /** Redirect path after logout (default: "/login") */
  redirectTo?: string | undefined;
  /** Whether to show a notification (default: true) */
  showNotification?: boolean | undefined;
  /** Custom notification message */
  message?: string | undefined;
}

/**
 * Hook that provides a complete logout function
 *
 * Handles:
 * - Clearing auth tokens and user state
 * - Disconnecting WebSocket connections
 * - Clearing React Query cache
 * - Clearing UI notifications
 * - Redirecting to login page
 *
 * @returns logout function
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authLogout = useAuthStore((state) => state.logout);
  const clearNotifications = useUIStore((state) => state.clearAllNotifications);
  const setWsStatus = useUIStore((state) => state.setWsStatus);
  const addNotification = useUIStore((state) => state.addNotification);

  const logout = useCallback(
    (options: LogoutOptions = {}) => {
      const {
        redirectTo = "/login",
        showNotification = false,
        message = "You have been logged out",
      } = options;

      // 1. Update WebSocket status to disconnected
      // This will trigger cleanup in WebSocket hooks
      setWsStatus("disconnected");

      // 2. Clear React Query cache to remove any cached user data
      queryClient.clear();

      // 3. Clear all notifications
      clearNotifications();

      // 4. Clear auth state (tokens, user, etc.)
      authLogout();

      // 5. Show logout notification if requested
      if (showNotification) {
        // Use setTimeout to show notification after state reset
        setTimeout(() => {
          addNotification({
            type: "info",
            title: message,
            duration: 3000,
          });
        }, 100);
      }

      // 6. Redirect to login page
      navigate(redirectTo, { replace: true });
    },
    [
      navigate,
      queryClient,
      authLogout,
      clearNotifications,
      setWsStatus,
      addNotification,
    ]
  );

  return logout;
}

/**
 * Hook that provides logout function with default notification
 *
 * Convenience wrapper around useLogout that shows notification by default.
 */
export function useLogoutWithNotification() {
  const logout = useLogout();

  return useCallback(
    (message = "You have been logged out") => {
      logout({ showNotification: true, message });
    },
    [logout]
  );
}
