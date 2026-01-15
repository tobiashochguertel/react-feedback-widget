/**
 * Feedback List Component
 *
 * Renders a scrollable list of FeedbackCard components with empty state handling.
 *
 * @module components/Dashboard/FeedbackListComponent
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { FeedbackListStyled, EmptyState } from './styled';
import { FeedbackCardComponent } from './FeedbackCardComponent';
import type { FeedbackData, StatusConfigs, ThemeMode, Theme, EventLog } from '../../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FeedbackListProps {
  /** Array of feedback items to display */
  items: FeedbackData[];
  /** ID of currently expanded item (or null if none) */
  expandedId: string | null;
  /** Callback when a card is toggled */
  onToggleExpand: (id: string) => void;
  /** All available status configurations */
  statuses: StatusConfigs;
  /** Whether the user is a developer */
  isDeveloper: boolean;
  /** Callback when status changes */
  onStatusChange?: ((id: string, status: string) => void) | undefined;
  /** Callback when delete is clicked */
  onDelete: (id: string) => void;
  /** Callback when video mode button is clicked */
  onOpenVideoMode: (item: FeedbackData) => void;
  /** The current theme mode */
  mode: ThemeMode;
  /** The full theme object */
  theme: Theme;
  /** Session replay wrapper component */
  SessionReplayWrapper: React.FC<{
    item: FeedbackData;
    mode: ThemeMode;
    fullHeight?: boolean | undefined;
    showLogsButton?: boolean | undefined;
    onTimeUpdate?: ((time: number, logs: EventLog[]) => void) | null | undefined;
  }>;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Scrollable list of feedback cards with empty state.
 */
export const FeedbackListComponent: React.FC<FeedbackListProps> = ({
  items,
  expandedId,
  onToggleExpand,
  statuses,
  isDeveloper,
  onStatusChange,
  onDelete,
  onOpenVideoMode,
  mode,
  theme,
  SessionReplayWrapper,
}) => {
  if (items.length === 0) {
    return (
      <FeedbackListStyled>
        <EmptyState>
          <MessageSquare size={48} strokeWidth={1} />
          <h3>No feedback yet</h3>
          <p>Submitted feedback will appear here</p>
        </EmptyState>
      </FeedbackListStyled>
    );
  }

  return (
    <FeedbackListStyled>
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const statusData = statuses[item.status ?? 'new'];

        return (
          <FeedbackCardComponent
            key={item.id}
            item={item}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            statusData={statusData}
            statuses={statuses}
            isDeveloper={isDeveloper}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onOpenVideoMode={onOpenVideoMode}
            mode={mode}
            theme={theme}
            SessionReplayWrapper={SessionReplayWrapper}
          />
        );
      })}
    </FeedbackListStyled>
  );
};
