/**
 * Dashboard Components Index
 *
 * Re-exports all Dashboard-related components.
 *
 * @module components/Dashboard
 */

// Styled components
export * from './styled';

// Helper components and functions
export { TypeIcon, formatRelativeDate } from './DashboardHelpers';
export type { TypeIconProps } from './DashboardHelpers';

// Dashboard Container (main orchestrator)
export { DashboardContainerComponent } from './DashboardContainerComponent';
export type { DashboardContainerProps } from './DashboardContainerComponent';

// Dashboard Header
export { DashboardHeaderComponent } from './DashboardHeaderComponent';
export type { DashboardHeaderProps } from './DashboardHeaderComponent';

// Feedback Card
export { FeedbackCardComponent } from './FeedbackCardComponent';
export type { FeedbackCardProps } from './FeedbackCardComponent';

// Feedback List
export { FeedbackListComponent } from './FeedbackListComponent';
export type { FeedbackListProps } from './FeedbackListComponent';

// Video Mode
export { VideoModeComponent } from './VideoModeComponent';
export type { VideoModeComponentProps, SessionReplayWrapperProps } from './VideoModeComponent';
