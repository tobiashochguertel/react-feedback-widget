/**
 * @file Layout Component Tests
 *
 * Unit tests for the main layout component with sidebar navigation.
 *
 * TASK-WUI-028: Write Component Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Layout } from "../Layout";

// ============================================================================
// Mocks
// ============================================================================

const mockLogout = vi.fn();

// Mock useLogout hook
vi.mock("../../hooks", () => ({
  useLogout: () => mockLogout,
}));

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Render Layout with MemoryRouter
 */
function renderLayout(initialRoute = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<div>Dashboard Page</div>} />
          <Route path="feedback" element={<div>Feedback Page</div>} />
          <Route path="settings" element={<div>Settings Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Test Suite
// ============================================================================

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sidebar rendering", () => {
    it("renders the logo and brand name", () => {
      renderLayout();

      // Brand name should be visible
      expect(screen.getAllByText("Feedback Admin")[0]).toBeInTheDocument();
    });

    it("renders navigation links", () => {
      renderLayout();

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Feedback")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders logout button", () => {
      renderLayout();

      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("shows Dashboard page when at /dashboard", () => {
      renderLayout("/dashboard");

      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });

    it("shows Feedback page when at /feedback", () => {
      renderLayout("/feedback");

      expect(screen.getByText("Feedback Page")).toBeInTheDocument();
    });

    it("shows Settings page when at /settings", () => {
      renderLayout("/settings");

      expect(screen.getByText("Settings Page")).toBeInTheDocument();
    });

    it("navigates when clicking nav links", () => {
      renderLayout("/dashboard");

      // Initially on dashboard
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();

      // Click on Feedback link
      fireEvent.click(screen.getByText("Feedback"));

      // Should show Feedback page
      expect(screen.getByText("Feedback Page")).toBeInTheDocument();
    });

    it("applies active styles to current route", () => {
      renderLayout("/dashboard");

      const dashboardLink = screen.getByText("Dashboard").closest("a");
      const feedbackLink = screen.getByText("Feedback").closest("a");

      // Dashboard link should have active styles (bg-primary class)
      expect(dashboardLink).toHaveClass("bg-primary");

      // Feedback link should not have active styles
      expect(feedbackLink).not.toHaveClass("bg-primary");
    });
  });

  describe("logout", () => {
    it("calls logout with notification when clicking logout button", () => {
      renderLayout();

      const logoutButton = screen.getByText("Logout");
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledWith({
        showNotification: true,
        message: "Successfully logged out",
      });
    });
  });

  describe("mobile menu", () => {
    it("renders mobile menu toggle button", () => {
      renderLayout();

      // The mobile toggle uses Menu icon, check for the button
      const toggleButtons = screen.getAllByRole("button");
      // Should have at least 2 buttons: mobile toggle and logout
      expect(toggleButtons.length).toBeGreaterThanOrEqual(2);
    });

    it("sidebar is hidden by default on mobile (has -translate-x-full)", () => {
      const { container } = renderLayout();

      // Sidebar starts hidden (translated off-screen)
      const sidebar = container.querySelector("aside");
      expect(sidebar).toHaveClass("-translate-x-full");
    });

    it("toggles sidebar visibility when clicking menu button", () => {
      const { container } = renderLayout();

      // Get the mobile menu button (first button, not the logout)
      const buttons = screen.getAllByRole("button");
      const menuButton = buttons.find(
        (btn) => !btn.textContent?.includes("Logout")
      );

      if (!menuButton) {
        throw new Error("Menu button not found");
      }

      // Click to open
      fireEvent.click(menuButton);

      const sidebar = container.querySelector("aside");
      expect(sidebar).toHaveClass("translate-x-0");
      expect(sidebar).not.toHaveClass("-translate-x-full");
    });

    it("shows backdrop when sidebar is open", () => {
      const { container } = renderLayout();

      // Get the mobile menu button
      const buttons = screen.getAllByRole("button");
      const menuButton = buttons.find(
        (btn) => !btn.textContent?.includes("Logout")
      );

      if (!menuButton) {
        throw new Error("Menu button not found");
      }

      // Initially no backdrop
      let backdrop = container.querySelector(".bg-black\\/50");
      expect(backdrop).not.toBeInTheDocument();

      // Open sidebar
      fireEvent.click(menuButton);

      // Backdrop should appear
      backdrop = container.querySelector(".bg-black\\/50");
      expect(backdrop).toBeInTheDocument();
    });

    it("closes sidebar when clicking backdrop", () => {
      const { container } = renderLayout();

      // Open sidebar first
      const buttons = screen.getAllByRole("button");
      const menuButton = buttons.find(
        (btn) => !btn.textContent?.includes("Logout")
      );

      if (!menuButton) {
        throw new Error("Menu button not found");
      }

      fireEvent.click(menuButton);

      // Click backdrop
      const backdrop = container.querySelector(".bg-black\\/50");
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Sidebar should be hidden again
      const sidebar = container.querySelector("aside");
      expect(sidebar).toHaveClass("-translate-x-full");
    });

    it("closes sidebar when clicking a nav link", () => {
      const { container } = renderLayout("/dashboard");

      // Open sidebar first
      const buttons = screen.getAllByRole("button");
      const menuButton = buttons.find(
        (btn) => !btn.textContent?.includes("Logout")
      );

      if (!menuButton) {
        throw new Error("Menu button not found");
      }

      fireEvent.click(menuButton);

      // Sidebar should be open
      let sidebar = container.querySelector("aside");
      expect(sidebar).toHaveClass("translate-x-0");

      // Click on a nav link
      fireEvent.click(screen.getByText("Feedback"));

      // Sidebar should be closed
      sidebar = container.querySelector("aside");
      expect(sidebar).toHaveClass("-translate-x-full");
    });
  });

  describe("main content area", () => {
    it("renders Outlet content in main element", () => {
      renderLayout("/dashboard");

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(main).toContainElement(screen.getByText("Dashboard Page"));
    });

    it("has correct padding classes on main", () => {
      renderLayout();

      const main = screen.getByRole("main");
      expect(main).toHaveClass("p-4", "lg:p-8");
    });
  });

  describe("responsive layout", () => {
    it("sidebar has lg:translate-x-0 for desktop visibility", () => {
      const { container } = renderLayout();

      const sidebar = container.querySelector("aside");
      expect(sidebar).toHaveClass("lg:translate-x-0");
    });

    it("main content wrapper has lg:pl-64 for sidebar offset", () => {
      const { container } = renderLayout();

      const mainWrapper = container.querySelector(".lg\\:pl-64");
      expect(mainWrapper).toBeInTheDocument();
    });

    it("mobile header has lg:hidden class", () => {
      renderLayout();

      const header = screen.getByRole("banner");
      expect(header).toHaveClass("lg:hidden");
    });
  });

  describe("accessibility", () => {
    it("has navigation landmark", () => {
      renderLayout();

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("has main landmark", () => {
      renderLayout();

      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("has banner/header landmark for mobile", () => {
      renderLayout();

      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("nav links are actual anchor elements", () => {
      renderLayout();

      const dashboardLink = screen.getByText("Dashboard");
      expect(dashboardLink.closest("a")).toHaveAttribute("href", "/dashboard");
    });
  });
});
