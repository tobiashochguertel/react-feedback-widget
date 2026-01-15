import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import styled, { ThemeProvider } from 'styled-components';
import { useMachine } from '@xstate/react';
import { FeedbackModal } from './FeedbackModal';
import { FeedbackDashboard, saveFeedbackToLocalStorage } from './FeedbackDashboard';
import { CanvasOverlay } from './CanvasOverlay';
import { RecordingOverlay } from './RecordingOverlay';
import { SubmissionQueue } from './SubmissionQueue';
import ErrorToast, { showError, showSuccess } from './ErrorToast';
import recorder from './recorder';
import { getElementInfo, captureElementScreenshot, getReactComponentInfo } from './utils';
import { getTheme, FeedbackGlobalStyle } from './theme';
import { IntegrationClient } from './integrations';
import { feedbackMachine } from './state/feedbackMachine';
import { Z_INDEX, ANIMATION } from './constants';
import type {
  FeedbackData,
  FeedbackContextValue,
  FeedbackProviderProps,
} from './types';

// ============================================
// CONTEXT
// ============================================

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ============================================
// STYLED COMPONENTS
// ============================================

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme.colors.overlayBg};
  z-index: ${Z_INDEX.SELECTION.OVERLAY};
  cursor: crosshair;
  pointer-events: none;
  transition: background 0.2s ease;
`;

const Highlight = styled.div`
  position: absolute;
  border: 2px solid ${props => props.theme.colors.highlightBorder};
  background: ${props => props.theme.colors.highlightBg};
  pointer-events: none;
  z-index: ${Z_INDEX.SELECTION.HIGHLIGHT};
  transition: all ${ANIMATION.FAST}ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 0 0 4px ${props => props.theme.colors.highlightShadow},
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 4px;
`;

const Tooltip = styled.div`
  position: fixed;
  background: ${props => props.theme.colors.tooltipBg};
  color: ${props => props.theme.colors.tooltipText};
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-weight: 500;
  pointer-events: none;
  z-index: ${Z_INDEX.SELECTION.TOOLTIP};
  white-space: nowrap;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  transition: all ${ANIMATION.FAST}ms ease;
  max-width: 300px;
`;

const TooltipComponent = styled.span`
  color: #10b981;
  font-weight: 600;
`;

const TooltipTag = styled.span`
  color: ${props => props.theme.colors.tooltipText};
  opacity: 0.7;
`;

// ============================================
// STATE MACHINE
// ============================================

// State management is handled by the XState feedbackMachine
// See: src/state/feedbackMachine.ts

// ============================================
// TOOLTIP CONTENT TYPE
// ============================================

interface TooltipContent {
  tagName: string;
  id: string;
  componentName: string | undefined;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  children,
  onSubmit,
  isActive: controlledIsActive,
  onActiveChange,
  dashboard = false,
  dashboardData,
  isDeveloper = false,
  isUser: _isUser = true,
  userName,
  userEmail,
  onStatusChange,
  mode = 'light',
  defaultOpen = false,
  integrations = null,
  onIntegrationSuccess,
  onIntegrationError
}) => {
  // XState machine for state management (I013)
  const [snapshot, send] = useMachine(feedbackMachine);

  // Alias send as dispatch for backward compatibility with existing code
  const dispatch = send;

  // Extract state from machine context
  const state = snapshot.context;
  const {
    internalIsActive,
    hoveredElement,
    hoveredComponentInfo,
    selectedElement,
    highlightStyle,
    tooltipStyle,
    isModalOpen,
    screenshot,
    isCapturing,
    isDashboardOpen,
    isCanvasActive,
    isRecordingActive: _isRecordingActive,
    isRecording,
    isInitializing,
    isPaused,
    videoBlob,
    eventLogs,
    isManualFeedbackOpen,
    integrationStatus,
    lastIntegrationResults: _lastIntegrationResults,
    submissionQueue
  } = state;

  // Initialize integration client
  const integrationClientRef = useRef<IntegrationClient | null>(null);

  useEffect(() => {
    if (integrations && (integrations.jira?.enabled || integrations.sheets?.enabled)) {
      integrationClientRef.current = new IntegrationClient({
        jira: integrations.jira ?? null,
        sheets: integrations.sheets ?? null,
        onSuccess: (type, result) => {
          if (onIntegrationSuccess) {
            onIntegrationSuccess(type, result);
          }
        },
        onError: (type, error) => {
          if (onIntegrationError) {
            onIntegrationError(type, error.message);
          }
        }
      });
    } else {
      integrationClientRef.current = null;
    }
  }, [integrations?.jira?.enabled, integrations?.sheets?.enabled, onIntegrationSuccess, onIntegrationError]);

  // Determine if component is controlled
  const isControlled = controlledIsActive !== undefined;
  const isActive = isControlled ? controlledIsActive : internalIsActive;

  useEffect(() => {
    if (defaultOpen) {
      dispatch({ type: 'OPEN_MANUAL_FEEDBACK' });
    }
  }, [defaultOpen]);

  // Handle state changes
  const setIsActive = useCallback((newValue: boolean | ((prev: boolean) => boolean)) => {
    if (isControlled) {
      if (onActiveChange) {
        onActiveChange(typeof newValue === 'function' ? newValue(isActive) : newValue);
      }
    } else {
      const value = typeof newValue === 'function' ? newValue(state.internalIsActive) : newValue;
      dispatch({ type: 'SET_STATE', payload: { internalIsActive: value } });
    }
  }, [isControlled, onActiveChange, isActive, state.internalIsActive]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const theme = getTheme(mode);

  useEffect(() => {
    if (!onSubmit || typeof onSubmit !== 'function') {
      // onSubmit function is required
    }
  }, [onSubmit]);

  const isValidElement = useCallback((element: Element | null): element is HTMLElement => {
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }

    if (element.closest('.feedback-overlay, .feedback-modal, .feedback-backdrop, .feedback-tooltip, .feedback-highlight')) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      return false;
    }

    return true;
  }, []);

  // Throttle helper
  const throttleRef = useRef<number | null>(null);
  const lastElementRef = useRef<Element | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;

    // Throttle to 60fps max (16ms)
    if (throttleRef.current) return;
    throttleRef.current = requestAnimationFrame(() => {
      throttleRef.current = null;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (!isValidElement(element) || element === lastElementRef.current) return;

      lastElementRef.current = element;
      const componentInfo = getReactComponentInfo(element);
      const rect = element.getBoundingClientRect();
      const scrollX = window.pageXOffset;
      const scrollY = window.pageYOffset;

      dispatch({
        type: 'START_HOVERING',
        payload: {
          element,
          componentInfo,
          highlightStyle: {
            left: rect.left + scrollX,
            top: rect.top + scrollY,
            width: rect.width,
            height: rect.height,
          },
          tooltipStyle: {
            left: Math.min(e.clientX + 10, window.innerWidth - 300),
            top: Math.max(e.clientY - 40, 10),
          }
        }
      });
    });
  }, [isActive, isValidElement]);

  const handleElementClick = useCallback(async (e: MouseEvent) => {
    if (!isActive || !hoveredElement) return;

    e.preventDefault();
    e.stopPropagation();

    dispatch({ type: 'START_CAPTURE', payload: hoveredElement });

    try {
      const screenshotData = await captureElementScreenshot(hoveredElement);
      dispatch({ type: 'COMPLETE_CAPTURE', payload: screenshotData });
    } catch (error) {
      showError('Failed to capture screenshot. You can still submit feedback.', 'Capture Error');
      dispatch({ type: 'COMPLETE_CAPTURE', payload: null });
    }
  }, [isActive, hoveredElement]);

  // Recording handlers - need to be defined before handleKeyDown
  const handleStartRecording = useCallback(async () => {
    try {
      dispatch({ type: 'START_RECORDING_INIT' });
      await recorder.start();
      dispatch({ type: 'START_RECORDING_SUCCESS' });
    } catch (error) {
      dispatch({ type: 'START_RECORDING_FAILURE' });
      showError('Could not start recording. Please ensure you have granted screen and microphone permissions.', 'Recording Error');
    }
  }, []);

  const handlePauseRecording = useCallback(() => {
    recorder.pause();
    dispatch({ type: 'PAUSE_RECORDING' });
  }, []);

  const handleResumeRecording = useCallback(() => {
    recorder.resume();
    dispatch({ type: 'RESUME_RECORDING' });
  }, []);

  const handleCancelRecording = useCallback(async () => {
    await recorder.stop();
    dispatch({ type: 'CANCEL_RECORDING' });
  }, []);

  const handleStopRecording = useCallback(async () => {
    try {
      const { videoBlob: blob, events } = await recorder.stop();
      dispatch({ type: 'STOP_RECORDING', payload: { blob, events } });
      if (!blob || blob.size === 0) {
        showError('Recording failed: No video data was captured. Please try again.', 'Recording Error');
      }
    } catch (error) {
      showError('Failed to stop recording properly. Please try again.', 'Recording Error');
      dispatch({ type: 'CANCEL_RECORDING' });
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Alt+Q - Activate feedback mode (element selection)
    if (e.altKey && !e.shiftKey && (e.key.toLowerCase() === 'q' || e.keyCode === 81 || e.code === 'KeyQ')) {
      e.preventDefault();
      if (!isActive && !isRecording) {
        setIsActive(true);
        dispatch({ type: 'SET_STATE', payload: { isCanvasActive: false } });
      }
      return;
    }

    // Alt+A - Open form directly (Manual Feedback)
    if (e.altKey && !e.shiftKey && (e.key.toLowerCase() === 'a' || e.keyCode === 65 || e.code === 'KeyA')) {
      e.preventDefault();
      if (!isModalOpen && !isActive && !isRecording) {
        dispatch({ type: 'OPEN_MANUAL_FEEDBACK' });
      }
      return;
    }

    // Alt+W - Start video recording
    if (e.altKey && !e.shiftKey && (e.key.toLowerCase() === 'w' || e.keyCode === 87 || e.code === 'KeyW')) {
      e.preventDefault();
      if (!isRecording && !isActive) {
        handleStartRecording();
      }
      return;
    }

    // Alt+Shift+Q - Open dashboard
    if (dashboard && e.altKey && e.shiftKey && (e.key.toLowerCase() === 'q' || e.keyCode === 81 || e.code === 'KeyQ')) {
      e.preventDefault();
      dispatch({ type: 'OPEN_DASHBOARD' });
      return;
    }

    // Escape - Cancel/close
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isActive) {
        setIsActive(false);
        dispatch({ type: 'RESET_MODAL' });
      }
      if (isDashboardOpen) {
        dispatch({ type: 'CLOSE_DASHBOARD' });
      }
    }
  }, [isActive, isDashboardOpen, dashboard, setIsActive, isRecording, isModalOpen, handleStartRecording]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('feedback-mode-active');
    } else {
      document.body.classList.remove('feedback-mode-active');
    }

    return () => {
      document.body.classList.remove('feedback-mode-active');
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      dispatch({ type: 'STOP_HOVERING' });
      dispatch({ type: 'SET_STATE', payload: { selectedElement: null } });
      return;
    }

    if (!isCanvasActive && !isModalOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleElementClick, true);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleElementClick, true);
      };
    }
  }, [isActive, isCanvasActive, isModalOpen, handleMouseMove, handleElementClick]);

  // Generate unique ID for submissions
  const generateSubmissionId = useCallback((): string => {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Async submission handler that adds to queue and processes in background
  const handleAsyncSubmit = useCallback((feedbackData: FeedbackData): Promise<unknown> => {
    const submissionId = generateSubmissionId();

    // Add to queue immediately with 'submitting' status
    dispatch({
      type: 'ADD_SUBMISSION',
      payload: {
        id: submissionId,
        status: 'submitting',
        feedbackData,
        retryCount: 0,
        createdAt: new Date().toISOString()
      }
    });

    // Reset modal state immediately (don't wait for submission)
    setIsActive(false);
    dispatch({ type: 'RESET_MODAL' });

    // Process submission in background with timeout (60 seconds for large files)
    const hasLargeMedia = feedbackData.videoBlob && feedbackData.videoBlob.size > 5 * 1024 * 1024; // 5MB+
    const timeoutMs = hasLargeMedia ? 60000 : 30000; // 1 min for large, 30s otherwise

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Submission timed out')), timeoutMs);
    });

    const submitPromise = (async () => {
      const processedData: FeedbackData = { ...feedbackData };

      // Keep videoBlob as-is for FormData upload
      if (feedbackData.videoBlob && feedbackData.videoBlob instanceof Blob) {
        processedData.videoBlob = feedbackData.videoBlob;
        processedData.videoSize = feedbackData.videoBlob.size;
        processedData.videoType = feedbackData.videoBlob.type;
      }

      // Extract selectedIntegrations from feedback data
      const selectedIntegrations = feedbackData.selectedIntegrations ?? {
        local: true,
        jira: integrations?.jira?.enabled ?? false,
        sheets: integrations?.sheets?.enabled ?? false
      };

      // Save to local storage if dashboard is enabled AND local is selected
      if (dashboard && selectedIntegrations.local) {
        await saveFeedbackToLocalStorage(processedData);
      }

      if (onSubmit && typeof onSubmit === 'function') {
        await onSubmit(processedData);
      }

      // Send to integrations if configured AND selected
      const shouldSendToJira = integrationClientRef.current && integrations?.jira?.enabled && selectedIntegrations.jira;
      const shouldSendToSheets = integrationClientRef.current && integrations?.sheets?.enabled && selectedIntegrations.sheets;

      if (shouldSendToJira || shouldSendToSheets) {
        try {
          const integrationResults = await integrationClientRef.current!.sendFeedback(processedData, {
            jira: !!shouldSendToJira,
            sheets: !!shouldSendToSheets
          });

          if (integrationResults.jira?.success && integrationResults.jira?.issueKey) {
            processedData.jiraKey = integrationResults.jira.issueKey;
            processedData.jiraUrl = integrationResults.jira.issueUrl;

            if (dashboard && selectedIntegrations.local) {
              await saveFeedbackToLocalStorage({
                ...processedData,
                jiraKey: integrationResults.jira.issueKey,
                jiraUrl: integrationResults.jira.issueUrl
              });
            }
          }
        } catch (integrationError) {
          // Log but don't fail the submission
          console.warn('Integration error:', (integrationError as Error).message);
        }
      }

      return processedData;
    })();

    // Race between submission and timeout
    return Promise.race([submitPromise, timeoutPromise])
      .then(() => {
        // Update to success
        dispatch({
          type: 'UPDATE_SUBMISSION',
          payload: { id: submissionId, status: 'success' }
        });

        // Auto-remove success after 3 seconds
        setTimeout(() => {
          dispatch({ type: 'REMOVE_SUBMISSION', payload: submissionId });
        }, 3000);

        return { success: true };
      })
      .catch((error: Error) => {
        // Update to error
        dispatch({
          type: 'UPDATE_SUBMISSION',
          payload: { id: submissionId, status: 'error', error: error.message }
        });

        // Auto-remove error after 5 seconds
        setTimeout(() => {
          dispatch({ type: 'REMOVE_SUBMISSION', payload: submissionId });
        }, 5000);

        return { success: false, error: error.message };
      });
  }, [onSubmit, dashboard, setIsActive, integrations, generateSubmissionId]);

  // Handler to dismiss a submission from the queue
  const handleDismissSubmission = useCallback((submissionId: string) => {
    dispatch({ type: 'REMOVE_SUBMISSION', payload: submissionId });
  }, []);

  // Legacy synchronous submit (kept for backward compatibility)
  const handleFeedbackSubmit = useCallback(async (feedbackData: FeedbackData): Promise<unknown> => {
    // Use async handler
    return handleAsyncSubmit(feedbackData);
  }, [handleAsyncSubmit]);

  const handleCloseModal = useCallback(() => {
    setIsActive(false);
    dispatch({ type: 'RESET_MODAL' });
  }, [setIsActive]);

  const handleCanvasComplete = useCallback(async (canvasScreenshot: string | null, feedbackText: string): Promise<void> => {
    setIsActive(false);
    dispatch({ type: 'SET_STATE', payload: { isCanvasActive: false } });

    const feedbackData: FeedbackData = {
      id: Date.now().toString(),
      feedback: feedbackText,
      elementInfo: undefined,
      screenshot: canvasScreenshot ?? undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        devicePixelRatio: window.devicePixelRatio
      },
      timestamp: new Date().toISOString(),
      userName: userName ?? 'Anonymous',
      userEmail: userEmail ?? undefined,
      type: 'other'
    };

    try {
      if (dashboard) {
        const result = await saveFeedbackToLocalStorage(feedbackData);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      if (onSubmit && typeof onSubmit === 'function') {
        await onSubmit(feedbackData);
      }

      showSuccess('Feedback submitted successfully!', 'Success');
      dispatch({ type: 'STOP_HOVERING' });
      dispatch({ type: 'SET_STATE', payload: { selectedElement: null, screenshot: null } });
    } catch (error) {
      showError((error as Error).message || 'Failed to save feedback. Please try again.', 'Submission Error');
    }
  }, [dashboard, onSubmit, userName, userEmail, setIsActive]);

  const handleCanvasCancel = useCallback(() => {
    setIsActive(false);
    dispatch({ type: 'SET_STATE', payload: { isCanvasActive: false } });
  }, [setIsActive]);

  const setIsDashboardOpen = useCallback((value: boolean) => {
    if (value) {
      dispatch({ type: 'OPEN_DASHBOARD' });
    } else {
      dispatch({ type: 'CLOSE_DASHBOARD' });
    }
  }, []);

  const getTooltipContent = (): TooltipContent | null => {
    if (!hoveredElement) return null;
    const tagName = hoveredElement.tagName.toLowerCase();
    const id = hoveredElement.id ? `#${hoveredElement.id}` : '';
    const componentName = hoveredComponentInfo?.componentName ?? undefined;
    return { tagName, id, componentName };
  };

  const tooltipContent = getTooltipContent();

  return (
    <FeedbackContext.Provider value={{
      isActive,
      setIsActive,
      setIsDashboardOpen,
      startRecording: handleStartRecording,
      integrationStatus,
      integrations,
      integrationClient: integrationClientRef.current
    }}>
      <ThemeProvider theme={theme}>
        <FeedbackGlobalStyle />
        {children}

        {isActive && !isCanvasActive && !isModalOpen && createPortal(
          <>
            <Overlay ref={overlayRef} />

            {hoveredElement && (
              <>
                <Highlight
                  ref={highlightRef}
                  style={highlightStyle}
                />
                <Tooltip style={tooltipStyle}>
                  {tooltipContent?.componentName && (
                    <>
                      <TooltipComponent>&lt;{tooltipContent.componentName}&gt;</TooltipComponent>
                      {' '}
                    </>
                  )}
                  <TooltipTag>
                    {tooltipContent?.tagName}
                    {tooltipContent?.id}
                  </TooltipTag>
                  {isCapturing && ' (Capturing...)'}
                </Tooltip>
              </>
            )}
          </>,
          document.body
        )}

        <FeedbackModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          elementInfo={selectedElement ? getElementInfo(selectedElement) : null}
          screenshot={screenshot}
          videoBlob={videoBlob}
          eventLogs={eventLogs}
          onSubmit={handleFeedbackSubmit}
          onAsyncSubmit={handleAsyncSubmit}
          userName={userName}
          userEmail={userEmail}
          mode={mode}
          isManual={isManualFeedbackOpen}
          integrations={integrations}
        />

        <CanvasOverlay
          isActive={isCanvasActive}
          onComplete={handleCanvasComplete}
          onCancel={handleCanvasCancel}
          mode={mode}
        />

        <RecordingOverlay
          isRecording={isRecording}
          isInitializing={isInitializing}
          isPaused={isPaused}
          onStop={handleStopRecording}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
          onCancel={handleCancelRecording}
          mode={mode}
        />

        {dashboard && (
          <FeedbackDashboard
            isOpen={isDashboardOpen}
            onClose={() => setIsDashboardOpen(false)}
            data={dashboardData}
            isDeveloper={isDeveloper}
            onStatusChange={onStatusChange}
            mode={mode}
            integrations={integrations}
          />
        )}

        <ErrorToast />

        <SubmissionQueue
          submissions={submissionQueue}
          onDismiss={handleDismissSubmission}
          mode={mode}
        />
      </ThemeProvider>
    </FeedbackContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useFeedback = (): FeedbackContextValue => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }
  return context;
};
