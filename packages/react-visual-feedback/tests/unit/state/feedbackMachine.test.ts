/**
 * Feedback Machine Tests
 *
 * Unit tests for the XState feedback machine.
 * Tests verify that all state transitions produce the expected context changes.
 *
 * @module tests/unit/state/feedbackMachine.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import {
  feedbackMachine,
  initialContext,
  createInitialContext,
  getContextFromSnapshot,
  type FeedbackContext,
} from '../../../src/state/feedbackMachine';

describe('feedbackMachine', () => {
  // ============================================
  // Setup
  // ============================================

  describe('initialization', () => {
    it('should start with initial context', () => {
      const actor = createActor(feedbackMachine);
      actor.start();

      const snapshot = actor.getSnapshot();
      expect(snapshot.context).toEqual(initialContext);

      actor.stop();
    });

    it('should have correct initial values', () => {
      const actor = createActor(feedbackMachine);
      actor.start();

      const { context } = actor.getSnapshot();

      expect(context.internalIsActive).toBe(false);
      expect(context.hoveredElement).toBeNull();
      expect(context.isModalOpen).toBe(false);
      expect(context.isCapturing).toBe(false);
      expect(context.isRecording).toBe(false);
      expect(context.isDashboardOpen).toBe(false);

      actor.stop();
    });
  });

  // ============================================
  // SET_STATE Action
  // ============================================

  describe('SET_STATE', () => {
    it('should update context with payload', () => {
      const actor = createActor(feedbackMachine);
      actor.start();

      actor.send({ type: 'SET_STATE', payload: { internalIsActive: true } });

      expect(actor.getSnapshot().context.internalIsActive).toBe(true);

      actor.stop();
    });

    it('should merge partial state', () => {
      const actor = createActor(feedbackMachine);
      actor.start();

      actor.send({
        type: 'SET_STATE',
        payload: { internalIsActive: true, isDashboardOpen: true },
      });

      const { context } = actor.getSnapshot();
      expect(context.internalIsActive).toBe(true);
      expect(context.isDashboardOpen).toBe(true);
      expect(context.isModalOpen).toBe(false); // unchanged

      actor.stop();
    });
  });

  // ============================================
  // Element Selection Actions
  // ============================================

  describe('Element Selection', () => {
    describe('START_HOVERING', () => {
      it('should set hovered element and styles', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        const mockElement = document.createElement('div');
        const highlightStyle = { top: 10, left: 20, width: 100, height: 50 };
        const tooltipStyle = { top: 60, left: 20 };

        actor.send({
          type: 'START_HOVERING',
          payload: {
            element: mockElement,
            componentInfo: null,
            highlightStyle,
            tooltipStyle,
          },
        });

        const { context } = actor.getSnapshot();
        expect(context.hoveredElement).toBe(mockElement);
        expect(context.highlightStyle).toEqual(highlightStyle);
        expect(context.tooltipStyle).toEqual(tooltipStyle);

        actor.stop();
      });
    });

    describe('STOP_HOVERING', () => {
      it('should clear hovered element', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        // First hover
        const mockElement = document.createElement('div');
        actor.send({
          type: 'START_HOVERING',
          payload: {
            element: mockElement,
            componentInfo: null,
            highlightStyle: {},
            tooltipStyle: {},
          },
        });

        // Then stop
        actor.send({ type: 'STOP_HOVERING' });

        const { context } = actor.getSnapshot();
        expect(context.hoveredElement).toBeNull();
        expect(context.hoveredComponentInfo).toBeNull();

        actor.stop();
      });
    });
  });

  // ============================================
  // Screenshot Capture Actions
  // ============================================

  describe('Screenshot Capture', () => {
    describe('START_CAPTURE', () => {
      it('should set capturing state and selected element', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        const mockElement = document.createElement('div');
        actor.send({ type: 'START_CAPTURE', payload: mockElement });

        const { context } = actor.getSnapshot();
        expect(context.isCapturing).toBe(true);
        expect(context.selectedElement).toBe(mockElement);

        actor.stop();
      });
    });

    describe('COMPLETE_CAPTURE', () => {
      it('should open modal with screenshot', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        const screenshotData = 'data:image/png;base64,abc123';
        actor.send({ type: 'COMPLETE_CAPTURE', payload: screenshotData });

        const { context } = actor.getSnapshot();
        expect(context.isCapturing).toBe(false);
        expect(context.screenshot).toBe(screenshotData);
        expect(context.isModalOpen).toBe(true);

        actor.stop();
      });

      it('should clear hovered element on capture complete', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        // First hover
        const mockElement = document.createElement('div');
        actor.send({
          type: 'START_HOVERING',
          payload: {
            element: mockElement,
            componentInfo: null,
            highlightStyle: {},
            tooltipStyle: {},
          },
        });

        // Then complete capture
        actor.send({ type: 'COMPLETE_CAPTURE', payload: 'screenshot-data' });

        const { context } = actor.getSnapshot();
        expect(context.hoveredElement).toBeNull();
        expect(context.hoveredComponentInfo).toBeNull();

        actor.stop();
      });
    });

    describe('CANCEL_CAPTURE', () => {
      it('should reset capture state', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        // Start capture first
        const mockElement = document.createElement('div');
        actor.send({ type: 'START_CAPTURE', payload: mockElement });
        expect(actor.getSnapshot().context.isCapturing).toBe(true);

        // Then cancel
        actor.send({ type: 'CANCEL_CAPTURE' });

        const { context } = actor.getSnapshot();
        expect(context.isCapturing).toBe(false);

        actor.stop();
      });
    });
  });

  // ============================================
  // Dashboard Actions
  // ============================================

  describe('Dashboard', () => {
    describe('OPEN_DASHBOARD', () => {
      it('should set isDashboardOpen to true', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'OPEN_DASHBOARD' });

        expect(actor.getSnapshot().context.isDashboardOpen).toBe(true);

        actor.stop();
      });
    });

    describe('CLOSE_DASHBOARD', () => {
      it('should set isDashboardOpen to false', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'OPEN_DASHBOARD' });
        actor.send({ type: 'CLOSE_DASHBOARD' });

        expect(actor.getSnapshot().context.isDashboardOpen).toBe(false);

        actor.stop();
      });
    });
  });

  // ============================================
  // Manual Feedback Actions
  // ============================================

  describe('Manual Feedback', () => {
    describe('OPEN_MANUAL_FEEDBACK', () => {
      it('should open modal in manual mode', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'OPEN_MANUAL_FEEDBACK' });

        const { context } = actor.getSnapshot();
        expect(context.isManualFeedbackOpen).toBe(true);
        expect(context.isModalOpen).toBe(true);
        expect(context.screenshot).toBeNull();
        expect(context.videoBlob).toBeNull();

        actor.stop();
      });
    });

    describe('CLOSE_MANUAL_FEEDBACK', () => {
      it('should close modal', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'OPEN_MANUAL_FEEDBACK' });
        actor.send({ type: 'CLOSE_MANUAL_FEEDBACK' });

        const { context } = actor.getSnapshot();
        expect(context.isManualFeedbackOpen).toBe(false);
        expect(context.isModalOpen).toBe(false);

        actor.stop();
      });
    });
  });

  // ============================================
  // Recording Actions
  // ============================================

  describe('Recording', () => {
    describe('START_RECORDING_INIT', () => {
      it('should set initializing state', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_INIT' });

        expect(actor.getSnapshot().context.isInitializing).toBe(true);

        actor.stop();
      });
    });

    describe('START_RECORDING_SUCCESS', () => {
      it('should set recording active', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_INIT' });
        actor.send({ type: 'START_RECORDING_SUCCESS' });

        const { context } = actor.getSnapshot();
        expect(context.isInitializing).toBe(false);
        expect(context.isRecordingActive).toBe(true);
        expect(context.isRecording).toBe(true);
        expect(context.isPaused).toBe(false);

        actor.stop();
      });
    });

    describe('START_RECORDING_FAILURE', () => {
      it('should reset recording state', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_INIT' });
        actor.send({ type: 'START_RECORDING_FAILURE' });

        const { context } = actor.getSnapshot();
        expect(context.isInitializing).toBe(false);
        expect(context.isRecording).toBe(false);
        expect(context.isRecordingActive).toBe(false);

        actor.stop();
      });
    });

    describe('PAUSE_RECORDING', () => {
      it('should pause recording', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_SUCCESS' });
        actor.send({ type: 'PAUSE_RECORDING' });

        expect(actor.getSnapshot().context.isPaused).toBe(true);

        actor.stop();
      });
    });

    describe('RESUME_RECORDING', () => {
      it('should resume recording', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_SUCCESS' });
        actor.send({ type: 'PAUSE_RECORDING' });
        actor.send({ type: 'RESUME_RECORDING' });

        expect(actor.getSnapshot().context.isPaused).toBe(false);

        actor.stop();
      });
    });

    describe('CANCEL_RECORDING', () => {
      it('should reset all recording state', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_SUCCESS' });
        actor.send({ type: 'CANCEL_RECORDING' });

        const { context } = actor.getSnapshot();
        expect(context.isRecordingActive).toBe(false);
        expect(context.isRecording).toBe(false);
        expect(context.isInitializing).toBe(false);
        expect(context.isPaused).toBe(false);
        expect(context.videoBlob).toBeNull();
        expect(context.eventLogs).toEqual([]);

        actor.stop();
      });
    });

    describe('STOP_RECORDING', () => {
      it('should stop recording and open modal with video', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_SUCCESS' });

        const mockBlob = new Blob(['video-data'], { type: 'video/webm' });
        const mockEvents = [{ id: '1', timestamp: Date.now(), type: 'click' as const, elementId: 'btn' }];

        actor.send({
          type: 'STOP_RECORDING',
          payload: { blob: mockBlob, events: mockEvents },
        });

        const { context } = actor.getSnapshot();
        expect(context.isRecording).toBe(false);
        expect(context.isRecordingActive).toBe(false);
        expect(context.videoBlob).toBe(mockBlob);
        expect(context.eventLogs).toBe(mockEvents);
        expect(context.isModalOpen).toBe(true);

        actor.stop();
      });

      it('should not open modal if blob is empty', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'START_RECORDING_SUCCESS' });

        const emptyBlob = new Blob([], { type: 'video/webm' });

        actor.send({
          type: 'STOP_RECORDING',
          payload: { blob: emptyBlob, events: [] },
        });

        expect(actor.getSnapshot().context.isModalOpen).toBe(false);

        actor.stop();
      });
    });
  });

  // ============================================
  // Modal Reset Action
  // ============================================

  describe('RESET_MODAL', () => {
    it('should reset all modal-related state', () => {
      const actor = createActor(feedbackMachine);
      actor.start();

      // Open modal with screenshot
      actor.send({ type: 'COMPLETE_CAPTURE', payload: 'screenshot-data' });
      expect(actor.getSnapshot().context.isModalOpen).toBe(true);

      // Reset modal
      actor.send({ type: 'RESET_MODAL' });

      const { context } = actor.getSnapshot();
      expect(context.isModalOpen).toBe(false);
      expect(context.isManualFeedbackOpen).toBe(false);
      expect(context.selectedElement).toBeNull();
      expect(context.screenshot).toBeNull();
      expect(context.hoveredElement).toBeNull();
      expect(context.isCanvasActive).toBe(false);
      expect(context.videoBlob).toBeNull();
      expect(context.eventLogs).toEqual([]);
      expect(context.lastIntegrationResults).toBeNull();

      actor.stop();
    });
  });

  // ============================================
  // Integration Actions
  // ============================================

  describe('Integrations', () => {
    describe('INTEGRATION_START', () => {
      it('should set jira loading state', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'INTEGRATION_START', payload: { jira: true } });

        const { context } = actor.getSnapshot();
        expect(context.integrationStatus.jira.loading).toBe(true);
        expect(context.integrationStatus.sheets.loading).toBe(false);

        actor.stop();
      });

      it('should set sheets loading state', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'INTEGRATION_START', payload: { sheets: true } });

        const { context } = actor.getSnapshot();
        expect(context.integrationStatus.jira.loading).toBe(false);
        expect(context.integrationStatus.sheets.loading).toBe(true);

        actor.stop();
      });
    });

    describe('INTEGRATION_SUCCESS', () => {
      it('should set success result', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        const jiraResult = { success: true, issueUrl: 'https://jira.example.com/ABC-123' };

        actor.send({
          type: 'INTEGRATION_SUCCESS',
          payload: { jira: jiraResult },
        });

        const { context } = actor.getSnapshot();
        expect(context.integrationStatus.jira.loading).toBe(false);
        expect(context.integrationStatus.jira.result).toEqual(jiraResult);
        expect(context.lastIntegrationResults).toEqual({ jira: jiraResult });

        actor.stop();
      });
    });

    describe('INTEGRATION_ERROR', () => {
      it('should set error state', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({
          type: 'INTEGRATION_ERROR',
          payload: { jira: { success: false, error: 'Failed to create issue' } },
        });

        const { context } = actor.getSnapshot();
        expect(context.integrationStatus.jira.loading).toBe(false);
        expect(context.integrationStatus.jira.error).toBe('Failed to create issue');

        actor.stop();
      });
    });

    describe('INTEGRATION_RESET', () => {
      it('should reset integration status', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        // First set some integration state
        actor.send({
          type: 'INTEGRATION_SUCCESS',
          payload: { jira: { success: true, issueUrl: 'https://jira.example.com' } },
        });

        // Then reset
        actor.send({ type: 'INTEGRATION_RESET' });

        const { context } = actor.getSnapshot();
        expect(context.integrationStatus.jira.loading).toBe(false);
        expect(context.integrationStatus.jira.error).toBeNull();
        expect(context.integrationStatus.jira.result).toBeNull();
        expect(context.lastIntegrationResults).toBeNull();

        actor.stop();
      });
    });
  });

  // ============================================
  // Submission Queue Actions
  // ============================================

  describe('Submission Queue', () => {
    const createMockSubmission = (id: string): import('../../../src/types').QueuedSubmission => ({
      id,
      data: {
        id,
        description: 'Test feedback',
        timestamp: Date.now(),
        source: 'manual',
        url: 'https://example.com',
        viewport: { width: 1920, height: 1080, scrollX: 0, scrollY: 0, devicePixelRatio: 1 },
        browser: { userAgent: 'test', language: 'en' },
      },
      status: 'pending' as const,
      retryCount: 0,
      createdAt: Date.now(),
      jiraEnabled: false,
      sheetsEnabled: false,
    });

    describe('ADD_SUBMISSION', () => {
      it('should add submission to queue', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        const submission = createMockSubmission('sub-1');
        actor.send({ type: 'ADD_SUBMISSION', payload: submission });

        const { context } = actor.getSnapshot();
        expect(context.submissionQueue).toHaveLength(1);
        expect(context.submissionQueue[0]).toEqual(submission);

        actor.stop();
      });

      it('should append multiple submissions', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'ADD_SUBMISSION', payload: createMockSubmission('sub-1') });
        actor.send({ type: 'ADD_SUBMISSION', payload: createMockSubmission('sub-2') });

        expect(actor.getSnapshot().context.submissionQueue).toHaveLength(2);

        actor.stop();
      });
    });

    describe('UPDATE_SUBMISSION', () => {
      it('should update existing submission', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        const submission = createMockSubmission('sub-1');
        actor.send({ type: 'ADD_SUBMISSION', payload: submission });

        actor.send({
          type: 'UPDATE_SUBMISSION',
          payload: { id: 'sub-1', status: 'sending' as const },
        });

        const { context } = actor.getSnapshot();
        expect(context.submissionQueue[0].status).toBe('sending');

        actor.stop();
      });
    });

    describe('REMOVE_SUBMISSION', () => {
      it('should remove submission by id', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'ADD_SUBMISSION', payload: createMockSubmission('sub-1') });
        actor.send({ type: 'ADD_SUBMISSION', payload: createMockSubmission('sub-2') });
        actor.send({ type: 'REMOVE_SUBMISSION', payload: 'sub-1' });

        const { context } = actor.getSnapshot();
        expect(context.submissionQueue).toHaveLength(1);
        expect(context.submissionQueue[0].id).toBe('sub-2');

        actor.stop();
      });
    });
  });

  // ============================================
  // Helper Functions
  // ============================================

  describe('Helper Functions', () => {
    describe('createInitialContext', () => {
      it('should create a fresh copy of initial context', () => {
        const context1 = createInitialContext();
        const context2 = createInitialContext();

        expect(context1).toEqual(context2);
        expect(context1).not.toBe(context2);
        expect(context1.integrationStatus).not.toBe(context2.integrationStatus);
      });
    });

    describe('getContextFromSnapshot', () => {
      it('should extract context from snapshot', () => {
        const actor = createActor(feedbackMachine);
        actor.start();

        actor.send({ type: 'SET_STATE', payload: { internalIsActive: true } });

        const snapshot = actor.getSnapshot();
        const context = getContextFromSnapshot(snapshot);

        expect(context.internalIsActive).toBe(true);
        expect(context).toBe(snapshot.context);

        actor.stop();
      });
    });
  });
});
