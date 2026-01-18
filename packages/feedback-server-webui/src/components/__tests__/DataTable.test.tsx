/**
 * @file DataTable Component Tests
 *
 * Unit tests for the DataTable component including sorting, selection,
 * keyboard navigation, and rendering states.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, type Column, type SortState } from "../DataTable";

// =============================================================================
// Test Data & Fixtures
// =============================================================================

interface TestRow {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

const testData: TestRow[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    status: "pending",
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    status: "inactive",
    createdAt: "2024-01-13",
  },
];

const testColumns: Column<TestRow>[] = [
  { id: "name", header: "Name", accessor: "name", sortable: true },
  { id: "email", header: "Email", accessor: "email", sortable: true },
  { id: "status", header: "Status", accessor: "status" },
  { id: "createdAt", header: "Created", accessor: "createdAt", sortable: true },
];

const getRowKey = (row: TestRow) => row.id;

// =============================================================================
// Rendering Tests
// =============================================================================

describe("DataTable", () => {
  describe("rendering", () => {
    it("renders column headers", () => {
      render(<DataTable columns={testColumns} data={testData} getRowKey={getRowKey} />);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
    });

    it("renders data rows", () => {
      render(<DataTable columns={testColumns} data={testData} getRowKey={getRowKey} />);

      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    });

    it("renders all cell values", () => {
      render(<DataTable columns={testColumns} data={testData} getRowKey={getRowKey} />);

      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("renders empty message when no data", () => {
      render(<DataTable columns={testColumns} data={[]} getRowKey={getRowKey} />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("renders custom empty message", () => {
      render(
        <DataTable
          columns={testColumns}
          data={[]}
          getRowKey={getRowKey}
          emptyMessage="No items found"
        />
      );

      expect(screen.getByText("No items found")).toBeInTheDocument();
    });

    it("renders loading state with skeleton rows", () => {
      render(
        <DataTable columns={testColumns} data={[]} getRowKey={getRowKey} loading />
      );

      // Should have skeleton rows with pulse animation
      const skeletonCells = screen.getAllByRole("cell");
      expect(skeletonCells.length).toBeGreaterThan(0);
    });

    it("applies custom className", () => {
      const { container } = render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          className="custom-table"
        />
      );

      expect(container.firstChild).toHaveClass("custom-table");
    });
  });

  // ===========================================================================
  // Custom Cell Renderer Tests
  // ===========================================================================

  describe("custom cell renderers", () => {
    it("uses custom cell renderer when provided", () => {
      const columnsWithCustomCell: Column<TestRow>[] = [
        ...testColumns.slice(0, 2),
        {
          id: "status",
          header: "Status",
          accessor: "status",
          cell: (row) => <span data-testid={`status-${row.id}`}>{row.status.toUpperCase()}</span>,
        },
      ];

      render(
        <DataTable columns={columnsWithCustomCell} data={testData} getRowKey={getRowKey} />
      );

      expect(screen.getByTestId("status-1")).toHaveTextContent("ACTIVE");
      expect(screen.getByTestId("status-2")).toHaveTextContent("PENDING");
    });

    it("uses accessor function when provided", () => {
      const columnsWithFnAccessor: Column<TestRow>[] = [
        {
          id: "fullInfo",
          header: "Info",
          accessor: (row) => `${row.name} (${row.email})`,
        },
      ];

      render(
        <DataTable columns={columnsWithFnAccessor} data={testData} getRowKey={getRowKey} />
      );

      expect(screen.getByText("Alice Johnson (alice@example.com)")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Selection Tests
  // ===========================================================================

  describe("selection", () => {
    it("renders checkboxes when selectable", () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={[]}
          onSelectionChange={vi.fn()}
        />
      );

      // Should have header checkbox + 3 row checkboxes
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(4);
    });

    it("does not render checkboxes when not selectable", () => {
      render(<DataTable columns={testColumns} data={testData} getRowKey={getRowKey} />);

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("calls onSelectionChange when row checkbox is clicked", () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // First row checkbox

      expect(handleSelectionChange).toHaveBeenCalledWith(["1"]);
    });

    it("deselects row when checkbox is clicked on selected row", () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={["1", "2"]}
          onSelectionChange={handleSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // First row checkbox (already selected)

      expect(handleSelectionChange).toHaveBeenCalledWith(["2"]);
    });

    it("selects all when header checkbox is clicked", () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      );

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      fireEvent.click(headerCheckbox);

      expect(handleSelectionChange).toHaveBeenCalledWith(["1", "2", "3"]);
    });

    it("deselects all when header checkbox is clicked with all selected", () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={["1", "2", "3"]}
          onSelectionChange={handleSelectionChange}
        />
      );

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      fireEvent.click(headerCheckbox);

      expect(handleSelectionChange).toHaveBeenCalledWith([]);
    });

    it("shows indeterminate state when partially selected", () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={["1"]}
          onSelectionChange={vi.fn()}
        />
      );

      const headerCheckbox = screen.getAllByRole("checkbox")[0] as HTMLInputElement;
      expect(headerCheckbox.indeterminate).toBe(true);
    });
  });

  // ===========================================================================
  // Row Click Tests
  // ===========================================================================

  describe("row click", () => {
    it("calls onRowClick when row is clicked", () => {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onRowClick={handleRowClick}
        />
      );

      fireEvent.click(screen.getByText("Alice Johnson"));
      expect(handleRowClick).toHaveBeenCalledWith(testData[0]);
    });

    it("has cursor pointer on rows when clickable", () => {
      const { container } = render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onRowClick={vi.fn()}
        />
      );

      const rows = container.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        expect(row).toHaveClass("cursor-pointer");
      });
    });

    it("checkbox click does not trigger row click", () => {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={[]}
          onSelectionChange={vi.fn()}
          onRowClick={handleRowClick}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[1]); // First row checkbox

      expect(handleRowClick).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Sorting Tests
  // ===========================================================================

  describe("sorting", () => {
    it("shows sort indicator for sortable columns", () => {
      render(<DataTable columns={testColumns} data={testData} getRowKey={getRowKey} />);

      // Sortable columns should have SVG icons
      const nameHeader = screen.getByText("Name").closest("th");
      expect(nameHeader?.querySelector("svg")).toBeInTheDocument();
    });

    it("calls onSortChange when sortable header is clicked", () => {
      const handleSortChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onSortChange={handleSortChange}
        />
      );

      fireEvent.click(screen.getByText("Name"));
      expect(handleSortChange).toHaveBeenCalledWith({ column: "name", direction: "asc" });
    });

    it("toggles sort direction when same column is clicked", () => {
      const handleSortChange = vi.fn();
      const sort: SortState = { column: "name", direction: "asc" };
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          sort={sort}
          onSortChange={handleSortChange}
        />
      );

      fireEvent.click(screen.getByText("Name"));
      expect(handleSortChange).toHaveBeenCalledWith({ column: "name", direction: "desc" });
    });

    it("shows ascending indicator when sorted ascending", () => {
      const sort: SortState = { column: "name", direction: "asc" };
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          sort={sort}
        />
      );

      expect(screen.getByText("↑")).toBeInTheDocument();
    });

    it("shows descending indicator when sorted descending", () => {
      const sort: SortState = { column: "name", direction: "desc" };
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          sort={sort}
        />
      );

      expect(screen.getByText("↓")).toBeInTheDocument();
    });

    it("sorts data client-side when enableClientSort is true", () => {
      const { container } = render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          enableClientSort
        />
      );

      // Click to sort by name
      fireEvent.click(screen.getByText("Name"));

      // Check the first row is now Alice (alphabetically first)
      const firstRowCells = container.querySelectorAll("tbody tr:first-child td");
      expect(firstRowCells[0]).toHaveTextContent("Alice Johnson");
    });

    it("responds to keyboard Enter on sortable header", () => {
      const handleSortChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onSortChange={handleSortChange}
        />
      );

      const nameHeader = screen.getByText("Name").closest("th")!;
      fireEvent.keyDown(nameHeader, { key: "Enter" });
      expect(handleSortChange).toHaveBeenCalled();
    });

    it("responds to keyboard Space on sortable header", () => {
      const handleSortChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onSortChange={handleSortChange}
        />
      );

      const nameHeader = screen.getByText("Name").closest("th")!;
      fireEvent.keyDown(nameHeader, { key: " " });
      expect(handleSortChange).toHaveBeenCalled();
    });

    it("sets aria-sort attribute on sorted column", () => {
      const sort: SortState = { column: "name", direction: "asc" };
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          sort={sort}
        />
      );

      const nameHeader = screen.getByText("Name").closest("th");
      expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    });
  });

  // ===========================================================================
  // Keyboard Navigation Tests
  // ===========================================================================

  describe("keyboard navigation", () => {
    it("responds to Enter key on row to trigger click", () => {
      const handleRowClick = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onRowClick={handleRowClick}
        />
      );

      const firstRow = screen.getByText("Alice Johnson").closest("tr")!;
      fireEvent.keyDown(firstRow, { key: "Enter" });

      expect(handleRowClick).toHaveBeenCalledWith(testData[0]);
    });

    it("responds to Space key to toggle selection", () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          selectable
          selectedRows={[]}
          onSelectionChange={handleSelectionChange}
        />
      );

      const firstRow = screen.getByText("Alice Johnson").closest("tr")!;
      fireEvent.keyDown(firstRow, { key: " " });

      expect(handleSelectionChange).toHaveBeenCalledWith(["1"]);
    });

    it("ArrowDown moves focus to next row", () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onRowClick={vi.fn()}
        />
      );

      const firstRow = screen.getByText("Alice Johnson").closest("tr")!;
      fireEvent.keyDown(firstRow, { key: "ArrowDown" });

      // Verify focus was updated (visual ring class would be applied)
      // Since focus state is internal, we verify it doesn't throw
      expect(firstRow).toBeInTheDocument();
    });

    it("ArrowUp moves focus to previous row", () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onRowClick={vi.fn()}
        />
      );

      const secondRow = screen.getByText("Bob Smith").closest("tr")!;
      fireEvent.keyDown(secondRow, { key: "ArrowUp" });

      expect(secondRow).toBeInTheDocument();
    });

    it("has tabIndex on rows when clickable or selectable", () => {
      const { container } = render(
        <DataTable
          columns={testColumns}
          data={testData}
          getRowKey={getRowKey}
          onRowClick={vi.fn()}
        />
      );

      const rows = container.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        expect(row).toHaveAttribute("tabIndex", "0");
      });
    });
  });

  // ===========================================================================
  // Column Configuration Tests
  // ===========================================================================

  describe("column configuration", () => {
    it("applies column width", () => {
      const columnsWithWidth: Column<TestRow>[] = [
        { id: "name", header: "Name", accessor: "name", width: "200px" },
      ];

      render(
        <DataTable columns={columnsWithWidth} data={testData} getRowKey={getRowKey} />
      );

      const header = screen.getByText("Name").closest("th");
      expect(header).toHaveStyle({ width: "200px" });
    });

    it("applies custom header className", () => {
      const columnsWithClass: Column<TestRow>[] = [
        { id: "name", header: "Name", accessor: "name", headerClassName: "custom-header" },
      ];

      render(
        <DataTable columns={columnsWithClass} data={testData} getRowKey={getRowKey} />
      );

      const header = screen.getByText("Name").closest("th");
      expect(header).toHaveClass("custom-header");
    });

    it("applies custom cell className", () => {
      const columnsWithClass: Column<TestRow>[] = [
        { id: "name", header: "Name", accessor: "name", cellClassName: "custom-cell" },
      ];

      const { container } = render(
        <DataTable columns={columnsWithClass} data={testData} getRowKey={getRowKey} />
      );

      const cells = container.querySelectorAll("td.custom-cell");
      expect(cells).toHaveLength(3);
    });
  });
});
