/**
 * @file DataTable Component
 *
 * A reusable data table component with sorting, selection, and custom column renderers.
 * Supports keyboard navigation and accessible row selection.
 *
 * @example
 * <DataTable
 *   columns={columns}
 *   data={feedbacks}
 *   onRowClick={(row) => navigate(`/feedback/${row.id}`)}
 *   selectable
 *   selectedRows={selectedIds}
 *   onSelectionChange={setSelectedIds}
 * />
 */

import { useState, useCallback, useMemo } from "react";

/** Column definition */
export interface Column<T> {
  /** Unique column identifier */
  id: string;
  /** Column header text */
  header: string;
  /** Accessor function to get cell value */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Custom cell renderer */
  cell?: (row: T) => React.ReactNode;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Column alignment */
  align?: "left" | "center" | "right";
  /** Custom header class */
  headerClassName?: string;
  /** Custom cell class */
  cellClassName?: string;
}

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Sort state */
export interface SortState {
  column: string;
  direction: SortDirection;
}

/** Props for DataTable component */
export interface DataTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data rows */
  data: T[];
  /** Key accessor for each row */
  getRowKey: (row: T) => string;
  /** Callback when row is clicked */
  onRowClick?: (row: T) => void;
  /** Enable row selection */
  selectable?: boolean;
  /** Currently selected row keys */
  selectedRows?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (keys: string[]) => void;
  /** External sort state */
  sort?: SortState;
  /** Callback when sort changes */
  onSortChange?: (sort: SortState) => void;
  /** Enable internal sorting */
  enableClientSort?: boolean;
  /** Whether data is loading */
  loading?: boolean;
  /** Message to show when no data */
  emptyMessage?: string;
  /** Additional CSS classes for table */
  className?: string;
}

/**
 * Get cell value from accessor
 */
function getCellValue<T>(row: T, accessor: keyof T | ((row: T) => React.ReactNode)): React.ReactNode {
  if (typeof accessor === "function") {
    return accessor(row);
  }
  return row[accessor] as React.ReactNode;
}

/**
 * Sort icon component
 */
function SortIcon({ direction }: { direction: SortDirection | null }) {
  if (!direction) {
    return (
      <span className="ml-1 text-gray-400">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </span>
    );
  }
  return (
    <span className="ml-1">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

/**
 * Loading skeleton row
 */
function LoadingRow({ columnCount }: { columnCount: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columnCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded dark:bg-gray-700" />
        </td>
      ))}
    </tr>
  );
}

/**
 * DataTable - A reusable data table with sorting, selection, and custom renderers
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sort,
  onSortChange,
  enableClientSort = false,
  loading = false,
  emptyMessage = "No data available",
  className = "",
}: DataTableProps<T>) {
  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // Use external or internal sort
  const currentSort = sort || internalSort;

  // Handle sort click
  const handleSortClick = useCallback(
    (columnId: string) => {
      const newDirection: SortDirection =
        currentSort?.column === columnId && currentSort?.direction === "asc" ? "desc" : "asc";
      const newSort = { column: columnId, direction: newDirection };

      if (onSortChange) {
        onSortChange(newSort);
      } else if (enableClientSort) {
        setInternalSort(newSort);
      }
    },
    [currentSort, onSortChange, enableClientSort]
  );

  // Sort data if client-side sorting is enabled
  const sortedData = useMemo(() => {
    if (!enableClientSort || !internalSort) {
      return data;
    }

    const column = columns.find((c) => c.id === internalSort.column);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = getCellValue(a, column.accessor);
      const bValue = getCellValue(b, column.accessor);

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return internalSort.direction === "asc" ? comparison : -comparison;
    });
  }, [data, internalSort, enableClientSort, columns]);

  // Handle row selection
  const handleRowSelect = useCallback(
    (key: string) => {
      if (!onSelectionChange) return;

      const isSelected = selectedRows.includes(key);
      const newSelection = isSelected
        ? selectedRows.filter((k) => k !== key)
        : [...selectedRows, key];

      onSelectionChange(newSelection);
    },
    [selectedRows, onSelectionChange]
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const allKeys = sortedData.map(getRowKey);
    const allSelected = allKeys.every((key) => selectedRows.includes(key));

    onSelectionChange(allSelected ? [] : allKeys);
  }, [sortedData, selectedRows, onSelectionChange, getRowKey]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: T, index: number) => {
      switch (e.key) {
        case "Enter":
        case " ":
          if (e.key === " " && selectable) {
            e.preventDefault();
            handleRowSelect(getRowKey(row));
          } else if (e.key === "Enter" && onRowClick) {
            onRowClick(row);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedRowIndex(Math.min(index + 1, sortedData.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedRowIndex(Math.max(index - 1, 0));
          break;
      }
    },
    [selectable, onRowClick, handleRowSelect, getRowKey, sortedData.length]
  );

  // Calculate if all are selected
  const allSelected =
    sortedData.length > 0 && sortedData.every((row) => selectedRows.includes(getRowKey(row)));
  const someSelected =
    sortedData.some((row) => selectedRows.includes(getRowKey(row))) && !allSelected;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {/* Selection checkbox column */}
            {selectable && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  aria-label="Select all rows"
                />
              </th>
            )}

            {/* Column headers */}
            {columns.map((column) => {
              const isSorted = currentSort?.column === column.id;
              const sortDirection = isSorted ? currentSort.direction : null;

              return (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-${column.align || "left"} text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 ${column.headerClassName || ""} ${column.sortable ? "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700" : ""}`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSortClick(column.id) : undefined}
                  role={column.sortable ? "button" : undefined}
                  tabIndex={column.sortable ? 0 : undefined}
                  onKeyDown={
                    column.sortable
                      ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSortClick(column.id);
                        }
                      }
                      : undefined
                  }
                  aria-sort={
                    isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {column.header}
                    {column.sortable && <SortIcon direction={sortDirection} />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {/* Loading state */}
          {loading && (
            <>
              <LoadingRow columnCount={columns.length + (selectable ? 1 : 0)} />
              <LoadingRow columnCount={columns.length + (selectable ? 1 : 0)} />
              <LoadingRow columnCount={columns.length + (selectable ? 1 : 0)} />
            </>
          )}

          {/* Empty state */}
          {!loading && sortedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {/* Data rows */}
          {!loading &&
            sortedData.map((row, index) => {
              const key = getRowKey(row);
              const isSelected = selectedRows.includes(key);
              const isFocused = focusedRowIndex === index;

              return (
                <tr
                  key={key}
                  className={`
                    ${onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""}
                    ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                    ${isFocused ? "ring-2 ring-inset ring-blue-500" : ""}
                  `}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={(e) => handleKeyDown(e, row, index)}
                  tabIndex={onRowClick || selectable ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                >
                  {/* Selection checkbox */}
                  {selectable && (
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRowSelect(key)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                        aria-label={`Select row ${key}`}
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-${column.align || "left"} ${column.cellClassName || ""}`}
                    >
                      {column.cell ? column.cell(row) : getCellValue(row, column.accessor)}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
