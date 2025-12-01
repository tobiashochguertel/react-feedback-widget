import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled, { ThemeProvider, keyframes, css } from 'styled-components';
import { Square, Pause, Play, X, GripHorizontal } from 'lucide-react';
import { getTheme } from './theme.js';

// --- Animations ---
const slideUp = keyframes`
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
`;

const pulseRing = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const pulseDot = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// --- Styled Components ---
const OverlayContainer = styled.div`
  position: fixed;
  z-index: 10001;
  animation: ${props => props.$isDragging ? 'none' : css`${slideUp} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`};
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: ${props => props.theme.mode === 'dark' ? '#1e293b' : '#ffffff'};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 40px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  user-select: none;
  touch-action: none;
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  cursor: grab;
  color: ${props => props.theme.colors.textTertiary};
  border-radius: 4px;
  transition: all 0.15s;

  &:hover {
    color: ${props => props.theme.colors.textSecondary};
    background: ${props => props.theme.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)'};
  }

  &:active {
    cursor: grabbing;
  }
`;

const RecordingStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px 0 10px;
`;

const RecordingDot = styled.div`
  position: relative;
  width: 10px;
  height: 10px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #ef4444;
    ${props => props.$isRecording && css`
      animation: ${pulseDot} 1.2s ease-in-out infinite;
    `}
  }

  ${props => props.$isRecording && css`
    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid rgba(239, 68, 68, 0.4);
      animation: ${pulseRing} 1.2s ease-in-out infinite;
    }
  `}
`;

const Timer = styled.div`
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: ${props => props.theme.colors.textPrimary};
  min-width: 52px;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: ${props => props.theme.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.08)'};
  margin: 0 4px;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: ${props => props.theme.colors.textSecondary};
  background: transparent;

  &:hover {
    background: ${props => props.theme.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.06)'};
    color: ${props => props.theme.colors.textPrimary};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
`;

const StopButton = styled(ControlButton)`
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);

  &:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
    transform: scale(1.08);
  }
`;

const PauseResumeButton = styled(ControlButton)`
  background: ${props => props.$isPaused
    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    : props.theme.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.06)'};
  color: ${props => props.$isPaused ? 'white' : props.theme.colors.textSecondary};
  ${props => props.$isPaused && css`
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
  `}

  &:hover {
    background: ${props => props.$isPaused
      ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
      : props.theme.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(0, 0, 0, 0.1)'};
    color: ${props => props.$isPaused ? 'white' : props.theme.colors.textPrimary};
  }
`;

const CancelButton = styled(ControlButton)`
  width: 32px;
  height: 32px;
  color: ${props => props.theme.colors.textTertiary};

  &:hover {
    color: #ef4444;
    background: ${props => props.theme.mode === 'dark'
      ? 'rgba(239, 68, 68, 0.15)'
      : 'rgba(239, 68, 68, 0.1)'};
  }
`;

const Loader = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.theme.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.2)'
    : 'rgba(0, 0, 0, 0.1)'};
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin: 0 12px;
`;

const StatusText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme.colors.textTertiary};
  margin-right: 8px;
`;

// --- Timer Formatting ---
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};


// --- Component ---
export const RecordingOverlay = ({
  isRecording,
  isPaused,
  isInitializing,
  onStop,
  onPause,
  onResume,
  onCancel,
  mode = 'light'
}) => {
  const [time, setTime] = useState(0);
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const theme = getTheme(mode);

  // Reset timer and position when recording starts
  useEffect(() => {
    if (isRecording) {
      setTime(0);
      setPosition({ x: null, y: null }); // Reset to center
    }
  }, [isRecording]);

  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (!containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: rect.left,
      posY: rect.top
    };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    let newX = dragStartRef.current.posX + deltaX;
    let newY = dragStartRef.current.posY + deltaY;

    // Constrain to viewport
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
    }

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isRecording && !isInitializing) {
    return null;
  }

  // Calculate position style
  const positionStyle = position.x !== null && position.y !== null
    ? { left: position.x, top: position.y }
    : { bottom: 24, left: '50%', transform: 'translateX(-50%)' };

  return createPortal(
    <ThemeProvider theme={theme}>
      <OverlayContainer
        ref={containerRef}
        style={positionStyle}
        $isDragging={isDragging}
      >
        {isInitializing ? (
          <>
            <StatusText>Starting...</StatusText>
            <Loader />
          </>
        ) : (
          <>
            <DragHandle
              onMouseDown={handleMouseDown}
              title="Drag to move"
            >
              <GripHorizontal size={14} />
            </DragHandle>

            <RecordingStatus>
              <RecordingDot $isRecording={!isPaused} />
              <Timer>{formatTime(time)}</Timer>
            </RecordingStatus>

            <Divider />

            <PauseResumeButton
              $isPaused={isPaused}
              onClick={(e) => {
                e.stopPropagation();
                isPaused ? onResume() : onPause();
              }}
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </PauseResumeButton>

            <StopButton
              onClick={(e) => { e.stopPropagation(); onStop(); }}
              title="Stop & Save"
            >
              <Square size={16} fill="currentColor" />
            </StopButton>

            <CancelButton
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              title="Cancel"
            >
              <X size={16} />
            </CancelButton>
          </>
        )}
      </OverlayContainer>
    </ThemeProvider>,
    document.body
  );
};
