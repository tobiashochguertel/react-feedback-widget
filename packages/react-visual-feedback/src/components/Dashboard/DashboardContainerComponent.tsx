/**
 * Dashboard Container Component
 *
 * Main orchestrator component that manages state and delegates to child components.
 * This is a pure presentation container that receives data from FeedbackDashboard.
 *
 * @module components/Dashboard/DashboardContainerComponent
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { DashboardBackdrop, DashboardPanel, Content } from './styled';
import { DashboardHeaderComponent } from './DashboardHeaderComponent';
import { FeedbackListComponent } from './FeedbackListComponent';
import { VideoModeComponent, SessionReplayWrapperProps } from './VideoModeComponent';
import type { FeedbackData, StatusConfigs, Theme, ThemeMode } from '../../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DashboardContainerProps {
  /** Theme object */
  theme: Theme;
  /** Current theme mode */
  mode: ThemeMode;
  /** Dashboard title */
  title: string;
  /** Total count of feedback items (before filtering) */
  totalCount: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Callback when refresh button is clicked */
  onRefresh: () => void;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Current filter status */
  filterStatus: string;
  /** Callback when filter status changes */
  onFilterChange: (status: string) => void;
  /** Status configurations */
  statuses: StatusConfigs;
  /** Filtered list of feedback items */
  items: FeedbackData[];
  /** ID of currently expanded item */
  expandedId: string | null;
  /** Callback when card is toggled */
  onToggleExpand: (id: string) => void;
  /** Whether user is a developer */
  isDeveloper: boolean;
  /** Callback when status changes */
  onStatusChange?: ((id: string, status: string) => void) | undefined;
  /** Callback when delete is clicked */
  onDelete: (id: string) => void;
  /** Currently active video mode item (or null) */
  videoModeItem: FeedbackData | null;
  /** Callback when video mode button is clicked */
  onOpenVideoMode: (item: FeedbackData) => void;
  /** Callback when video mode is closed */
  onCloseVideoMode: () => void;
  /** Session replay wrapper component */
  SessionReplayWrapper: React.FC<SessionReplayWrapperProps>;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Dashboard container that orchestrates header, list, and video mode components.
 * Renders through a portal to document.body.
 */
export const DashboardContainerComponent: React.FC<DashboardContainerProps> = ({
  theme,
  mode,
  title,
  totalCount,
  isLoading,
  onRefresh,
  onClose,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  statuses,
  items,
  expandedId,
  onToggleExpand,
  isDeveloper,
  onStatusChange,
  onDelete,
  videoModeItem,
  onOpenVideoMode,
  onCloseVideoMode,
  SessionReplayWrapper,
}) => {
  return createPortal(
    <ThemeProvider theme={theme}>
      <DashboardBackdrop onClick={onClose} />
      <DashboardPanel>
        <DashboardHeaderComponent
          title={title}
          count={totalCount}
          isLoading={isLoading}
          onRefresh={onRefresh}
          onClose={onClose}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filterStatus={filterStatus}
          onFilterChange={onFilterChange}
          statuses={statuses}
        />

        <Content>
          <FeedbackListComponent
            items={items}
            expandedId={expandedId}
            onToggleExpand={onToggleExpand}
            statuses={statuses}
            isDeveloper={isDeveloper}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onOpenVideoMode={onOpenVideoMode}
            mode={mode}
            theme={theme}
            SessionReplayWrapper={SessionReplayWrapper}
          />
        </Content>
      </DashboardPanel>

      {/* Video Mode - Fullscreen video with logs */}
      {videoModeItem && (
        <VideoModeComponent
          item={videoModeItem}
          theme={theme}
          onClose={onCloseVideoMode}
          SessionReplayWrapper={SessionReplayWrapper}
        />
      )}
    </ThemeProvider>,
    document.body
  );
};
