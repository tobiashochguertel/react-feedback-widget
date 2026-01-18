import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Bug,
  Lightbulb,
  HelpCircle,
  Wrench,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../stores/auth";
import { cn } from "../lib/utils";

interface FeedbackItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface FeedbackListResponse {
  items: FeedbackItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  feature: Lightbulb,
  question: HelpCircle,
  improvement: Wrench,
  other: MessageCircle,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  archived: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<string, string> = {
  low: "text-gray-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-red-500",
};

/**
 * Feedback list page with filtering and pagination
 */
export function FeedbackListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const apiKey = useAuthStore((state) => state.apiKey);
  const navigate = useNavigate();

  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";

  const { data, isLoading } = useQuery<FeedbackListResponse>({
    queryKey: ["feedback-list", page, status, type, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/v1/feedback?${params}`, {
        headers: {
          "X-API-Key": apiKey || "",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      prev.set("search", searchQuery);
      prev.set("page", "1");
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      prev.set("page", "1");
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground mt-1">
          Manage and review user feedback
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <select
            value={type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
          >
            <option value="">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="improvement">Improvement</option>
            <option value="question">Question</option>
          </select>
        </div>
      </div>

      {/* Feedback list */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading feedback...
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No feedback found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data?.items.map((item) => {
              const TypeIcon = typeIcons[item.type] || MessageCircle;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/feedback/${item.id}`)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <TypeIcon
                        className={cn(
                          "w-5 h-5",
                          priorityColors[item.priority] || "text-gray-500"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {item.title}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            statusColors[item.status] || "bg-gray-100 text-gray-800"
                          )}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(item.createdAt).toLocaleDateString()} •{" "}
                        {item.type}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages} •{" "}
              {data.pagination.total} items
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= data.pagination.totalPages}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
