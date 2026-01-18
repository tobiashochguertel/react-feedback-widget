/**
 * @file NetworkRequestViewer Component
 *
 * Displays network request logs with status indicators, timing, and expandable details.
 * Supports filtering by status, method, and search.
 *
 * @example
 * <NetworkRequestViewer
 *   requests={networkLogs}
 *   onRequestClick={(req) => console.log(req)}
 * />
 */

import { useState, useMemo, useCallback } from "react";

/** HTTP method */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/** Request status category */
export type StatusCategory = "success" | "redirect" | "client-error" | "server-error" | "pending";

/** Network request entry */
export interface NetworkRequest {
  /** Unique request identifier */
  id: string;
  /** HTTP method */
  method: HttpMethod;
  /** Request URL */
  url: string;
  /** HTTP status code */
  status?: number;
  /** Status text */
  statusText?: string;
  /** Request start timestamp */
  startTime: string | Date;
  /** Request duration in milliseconds */
  duration?: number;
  /** Request size in bytes */
  requestSize?: number;
  /** Response size in bytes */
  responseSize?: number;
  /** Request headers */
  requestHeaders?: Record<string, string>;
  /** Response headers */
  responseHeaders?: Record<string, string>;
  /** Request body */
  requestBody?: string;
  /** Response body */
  responseBody?: string;
  /** Content type */
  contentType?: string;
  /** Whether the request is pending */
  pending?: boolean;
  /** Whether the request failed */
  failed?: boolean;
  /** Error message */
  error?: string;
}

/** Props for NetworkRequestViewer component */
export interface NetworkRequestViewerProps {
  /** Array of network request entries */
  requests: NetworkRequest[];
  /** Callback when a request is clicked */
  onRequestClick?: (request: NetworkRequest) => void;
  /** Max height for the viewer */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
}

/** Method color configuration */
const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
  POST: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  PUT: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
  PATCH: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30",
  DELETE: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
  HEAD: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  OPTIONS: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800",
};

/**
 * Get status category from status code
 */
function getStatusCategory(status?: number, pending?: boolean, failed?: boolean): StatusCategory {
  if (pending) return "pending";
  if (failed || !status) return "server-error";
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "redirect";
  if (status >= 400 && status < 500) return "client-error";
  return "server-error";
}

/** Status color configuration */
const STATUS_COLORS: Record<StatusCategory, string> = {
  success: "text-green-600 dark:text-green-400",
  redirect: "text-blue-600 dark:text-blue-400",
  "client-error": "text-yellow-600 dark:text-yellow-400",
  "server-error": "text-red-600 dark:text-red-400",
  pending: "text-gray-400 dark:text-gray-500",
};

/**
 * Format bytes for display
 */
function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration for display
 */
function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null) return "-";
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Extract pathname from URL
 */
function getPathname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
}

/**
 * Method badge component
 */
function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-mono font-medium rounded ${METHOD_COLORS[method]}`}>
      {method}
    </span>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status, pending, failed }: { status?: number | undefined; pending?: boolean | undefined; failed?: boolean | undefined }) {
  const category = getStatusCategory(status, pending, failed);
  const color = STATUS_COLORS[category];

  if (pending) {
    return (
      <span className={`flex items-center gap-1 ${color}`}>
        <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
        <span className="text-xs">Pending</span>
      </span>
    );
  }

  if (failed && !status) {
    return <span className={`text-xs font-medium ${color}`}>Failed</span>;
  }

  return <span className={`text-xs font-mono font-medium ${color}`}>{status}</span>;
}

/**
 * Duration bar visualization
 */
function DurationBar({ duration, maxDuration }: { duration?: number | undefined; maxDuration: number }) {
  if (duration === undefined) return null;

  const percentage = Math.min((duration / maxDuration) * 100, 100);
  const color =
    duration < 100
      ? "bg-green-500"
      : duration < 500
        ? "bg-yellow-500"
        : duration < 1000
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
    </div>
  );
}

/**
 * Request details panel
 */
function RequestDetails({ request }: { request: NetworkRequest }) {
  const [activeTab, setActiveTab] = useState<"headers" | "request" | "response">("headers");

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(["headers", "request", "response"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-3 max-h-64 overflow-auto">
        {activeTab === "headers" && (
          <div className="space-y-4">
            {/* Request headers */}
            {request.requestHeaders && Object.keys(request.requestHeaders).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Request Headers
                </div>
                <div className="space-y-1">
                  {Object.entries(request.requestHeaders).map(([key, value]) => (
                    <div key={key} className="flex text-xs font-mono">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">{key}:</span>
                      <span className="text-gray-700 dark:text-gray-300 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response headers */}
            {request.responseHeaders && Object.keys(request.responseHeaders).length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Response Headers
                </div>
                <div className="space-y-1">
                  {Object.entries(request.responseHeaders).map(([key, value]) => (
                    <div key={key} className="flex text-xs font-mono">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">{key}:</span>
                      <span className="text-gray-700 dark:text-gray-300 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!request.requestHeaders && !request.responseHeaders && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No headers available</div>
            )}
          </div>
        )}

        {activeTab === "request" && (
          <div>
            {request.requestBody ? (
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                {request.requestBody}
              </pre>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No request body</div>
            )}
          </div>
        )}

        {activeTab === "response" && (
          <div>
            {request.error ? (
              <div className="text-sm text-red-600 dark:text-red-400">{request.error}</div>
            ) : request.responseBody ? (
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                {request.responseBody}
              </pre>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No response body</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Single request row component
 */
function RequestRow({
  request,
  maxDuration,
  isExpanded,
  onToggle,
  onClick,
}: {
  request: NetworkRequest;
  maxDuration: number;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: ((request: NetworkRequest) => void) | undefined;
}) {
  const category = getStatusCategory(request.status, request.pending, request.failed);
  const bgColor =
    category === "client-error" || category === "server-error"
      ? "bg-red-50 dark:bg-red-900/10"
      : "";

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${bgColor}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
        onClick={() => onClick?.(request)}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Status */}
        <div className="flex-shrink-0 w-12">
          <StatusBadge status={request.status} pending={request.pending} failed={request.failed} />
        </div>

        {/* Method */}
        <div className="flex-shrink-0">
          <MethodBadge method={request.method} />
        </div>

        {/* URL */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 dark:text-gray-100 truncate font-mono">
            {getPathname(request.url)}
          </div>
          {request.failed && request.error && (
            <div className="text-xs text-red-500 dark:text-red-400 truncate">{request.error}</div>
          )}
        </div>

        {/* Content type */}
        <div className="flex-shrink-0 w-24 text-xs text-gray-500 dark:text-gray-400 truncate">
          {request.contentType?.split(";")[0] || "-"}
        </div>

        {/* Size */}
        <div className="flex-shrink-0 w-16 text-xs text-gray-500 dark:text-gray-400 text-right font-mono">
          {formatBytes(request.responseSize)}
        </div>

        {/* Duration */}
        <div className="flex-shrink-0 w-32 flex items-center gap-2">
          <DurationBar duration={request.duration} maxDuration={maxDuration} />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono w-16 text-right">
            {formatDuration(request.duration)}
          </span>
        </div>

        {/* Time */}
        <div className="flex-shrink-0 w-20 text-xs text-gray-400 dark:text-gray-500 text-right">
          {formatTime(request.startTime)}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && <RequestDetails request={request} />}
    </div>
  );
}

/**
 * NetworkRequestViewer - Display network requests with filtering and details
 */
export function NetworkRequestViewer({
  requests,
  onRequestClick,
  maxHeight = "400px",
  className = "",
}: NetworkRequestViewerProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<HttpMethod[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusCategory[]>([]);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  // Calculate max duration for bar visualization
  const maxDuration = useMemo(() => {
    const durations = requests.map((r) => r.duration || 0);
    return Math.max(...durations, 1000); // At least 1 second scale
  }, [requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Method filter
      if (methodFilter.length > 0 && !methodFilter.includes(req.method)) {
        return false;
      }

      // Status filter
      if (statusFilter.length > 0) {
        const category = getStatusCategory(req.status, req.pending, req.failed);
        if (!statusFilter.includes(category)) {
          return false;
        }
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const urlMatch = req.url.toLowerCase().includes(searchLower);
        const statusMatch = String(req.status || "").includes(search);

        if (!urlMatch && !statusMatch) {
          return false;
        }
      }

      return true;
    });
  }, [requests, methodFilter, statusFilter, search]);

  // Toggle method filter
  const toggleMethod = useCallback((method: HttpMethod) => {
    setMethodFilter((prev) => {
      if (prev.includes(method)) {
        return prev.filter((m) => m !== method);
      }
      return [...prev, method];
    });
  }, []);

  // Toggle status filter
  const toggleStatus = useCallback((status: StatusCategory) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  }, []);

  // Toggle request expansion
  const toggleExpand = useCallback((requestId: string) => {
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  }, []);

  // Stats
  const stats = useMemo(() => {
    const success = requests.filter((r) => getStatusCategory(r.status, r.pending, r.failed) === "success").length;
    const errors = requests.filter((r) => ["client-error", "server-error"].includes(getStatusCategory(r.status, r.pending, r.failed))).length;
    const pending = requests.filter((r) => r.pending).length;
    return { success, errors, pending, total: requests.length };
  }, [requests]);

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter requests..."
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

        {/* Method filters */}
        <div className="flex gap-1">
          {(["GET", "POST", "PUT", "DELETE"] as HttpMethod[]).map((method) => (
            <button
              key={method}
              onClick={() => toggleMethod(method)}
              className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors ${methodFilter.includes(method)
                  ? METHOD_COLORS[method]
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              {method}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex gap-1">
          <button
            onClick={() => toggleStatus("success")}
            className={`px-2 py-1 text-xs font-medium rounded ${statusFilter.includes("success")
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
          >
            ✓ 2xx
          </button>
          <button
            onClick={() => toggleStatus("client-error")}
            className={`px-2 py-1 text-xs font-medium rounded ${statusFilter.includes("client-error")
                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
          >
            ⚠ 4xx
          </button>
          <button
            onClick={() => toggleStatus("server-error")}
            className={`px-2 py-1 text-xs font-medium rounded ${statusFilter.includes("server-error")
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
          >
            ✕ 5xx
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 ml-auto text-xs">
          <span className="text-green-600 dark:text-green-400">{stats.success} success</span>
          <span className="text-red-600 dark:text-red-400">{stats.errors} errors</span>
          {stats.pending > 0 && (
            <span className="text-gray-500 dark:text-gray-400">{stats.pending} pending</span>
          )}
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        <div className="w-6" /> {/* Expand toggle space */}
        <div className="w-12">Status</div>
        <div className="w-14">Method</div>
        <div className="flex-1">URL</div>
        <div className="w-24">Type</div>
        <div className="w-16 text-right">Size</div>
        <div className="w-32">Duration</div>
        <div className="w-20 text-right">Time</div>
      </div>

      {/* Requests list */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            {requests.length === 0 ? "No network requests captured" : "No requests match your filters"}
          </div>
        ) : (
          filteredRequests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              maxDuration={maxDuration}
              isExpanded={expandedRequests.has(request.id)}
              onToggle={() => toggleExpand(request.id)}
              onClick={onRequestClick}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        Showing {filteredRequests.length} of {requests.length} requests
      </div>
    </div>
  );
}

export default NetworkRequestViewer;
