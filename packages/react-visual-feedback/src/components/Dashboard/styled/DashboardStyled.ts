/**
 * Dashboard Styled Components
 *
 * All styled-components extracted from FeedbackDashboard.tsx
 * for better organization and reusability.
 *
 * @module components/Dashboard/styled/DashboardStyled
 */

import styled from 'styled-components';
import { fadeIn, slideInRight, slideDown } from '../../../theme';

// ============================================
// BACKDROP & PANEL
// ============================================

export const DashboardBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: ${props => props.theme.colors.backdropBg};
  z-index: 9998;
  animation: ${fadeIn} 0.2s ease-out;
  backdrop-filter: blur(2px);
`;

export const DashboardPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 600px;
  background-color: ${props => props.theme.colors.modalBg};
  z-index: 9999;
  box-shadow: -8px 0 32px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  animation: ${slideInRight} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

// ============================================
// HEADER COMPONENTS
// ============================================

export const DashboardHeader = styled.div`
  padding: 20px 24px;
  background: ${props => props.theme.colors.headerBg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
`;

export const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.textPrimary};
`;

export const CountBadge = styled.span`
  background: ${props => props.theme.colors.btnPrimaryBg};
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
`;

export const ActionsGroup = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  background: transparent;
  border-radius: 8px;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.hoverBg};
    color: ${props => props.theme.colors.textPrimary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ============================================
// FILTER BAR
// ============================================

export const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const SearchInput = styled.input`
  flex: 1;
  height: 36px;
  padding: 0 12px 0 36px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.textPrimary};
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.borderFocus};
  }
`;

export const SearchIconWrapper = styled.div`
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  pointer-events: none;
  color: ${props => props.theme.colors.textTertiary};
  display: flex;
  align-items: center;
`;

export const FilterSelect = styled.select`
  height: 36px;
  padding: 0 28px 0 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.textPrimary};
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;

  &:focus {
    border-color: ${props => props.theme.colors.borderFocus};
  }
`;

// ============================================
// CONTENT & LIST
// ============================================

export const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${props => props.theme.colors.contentBg};
  padding: 16px 24px;
`;

export const FeedbackListStyled = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// ============================================
// CARD COMPONENTS
// ============================================

export const Card = styled.div<{ $expanded: boolean }>`
  background: ${props => props.theme.colors.cardBg};
  border: 1px solid ${props => props.$expanded ? props.theme.colors.borderFocus : props.theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.$expanded ? props.theme.colors.borderFocus : props.theme.colors.textTertiary};
    box-shadow: 0 4px 12px ${props => props.theme.colors.shadow};
  }
`;

export const CardMain = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  padding: 16px;
  align-items: start;
`;

export const Thumbnail = styled.div`
  width: 64px;
  height: 48px;
  border-radius: 6px;
  background: ${props => props.theme.colors.hoverBg};
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: ${props => props.theme.colors.textTertiary};
  flex-shrink: 0;

  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CardContent = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const DateText = styled.span`
  font-size: 11px;
  color: ${props => props.theme.colors.textSecondary};
`;

export const FeedbackDescription = styled.p<{ $expanded: boolean }>`
  margin: 0;
  font-size: 14px;
  color: ${props => props.theme.colors.textPrimary};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.$expanded ? 'unset' : 2};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

// ============================================
// EXPANDED SECTION
// ============================================

export const ExpandedSection = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.hoverBg};
  padding: 16px;
  animation: ${slideDown} 0.2s ease-out;
`;

export const MediaViewer = styled.div`
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
  background: #000;

  img {
    width: 100%;
    max-height: 400px;
    object-fit: contain;
    display: block;
  }
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  font-size: 12px;
`;

export const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DetailLabel = styled.span`
  color: ${props => props.theme.colors.textTertiary};
  font-weight: 600;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.5px;
`;

export const DetailValue = styled.div`
  color: ${props => props.theme.colors.textPrimary};
  background: ${props => props.theme.colors.cardBg};
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme.colors.border};
  font-family: monospace;
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// ============================================
// EMPTY STATE
// ============================================

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.colors.textTertiary};
  gap: 12px;
`;

// ============================================
// VIDEO MODE
// ============================================

export const VideoModeBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 100000;
  animation: ${fadeIn} 0.2s ease-out;
`;

export const VideoModeContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100001;
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

export const VideoModeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

export const VideoModeTitle = styled.h2`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const VideoModeCloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export const VideoModeContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
  min-height: 0;
  height: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 300px;
  }
`;

export const VideoModePlayer = styled.div`
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
`;

export const VideoModeLogsPanel = styled.div`
  background: ${props => props.theme.mode === 'dark' ? '#0d1117' : '#f8fafc'};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
  border: 1px solid ${props => props.theme.mode === 'dark' ? '#30363d' : '#e2e8f0'};
  min-height: 0;
  height: 100%;
`;

export const VideoModeLogsHeader = styled.div`
  padding: 12px 16px;
  background: ${props => props.theme.mode === 'dark' ? '#161b22' : '#f1f5f9'};
  border-bottom: 1px solid ${props => props.theme.mode === 'dark' ? '#30363d' : '#e2e8f0'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

export const VideoModeLogsTitle = styled.h3`
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #7d8590;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const VideoModeLogsList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  background: ${props => props.theme.mode === 'dark' ? '#0d1117' : '#f8fafc'};
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  line-height: 1.5;
  min-height: 0;
  max-height: 100%;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.mode === 'dark' ? '#0d1117' : '#f1f5f9'};
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.mode === 'dark' ? '#30363d' : '#cbd5e1'};
    border-radius: 4px;
  }
`;

// ============================================
// UTILITY COMPONENTS
// ============================================

export const ExpandButton = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${props => props.theme.colors.textSecondary};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.hoverBg};
    color: ${props => props.theme.colors.textPrimary};
  }
`;
