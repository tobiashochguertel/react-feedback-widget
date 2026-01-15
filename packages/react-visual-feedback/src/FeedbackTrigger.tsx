/**
 * FeedbackTrigger - Floating feedback button component
 *
 * Renders a fixed-position button that triggers screenshot feedback mode.
 * Optionally shows a secondary button for video recording.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styled, { ThemeProvider } from 'styled-components';
import { MessageSquare, Video } from 'lucide-react';
import { getTheme } from './theme';
import { Z_INDEX, ANIMATION } from './constants';
import type { ThemeMode } from './types';

// ============================================================================
// Types
// ============================================================================

interface FeedbackTriggerProps {
  onFeedback?: () => void;
  onRecord?: () => void;
  showRecordButton?: boolean;
  mode?: ThemeMode;
}

// ============================================================================
// Styled Components
// ============================================================================

const Container = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: ${Z_INDEX.TRIGGER};
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 40px;
  transition: all ${ANIMATION.TOAST_HIDE}ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: ${(props) =>
    props.theme.mode === 'dark'
      ? 'rgba(0, 0, 0, 0.4)'
      : 'rgba(255, 255, 255, 0.8)'};
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
`;

const BaseButton = styled.button`
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${ANIMATION.NORMAL}ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  outline: none;

  &:active {
    transform: scale(0.95);
  }
`;

const MainButton = styled(BaseButton)`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: ${(props) => props.theme.colors.btnPrimaryBg};
  color: white;
  box-shadow: 0 4px 14px ${(props) => props.theme.colors.highlightShadow};
  z-index: ${Z_INDEX.INTERNAL.LOW};

  &:hover {
    background: ${(props) => props.theme.colors.btnPrimaryHover};
    transform: scale(1.05);
    box-shadow: 0 6px 20px ${(props) => props.theme.colors.highlightShadow};
  }
`;

const SecondaryButton = styled(BaseButton)`
  width: 42px;
  height: 42px;
  border-radius: 21px;
  background: transparent;
  color: ${(props) => props.theme.colors.textSecondary};
  opacity: 0.7;

  &:hover {
    background: ${(props) => props.theme.colors.hoverBg};
    color: ${(props) => props.theme.colors.textPrimary};
    opacity: 1;
  }
`;

// ============================================================================
// FeedbackTrigger Component
// ============================================================================

/**
 * Floating feedback button that triggers screenshot feedback mode
 */
export const FeedbackTrigger: React.FC<FeedbackTriggerProps> = ({
  onFeedback,
  onRecord,
  showRecordButton = false,
  mode = 'light',
}) => {
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);

  return createPortal(
    <ThemeProvider theme={theme}>
      <Container
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showRecordButton && (
          <SecondaryButton
            onClick={() => onRecord?.()}
            aria-label="Record Video Feedback"
            title="Record Video (Alt + W)"
            style={{
              width: isHovered ? '42px' : '0',
              opacity: isHovered ? 1 : 0,
              padding: 0,
              overflow: 'hidden',
              marginRight: isHovered ? '4px' : '0',
            }}
          >
            <Video size={20} />
          </SecondaryButton>
        )}
        <MainButton
          onClick={() => onFeedback?.()}
          aria-label="Give Feedback"
          title="Give Feedback (Alt + Q)"
        >
          <MessageSquare size={24} strokeWidth={2.5} />
        </MainButton>
      </Container>
    </ThemeProvider>,
    document.body
  );
};
