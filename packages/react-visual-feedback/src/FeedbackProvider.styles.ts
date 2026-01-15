/**
 * FeedbackProvider Styled Components
 *
 * Extracted styled components for the selection overlay UI.
 * These components render the highlight and tooltip during element selection.
 *
 * @module FeedbackProvider.styles
 */

import styled from 'styled-components';
import { Z_INDEX, ANIMATION } from './constants';

// ============================================
// OVERLAY
// ============================================

/**
 * Full-screen overlay that appears during element selection mode.
 * Provides a semi-transparent backdrop with crosshair cursor.
 */
export const Overlay = styled.div`
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

// ============================================
// HIGHLIGHT
// ============================================

/**
 * Highlight box that appears around the hovered element.
 * Provides visual feedback about which element will be selected.
 */
export const Highlight = styled.div`
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

// ============================================
// TOOLTIP
// ============================================

/**
 * Tooltip that displays information about the hovered element.
 * Shows tag name, component name, and capture status.
 */
export const Tooltip = styled.div`
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

/**
 * Styled span for React component name in tooltip.
 * Displays in green for visual distinction.
 */
export const TooltipComponent = styled.span`
  color: #10b981;
  font-weight: 600;
`;

/**
 * Styled span for HTML tag name in tooltip.
 * Displays with reduced opacity for visual hierarchy.
 */
export const TooltipTag = styled.span`
  color: ${props => props.theme.colors.tooltipText};
  opacity: 0.7;
`;
