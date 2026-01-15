/**
 * Dashboard Header Component
 *
 * Header with title, count badge, refresh/close buttons, search, and filter controls.
 *
 * @module components/Dashboard/DashboardHeaderComponent
 */

import React, { type ChangeEvent } from 'react';
import { X, RefreshCw, Search } from 'lucide-react';
import {
  DashboardHeader,
  HeaderTop,
  TitleGroup,
  HeaderTitle,
  CountBadge,
  ActionsGroup,
  ActionButton,
  FilterBar,
  SearchInput,
  SearchIconWrapper,
  FilterSelect,
} from './styled';
import type { StatusConfigs } from '../../types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DashboardHeaderProps {
  /** Dashboard title */
  title: string;
  /** Total count of items */
  count: number;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Callback when refresh button is clicked */
  onRefresh: () => void;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Current search query value */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Current filter status value */
  filterStatus: string;
  /** Callback when filter status changes */
  onFilterChange: (status: string) => void;
  /** Available status configurations for filter dropdown */
  statuses: StatusConfigs;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Dashboard header with title, actions, and filter controls.
 */
export const DashboardHeaderComponent: React.FC<DashboardHeaderProps> = ({
  title,
  count,
  isLoading,
  onRefresh,
  onClose,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  statuses,
}) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(e.target.value);
  };

  return (
    <DashboardHeader>
      <HeaderTop>
        <TitleGroup>
          <HeaderTitle>{title}</HeaderTitle>
          <CountBadge>{count}</CountBadge>
        </TitleGroup>
        <ActionsGroup>
          <ActionButton onClick={onRefresh} title="Refresh">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </ActionButton>
          <ActionButton onClick={onClose} title="Close">
            <X size={20} />
          </ActionButton>
        </ActionsGroup>
      </HeaderTop>

      <FilterBar>
        <div style={{ position: 'relative', flex: 1 }}>
          <SearchIconWrapper><Search size={14} /></SearchIconWrapper>
          <SearchInput
            placeholder="Search feedback, ID, type..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <FilterSelect
          value={filterStatus}
          onChange={handleFilterChange}
        >
          <option value="all">All Status</option>
          {Object.entries(statuses).map(([statusKey, status]) => (
            <option key={statusKey} value={statusKey}>{status.label}</option>
          ))}
        </FilterSelect>
      </FilterBar>
    </DashboardHeader>
  );
};
