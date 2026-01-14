/**
 * SubmissionQueue - Feedback submission status notifications
 *
 * Displays a queue of submission status notifications in the
 * bottom-right corner of the screen.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes, ThemeProvider } from 'styled-components';
import { Loader2, CheckCircle, XCircle, X } from 'lucide-react';
import { getTheme } from './theme';
import type { ThemeMode, QueuedSubmission, SubmissionStatus } from './types';

// ============================================================================
// Types
// ============================================================================

/** Extended submission type with UI-specific state */
export interface Submission extends Omit<QueuedSubmission, 'feedbackData'> {
  feedbackData?: unknown | undefined;
}

interface SubmissionQueueProps {
  submissions: Submission[];
  onDismiss: (id: string) => void;
  mode?: ThemeMode | undefined;
}

interface StatusInfo {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

// ============================================================================
// Animations
// ============================================================================

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ============================================================================
// Styled Components
// ============================================================================

const QueueContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99997;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const QueueItem = styled.div<{ $exiting?: boolean | undefined }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: ${props => props.theme.colors.modalBg};
  border-radius: 10px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 0 0 1px ${props => props.theme.colors.border};
  animation: ${props => props.$exiting ? slideOut : slideIn} 0.3s ease forwards;
  min-width: 200px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
  color: ${props => props.theme.colors.btnPrimaryBg};
`;

const SuccessIcon = styled(CheckCircle)`
  color: #22c55e;
`;

const ErrorIcon = styled(XCircle)`
  color: #ef4444;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtitle = styled.div`
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 2px;
`;

const DismissButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${props => props.theme.colors.textTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s;

  &:hover {
    background: ${props => props.theme.colors.hoverBg};
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const MoreIndicator = styled.div`
  text-align: center;
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
  padding: 4px 8px;
  background: ${props => props.theme.colors.modalBg};
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

// ============================================================================
// SubmissionQueue Component
// ============================================================================

export const SubmissionQueue: React.FC<SubmissionQueueProps> = ({
  submissions,
  onDismiss,
  mode = 'light',
}) => {
  const theme = getTheme(mode);

  if (!submissions || submissions.length === 0) return null;

  // Show only the first 3 submissions
  const visibleSubmissions = submissions.slice(0, 3);
  const hiddenCount = submissions.length - 3;

  const getStatusInfo = (status: SubmissionStatus): StatusInfo => {
    switch (status) {
      case 'submitting':
        return {
          icon: <SpinningLoader size={18} />,
          title: 'Submitting feedback...',
          subtitle: 'Please wait',
        };
      case 'success':
        return {
          icon: <SuccessIcon size={18} />,
          title: 'Submitted successfully!',
          subtitle: 'Feedback received',
        };
      case 'error':
        return {
          icon: <ErrorIcon size={18} />,
          title: 'Submission failed',
          subtitle: 'Please try again',
        };
      default:
        return {
          icon: <SpinningLoader size={18} />,
          title: 'Processing...',
          subtitle: '',
        };
    }
  };

  return createPortal(
    <ThemeProvider theme={theme}>
      <QueueContainer>
        {visibleSubmissions.map((submission) => {
          const { icon, title, subtitle } = getStatusInfo(submission.status);
          return (
            <QueueItem
              key={submission.id}
              $exiting={submission.exiting}
            >
              <IconWrapper>{icon}</IconWrapper>
              <Content>
                <Title>{title}</Title>
                {subtitle && <Subtitle>{subtitle}</Subtitle>}
              </Content>
              {submission.status !== 'submitting' && (
                <DismissButton onClick={() => onDismiss(submission.id)}>
                  <X size={14} />
                </DismissButton>
              )}
            </QueueItem>
          );
        })}
        {hiddenCount > 0 && (
          <MoreIndicator>
            +{hiddenCount} more in queue
          </MoreIndicator>
        )}
      </QueueContainer>
    </ThemeProvider>,
    document.body
  );
};

export default SubmissionQueue;
