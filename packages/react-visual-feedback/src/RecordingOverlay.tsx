/**
 * RecordingOverlay - Recording controls overlay
 *
 * Provides draggable recording controls that appear when
 * screen recording is active.
 */

import React, { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import styled, { ThemeProvider, keyframes, css } from 'styled-components';
import { Pause, Play, Square, Move, Loader } from 'lucide-react';
import { getTheme } from './theme';
import type { ThemeMode } from './types';

// ============================================================================
// Types
// ============================================================================

interface RecordingOverlayProps {
  isRecording: boolean;
  isInitializing?: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  mode?: ThemeMode;
  isProcessing?: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface DragStart {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

// ============================================================================
// Animations
// ============================================================================

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulseRing = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`;

const pulseDot = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// ============================================================================
// Styled Components
// ============================================================================

const OverlayContainer = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${(props) => props.$x}px;
  top: ${(props) => props.$y}px;
  z-index: 10001;
  animation: ${slideUp} 0.3s ease;
  user-select: none;
`;

const ControlPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background-color: ${(props) =>
    props.theme.mode === 'dark'
      ? 'rgba(31, 41, 55, 0.95)'
      : 'rgba(255, 255, 255, 0.95)'};
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: grab;
  color: ${(props) => (props.theme.mode === 'dark' ? '#9ca3af' : '#6b7280')};
  transition: color 0.2s;

  &:hover {
    color: ${(props) => (props.theme.mode === 'dark' ? '#e5e7eb' : '#374151')};
  }

  &:active {
    cursor: grabbing;
  }
`;

const RecordingIndicator = styled.div<{ $isPaused: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background-color: ${(props) =>
    props.$isPaused ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  border-radius: 6px;
`;

const PulseContainer = styled.div`
  position: relative;
  width: 12px;
  height: 12px;
`;

const PulseRing = styled.div<{ $isPaused: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: ${(props) =>
    props.$isPaused ? '#fbbf24' : '#ef4444'};

  ${(props) =>
    !props.$isPaused &&
    css`
      animation: ${pulseRing} 1.5s infinite;
    `}
`;

const PulseDot = styled.div<{ $isPaused: boolean }>`
  position: absolute;
  top: 2px;
  left: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.$isPaused ? '#fbbf24' : '#ef4444'};

  ${(props) =>
    props.$isPaused &&
    css`
      animation: ${pulseDot} 1s infinite;
    `}
`;

const TimerDisplay = styled.span`
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${(props) => (props.theme.mode === 'dark' ? '#e5e7eb' : '#374151')};
  min-width: 48px;
`;

const StatusText = styled.span<{ $isPaused: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${(props) =>
    props.$isPaused ? '#fbbf24' : '#ef4444'};
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background-color: ${(props) =>
    props.theme.mode === 'dark' ? '#374151' : '#e5e7eb'};
  margin: 0 4px;
`;

const ControlButton = styled.button<{ $variant?: 'pause' | 'stop' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
    if (props.$variant === 'stop') {
      return css`
        background-color: #ef4444;
        color: white;

        &:hover {
          background-color: #dc2626;
          transform: scale(1.05);
        }
      `;
    }
    return css`
      background-color: ${props.theme.mode === 'dark' ? '#374151' : '#f3f4f6'};
      color: ${props.theme.mode === 'dark' ? '#e5e7eb' : '#374151'};

      &:hover {
        background-color: ${props.theme.mode === 'dark' ? '#4b5563' : '#e5e7eb'};
        transform: scale(1.05);
      }
    `;
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProcessingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
  backdrop-filter: blur(4px);
`;

const ProcessingCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 48px;
  background-color: ${(props) =>
    props.theme.mode === 'dark' ? '#1f2937' : 'white'};
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const SpinnerIcon = styled(Loader)`
  animation: ${spin} 1s linear infinite;
  color: #ef4444;
`;

const ProcessingText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.theme.mode === 'dark' ? '#e5e7eb' : '#374151')};
`;

// ============================================================================
// RecordingOverlay Component
// ============================================================================

export const RecordingOverlay: React.FC<RecordingOverlayProps> = ({
  isRecording,
  isPaused,
  onPause,
  onResume,
  onStop,
  mode = 'light',
  isProcessing = false,
}) => {
  const [position, setPosition] = useState<Position>({
    x: window.innerWidth - 280,
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<DragStart | null>(null);
  const [timer, setTimer] = useState(0);

  const theme = getTheme(mode);

  // Timer effect
  useEffect(() => {
    if (!isRecording || isPaused || isProcessing) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused, isProcessing]);

  // Reset timer when recording starts
  useEffect(() => {
    if (!isRecording) {
      setTimer(0);
    }
  }, [isRecording]);

  // Format timer display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: MouseEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startX: position.x,
        startY: position.y,
      };
    },
    [position]
  );

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent): void => {
      if (!isDragging || !dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      let newX = dragStartRef.current.startX + deltaX;
      let newY = dragStartRef.current.startY + deltaY;

      // Keep within viewport bounds
      const panelWidth = 260;
      const panelHeight = 54;
      const margin = 10;

      newX = Math.max(margin, Math.min(newX, window.innerWidth - panelWidth - margin));
      newY = Math.max(margin, Math.min(newY, window.innerHeight - panelHeight - margin));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (): void => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle stop with processing state
  const handleStop = useCallback((): void => {
    onStop();
  }, [onStop]);

  if (!isRecording) return null;

  return createPortal(
    <ThemeProvider theme={theme}>
      <OverlayContainer $x={position.x} $y={position.y}>
        <ControlPanel>
          {/* Drag Handle */}
          <DragHandle
            onMouseDown={handleDragStart}
            title="Drag to move"
          >
            <Move size={16} />
          </DragHandle>

          {/* Recording Indicator */}
          <RecordingIndicator $isPaused={isPaused}>
            <PulseContainer>
              <PulseRing $isPaused={isPaused} />
              <PulseDot $isPaused={isPaused} />
            </PulseContainer>
            <StatusText $isPaused={isPaused}>
              {isPaused ? 'PAUSED' : 'REC'}
            </StatusText>
          </RecordingIndicator>

          {/* Timer */}
          <TimerDisplay>{formatTime(timer)}</TimerDisplay>

          <Divider />

          {/* Pause/Resume Button */}
          <ControlButton
            $variant="pause"
            onClick={isPaused ? onResume : onPause}
            title={isPaused ? 'Resume' : 'Pause'}
            disabled={isProcessing}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </ControlButton>

          {/* Stop Button */}
          <ControlButton
            $variant="stop"
            onClick={handleStop}
            title="Stop Recording"
            disabled={isProcessing}
          >
            <Square size={14} />
          </ControlButton>
        </ControlPanel>
      </OverlayContainer>

      {/* Processing Overlay */}
      {isProcessing && (
        <ProcessingOverlay>
          <ProcessingCard>
            <SpinnerIcon size={40} />
            <ProcessingText>Processing recording...</ProcessingText>
          </ProcessingCard>
        </ProcessingOverlay>
      )}
    </ThemeProvider>,
    document.body
  );
};
