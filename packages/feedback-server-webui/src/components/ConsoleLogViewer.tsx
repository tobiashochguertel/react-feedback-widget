/**
 * @file ConsoleLogViewer Component
 *
 * Displays console log entries with icons, syntax highlighting, and filtering.
 * Supports search, level filtering, and expandable details.
 *
 * @example
 * <ConsoleLogViewer
 *   logs={consoleLogs}
 *   onLogClick={(log) => console.log(log)}
 * />
 */

import { useState, useMemo, useCallback } from "react";

/** Console log level */
export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

/** Console log entry */
export interface ConsoleLog {
  /** Unique log identifier */
  id: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: string | Date;
  /** Additional arguments */
  args?: unknown[];
  /** Stack trace (for errors) */
  stack?: string;
  /** Source file */
  source?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
}

/** Props for ConsoleLogViewer component */
export interface ConsoleLogViewerProps {
  /** Array of console log entries */
  logs: ConsoleLog[];
  /** Callback when a log entry is clicked */
  onLogClick?: (log: ConsoleLog) => void;
  /** Initial level filter */
  initialLevelFilter?: LogLevel[];
  /** Enable search */
  searchable?: boolean;
  /** Max height for the viewer */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
}

/** Level configuration */
const LEVEL_CONFIG: Record<LogLevel, { icon: string; bg: string; text: string; label: string }> = {
  log: {
    icon: "📝",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    label: "Log",
  },
  info: {
    icon: "ℹ️",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    label: "Info",
  },
  warn: {
    icon: "⚠️",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-300",
    label: "Warn",
  },
  error: {
    icon: "❌",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    label: "Error",
  },
  debug: {
    icon: "🐛",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    label: "Debug",
  },
};

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${timeStr}.${ms}`;
}

/**
 * Format value for display with syntax highlighting
 */
function formatValue(value: unknown, depth = 0): React.ReactNode {
  if (depth > 3) return <span className="text-gray-400">...</span>;

  if (value === null) {
    return <span className="text-purple-500 dark:text-purple-400">null</span>;
  }

  if (value === undefined) {
    return <span className="text-gray-400">undefined</span>;
  }

  if (typeof value === "string") {
    return <span className="text-green-600 dark:text-green-400">&quot;{value}&quot;</span>;
  }

  if (typeof value === "number") {
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500">[]</span>;
    }
    return (
      <span>
        <span className="text-gray-500">[</span>
        {value.slice(0, 5).map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="text-gray-500">, </span>}
            {formatValue(item, depth + 1)}
          </span>
        ))}
        {value.length > 5 && <span className="text-gray-400">...+{value.length - 5} more</span>}
        <span className="text-gray-500">]</span>
      </span>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span className="text-gray-500">{"{}"}</span>;
    }
    return (
      <span>
        <span className="text-gray-500">{"{"}</span>
        {entries.slice(0, 3).map(([key, val], i) => (
          <span key={key}>
            {i > 0 && <span className="text-gray-500">, </span>}
            <span className="text-orange-600 dark:text-orange-400">{key}</span>
            <span className="text-gray-500">: </span>
            {formatValue(val, depth + 1)}
          </span>
        ))}
        {entries.length > 3 && <span className="text-gray-400">...+{entries.length - 3} more</span>}
        <span className="text-gray-500">{"}"}</span>
      </span>
    );
  }

  return <span className="text-gray-600">{String(value)}</span>;
}

/**
 * Level filter button component
 */
function LevelFilterButton({
  level,
  active,
  count,
  onClick,
}: {
  level: LogLevel;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const config = LEVEL_CONFIG[level];

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? `${config.bg} ${config.text} ring-1 ring-current`
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      <span className="ml-1 px-1.5 rounded-full bg-black/10 dark:bg-white/10">{count}</span>
    </button>
  );
}

/**
 * Single log entry component
 */
function LogEntry({
  log,
  onClick,
  isExpanded,
  onToggleExpand,
}: {
  log: ConsoleLog;
  onClick?: ((log: ConsoleLog) => void) | undefined;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const config = LEVEL_CONFIG[log.level];
  const hasDetails = log.stack || log.args?.length || log.source;

  return (
    <div
      className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${config.bg}`}
    >
      <div
        className={`flex items-start gap-2 px-3 py-2 ${onClick ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""}`}
        onClick={() => onClick?.(log)}
      >
        {/* Level icon */}
        <span className="flex-shrink-0 text-sm">{config.icon}</span>

        {/* Timestamp */}
        <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono">
          {formatTimestamp(log.timestamp)}
        </span>

        {/* Message */}
        <div className={`flex-1 font-mono text-sm ${config.text} break-all`}>
          {log.message}
          {log.args && log.args.length > 0 && (
            <span className="ml-2">
              {log.args.map((arg, i) => (
                <span key={i} className="mr-2">
                  {formatValue(arg)}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* Source location */}
        {log.source && (
          <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 font-mono">
            {log.source}
            {log.line && `:${log.line}`}
            {log.column && `:${log.column}`}
          </span>
        )}

        {/* Expand button */}
        {hasDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="px-3 pb-2 pl-9">
          {/* Stack trace */}
          {log.stack && (
            <pre className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {log.stack}
            </pre>
          )}

          {/* Arguments */}
          {log.args && log.args.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Arguments:</div>
              <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                {JSON.stringify(log.args, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ConsoleLogViewer - Display console logs with filtering and search
 */
export function ConsoleLogViewer({
  logs,
  onLogClick,
  initialLevelFilter,
  searchable = true,
  maxHeight = "400px",
  className = "",
}: ConsoleLogViewerProps) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel[]>(
    initialLevelFilter || ["log", "info", "warn", "error", "debug"]
  );
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Count logs by level
  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = {
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
    };
    logs.forEach((log) => {
      counts[log.level]++;
    });
    return counts;
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Level filter
      if (!levelFilter.includes(log.level)) {
        return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const messageMatch = log.message.toLowerCase().includes(searchLower);
        const sourceMatch = log.source?.toLowerCase().includes(searchLower);
        const stackMatch = log.stack?.toLowerCase().includes(searchLower);
        const argsMatch = JSON.stringify(log.args || []).toLowerCase().includes(searchLower);

        if (!messageMatch && !sourceMatch && !stackMatch && !argsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [logs, levelFilter, search]);

  // Toggle level filter
  const toggleLevel = useCallback((level: LogLevel) => {
    setLevelFilter((prev) => {
      if (prev.includes(level)) {
        return prev.filter((l) => l !== level);
      }
      return [...prev, level];
    });
  }, []);

  // Toggle log expansion
  const toggleExpand = useCallback((logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    setExpandedLogs(new Set(filteredLogs.map((log) => log.id)));
  }, [filteredLogs]);

  const collapseAll = useCallback(() => {
    setExpandedLogs(new Set());
  }, []);

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        {/* Search */}
        {searchable && (
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}

        {/* Level filters */}
        <div className="flex gap-1">
          {(Object.keys(LEVEL_CONFIG) as LogLevel[]).map((level) => (
            <LevelFilterButton
              key={level}
              level={level}
              active={levelFilter.includes(level)}
              count={levelCounts[level]}
              onClick={() => toggleLevel(level)}
            />
          ))}
        </div>

        {/* Expand/Collapse all */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            {logs.length === 0 ? "No console logs captured" : "No logs match your filters"}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              onClick={onLogClick}
              isExpanded={expandedLogs.has(log.id)}
              onToggleExpand={() => toggleExpand(log.id)}
            />
          ))
        )}
      </div>

      {/* Footer with count */}
      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Showing {filteredLogs.length} of {logs.length} log entries
      </div>
    </div>
  );
}

export default ConsoleLogViewer;
