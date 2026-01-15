/**
 * StatusDropdown - Dropdown menu for changing status
 *
 * Renders a button showing current status that opens a dropdown
 * menu with all available status options.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';
import {
  getIconComponent,
  normalizeStatusKey,
  getStatusData,
} from './StatusBadge';
import { dropdownSlideIn } from '../theme';
import { Z_INDEX, ANIMATION } from '../constants';
import type { StatusConfig, Theme } from '../types';

// ============================================================================
// Types
// ============================================================================

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (itemId: string, newStatus: string) => void;
  itemId: string;
  statuses?: Record<string, StatusConfig>;
  acceptableStatuses?: string[];
  theme: Theme;
}

interface DropdownButtonProps {
  $statusColor: string;
  $textColor: string;
  $bgColor: string;
}

interface DropdownItemProps {
  $isSelected: boolean;
  $bgColor: string;
  $textColor: string;
}

interface AnimatedChevronProps {
  $isOpen: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
}

// ============================================================================
// Styled Components
// ============================================================================

const DropdownContainer = styled.div`
  position: relative;
`;

const AnimatedChevron = styled(ChevronDown) <AnimatedChevronProps>`
  transition: transform 0.2s;
  transform: ${(props) => (props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

const DropdownButton = styled.button<DropdownButtonProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: transparent;
  border: 1.5px solid ${(props) => props.$statusColor};
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => props.$textColor};
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 140px;
  box-sizing: border-box;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    color: ${(props) => props.$statusColor};
  }

  span {
    flex: 1;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ${AnimatedChevron} {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    margin-left: auto;
    color: ${(props) => props.$textColor};
  }

  &:hover {
    background-color: ${(props) => props.$statusColor}10;
    border-color: ${(props) => props.$statusColor};
  }
`;

const DropdownMenu = styled.div`
  position: fixed;
  background-color: ${(props) =>
    props.theme.mode === 'dark' ? '#1e293b' : 'white'};
  border-radius: 12px;
  box-shadow: ${(props) =>
    props.theme.mode === 'dark'
      ? '0 10px 40px rgba(0, 0, 0, 0.5)'
      : '0 10px 40px rgba(0, 0, 0, 0.15)'};
  padding: 8px;
  z-index: ${Z_INDEX.STATUS_DROPDOWN};
  min-width: 180px;
  border: 1px solid ${(props) => props.theme.colors.border};
  animation: ${dropdownSlideIn} ${ANIMATION.FAST * 2}ms ease-out;
`;

const DropdownItem = styled.button<DropdownItemProps>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background-color: ${(props) =>
    props.$isSelected ? props.$bgColor : 'transparent'};
  color: ${(props) =>
    props.$isSelected ? props.$textColor : props.theme.colors.textPrimary};
  font-size: 13px;
  font-weight: ${(props) => (props.$isSelected ? '600' : '500')};
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;

  &:hover {
    background-color: ${(props) => props.$bgColor};
    color: ${(props) => props.$textColor};
  }
`;

// ============================================================================
// StatusDropdown Component
// ============================================================================

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  itemId,
  statuses = {},
  acceptableStatuses,
  theme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 180, // Align to right edge of button
      });
    }
  }, [isOpen]);

  // Handle empty or invalid statuses gracefully
  if (
    !statuses ||
    typeof statuses !== 'object' ||
    Object.keys(statuses).length === 0
  ) {
    return null;
  }

  // Filter statuses by acceptableStatuses if provided
  const visibleStatuses: Record<string, StatusConfig> =
    acceptableStatuses &&
      Array.isArray(acceptableStatuses) &&
      acceptableStatuses.length > 0
      ? Object.fromEntries(
        Object.entries(statuses).filter(([key]) =>
          acceptableStatuses.includes(key)
        )
      )
      : statuses;

  if (Object.keys(visibleStatuses).length === 0) {
    return null;
  }

  const statusKey = normalizeStatusKey(currentStatus, visibleStatuses);
  const currentStatusData = getStatusData(statusKey, visibleStatuses);
  const IconComponent = getIconComponent(currentStatusData.icon);
  const { color, textColor, bgColor, label } = currentStatusData;

  return (
    <DropdownContainer>
      <DropdownButton
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        $statusColor={color}
        $textColor={textColor}
        $bgColor={bgColor}
      >
        <IconComponent size={14} />
        <span>{label}</span>
        <AnimatedChevron size={14} $isOpen={isOpen} />
      </DropdownButton>

      {isOpen &&
        createPortal(
          <DropdownMenu
            ref={dropdownRef}
            theme={theme}
            style={{ top: menuPosition.top, left: menuPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.entries(visibleStatuses).map(([key, data]) => {
              if (!data || typeof data !== 'object') return null;
              const itemData = getStatusData(key, visibleStatuses);
              const Icon = getIconComponent(itemData.icon);
              const isSelected = statusKey === key;
              return (
                <DropdownItem
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(itemId, key);
                    setIsOpen(false);
                  }}
                  $isSelected={isSelected}
                  $bgColor={itemData.bgColor}
                  $textColor={itemData.textColor}
                  theme={theme}
                >
                  <Icon size={16} />
                  <span>{itemData.label}</span>
                </DropdownItem>
              );
            })}
          </DropdownMenu>,
          document.body
        )}
    </DropdownContainer>
  );
};
