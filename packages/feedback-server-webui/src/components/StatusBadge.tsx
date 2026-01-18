/**
 * @file StatusBadge Component
 *
 * A reusable badge component for displaying feedback status, type, and priority
 * with color-coded variants and optional icons.
 *
 * @example
 * <StatusBadge variant="status" value="pending" />
 * <StatusBadge variant="type" value="bug" />
 * <StatusBadge variant="priority" value="high" />
 */

import type { FeedbackStatus, FeedbackType, FeedbackPriority } from "@/types/api";

/** Props for StatusBadge component */
export interface StatusBadgeProps {
  /** The type of badge to display */
  variant: "status" | "type" | "priority";
  /** The value to display */
  value: FeedbackStatus | FeedbackType | FeedbackPriority;
  /** Whether the badge is clickable */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show icon alongside text */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/** Status color mappings */
const STATUS_COLORS: Record<FeedbackStatus, { bg: string; text: string; border: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  resolved: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  closed: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
  archived: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
};

/** Type color mappings */
const TYPE_COLORS: Record<FeedbackType, { bg: string; text: string; border: string }> = {
  bug: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  feature: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  improvement: { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-300" },
  question: { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-300" },
  other: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
};

/** Priority color mappings */
const PRIORITY_COLORS: Record<FeedbackPriority, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
  medium: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  high: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
  critical: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
};

/** Status icons */
const STATUS_ICONS: Record<FeedbackStatus, string> = {
  pending: "⏳",
  in_progress: "🔄",
  resolved: "✅",
  closed: "🔒",
  archived: "📦",
};

/** Type icons */
const TYPE_ICONS: Record<FeedbackType, string> = {
  bug: "🐛",
  feature: "✨",
  improvement: "🔧",
  question: "❓",
  other: "📋",
};

/** Priority icons */
const PRIORITY_ICONS: Record<FeedbackPriority, string> = {
  low: "⬇️",
  medium: "➡️",
  high: "⬆️",
  critical: "🔥",
};

/** Size classes */
const SIZE_CLASSES = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
};

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
 * StatusBadge - A color-coded badge for feedback status, type, or priority
 */
export function StatusBadge({
  variant,
  value,
  onClick,
  className = "",
  showIcon = false,
  size = "md",
}: StatusBadgeProps) {
  // Get colors based on variant
  let colors: { bg: string; text: string; border: string };
  let icon: string | undefined;

  switch (variant) {
    case "status":
      colors = STATUS_COLORS[value as FeedbackStatus] || STATUS_COLORS.pending;
      icon = STATUS_ICONS[value as FeedbackStatus];
      break;
    case "type":
      colors = TYPE_COLORS[value as FeedbackType] || TYPE_COLORS.other;
      icon = TYPE_ICONS[value as FeedbackType];
      break;
    case "priority":
      colors = PRIORITY_COLORS[value as FeedbackPriority] || PRIORITY_COLORS.medium;
      icon = PRIORITY_ICONS[value as FeedbackPriority];
      break;
    default:
      colors = { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" };
  }

  const baseClasses = `inline-flex items-center gap-1 rounded-full border font-medium ${SIZE_CLASSES[size]}`;
  const colorClasses = `${colors.bg} ${colors.text} ${colors.border}`;
  const interactiveClasses = onClick
    ? "cursor-pointer hover:opacity-80 transition-opacity"
    : "";

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <span
      className={`${baseClasses} ${colorClasses} ${interactiveClasses} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showIcon && icon && <span>{icon}</span>}
      <span>{getDisplayText(value)}</span>
    </span>
  );
}

/**
 * TypeBadge - Convenience component for feedback type
 */
export function TypeBadge({
  type,
  ...props
}: Omit<StatusBadgeProps, "variant" | "value"> & { type: FeedbackType }) {
  return <StatusBadge variant="type" value={type} {...props} />;
}

/**
 * PriorityBadge - Convenience component for feedback priority
 */
export function PriorityBadge({
  priority,
  ...props
}: Omit<StatusBadgeProps, "variant" | "value"> & { priority: FeedbackPriority }) {
  return <StatusBadge variant="priority" value={priority} {...props} />;
}

export default StatusBadge;
