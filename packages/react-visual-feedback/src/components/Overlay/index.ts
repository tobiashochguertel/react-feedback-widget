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
  OverlayHighlightStyle,
  OverlayTooltipStyle,
  HoveredElementInfo,
} from './SelectionOverlay';

// Re-export with legacy names for backwards compatibility
export type { OverlayHighlightStyle as HighlightStyle } from './SelectionOverlay';
export type { OverlayTooltipStyle as TooltipStyle } from './SelectionOverlay';

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
  TooltipElementInfo,
  TooltipVariant,
  TooltipPosition,
} from './ElementTooltip';

// Re-export with legacy name for backwards compatibility
export type { TooltipElementInfo as ElementInfo } from './ElementTooltip';
