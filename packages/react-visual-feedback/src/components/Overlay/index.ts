/**
 * Overlay Components
 *
 * Components for element selection mode, including the selection overlay,
 * element highlight, and element tooltip.
 *
 * @module components/Overlay
 */

// ============================================
// SELECTION OVERLAY
// ============================================
export {
  SelectionOverlay,
  default as SelectionOverlayDefault,
  calculateHighlightStyle,
  calculateTooltipStyle,
  getComponentInfo,
  shouldIgnoreElement,
} from './SelectionOverlay';

export type {
  SelectionOverlayProps,
  Position,
  HighlightStyle,
  TooltipStyle,
  HoveredElementInfo,
} from './SelectionOverlay';

// ============================================
// ELEMENT HIGHLIGHT
// ============================================
export {
  ElementHighlight,
  default as ElementHighlightDefault,
} from './ElementHighlight';

export type {
  ElementHighlightProps,
  HighlightVariant,
  HighlightAnimation,
} from './ElementHighlight';

// ============================================
// ELEMENT TOOLTIP
// ============================================
export {
  ElementTooltip,
  default as ElementTooltipDefault,
  extractElementInfo,
} from './ElementTooltip';

export type {
  ElementTooltipProps,
  ElementInfo,
  TooltipVariant,
  TooltipPosition,
} from './ElementTooltip';
