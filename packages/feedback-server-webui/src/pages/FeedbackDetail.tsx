import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bug,
  Lightbulb,
  HelpCircle,
  Wrench,
  MessageCircle,
  Clock,
  User,
  Globe,
  Monitor,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../stores/auth";
import { cn } from "../lib/utils";

interface FeedbackDetail {
  id: string;
  projectId: string;
  sessionId: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  tags?: string[];
  environment?: {
    userAgent?: string;
    browser?: string;
    os?: string;
    url?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  feature: Lightbulb,
  question: HelpCircle,
  improvement: Wrench,
  other: MessageCircle,
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

/**
 * Feedback detail page with edit capabilities
 */
export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiKey = useAuthStore((state) => state.apiKey);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: feedback, isLoading } = useQuery<FeedbackDetail>({
    queryKey: ["feedback", id],
    queryFn: async () => {
      const response = await fetch(`/api/v1/feedback/${id}`, {
        headers: {
          "X-API-Key": apiKey || "",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Initialize form state when data loads
  if (feedback && !status && !priority) {
    setStatus(feedback.status);
    setPriority(feedback.priority);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: { status?: string; priority?: string }) => {
      const response = await fetch(`/api/v1/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update feedback");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback", id] });
      queryClient.invalidateQueries({ queryKey: ["feedback-list"] });
      setHasChanges(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/v1/feedback/${id}`, {
        method: "DELETE",
        headers: {
          "X-API-Key": apiKey || "",
        },
      });
      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to delete feedback");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-list"] });
      navigate("/feedback");
    },
  });

  const handleSave = () => {
    const updates: { status?: string; priority?: string } = {};
    if (status !== feedback?.status) updates.status = status;
    if (priority !== feedback?.priority) updates.priority = priority;
    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      deleteMutation.mutate();
    }
  };

  const TypeIcon = feedback ? typeIcons[feedback.type] || MessageCircle : MessageCircle;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Feedback not found</p>
        <button
          onClick={() => navigate("/feedback")}
          className="mt-4 text-primary hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/feedback")}
          className="p-2 rounded-lg hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <TypeIcon className="w-6 h-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">
              {feedback.title}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ID: {feedback.id}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Description
            </h2>
            <p className="text-foreground whitespace-pre-wrap">
              {feedback.description || "No description provided"}
            </p>
          </div>

          {/* Environment */}
          {feedback.environment && (
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Environment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedback.environment.browser && (
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Browser</p>
                      <p className="text-foreground">{feedback.environment.browser}</p>
                    </div>
                  </div>
                )}
                {feedback.environment.os && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">OS</p>
                      <p className="text-foreground">{feedback.environment.os}</p>
                    </div>
                  </div>
                )}
                {feedback.environment.url && (
                  <div className="flex items-center gap-3 md:col-span-2">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">URL</p>
                      <p className="text-foreground truncate">
                        {feedback.environment.url}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-foreground mb-4">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-foreground">
                    {new Date(feedback.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="text-foreground">
                    {new Date(feedback.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {feedback.tags && feedback.tags.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h3 className="text-sm font-medium text-foreground mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {feedback.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md bg-muted text-sm text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
