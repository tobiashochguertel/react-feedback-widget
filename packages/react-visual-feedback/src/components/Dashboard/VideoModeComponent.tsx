/**
 * Video Mode Component
 *
 * Fullscreen video player with synchronized console and network logs panel.
 *
 * @module components/Dashboard/VideoModeComponent
 */

import React, { useRef, useState } from 'react';
import { Video, Minimize2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import {
  VideoModeBackdrop,
  VideoModeContainer,
  VideoModeHeader,
  VideoModeTitle,
  VideoModeCloseBtn,
  VideoModeContent,
  VideoModePlayer,
  VideoModeLogsPanel,
  VideoModeLogsHeader,
  VideoModeLogsTitle,
  VideoModeLogsList,
} from './styled';
import { LogEntry } from '../LogEntry';
import type { FeedbackData, EventLog, Theme, ThemeMode } from '../../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SessionReplayWrapperProps {
  item: FeedbackData;
  mode: ThemeMode;
  fullHeight?: boolean | undefined;
  showLogsButton?: boolean | undefined;
  onTimeUpdate?: ((time: number, logs: EventLog[]) => void) | null | undefined;
}

export interface VideoModeComponentProps {
  /** The feedback item containing video data */
  item: FeedbackData;
  /** The theme object */
  theme: Theme;
  /** Callback when video mode is closed */
  onClose: () => void;
  /** Session replay wrapper component */
  SessionReplayWrapper: React.FC<SessionReplayWrapperProps>;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Fullscreen video mode with synchronized logs panel.
 * Renders in a portal to document.body for overlay behavior.
 */
export const VideoModeComponent: React.FC<VideoModeComponentProps> = ({
  item,
  theme,
  onClose,
  SessionReplayWrapper,
}) => {
  const [visibleLogs, setVisibleLogs] = useState<EventLog[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  const handleTimeUpdate = (_time: number, logs: EventLog[]) => {
    setVisibleLogs(logs);
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  };

  const feedbackTitle = item.feedback?.slice(0, 50) || 'Video Recording';
  const hasTruncatedTitle = (item.feedback?.length ?? 0) > 50;
  const totalLogs = item.eventLogs?.length || 0;

  return createPortal(
    <ThemeProvider theme={theme}>
      <VideoModeBackdrop onClick={onClose} />
      <VideoModeContainer>
        <VideoModeHeader>
          <VideoModeTitle>
            <Video size={20} />
            {feedbackTitle}
            {hasTruncatedTitle && '...'}
          </VideoModeTitle>
          <VideoModeCloseBtn onClick={onClose}>
            <Minimize2 size={16} />
            Exit Video Mode
          </VideoModeCloseBtn>
        </VideoModeHeader>

        <VideoModeContent>
          <VideoModePlayer>
            <SessionReplayWrapper
              item={item}
              mode="dark"
              fullHeight={true}
              showLogsButton={false}
              onTimeUpdate={handleTimeUpdate}
            />
          </VideoModePlayer>

          <VideoModeLogsPanel>
            <VideoModeLogsHeader>
              <VideoModeLogsTitle>
                <span style={{ color: '#3fb950' }}>❯</span>
                Console & Network Logs
              </VideoModeLogsTitle>
              <span style={{
                background: '#238636',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600
              }}>
                {visibleLogs.length} / {totalLogs}
              </span>
            </VideoModeLogsHeader>

            <VideoModeLogsList ref={logsRef}>
              {visibleLogs.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#484f58'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>❯_</div>
                  <div>No logs yet - play the video to see logs</div>
                </div>
              ) : (
                visibleLogs.map((log, idx) => (
                  <LogEntry key={idx} log={log} theme={theme} />
                ))
              )}
            </VideoModeLogsList>
          </VideoModeLogsPanel>
        </VideoModeContent>
      </VideoModeContainer>
    </ThemeProvider>,
    document.body
  );
};
