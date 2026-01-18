/**
 * @file Authentication Store Tests
 *
 * Unit tests for the auth store functionality.
 *
 * TASK-WUI-024: Create Auth Context
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  useAuthStore,
  useAuth,
  useRequireRole,
  type UserRole,
} from "../auth";

// ============================================================================
// Mock localStorage
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ============================================================================
// Test Helpers
// ============================================================================

function resetStore() {
  // Reset the store to initial state
  useAuthStore.setState({
    isAuthenticated: false,
    isLoading: false,
    authType: null,
    apiKey: null,
    tokens: null,
    user: null,
    error: null,
  });
}

// ============================================================================
// useAuthStore Tests
// ============================================================================

describe("useAuthStore", () => {
  beforeEach(() => {
    resetStore();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.authType).toBeNull();
      expect(state.apiKey).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe("loginWithApiKey", () => {
    it("should authenticate with API key", () => {
      const { loginWithApiKey } = useAuthStore.getState();

      act(() => {
        loginWithApiKey("test-api-key");
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.authType).toBe("api-key");
      expect(state.apiKey).toBe("test-api-key");
      expect(state.tokens).toBeNull();
      expect(state.user).toEqual({ role: "user" });
    });

    it("should authenticate with API key and user info", () => {
      const { loginWithApiKey } = useAuthStore.getState();

      act(() => {
        loginWithApiKey("test-api-key", {
          email: "test@example.com",
          name: "Test User",
          role: "admin",
        });
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual({
        email: "test@example.com",
        name: "Test User",
        role: "admin",
      });
    });

    it("should default to 'user' role if not specified", () => {
      const { loginWithApiKey } = useAuthStore.getState();

      act(() => {
        loginWithApiKey("test-api-key", { email: "test@example.com" });
      });

      const state = useAuthStore.getState();
      expect(state.user?.role).toBe("user");
    });

    it("should clear any previous error", () => {
      useAuthStore.setState({ error: "Previous error" });
      const { loginWithApiKey } = useAuthStore.getState();

      act(() => {
        loginWithApiKey("test-api-key");
      });

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe("loginWithJwt", () => {
    it("should authenticate with JWT tokens", () => {
      const { loginWithJwt } = useAuthStore.getState();
      const tokens = {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() + 3600000,
      };
      const user = { id: "1", email: "test@example.com", role: "admin" as UserRole };

      act(() => {
        loginWithJwt(tokens, user);
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.authType).toBe("jwt");
      expect(state.tokens).toEqual(tokens);
      expect(state.apiKey).toBeNull();
      expect(state.user).toEqual(user);
    });
  });

  describe("logout", () => {
    it("should clear all auth state", () => {
      // First login
      const { loginWithApiKey, logout } = useAuthStore.getState();
      act(() => {
        loginWithApiKey("test-api-key", { email: "test@example.com", role: "admin" });
      });

      // Then logout
      act(() => {
        logout();
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.authType).toBeNull();
      expect(state.apiKey).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.user).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe("setApiKey (legacy)", () => {
    it("should login when setting API key", () => {
      const { setApiKey } = useAuthStore.getState();

      act(() => {
        setApiKey("test-api-key");
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.apiKey).toBe("test-api-key");
    });

    it("should logout when setting empty API key", () => {
      // First login
      const { loginWithApiKey, setApiKey } = useAuthStore.getState();
      act(() => {
        loginWithApiKey("test-api-key");
      });

      // Then set empty API key
      act(() => {
        setApiKey("");
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("updateUser", () => {
    it("should update user information", () => {
      const { loginWithApiKey, updateUser } = useAuthStore.getState();
      act(() => {
        loginWithApiKey("test-api-key", { email: "old@example.com", role: "user" });
      });

      act(() => {
        updateUser({ email: "new@example.com", name: "New Name" });
      });

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe("new@example.com");
      expect(state.user?.name).toBe("New Name");
      expect(state.user?.role).toBe("user"); // Preserved
    });

    it("should create user if not exists", () => {
      const { updateUser } = useAuthStore.getState();

      act(() => {
        updateUser({ email: "new@example.com" });
      });

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe("new@example.com");
      expect(state.user?.role).toBe("user"); // Default role
    });
  });

  describe("setLoading", () => {
    it("should set loading state", () => {
      const { setLoading } = useAuthStore.getState();

      act(() => {
        setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);

      act(() => {
        setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error state", () => {
      const { setError } = useAuthStore.getState();

      act(() => {
        setError("Something went wrong");
      });

      expect(useAuthStore.getState().error).toBe("Something went wrong");

      act(() => {
        setError(null);
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe("refreshTokens", () => {
    it("should update tokens", () => {
      const { loginWithJwt, refreshTokens } = useAuthStore.getState();
      const initialTokens = {
        accessToken: "old-token",
        expiresAt: Date.now() + 1000,
      };
      const user = { id: "1", role: "user" as UserRole };

      act(() => {
        loginWithJwt(initialTokens, user);
      });

      const newTokens = {
        accessToken: "new-token",
        expiresAt: Date.now() + 3600000,
      };

      act(() => {
        refreshTokens(newTokens);
      });

      const state = useAuthStore.getState();
      expect(state.tokens?.accessToken).toBe("new-token");
      expect(state.error).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for API key auth", () => {
      const { loginWithApiKey, isTokenExpired } = useAuthStore.getState();
      act(() => {
        loginWithApiKey("test-api-key");
      });

      expect(isTokenExpired()).toBe(false);
    });

    it("should return false for valid JWT token", () => {
      const { loginWithJwt, isTokenExpired } = useAuthStore.getState();
      const tokens = {
        accessToken: "token",
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };
      const user = { id: "1", role: "user" as UserRole };

      act(() => {
        loginWithJwt(tokens, user);
      });

      expect(isTokenExpired()).toBe(false);
    });

    it("should return true for expired JWT token", () => {
      const { loginWithJwt, isTokenExpired } = useAuthStore.getState();
      const tokens = {
        accessToken: "token",
        expiresAt: Date.now() - 1000, // Already expired
      };
      const user = { id: "1", role: "user" as UserRole };

      act(() => {
        loginWithJwt(tokens, user);
      });

      expect(isTokenExpired()).toBe(true);
    });

    it("should return true for token within buffer (5 min)", () => {
      const { loginWithJwt, isTokenExpired } = useAuthStore.getState();
      const tokens = {
        accessToken: "token",
        expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes from now (within 5 min buffer)
      };
      const user = { id: "1", role: "user" as UserRole };

      act(() => {
        loginWithJwt(tokens, user);
      });

      expect(isTokenExpired()).toBe(true);
    });
  });

  describe("getAuthHeader", () => {
    it("should return API key for api-key auth", () => {
      const { loginWithApiKey, getAuthHeader } = useAuthStore.getState();
      act(() => {
        loginWithApiKey("my-api-key");
      });

      expect(getAuthHeader()).toBe("my-api-key");
    });

    it("should return Bearer token for JWT auth", () => {
      const { loginWithJwt, getAuthHeader } = useAuthStore.getState();
      const tokens = { accessToken: "jwt-token" };
      const user = { id: "1", role: "user" as UserRole };

      act(() => {
        loginWithJwt(tokens, user);
      });

      expect(getAuthHeader()).toBe("Bearer jwt-token");
    });

    it("should return null when not authenticated", () => {
      const { getAuthHeader } = useAuthStore.getState();
      expect(getAuthHeader()).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("should check role hierarchy correctly", () => {
      const { loginWithApiKey, hasRole } = useAuthStore.getState();

      // Test as viewer
      act(() => {
        loginWithApiKey("key", { role: "viewer" });
      });
      expect(hasRole("viewer")).toBe(true);
      expect(hasRole("user")).toBe(false);
      expect(hasRole("admin")).toBe(false);

      // Test as user
      act(() => {
        loginWithApiKey("key", { role: "user" });
      });
      expect(hasRole("viewer")).toBe(true);
      expect(hasRole("user")).toBe(true);
      expect(hasRole("admin")).toBe(false);

      // Test as admin
      act(() => {
        loginWithApiKey("key", { role: "admin" });
      });
      expect(hasRole("viewer")).toBe(true);
      expect(hasRole("user")).toBe(true);
      expect(hasRole("admin")).toBe(true);
    });

    it("should return false when not authenticated", () => {
      const { hasRole } = useAuthStore.getState();
      expect(hasRole("viewer")).toBe(false);
    });
  });
});

// ============================================================================
// useAuth Hook Tests
// ============================================================================

describe("useAuth", () => {
  beforeEach(() => {
    resetStore();
    localStorageMock.clear();
  });

  it("should return auth state and methods", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.authType).toBeNull();
    expect(typeof result.current.loginWithApiKey).toBe("function");
    expect(typeof result.current.loginWithJwt).toBe("function");
    expect(typeof result.current.logout).toBe("function");
    expect(typeof result.current.hasRole).toBe("function");
    expect(typeof result.current.getAuthHeader).toBe("function");
  });

  it("should update when login is called", () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.loginWithApiKey("test-key", { role: "admin" });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.authType).toBe("api-key");
    expect(result.current.user?.role).toBe("admin");
  });

  it("should update when logout is called", () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.loginWithApiKey("test-key");
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

// ============================================================================
// useRequireRole Hook Tests
// ============================================================================

describe("useRequireRole", () => {
  beforeEach(() => {
    resetStore();
    localStorageMock.clear();
  });

  it("should return hasAccess false when not authenticated", () => {
    const { result } = renderHook(() => useRequireRole("viewer"));

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.userRole).toBeNull();
  });

  it("should return hasAccess true when user has required role", () => {
    // Login first
    act(() => {
      useAuthStore.getState().loginWithApiKey("key", { role: "admin" });
    });

    const { result } = renderHook(() => useRequireRole("user"));

    expect(result.current.hasAccess).toBe(true);
    expect(result.current.userRole).toBe("admin");
  });

  it("should return hasAccess false when user lacks required role", () => {
    // Login as viewer
    act(() => {
      useAuthStore.getState().loginWithApiKey("key", { role: "viewer" });
    });

    const { result } = renderHook(() => useRequireRole("admin"));

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.userRole).toBe("viewer");
  });
});
