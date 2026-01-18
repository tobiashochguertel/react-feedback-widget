/**
 * @file FilterBar Component Tests
 *
 * Unit tests for the FilterBar component including filter interactions,
 * chip display, and reset functionality.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar, type FilterValues } from "../FilterBar";

// =============================================================================
// Test Fixtures
// =============================================================================

const defaultFilters: FilterValues = {};

const activeFilters: FilterValues = {
  status: "pending",
  type: "bug",
  priority: "high",
  search: "test search",
};

// =============================================================================
// Rendering Tests
// =============================================================================

describe("FilterBar", () => {
  describe("rendering", () => {
    it("renders all filter dropdowns", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);

      expect(screen.getByLabelText("Filter by status")).toBeInTheDocument();
      expect(screen.getByLabelText("Filter by type")).toBeInTheDocument();
      expect(screen.getByLabelText("Filter by priority")).toBeInTheDocument();
    });

    it("renders search input when showSearch is true", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} showSearch />);
      expect(screen.getByPlaceholderText("Search feedback...")).toBeInTheDocument();
    });

    it("hides search input when showSearch is false", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} showSearch={false} />);
      expect(screen.queryByPlaceholderText("Search feedback...")).not.toBeInTheDocument();
    });

    it("renders date range inputs when showDateRange is true", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} showDateRange />);
      // Date inputs use "From:" and "To:" labels with for= pointing to dateFrom/dateTo
      expect(screen.getByLabelText("From:")).toBeInTheDocument();
      expect(screen.getByLabelText("To:")).toBeInTheDocument();
    });

    it("hides date range inputs when showDateRange is false", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} showDateRange={false} />);
      expect(screen.queryByLabelText("From:")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <FilterBar filters={defaultFilters} onChange={vi.fn()} className="custom-filter" />
      );
      expect(container.firstChild).toHaveClass("custom-filter");
    });
  });

  // ===========================================================================
  // Select Dropdown Tests
  // ===========================================================================

  describe("select dropdowns", () => {
    it("displays current status filter value", () => {
      render(<FilterBar filters={{ status: "pending" }} onChange={vi.fn()} />);
      expect(screen.getByLabelText("Filter by status")).toHaveValue("pending");
    });

    it("displays current type filter value", () => {
      render(<FilterBar filters={{ type: "bug" }} onChange={vi.fn()} />);
      expect(screen.getByLabelText("Filter by type")).toHaveValue("bug");
    });

    it("displays current priority filter value", () => {
      render(<FilterBar filters={{ priority: "high" }} onChange={vi.fn()} />);
      expect(screen.getByLabelText("Filter by priority")).toHaveValue("high");
    });

    it("calls onChange when status is selected", async () => {
      const handleChange = vi.fn();
      render(<FilterBar filters={defaultFilters} onChange={handleChange} />);

      fireEvent.change(screen.getByLabelText("Filter by status"), {
        target: { value: "resolved" },
      });

      expect(handleChange).toHaveBeenCalledWith({ status: "resolved" });
    });

    it("calls onChange when type is selected", async () => {
      const handleChange = vi.fn();
      render(<FilterBar filters={defaultFilters} onChange={handleChange} />);

      fireEvent.change(screen.getByLabelText("Filter by type"), {
        target: { value: "feature" },
      });

      expect(handleChange).toHaveBeenCalledWith({ type: "feature" });
    });

    it("calls onChange when priority is selected", async () => {
      const handleChange = vi.fn();
      render(<FilterBar filters={defaultFilters} onChange={handleChange} />);

      fireEvent.change(screen.getByLabelText("Filter by priority"), {
        target: { value: "critical" },
      });

      expect(handleChange).toHaveBeenCalledWith({ priority: "critical" });
    });

    it("contains all status options", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);
      const statusSelect = screen.getByLabelText("Filter by status");

      expect(statusSelect).toContainHTML("All Statuses");
      expect(statusSelect).toContainHTML("Pending");
      expect(statusSelect).toContainHTML("In Progress");
      expect(statusSelect).toContainHTML("Resolved");
      expect(statusSelect).toContainHTML("Closed");
      expect(statusSelect).toContainHTML("Archived");
    });

    it("contains all type options", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);
      const typeSelect = screen.getByLabelText("Filter by type");

      expect(typeSelect).toContainHTML("All Types");
      expect(typeSelect).toContainHTML("Bug");
      expect(typeSelect).toContainHTML("Feature");
      expect(typeSelect).toContainHTML("Improvement");
      expect(typeSelect).toContainHTML("Question");
      expect(typeSelect).toContainHTML("Other");
    });

    it("contains all priority options", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);
      const prioritySelect = screen.getByLabelText("Filter by priority");

      expect(prioritySelect).toContainHTML("All Priorities");
      expect(prioritySelect).toContainHTML("Low");
      expect(prioritySelect).toContainHTML("Medium");
      expect(prioritySelect).toContainHTML("High");
      expect(prioritySelect).toContainHTML("Critical");
    });
  });

  // ===========================================================================
  // Search Input Tests
  // ===========================================================================

  describe("search input", () => {
    it("displays current search value", () => {
      render(<FilterBar filters={{ search: "test query" }} onChange={vi.fn()} />);
      expect(screen.getByPlaceholderText("Search feedback...")).toHaveValue("test query");
    });

    it("calls onChange with search value (debounced)", async () => {
      vi.useFakeTimers();
      const handleChange = vi.fn();
      render(<FilterBar filters={defaultFilters} onChange={handleChange} />);

      const searchInput = screen.getByPlaceholderText("Search feedback...");
      fireEvent.change(searchInput, { target: { value: "new search" } });

      // Before debounce timeout
      expect(handleChange).not.toHaveBeenCalled();

      // After debounce timeout
      vi.advanceTimersByTime(350);
      expect(handleChange).toHaveBeenCalledWith({ search: "new search" });

      vi.useRealTimers();
    });
  });

  // ===========================================================================
  // Date Range Tests
  // ===========================================================================

  describe("date range", () => {
    it("calls onChange when from date changes", () => {
      const handleChange = vi.fn();
      render(<FilterBar filters={defaultFilters} onChange={handleChange} showDateRange />);

      fireEvent.change(screen.getByLabelText("From:"), {
        target: { value: "2024-01-01" },
      });

      expect(handleChange).toHaveBeenCalledWith({ dateFrom: "2024-01-01" });
    });

    it("calls onChange when to date changes", () => {
      const handleChange = vi.fn();
      render(<FilterBar filters={defaultFilters} onChange={handleChange} showDateRange />);

      fireEvent.change(screen.getByLabelText("To:"), {
        target: { value: "2024-12-31" },
      });

      expect(handleChange).toHaveBeenCalledWith({ dateTo: "2024-12-31" });
    });

    it("displays current date values", () => {
      render(
        <FilterBar
          filters={{ dateFrom: "2024-01-01", dateTo: "2024-12-31" }}
          onChange={vi.fn()}
          showDateRange
        />
      );

      expect(screen.getByLabelText("From:")).toHaveValue("2024-01-01");
      expect(screen.getByLabelText("To:")).toHaveValue("2024-12-31");
    });
  });

  // ===========================================================================
  // Filter Chips Tests
  // ===========================================================================

  describe("filter chips", () => {
    it("displays chips for active filters", () => {
      render(<FilterBar filters={activeFilters} onChange={vi.fn()} />);

      expect(screen.getByText("Status:")).toBeInTheDocument();
      // "Pending" appears both in option and chip, so use getAllByText
      expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Type:")).toBeInTheDocument();
      // "Bug" also appears in both places
      expect(screen.getAllByText("Bug").length).toBeGreaterThanOrEqual(1);
    });

    it("removes filter when chip X is clicked", () => {
      const handleChange = vi.fn();
      render(
        <FilterBar filters={{ status: "pending" }} onChange={handleChange} />
      );

      fireEvent.click(screen.getByLabelText("Remove Status filter"));
      expect(handleChange).toHaveBeenCalledWith({});
    });

    it("does not display chips when no filters active", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);
      expect(screen.queryByText("Status:")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Reset Button Tests
  // ===========================================================================

  describe("reset button", () => {
    it("renders reset button when onReset is provided and filters are active", () => {
      render(<FilterBar filters={activeFilters} onChange={vi.fn()} onReset={vi.fn()} />);
      expect(screen.getByText("Reset All")).toBeInTheDocument();
    });

    it("calls onReset when reset button is clicked", () => {
      const handleReset = vi.fn();
      render(<FilterBar filters={activeFilters} onChange={vi.fn()} onReset={handleReset} />);

      fireEvent.click(screen.getByText("Reset All"));
      expect(handleReset).toHaveBeenCalledTimes(1);
    });

    it("does not render reset button when no filters are active", () => {
      render(<FilterBar filters={defaultFilters} onChange={vi.fn()} onReset={vi.fn()} />);
      expect(screen.queryByText("Reset All")).not.toBeInTheDocument();
    });
  });
});
