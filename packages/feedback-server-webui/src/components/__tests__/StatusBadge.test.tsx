/**
 * @file StatusBadge Component Tests
 *
 * Unit tests for the StatusBadge component and its convenience variants.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatusBadge, TypeBadge, PriorityBadge } from "../StatusBadge";
import type { FeedbackStatus, FeedbackType, FeedbackPriority } from "@/types/api";

describe("StatusBadge", () => {
  // ==========================================================================
  // Rendering Tests
  // ==========================================================================

  describe("rendering", () => {
    it("renders status badge with correct text", () => {
      render(<StatusBadge variant="status" value="pending" />);
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("renders type badge with correct text", () => {
      render(<StatusBadge variant="type" value="bug" />);
      expect(screen.getByText("Bug")).toBeInTheDocument();
    });

    it("renders priority badge with correct text", () => {
      render(<StatusBadge variant="priority" value="high" />);
      expect(screen.getByText("High")).toBeInTheDocument();
    });

    it("renders multi-word values with proper capitalization", () => {
      render(<StatusBadge variant="status" value="in_progress" />);
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it("renders icon when showIcon is true", () => {
      render(<StatusBadge variant="status" value="pending" showIcon />);
      expect(screen.getByText("⏳")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("does not render icon when showIcon is false", () => {
      render(<StatusBadge variant="status" value="pending" showIcon={false} />);
      expect(screen.queryByText("⏳")).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // All Status Values
  // ==========================================================================

  describe("status variants", () => {
    const statusValues: FeedbackStatus[] = [
      "pending",
      "in_progress",
      "resolved",
      "closed",
      "archived",
    ];

    it.each(statusValues)("renders %s status correctly", (status) => {
      const { container } = render(<StatusBadge variant="status" value={status} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it.each(statusValues)("shows icon for %s status when showIcon is true", (status) => {
      const { container } = render(<StatusBadge variant="status" value={status} showIcon />);
      // Verify badge exists and has two child spans (icon + text)
      const badge = container.querySelector("span");
      expect(badge).toBeInTheDocument();
      const spans = badge?.querySelectorAll("span");
      expect(spans).toHaveLength(2); // Icon span + text span
    });
  });

  // ==========================================================================
  // All Type Values
  // ==========================================================================

  describe("type variants", () => {
    const typeValues: FeedbackType[] = ["bug", "feature", "improvement", "question", "other"];

    it.each(typeValues)("renders %s type correctly", (type) => {
      const { container } = render(<StatusBadge variant="type" value={type} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // All Priority Values
  // ==========================================================================

  describe("priority variants", () => {
    const priorityValues: FeedbackPriority[] = ["low", "medium", "high", "critical"];

    it.each(priorityValues)("renders %s priority correctly", (priority) => {
      const { container } = render(<StatusBadge variant="priority" value={priority} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Size Variants
  // ==========================================================================

  describe("size variants", () => {
    it("applies small size classes", () => {
      const { container } = render(<StatusBadge variant="status" value="pending" size="sm" />);
      expect(container.firstChild).toHaveClass("text-xs");
    });

    it("applies medium size classes (default)", () => {
      const { container } = render(<StatusBadge variant="status" value="pending" />);
      expect(container.firstChild).toHaveClass("text-sm");
    });

    it("applies large size classes", () => {
      const { container } = render(<StatusBadge variant="status" value="pending" size="lg" />);
      expect(container.firstChild).toHaveClass("text-base");
    });
  });

  // ==========================================================================
  // Interactive Behavior
  // ==========================================================================

  describe("interactive behavior", () => {
    it("calls onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<StatusBadge variant="status" value="pending" onClick={handleClick} />);

      fireEvent.click(screen.getByText("Pending"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not throw when clicked without onClick handler", () => {
      render(<StatusBadge variant="status" value="pending" />);
      expect(() => fireEvent.click(screen.getByText("Pending"))).not.toThrow();
    });

    it("has button role when clickable", () => {
      const handleClick = vi.fn();
      render(<StatusBadge variant="status" value="pending" onClick={handleClick} />);

      const badge = screen.getByRole("button");
      expect(badge).toBeInTheDocument();
    });

    it("does not have button role when not clickable", () => {
      render(<StatusBadge variant="status" value="pending" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("responds to Enter key when clickable", () => {
      const handleClick = vi.fn();
      render(<StatusBadge variant="status" value="pending" onClick={handleClick} />);

      const badge = screen.getByRole("button");
      fireEvent.keyDown(badge, { key: "Enter" });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("responds to Space key when clickable", () => {
      const handleClick = vi.fn();
      render(<StatusBadge variant="status" value="pending" onClick={handleClick} />);

      const badge = screen.getByRole("button");
      fireEvent.keyDown(badge, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("has tabIndex when clickable", () => {
      const handleClick = vi.fn();
      render(<StatusBadge variant="status" value="pending" onClick={handleClick} />);

      const badge = screen.getByRole("button");
      expect(badge).toHaveAttribute("tabIndex", "0");
    });
  });

  // ==========================================================================
  // Custom Classes
  // ==========================================================================

  describe("custom classes", () => {
    it("applies custom className", () => {
      const { container } = render(
        <StatusBadge variant="status" value="pending" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});

// ============================================================================
// Convenience Components
// ============================================================================

describe("TypeBadge", () => {
  it("renders with correct type", () => {
    render(<TypeBadge type="bug" />);
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("passes additional props to StatusBadge", () => {
    const handleClick = vi.fn();
    render(<TypeBadge type="feature" onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows icon when showIcon is true", () => {
    render(<TypeBadge type="bug" showIcon />);
    expect(screen.getByText("🐛")).toBeInTheDocument();
  });
});

describe("PriorityBadge", () => {
  it("renders with correct priority", () => {
    render(<PriorityBadge priority="critical" />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("passes additional props to StatusBadge", () => {
    const handleClick = vi.fn();
    render(<PriorityBadge priority="high" onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows icon when showIcon is true", () => {
    render(<PriorityBadge priority="critical" showIcon />);
    expect(screen.getByText("🔥")).toBeInTheDocument();
  });
});
