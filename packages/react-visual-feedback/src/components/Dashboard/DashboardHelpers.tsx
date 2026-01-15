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
import { formatRelativeDate as formatRelativeDateUtil } from '../../utils/dateUtils';

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
// HELPER FUNCTIONS (Re-export from dateUtils)
// ============================================

/**
 * Format a date string to a relative date string.
 * Re-exported from utils/dateUtils for backward compatibility.
 *
 * @deprecated Import from '../../utils/dateUtils' directly.
 */
export const formatRelativeDate = formatRelativeDateUtil;

