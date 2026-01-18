import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** API key for authentication */
  apiKey: string | null;
  /** User information */
  user: {
    email?: string;
    name?: string;
  } | null;
  /** Login with API key */
  login: (apiKey: string, user?: { email?: string; name?: string }) => void;
  /** Logout and clear credentials */
  logout: () => void;
  /** Set API key */
  setApiKey: (apiKey: string) => void;
}

/**
 * Authentication store using Zustand with persistence
 *
 * Stores authentication state in localStorage for persistence across sessions.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      apiKey: null,
      user: null,

      login: (apiKey, user) =>
        set({
          isAuthenticated: true,
          apiKey,
          user: user || null,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          apiKey: null,
          user: null,
        }),

      setApiKey: (apiKey) =>
        set({
          apiKey,
          isAuthenticated: !!apiKey,
        }),
    }),
    {
      name: "feedback-auth-storage",
      // Only persist specific fields
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        apiKey: state.apiKey,
        user: state.user,
      }),
    }
  )
);
