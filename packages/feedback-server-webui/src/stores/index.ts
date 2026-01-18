// Authentication store
export {
  useAuthStore,
  useAuth,
  useRequireRole,
  // Selectors
  selectIsAuthenticated,
  selectIsLoading,
  selectUser,
  selectUserRole,
  selectAuthError,
  selectAuthType,
} from "./auth";
export type { User, UserRole, AuthTokens, AuthType } from "./auth";

// UI state store
export {
  useUIStore,
  useNotifications,
  useTheme,
  useWebSocketStatus,
  initializeTheme,
  // Selectors
  selectTheme,
  selectEffectiveTheme,
  selectSidebarOpen,
  selectSidebarCollapsed,
  selectNotifications,
  selectWsStatus,
  selectWsConnectionId,
  selectWsLastError,
  selectActiveModal,
  selectGlobalLoading,
} from "./ui";
export type {
  Theme,
  NotificationType,
  WebSocketStatus,
  Notification,
  UIState,
} from "./ui";
