import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "../stores/auth";
import { cn } from "../lib/utils";

interface FeedbackStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentCount: number;
}

/**
 * Dashboard page with feedback statistics
 */
export function DashboardPage() {
  const apiKey = useAuthStore((state) => state.apiKey);

  const { data: stats, isLoading } = useQuery<FeedbackStats>({
    queryKey: ["feedback-stats"],
    queryFn: async () => {
      const response = await fetch("/api/v1/feedback/stats", {
        headers: {
          "X-API-Key": apiKey || "",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
  });

  const statCards = [
    {
      title: "Total Feedback",
      value: stats?.total || 0,
      icon: MessageSquare,
      color: "bg-blue-500",
    },
    {
      title: "Bugs",
      value: stats?.byType?.bug || 0,
      icon: Bug,
      color: "bg-red-500",
    },
    {
      title: "Feature Requests",
      value: stats?.byType?.feature || 0,
      icon: Lightbulb,
      color: "bg-yellow-500",
    },
    {
      title: "Pending",
      value: stats?.byStatus?.pending || 0,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Resolved",
      value: stats?.byStatus?.resolved || 0,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Critical",
      value: stats?.byType?.critical || 0,
      icon: AlertTriangle,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of feedback submissions
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-card rounded-lg border border-border p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg text-white",
                  card.color
                )}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? "..." : card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity section */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <p className="text-muted-foreground">
          {isLoading
            ? "Loading recent feedback..."
            : `${stats?.recentCount || 0} new feedback items in the last 7 days`}
        </p>
      </div>
    </div>
  );
}
