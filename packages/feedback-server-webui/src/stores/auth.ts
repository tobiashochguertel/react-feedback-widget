/**
 * @file Authentication Store
 *
 * Zustand store for authentication state management with persistence.
 * Supports both API key and JWT authentication.
 *
 * TASK-WUI-024: Create Auth Context
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * User role for access control
 */
export type UserRole = "admin" | "user" | "viewer";

/**
 * User information stored in auth state
 */
export interface User {
  id?: string;
  email?: string;
  name?: string;
  role: UserRole;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string | undefined;
  expiresAt?: number | undefined;
}

/**
 * Authentication type
 */
export type AuthType = "api-key" | "jwt";

/**
 * Authentication state interface
 */
interface AuthState {
  // State
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is being checked */
  isLoading: boolean;
  /** Type of authentication used */
  authType: AuthType | null;
  /** API key for authentication */
  apiKey: string | null;
  /** JWT tokens for authentication */
  tokens: AuthTokens | null;
  /** User information */
  user: User | null;
  /** Last authentication error */
  error: string | null;

  // Actions
  /** Login with API key */
  loginWithApiKey: (apiKey: string, user?: Partial<User> | undefined) => void;
  /** Login with JWT tokens */
  loginWithJwt: (tokens: AuthTokens, user: User) => void;
  /** Logout and clear credentials */
  logout: () => void;
  /** Set API key (legacy support) */
  setApiKey: (apiKey: string) => void;
  /** Update user information */
  updateUser: (user: Partial<User>) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Refresh JWT tokens */
  refreshTokens: (tokens: AuthTokens) => void;
  /** Check if token is expired */
  isTokenExpired: () => boolean;
  /** Get the current auth header value */
  getAuthHeader: () => string | null;
  /** Check if user has required role */
  hasRole: (requiredRole: UserRole) => boolean;
}

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  user: 2,
  admin: 3,
};

/**
 * Token expiry buffer (5 minutes before actual expiry)
 */
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

/**
 * Authentication store using Zustand with persistence
 *
 * Stores authentication state in localStorage for persistence across sessions.
 * Supports both API key and JWT authentication methods.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: true, // Start loading to check stored auth
      authType: null,
      apiKey: null,
      tokens: null,
      user: null,
      error: null,

      // Login with API key
      loginWithApiKey: (apiKey, user) =>
        set({
          isAuthenticated: true,
          isLoading: false,
          authType: "api-key",
          apiKey,
          tokens: null,
          user: user
            ? {
              role: user.role ?? "user",
              ...user,
            }
            : { role: "user" },
          error: null,
        }),

      // Login with JWT
      loginWithJwt: (tokens, user) =>
        set({
          isAuthenticated: true,
          isLoading: false,
          authType: "jwt",
          apiKey: null,
          tokens,
          user,
          error: null,
        }),

      // Logout
      logout: () =>
        set({
          isAuthenticated: false,
          isLoading: false,
          authType: null,
          apiKey: null,
          tokens: null,
          user: null,
          error: null,
        }),

      // Legacy setApiKey support
      setApiKey: (apiKey) => {
        const state = get();
        if (apiKey) {
          state.loginWithApiKey(apiKey, state.user ?? undefined);
        } else {
          state.logout();
        }
      },

      // Update user
      updateUser: (updates) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...updates }
            : { role: "user" as UserRole, ...updates },
        })),

      // Set loading
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error
      setError: (error) => set({ error }),

      // Refresh tokens
      refreshTokens: (tokens) =>
        set({
          tokens,
          error: null,
        }),

      // Check token expiry
      isTokenExpired: () => {
        const { tokens, authType } = get();
        if (authType !== "jwt" || !tokens?.expiresAt) {
          return false;
        }
        return Date.now() >= tokens.expiresAt - TOKEN_EXPIRY_BUFFER;
      },

      // Get auth header
      getAuthHeader: () => {
        const { authType, apiKey, tokens } = get();
        if (authType === "api-key" && apiKey) {
          return apiKey;
        }
        if (authType === "jwt" && tokens?.accessToken) {
          return `Bearer ${tokens.accessToken}`;
        }
        return null;
      },

      // Check role
      hasRole: (requiredRole) => {
        const { user } = get();
        if (!user?.role) return false;
        return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
      },
    }),
    {
      name: "feedback-auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authType: state.authType,
        apiKey: state.apiKey,
        tokens: state.tokens,
        user: state.user,
      }),
      // Rehydration callback
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mark loading as complete after rehydration
          state.setLoading(false);

          // Check if JWT token is expired on rehydration
          if (state.authType === "jwt" && state.isTokenExpired()) {
            // Token expired, trigger logout
            console.warn("[Auth] Token expired on rehydration");
            state.logout();
          }
        }
      },
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select authentication status
 */
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;

/**
 * Select loading status
 */
export const selectIsLoading = (state: AuthState) => state.isLoading;

/**
 * Select user
 */
export const selectUser = (state: AuthState) => state.user;

/**
 * Select user role
 */
export const selectUserRole = (state: AuthState) => state.user?.role ?? null;

/**
 * Select auth error
 */
export const selectAuthError = (state: AuthState) => state.error;

/**
 * Select auth type
 */
export const selectAuthType = (state: AuthState) => state.authType;

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get auth status
 */
export function useAuth() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const user = useAuthStore(selectUser);
  const error = useAuthStore(selectAuthError);
  const authType = useAuthStore(selectAuthType);

  const loginWithApiKey = useAuthStore((state) => state.loginWithApiKey);
  const loginWithJwt = useAuthStore((state) => state.loginWithJwt);
  const logout = useAuthStore((state) => state.logout);
  const hasRole = useAuthStore((state) => state.hasRole);
  const getAuthHeader = useAuthStore((state) => state.getAuthHeader);

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    authType,
    loginWithApiKey,
    loginWithJwt,
    logout,
    hasRole,
    getAuthHeader,
  };
}

/**
 * Hook for role-based access control
 */
export function useRequireRole(requiredRole: UserRole): {
  hasAccess: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
} {
  const isLoading = useAuthStore(selectIsLoading);
  const userRole = useAuthStore(selectUserRole);
  const hasRole = useAuthStore((state) => state.hasRole);

  return {
    hasAccess: hasRole(requiredRole),
    isLoading,
    userRole,
  };
}
