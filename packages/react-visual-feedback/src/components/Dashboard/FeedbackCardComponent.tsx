/**
 * Feedback Card Component
 *
 * Individual feedback item card with thumbnail, info, status, and expandable details.
 *
 * @module components/Dashboard/FeedbackCardComponent
 */

import React from 'react';
import { Video, MessageSquare, Trash2, Maximize2, Globe, Layers, Monitor, FileCode, Copy } from 'lucide-react';
import {
  Card,
  CardMain,
  Thumbnail,
  CardContent,
  CardHeader,
  DateText,
  FeedbackDescription,
  CardActions,
  ExpandedSection,
  MediaViewer,
  DetailGrid,
  DetailItem,
  DetailLabel,
  DetailValue,
  ActionButton,
  ExpandButton,
} from './styled';
import { TypeIcon, formatRelativeDate } from './DashboardHelpers';
import { StatusBadgeStyled } from '../StatusBadge';
import { StatusDropdown } from '../StatusDropdown';
import { formatPath } from '../../utils';
import type { FeedbackData, StatusConfigs, StatusConfig, ThemeMode, Theme, EventLog } from '../../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface FeedbackCardProps {
  /** The feedback item data */
  item: FeedbackData;
  /** Whether the card is currently expanded */
  isExpanded: boolean;
  /** Callback when card is clicked (toggle expand) */
  onToggleExpand: (id: string) => void;
  /** Status configuration data for the item */
  statusData: StatusConfig | undefined;
  /** All available status configurations */
  statuses: StatusConfigs;
  /** Whether the user is a developer (shows extra controls) */
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
 * Feedback card with thumbnail, info, status, and expandable details.
 */
export const FeedbackCardComponent: React.FC<FeedbackCardProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  statusData,
  statuses,
  isDeveloper,
  onStatusChange,
  onDelete,
  onOpenVideoMode,
  mode,
  theme,
  SessionReplayWrapper,
}) => {
  const hasVideo = !!(item.video || (item as unknown as { videoRef?: string }).videoRef);

  const handleCardClick = () => {
    onToggleExpand(item.id);
  };

  const handleDeleteClick = () => {
    onDelete(item.id);
  };

  const handleStatusChange = (_id: string, status: string) => {
    if (onStatusChange) {
      onStatusChange(item.id, status);
    }
  };

  const handleCopySource = () => {
    const fileName = item.elementInfo?.reactComponent?.sourceFile?.fileName;
    if (fileName) {
      navigator.clipboard.writeText(fileName);
    }
  };

  return (
    <Card $expanded={isExpanded} onClick={handleCardClick}>
      <CardMain>
        <Thumbnail>
          {hasVideo ? (
            <Video size={24} />
          ) : item.screenshot ? (
            <img src={item.screenshot} alt="" />
          ) : (
            <MessageSquare size={24} />
          )}
        </Thumbnail>

        <CardContent>
          <CardHeader>
            <TypeIcon type={item.type} />
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: theme.colors.textPrimary }}>
              {item.type || 'Feedback'}
            </span>
            <span style={{ fontSize: 12, color: theme.colors.textTertiary }}>•</span>
            <DateText>{formatRelativeDate(item.timestamp)}</DateText>
          </CardHeader>
          <FeedbackDescription $expanded={isExpanded}>
            {item.feedback || 'No description'}
          </FeedbackDescription>
        </CardContent>

        <CardActions onClick={e => e.stopPropagation()}>
          {isDeveloper ? (
            <StatusDropdown
              currentStatus={item.status ?? 'new'}
              onStatusChange={handleStatusChange}
              itemId={item.id}
              statuses={statuses}
              theme={theme}
            />
          ) : (
            <StatusBadgeStyled
              $statusColor={statusData?.color ?? '#6b7280'}
              $textColor={statusData?.textColor ?? '#374151'}
              $statusBg={statusData?.bgColor ?? '#f3f4f6'}
            >
              {statusData?.label ?? 'New'}
            </StatusBadgeStyled>
          )}
          {isExpanded && isDeveloper && (
            <ActionButton onClick={handleDeleteClick} title="Delete">
              <Trash2 size={14} color="#ef4444" />
            </ActionButton>
          )}
        </CardActions>
      </CardMain>

      {isExpanded && (
        <ExpandedSection onClick={e => e.stopPropagation()}>
          {(item.screenshot || hasVideo) && (
            <MediaViewer style={{ position: 'relative' }}>
              {hasVideo ? (
                <>
                  <SessionReplayWrapper item={item} mode={mode} />
                  <ExpandButton
                    onClick={() => onOpenVideoMode(item)}
                    title="Open in Video Mode"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: 6,
                      borderRadius: 6
                    }}
                  >
                    <Maximize2 size={16} />
                  </ExpandButton>
                </>
              ) : (
                <img src={item.screenshot} alt="Evidence" />
              )}
            </MediaViewer>
          )}

          {isDeveloper && (
            <DetailGrid>
              <DetailItem>
                <DetailLabel>Page</DetailLabel>
                <DetailValue>
                  <Globe size={12} /> {item.url ? new URL(item.url).pathname : '/'}
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Component</DetailLabel>
                <DetailValue>
                  <Layers size={12} /> {item.elementInfo?.reactComponent?.componentName ?? 'Unknown'}
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Browser</DetailLabel>
                <DetailValue>
                  <Monitor size={12} /> {item.userAgent?.split(') ')[0]?.slice(-30) || 'Unknown'}...
                </DetailValue>
              </DetailItem>
              {item.elementInfo?.reactComponent?.sourceFile?.fileName && (
                <DetailItem>
                  <DetailLabel>Source</DetailLabel>
                  <DetailValue
                    style={{ cursor: 'pointer' }}
                    onClick={handleCopySource}
                  >
                    <FileCode size={12} />
                    {formatPath(item.elementInfo?.reactComponent?.sourceFile?.fileName ?? '')}
                    <Copy size={10} style={{ marginLeft: 'auto' }} />
                  </DetailValue>
                </DetailItem>
              )}
            </DetailGrid>
          )}
        </ExpandedSection>
      )}
    </Card>
  );
};
