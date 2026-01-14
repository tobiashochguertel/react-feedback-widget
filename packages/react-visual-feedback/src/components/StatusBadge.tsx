/**
 * StatusBadge - Displays a status indicator with icon and label
 *
 * Provides utility functions for status normalization and icon mapping
 * that are reused across StatusBadge and StatusDropdown components.
 */

import React from 'react';
import styled from 'styled-components';
import {
  Inbox,
  AlertCircle,
  Play,
  Eye,
  PauseCircle,
  CheckCircle,
  Archive,
  Ban,
  XCircle,
  HelpCircle,
  Lightbulb,
  Bug,
  Zap,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import type { StatusConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

type IconName =
  | 'Inbox'
  | 'AlertCircle'
  | 'Play'
  | 'Eye'
  | 'PauseCircle'
  | 'CheckCircle'
  | 'Archive'
  | 'Ban'
  | 'XCircle'
  | 'HelpCircle'
  | 'Lightbulb'
  | 'Bug'
  | 'Zap'
  | 'MessageSquare';

type IconInput = IconName | LucideIcon | React.ComponentType<{ size?: number }>;

interface StatusData {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: IconInput;
}

interface StatusBadgeStyledProps {
  $statusColor: string;
  $textColor: string;
  $statusBg: string;
}

interface StatusBadgeProps {
  status: string;
  statuses?: Record<string, StatusConfig>;
}

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<IconName, LucideIcon> = {
  Inbox,
  AlertCircle,
  Play,
  Eye,
  PauseCircle,
  CheckCircle,
  Archive,
  Ban,
  XCircle,
  HelpCircle,
  Lightbulb,
  Bug,
  Zap,
  MessageSquare,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get icon component from string name or component
 * Returns default AlertCircle if input is undefined/null/invalid
 */
export function getIconComponent(
  icon: IconInput | null | undefined
): LucideIcon | React.ComponentType<{ size?: number }> {
  if (!icon) return AlertCircle;

  if (typeof icon === 'string') {
    return ICON_MAP[icon as IconName] ?? AlertCircle;
  }

  // If it's a valid React component, return it; otherwise return default
  if (
    typeof icon === 'function' ||
    (icon && typeof icon === 'object' && '$$typeof' in icon)
  ) {
    return icon;
  }

  return AlertCircle;
}

/**
 * Normalize status key to match available statuses
 * Handles common mappings like 'reported' -> 'new', 'done' -> 'resolved'
 */
export function normalizeStatusKey(
  status: string | null | undefined,
  availableStatuses: Record<string, StatusConfig> = {}
): string {
  if (!status) return 'new';
  if (!availableStatuses || typeof availableStatuses !== 'object') return 'new';

  // Check if status exists and has valid data
  if (
    availableStatuses[status] &&
    typeof availableStatuses[status] === 'object'
  ) {
    return status;
  }

  const mappings: Record<string, string> = {
    reported: 'new',
    submitted: 'new',
    pending: 'new',
    doing: 'inProgress',
    in_progress: 'inProgress',
    review: 'underReview',
    under_review: 'underReview',
    hold: 'onHold',
    on_hold: 'onHold',
    paused: 'onHold',
    done: 'resolved',
    fixed: 'resolved',
    completed: 'resolved',
    archived: 'closed',
    rejected: 'wontFix',
    wont_fix: 'wontFix',
    cancelled: 'wontFix',
  };

  const statusLower = typeof status === 'string' ? status.toLowerCase() : '';
  const mapped = mappings[statusLower];

  if (
    mapped &&
    availableStatuses[mapped] &&
    typeof availableStatuses[mapped] === 'object'
  ) {
    return mapped;
  }

  // Find first valid status key
  const validKeys = Object.keys(availableStatuses).filter(
    (key) =>
      availableStatuses[key] && typeof availableStatuses[key] === 'object'
  );

  return validKeys.length > 0 ? validKeys[0] : 'new';
}

/**
 * Default status configuration used as fallback
 */
const DEFAULT_STATUS_FALLBACK: Omit<StatusData, 'key'> = {
  label: 'Unknown',
  color: '#6b7280',
  bgColor: '#f3f4f6',
  textColor: '#374151',
  icon: 'AlertCircle',
};

/**
 * Safely get status data with defaults
 */
export function getStatusData(
  statusKey: string,
  statuses: Record<string, StatusConfig> = {}
): StatusData {
  const data = statuses[statusKey];

  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_STATUS_FALLBACK, key: statusKey };
  }

  return {
    key: statusKey,
    label: data.label ?? statusKey,
    color: data.color ?? DEFAULT_STATUS_FALLBACK.color,
    bgColor: data.bgColor ?? DEFAULT_STATUS_FALLBACK.bgColor,
    textColor: data.textColor ?? DEFAULT_STATUS_FALLBACK.textColor,
    icon: (data.icon as IconInput) ?? DEFAULT_STATUS_FALLBACK.icon,
  };
}

// ============================================================================
// Styled Components
// ============================================================================

export const StatusBadgeStyled = styled.div<StatusBadgeStyledProps>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  background-color: ${(props) => props.$statusBg};
  border: 1px solid ${(props) => props.$statusColor};
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => props.$textColor};
  white-space: nowrap;
  min-width: 120px;
  box-sizing: border-box;
  transition: all 0.2s ease;

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: ${(props) => props.$textColor};
  }

  span {
    flex: 1;
    text-align: left;
  }
`;

// ============================================================================
// StatusBadge Component
// ============================================================================

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  statuses = {},
}) => {
  // Handle empty or invalid statuses gracefully
  if (
    !statuses ||
    typeof statuses !== 'object' ||
    Object.keys(statuses).length === 0
  ) {
    return null;
  }

  const statusKey = normalizeStatusKey(status, statuses);
  const statusData = getStatusData(statusKey, statuses);
  const IconComponent = getIconComponent(statusData.icon);

  return (
    <StatusBadgeStyled
      $statusColor={statusData.color}
      $textColor={statusData.textColor}
      $statusBg={statusData.bgColor}
    >
      <IconComponent size={16} />
      <span>{statusData.label}</span>
    </StatusBadgeStyled>
  );
};
