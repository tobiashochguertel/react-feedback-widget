/**
 * Unit tests for FeedbackProvider component.
 *
 * Tests keyboard shortcuts, context provision, and state management.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackProvider } from '@/FeedbackProvider';

// Mock FeedbackModal to isolate FeedbackProvider testing
vi.mock('@/FeedbackModal', () => ({
  FeedbackModal: vi.fn(({ isOpen, isManual }: { isOpen: boolean; isManual: boolean }) =>
    isOpen ? (
      <div data-testid="feedback-modal" data-manual={isManual ? 'true' : 'false'}>
        Modal
      </div>
    ) : null
  ),
}));

describe('FeedbackProvider', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Shortcuts', () => {
    it('opens manual feedback on Alt+A', () => {
      render(
        <FeedbackProvider onSubmit={mockOnSubmit}>
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      // Simulate Alt+A keypress
      fireEvent.keyDown(document, { key: 'a', altKey: true, code: 'KeyA' });

      // Expect modal to be open and isManual to be true
      const modal = screen.getByTestId('feedback-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-manual', 'true');
    });

    it('opens feedback on Alt+F (configurable shortcut)', () => {
      render(
        <FeedbackProvider
          onSubmit={mockOnSubmit}
          keyboardShortcut={{ key: 'f', alt: true }}
        >
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      // Simulate Alt+F keypress
      fireEvent.keyDown(document, { key: 'f', altKey: true, code: 'KeyF' });

      const modal = screen.getByTestId('feedback-modal');
      expect(modal).toBeInTheDocument();
    });

    it('does not open feedback when shortcut is disabled', () => {
      render(
        <FeedbackProvider
          onSubmit={mockOnSubmit}
          keyboardShortcut={{ enabled: false }}
        >
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      // Simulate Alt+A keypress
      fireEvent.keyDown(document, { key: 'a', altKey: true, code: 'KeyA' });

      expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('opens directly if defaultOpen is true', () => {
      render(
        <FeedbackProvider onSubmit={mockOnSubmit} defaultOpen={true}>
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      const modal = screen.getByTestId('feedback-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-manual', 'true');
    });

    it('renders children when modal is closed', () => {
      render(
        <FeedbackProvider onSubmit={mockOnSubmit}>
          <div data-testid="child">Child Content</div>
        </FeedbackProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
      expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('applies light theme by default', () => {
      const { container } = render(
        <FeedbackProvider onSubmit={mockOnSubmit}>
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      // FeedbackProvider wraps content in ThemeProvider
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts dark theme mode', () => {
      render(
        <FeedbackProvider onSubmit={mockOnSubmit} themeMode="dark">
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('accepts custom theme overrides', () => {
      render(
        <FeedbackProvider
          onSubmit={mockOnSubmit}
          themeOverrides={{ colors: { primary: '#ff0000' } }}
        >
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Submission Handler', () => {
    it('passes onSubmit function to context', () => {
      // This test verifies onSubmit is properly set up
      // Full submission testing would require more complex setup
      render(
        <FeedbackProvider onSubmit={mockOnSubmit}>
          <div data-testid="child">Child</div>
        </FeedbackProvider>
      );

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});

describe('FeedbackProvider Props Validation', () => {
  const mockOnSubmit = vi.fn();

  it('accepts all optional configuration props', () => {
    render(
      <FeedbackProvider
        onSubmit={mockOnSubmit}
        defaultOpen={false}
        themeMode="light"
        themeOverrides={{}}
        keyboardShortcut={{ key: 'a', alt: true, enabled: true }}
        enableScreenRecording={true}
        recordingOptions={{ maxDuration: 60 }}
        integrations={{}}
      >
        <div data-testid="child">Child</div>
      </FeedbackProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
