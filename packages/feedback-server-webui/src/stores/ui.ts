/**
 * UI State Store
 *
 * Zustand store for UI state and preferences:
 * - Theme state with persistence
 * - Sidebar toggle state
 * - Notification queue
 * - WebSocket connection state
 *
 * TASK-WUI-017
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface Notification {
  /** Unique identifier */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Title text */
  title: string;
  /** Optional description */
  description?: string | undefined;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  } | undefined;
  /** Duration in ms (0 = permanent) */
  duration?: number | undefined;
  /** Whether the notification is dismissible */
  dismissible?: boolean | undefined;
  /** Timestamp when notification was created */
  createdAt: number;
}

export interface UIState {
  // Theme
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // WebSocket
  wsStatus: WebSocketStatus;
  wsLastConnected: number | null;
  wsReconnectAttempts: number;
  wsConnectionId: string | null;
  wsLastError: string | null;
  setWsStatus: (status: WebSocketStatus) => void;
  setWsConnected: () => void;
  incrementWsReconnectAttempts: () => void;
  resetWsReconnectAttempts: () => void;
  setWsConnectionId: (id: string | null) => void;
  setWsLastError: (error: string | null) => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown>;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  setGlobalLoading: (loading: boolean, message?: string | null) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for notifications
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the effective theme based on system preference
 */
function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  }
  return theme;
}

// ============================================================================
// Store
// ============================================================================

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ====================================================================
        // Theme
        // ====================================================================
        theme: 'system',
        effectiveTheme: getEffectiveTheme('system'),

        setTheme: (theme) => {
          const effectiveTheme = getEffectiveTheme(theme);
          set({ theme, effectiveTheme });

          // Apply theme to document
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(effectiveTheme);
          }
        },

        // ====================================================================
        // Sidebar
        // ====================================================================
        sidebarOpen: true,
        sidebarCollapsed: false,

        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        setSidebarCollapsed: (collapsed) =>
          set({ sidebarCollapsed: collapsed }),

        // ====================================================================
        // Notifications
        // ====================================================================
        notifications: [],

        addNotification: (notification) => {
          const id = generateId();
          const newNotification: Notification = {
            ...notification,
            id,
            createdAt: Date.now(),
            duration: notification.duration ?? 5000,
            dismissible: notification.dismissible ?? true,
          };

          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }));

          // Auto-remove after duration (if duration > 0)
          if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }

          return id;
        },

        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),

        clearAllNotifications: () => set({ notifications: [] }),

        // ====================================================================
        // WebSocket
        // ====================================================================
        wsStatus: 'disconnected',
        wsLastConnected: null,
        wsReconnectAttempts: 0,
        wsConnectionId: null,
        wsLastError: null,

        setWsStatus: (status) => set({ wsStatus: status }),

        setWsConnected: () =>
          set({
            wsStatus: 'connected',
            wsLastConnected: Date.now(),
            wsReconnectAttempts: 0,
            wsLastError: null,
          }),

        incrementWsReconnectAttempts: () =>
          set((state) => ({
            wsReconnectAttempts: state.wsReconnectAttempts + 1,
          })),

        resetWsReconnectAttempts: () => set({ wsReconnectAttempts: 0 }),

        setWsConnectionId: (id) => set({ wsConnectionId: id }),

        setWsLastError: (error) => set({ wsLastError: error }),

        // ====================================================================
        // Modals
        // ====================================================================
        activeModal: null,
        modalData: {},

        openModal: (modalId, data = {}) =>
          set({ activeModal: modalId, modalData: data }),

        closeModal: () => set({ activeModal: null, modalData: {} }),

        // ====================================================================
        // Loading
        // ====================================================================
        globalLoading: false,
        loadingMessage: null,

        setGlobalLoading: (loading, message = null) =>
          set({
            globalLoading: loading,
            loadingMessage: loading ? message ?? null : null,
          }),
      }),
      {
        name: 'feedback-ui-storage',
        // Only persist specific fields
        partialize: (state) => ({
          theme: state.theme,
          effectiveTheme: state.effectiveTheme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    )
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectTheme = (state: UIState) => state.theme;
export const selectEffectiveTheme = (state: UIState) => state.effectiveTheme;
export const selectSidebarOpen = (state: UIState) => state.sidebarOpen;
export const selectSidebarCollapsed = (state: UIState) => state.sidebarCollapsed;
export const selectNotifications = (state: UIState) => state.notifications;
export const selectWsStatus = (state: UIState) => state.wsStatus;
export const selectWsConnectionId = (state: UIState) => state.wsConnectionId;
export const selectWsLastError = (state: UIState) => state.wsLastError;
export const selectActiveModal = (state: UIState) => state.activeModal;
export const selectGlobalLoading = (state: UIState) => state.globalLoading;

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for using notifications
 */
export function useNotifications() {
  const notifications = useUIStore((state) => state.notifications);
  const addNotification = useUIStore((state) => state.addNotification);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const clearAllNotifications = useUIStore(
    (state) => state.clearAllNotifications
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    // Convenience methods
    success: (title: string, description?: string) =>
      addNotification({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addNotification({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addNotification({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addNotification({ type: 'info', title, description }),
  };
}

/**
 * Hook for using theme
 */
export function useTheme() {
  const theme = useUIStore((state) => state.theme);
  const effectiveTheme = useUIStore((state) => state.effectiveTheme);
  const setTheme = useUIStore((state) => state.setTheme);

  return { theme, effectiveTheme, setTheme };
}

/**
 * Hook for using WebSocket status
 */
export function useWebSocketStatus() {
  const status = useUIStore((state) => state.wsStatus);
  const lastConnected = useUIStore((state) => state.wsLastConnected);
  const reconnectAttempts = useUIStore((state) => state.wsReconnectAttempts);
  const connectionId = useUIStore((state) => state.wsConnectionId);
  const lastError = useUIStore((state) => state.wsLastError);

  return {
    status,
    lastConnected,
    reconnectAttempts,
    connectionId,
    lastError,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || status === 'reconnecting',
  };
}

// ============================================================================
// Initialize Theme on Load
// ============================================================================

/**
 * Initialize theme from stored preference
 * Call this on app startup
 */
export function initializeTheme() {
  const stored = useUIStore.getState().theme;
  useUIStore.getState().setTheme(stored);

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const currentTheme = useUIStore.getState().theme;
      if (currentTheme === 'system') {
        useUIStore.getState().setTheme('system');
      }
    });
  }
}
