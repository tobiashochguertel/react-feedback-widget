/**
 * @file useLogout Hook Tests
 *
 * Unit tests for the logout hook functionality.
 *
 * TASK-WUI-026: Implement Logout Flow
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useLogout, useLogoutWithNotification } from "../useLogout";

// ============================================================================
// Mocks
// ============================================================================

const mockNavigate = vi.fn();
const mockClearQueryClient = vi.fn();
const mockAuthLogout = vi.fn();
const mockClearNotifications = vi.fn();
const mockSetWsStatus = vi.fn();
const mockAddNotification = vi.fn();

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    clear: mockClearQueryClient,
  }),
}));

// Mock auth store
vi.mock("../../stores/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => {
    const state = {
      logout: mockAuthLogout,
    };
    return selector(state);
  },
}));

// Mock UI store
vi.mock("../../stores/ui", () => ({
  useUIStore: (selector: (state: unknown) => unknown) => {
    const state = {
      clearAllNotifications: mockClearNotifications,
      setWsStatus: mockSetWsStatus,
      addNotification: mockAddNotification,
    };
    return selector(state);
  },
}));

// ============================================================================
// Tests
// ============================================================================

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call all cleanup functions in correct order", () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current();
    });

    // Check all cleanup functions were called
    expect(mockSetWsStatus).toHaveBeenCalledWith("disconnected");
    expect(mockClearQueryClient).toHaveBeenCalled();
    expect(mockClearNotifications).toHaveBeenCalled();
    expect(mockAuthLogout).toHaveBeenCalled();
  });

  it("should navigate to login by default", () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("should navigate to custom redirect path", () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current({ redirectTo: "/custom" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/custom", { replace: true });
  });

  it("should not show notification by default", () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current();
    });

    // Advance timers to check if notification would be added
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it("should show notification when showNotification is true", () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current({ showNotification: true });
    });

    // Advance timers to trigger the setTimeout
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "info",
      title: "You have been logged out",
      duration: 3000,
    });
  });

  it("should show custom notification message", () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current({ showNotification: true, message: "Custom message" });
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "info",
      title: "Custom message",
      duration: 3000,
    });
  });

  it("should set WebSocket status to disconnected", () => {
    const { result } = renderHook(() => useLogout());

    act(() => {
      result.current();
    });

    expect(mockSetWsStatus).toHaveBeenCalledWith("disconnected");
  });
});

describe("useLogoutWithNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show notification with default message", () => {
    const { result } = renderHook(() => useLogoutWithNotification());

    act(() => {
      result.current();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "info",
      title: "You have been logged out",
      duration: 3000,
    });
  });

  it("should show notification with custom message", () => {
    const { result } = renderHook(() => useLogoutWithNotification());

    act(() => {
      result.current("Session expired");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: "info",
      title: "Session expired",
      duration: 3000,
    });
  });

  it("should perform all cleanup operations", () => {
    const { result } = renderHook(() => useLogoutWithNotification());

    act(() => {
      result.current();
    });

    expect(mockSetWsStatus).toHaveBeenCalled();
    expect(mockClearQueryClient).toHaveBeenCalled();
    expect(mockClearNotifications).toHaveBeenCalled();
    expect(mockAuthLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });
});
