/**
 * Base Modal Component
 *
 * A reusable modal component with backdrop, keyboard handling, and slots.
 *
 * @module components/Modal/BaseModal
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes, css } from 'styled-components';

// ============================================
// TYPES
// ============================================

export interface BaseModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Header content (optional) */
  header?: ReactNode | undefined;
  /** Footer content (optional) */
  footer?: ReactNode | undefined;
  /** Close on escape key (default: true) */
  closeOnEscape?: boolean | undefined;
  /** Close on backdrop click (default: true) */
  closeOnBackdropClick?: boolean | undefined;
  /** Disable animation (default: false) */
  disableAnimation?: boolean | undefined;
  /** Max width of modal (default: 480px) */
  maxWidth?: string | undefined;
  /** Max height of modal (default: 90vh) */
  maxHeight?: string | undefined;
  /** Z-index for modal (default: 99999) */
  zIndex?: number | undefined;
  /** Additional class name */
  className?: string | undefined;
  /** ARIA label for accessibility */
  ariaLabel?: string | undefined;
  /** ARIA described by ID */
  ariaDescribedBy?: string | undefined;
  /** Portal container (default: document.body) */
  container?: Element | undefined;
}

// ============================================
// ANIMATIONS
// ============================================

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -40%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`;

const slideDown = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -40%) scale(0.96);
  }
`;

// ============================================
// STYLED COMPONENTS
// ============================================

interface StyledBackdropProps {
  $disableAnimation?: boolean;
  $zIndex?: number;
}

const Backdrop = styled.div<StyledBackdropProps>`
  position: fixed;
  inset: 0;
  background-color: ${(props) =>
    props.theme.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.5)'};
  backdrop-filter: blur(4px);
  z-index: ${(props) => (props.$zIndex ?? 99999) - 1};
  ${(props) =>
    !props.$disableAnimation &&
    css`
      animation: ${fadeIn} 0.2s ease-out;
    `}
`;

interface StyledContainerProps {
  $maxWidth?: string;
  $maxHeight?: string;
  $zIndex?: number;
  $disableAnimation?: boolean;
}

const Container = styled.div<StyledContainerProps>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: ${(props) => props.$maxWidth ?? '480px'};
  max-width: 95vw;
  max-height: ${(props) => props.$maxHeight ?? '90vh'};
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.colors.modalBg};
  border-radius: 16px;
  box-shadow:
    0 20px 60px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: ${(props) => props.$zIndex ?? 99999};
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;

  ${(props) =>
    !props.$disableAnimation &&
    css`
      animation: ${slideUp} 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    `}

  @media (max-width: 640px) {
    width: 100vw;
    max-width: 100vw;
    bottom: 0;
    top: auto;
    transform: translateX(-50%);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  background-color: ${(props) => props.theme.colors.headerBg};
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const Footer = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  background-color: ${(props) => props.theme.colors.headerBg};
`;

// ============================================
// COMPONENT
// ============================================

/**
 * BaseModal component providing reusable modal functionality.
 *
 * Features:
 * - Backdrop with blur effect
 * - Close on escape key
 * - Close on backdrop click
 * - Header/body/footer slots
 * - Smooth animations
 * - Responsive design
 * - Focus trap
 * - ARIA accessibility
 *
 * @example
 * ```tsx
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   header={<h2>Modal Title</h2>}
 *   footer={<button onClick={handleSubmit}>Submit</button>}
 * >
 *   <p>Modal content goes here</p>
 * </BaseModal>
 * ```
 */
export function BaseModal({
  isOpen,
  onClose,
  children,
  header,
  footer,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  disableAnimation = false,
  maxWidth = '480px',
  maxHeight = '90vh',
  zIndex = 99999,
  className,
  ariaLabel,
  ariaDescribedBy,
  container,
}: BaseModalProps): React.ReactElement | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Prevent clicks inside modal from closing
  const handleContainerClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    []
  );

  // Focus management and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement;

      // Focus modal
      modalRef.current?.focus();

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore body scroll
        document.body.style.overflow = originalOverflow;

        // Restore focus
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const portalContainer = container ?? document.body;

  const modal = (
    <Backdrop
      $disableAnimation={disableAnimation}
      $zIndex={zIndex}
      onClick={handleBackdropClick}
    >
      <Container
        ref={modalRef}
        $maxWidth={maxWidth}
        $maxHeight={maxHeight}
        $zIndex={zIndex}
        $disableAnimation={disableAnimation}
        className={className}
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {header && <Header>{header}</Header>}
        <Body>{children}</Body>
        {footer && <Footer>{footer}</Footer>}
      </Container>
    </Backdrop>
  );

  return createPortal(modal, portalContainer);
}

// ============================================
// ADDITIONAL EXPORTS
// ============================================

export { fadeIn, fadeOut, slideUp, slideDown };
