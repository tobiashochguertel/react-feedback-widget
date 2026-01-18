/**
 * Toast Component Tests
 *
 * Unit tests for Toast, ToastContainer, and useToast hook.
 *
 * TASK-WUI-023
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Toast, ToastContainer, useToast } from "../Toast";
import type { Notification } from "../../stores";

// ============================================================================
// Mock matchMedia for jsdom
// ============================================================================

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================================================
// Mock Store
// ============================================================================

// We need to mock the store for isolated testing
const mockAddNotification = vi.fn();
const mockRemoveNotification = vi.fn();
const mockClearAllNotifications = vi.fn();
const mockNotifications: Notification[] = [];

vi.mock("../../stores", () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    addNotification: mockAddNotification,
    removeNotification: mockRemoveNotification,
    clearAllNotifications: mockClearAllNotifications,
  }),
}));

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return {
    id: "test-id-1",
    type: "success",
    title: "Test Title",
    createdAt: Date.now(),
    ...overrides,
  };
}

// ============================================================================
// Toast Component Tests
// ============================================================================

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render success toast with title", () => {
    const notification = createMockNotification({
      type: "success",
      title: "Success!",
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should render error toast", () => {
    const notification = createMockNotification({
      type: "error",
      title: "Error!",
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  it("should render warning toast", () => {
    const notification = createMockNotification({
      type: "warning",
      title: "Warning!",
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    expect(screen.getByText("Warning!")).toBeInTheDocument();
  });

  it("should render info toast", () => {
    const notification = createMockNotification({
      type: "info",
      title: "Info!",
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    expect(screen.getByText("Info!")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    const notification = createMockNotification({
      title: "Title",
      description: "This is a description",
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("should render action button when provided", () => {
    const actionClick = vi.fn();
    const notification = createMockNotification({
      title: "Title",
      action: {
        label: "Undo",
        onClick: actionClick,
      },
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    const actionButton = screen.getByRole("button", { name: "Undo" });
    expect(actionButton).toBeInTheDocument();
  });

  it("should call action onClick and remove toast when action clicked", () => {
    const actionClick = vi.fn();
    const notification = createMockNotification({
      title: "Title",
      action: {
        label: "Undo",
        onClick: actionClick,
      },
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    const actionButton = screen.getByRole("button", { name: "Undo" });
    fireEvent.click(actionButton);

    expect(actionClick).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith("test-id-1");
  });

  it("should call onRemove when dismiss button clicked", () => {
    const notification = createMockNotification({
      title: "Title",
      dismissible: true,
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    const dismissButton = screen.getByRole("button", {
      name: "Dismiss notification",
    });
    fireEvent.click(dismissButton);

    expect(onRemove).toHaveBeenCalledWith("test-id-1");
  });

  it("should not show dismiss button when dismissible is false", () => {
    const notification = createMockNotification({
      title: "Title",
      dismissible: false,
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    expect(
      screen.queryByRole("button", { name: "Dismiss notification" })
    ).not.toBeInTheDocument();
  });

  it("should auto-dismiss after duration", () => {
    const notification = createMockNotification({
      title: "Title",
      duration: 3000,
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    expect(onRemove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onRemove).toHaveBeenCalledWith("test-id-1");
  });

  it("should use default duration when not specified", () => {
    const notification = createMockNotification({
      title: "Title",
      duration: undefined,
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    // Default is 5000ms
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(onRemove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onRemove).toHaveBeenCalled();
  });

  it("should not auto-dismiss when duration is 0 (permanent)", () => {
    const notification = createMockNotification({
      title: "Title",
      duration: 0,
    });
    const onRemove = vi.fn();

    render(<Toast notification={notification} onRemove={onRemove} />);

    act(() => {
      vi.advanceTimersByTime(60000); // 1 minute
    });

    expect(onRemove).not.toHaveBeenCalled();
  });
});

// ============================================================================
// ToastContainer Tests
// ============================================================================

describe("ToastContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when no notifications", () => {
    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });
});

// ============================================================================
// useToast Hook Tests
// ============================================================================

describe("useToast", () => {
  // Helper component to test hook
  function TestComponent() {
    const toast = useToast();
    return (
      <div>
        <button onClick={() => toast.success("Success!")}>Success</button>
        <button onClick={() => toast.error("Error!")}>Error</button>
        <button onClick={() => toast.warning("Warning!")}>Warning</button>
        <button onClick={() => toast.info("Info!")}>Info</button>
        <button
          onClick={() =>
            toast.success("With desc", { description: "Description" })
          }
        >
          With Description
        </button>
        <button
          onClick={() =>
            toast.success("With action", {
              action: { label: "Undo", onClick: () => { } },
            })
          }
        >
          With Action
        </button>
        <button onClick={() => toast.dismiss("test-id")}>Dismiss</button>
        <button onClick={() => toast.dismissAll()}>Dismiss All</button>
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddNotification.mockReturnValue("mock-id");
  });

  it("should call addNotification with success type", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Success"));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Success!",
      })
    );
  });

  it("should call addNotification with error type", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Error"));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Error!",
      })
    );
  });

  it("should call addNotification with warning type", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Warning"));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "warning",
        title: "Warning!",
      })
    );
  });

  it("should call addNotification with info type", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Info"));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "info",
        title: "Info!",
      })
    );
  });

  it("should pass description to addNotification", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("With Description"));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Description",
      })
    );
  });

  it("should pass action to addNotification", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("With Action"));

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        action: expect.objectContaining({
          label: "Undo",
        }),
      })
    );
  });

  it("should call removeNotification on dismiss", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Dismiss"));

    expect(mockRemoveNotification).toHaveBeenCalledWith("test-id");
  });

  it("should call clearAllNotifications on dismissAll", () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Dismiss All"));

    expect(mockClearAllNotifications).toHaveBeenCalled();
  });
});

// ============================================================================
// Toast Variants Styling Tests
// ============================================================================

describe("Toast Variants", () => {
  const variants: Array<{ type: Notification["type"]; expectedClass: string }> =
    [
      { type: "success", expectedClass: "bg-green-50" },
      { type: "error", expectedClass: "bg-red-50" },
      { type: "warning", expectedClass: "bg-yellow-50" },
      { type: "info", expectedClass: "bg-blue-50" },
    ];

  variants.forEach(({ type, expectedClass }) => {
    it(`should apply ${type} styling`, () => {
      const notification = createMockNotification({ type, title: "Test" });
      const onRemove = vi.fn();

      render(<Toast notification={notification} onRemove={onRemove} />);

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain(expectedClass);
    });
  });
});
