/**
 * Dashboard Helper Components
 *
 * Small reusable components used within the Dashboard.
 *
 * @module components/Dashboard/DashboardHelpers
 */

import React from 'react';
import { Bug, Lightbulb, Zap, MessageSquare } from 'lucide-react';
import type { FeedbackType } from '../../types';

// ============================================
// TYPE ICON COMPONENT
// ============================================

export interface TypeIconProps {
  type: FeedbackType | string | undefined;
}

/**
 * Renders an icon based on feedback type.
 */
export const TypeIcon: React.FC<TypeIconProps> = ({ type }) => {
  switch (type) {
    case 'bug':
      return <Bug size={14} color="#ef4444" />;
    case 'feature':
      return <Lightbulb size={14} color="#22c55e" />;
    case 'improvement':
      return <Zap size={14} color="#3b82f6" />;
    default:
      return <MessageSquare size={14} color="#6b7280" />;
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format a date string to a relative date string.
 *
 * @param dateString - The date string to format.
 * @returns A relative date string (e.g., "Today", "Yesterday", "3d ago").
 */
export const formatRelativeDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
