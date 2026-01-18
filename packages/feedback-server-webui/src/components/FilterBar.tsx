/**
 * @file FilterBar Component
 *
 * A reusable filter bar component with multiple filter types including
 * select dropdowns, date range picker, and active filter chips.
 *
 * @example
 * <FilterBar
 *   filters={filters}
 *   onChange={setFilters}
 *   onReset={() => setFilters({})}
 * />
 */

import { useState, useCallback } from "react";
import type { FeedbackStatus, FeedbackType, FeedbackPriority } from "@/types/api";

/** Filter values structure */
export interface FilterValues {
  status?: FeedbackStatus | "";
  type?: FeedbackType | "";
  priority?: FeedbackPriority | "";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/** Props for FilterBar component */
export interface FilterBarProps {
  /** Current filter values */
  filters: FilterValues;
  /** Callback when filters change */
  onChange: (filters: FilterValues) => void;
  /** Callback to reset all filters */
  onReset?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Show date range picker */
  showDateRange?: boolean;
}

/** Status options */
const STATUS_OPTIONS: { value: FeedbackStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

/** Type options */
const TYPE_OPTIONS: { value: FeedbackType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "improvement", label: "Improvement" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
];

/** Priority options */
const PRIORITY_OPTIONS: { value: FeedbackPriority | ""; label: string }[] = [
  { value: "", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/**
 * FilterChip - A chip showing an active filter with a remove button
 */
function FilterChip({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-200">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  );
}

/**
 * Get display text for a value
 */
function getDisplayText(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * FilterBar - A filter bar with select dropdowns, date range, and active filter chips
 */
export function FilterBar({
  filters,
  onChange,
  onReset,
  className = "",
  showSearch = true,
  showDateRange = true,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      // Debounce the actual filter update
      const timeoutId = setTimeout(() => {
        onChange({ ...filters, search: value || "" });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onChange]
  );

  // Handle select changes
  const handleSelectChange = useCallback(
    (field: keyof FilterValues) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onChange({ ...filters, [field]: value || undefined });
    },
    [filters, onChange]
  );

  // Handle date changes
  const handleDateChange = useCallback(
    (field: "dateFrom" | "dateTo") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange({ ...filters, [field]: value || undefined });
    },
    [filters, onChange]
  );

  // Remove a specific filter
  const handleRemoveFilter = useCallback(
    (field: keyof FilterValues) => () => {
      const newFilters = { ...filters };
      delete newFilters[field];
      if (field === "search") {
        setSearchValue("");
      }
      onChange(newFilters);
    },
    [filters, onChange]
  );

  // Get active filters for chips
  const activeFilters: { field: keyof FilterValues; label: string; value: string }[] = [];
  if (filters.status) {
    activeFilters.push({ field: "status", label: "Status", value: getDisplayText(filters.status) });
  }
  if (filters.type) {
    activeFilters.push({ field: "type", label: "Type", value: getDisplayText(filters.type) });
  }
  if (filters.priority) {
    activeFilters.push({ field: "priority", label: "Priority", value: getDisplayText(filters.priority) });
  }
  if (filters.dateFrom) {
    activeFilters.push({ field: "dateFrom", label: "From", value: filters.dateFrom });
  }
  if (filters.dateTo) {
    activeFilters.push({ field: "dateTo", label: "To", value: filters.dateTo });
  }
  if (filters.search) {
    activeFilters.push({ field: "search", label: "Search", value: filters.search });
  }

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        {showSearch && (
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
        )}

        {/* Status Select */}
        <select
          aria-label="Filter by status"
          value={filters.status || ""}
          onChange={handleSelectChange("status")}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Type Select */}
        <select
          aria-label="Filter by type"
          value={filters.type || ""}
          onChange={handleSelectChange("type")}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Priority Select */}
        <select
          aria-label="Filter by priority"
          value={filters.priority || ""}
          onChange={handleSelectChange("priority")}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Date Range */}
        {showDateRange && (
          <>
            <div className="flex items-center gap-2">
              <label htmlFor="dateFrom" className="text-sm text-gray-500 dark:text-gray-400">
                From:
              </label>
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ""}
                onChange={handleDateChange("dateFrom")}
                className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="dateTo" className="text-sm text-gray-500 dark:text-gray-400">
                To:
              </label>
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo || ""}
                onChange={handleDateChange("dateTo")}
                className="px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </>
        )}

        {/* Reset Button */}
        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
          {activeFilters.map((filter) => (
            <FilterChip
              key={filter.field}
              label={filter.label}
              value={filter.value}
              onRemove={handleRemoveFilter(filter.field)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
