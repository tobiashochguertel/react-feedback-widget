/**
 * Status-related constants
 *
 * @packageDocumentation
 */

import type { StatusConfigs } from '../types';

/**
 * Default status configurations for feedback items
 *
 * These statuses follow a typical issue lifecycle:
 * new → open → inProgress → underReview → resolved → closed
 */
export const DEFAULT_STATUSES: StatusConfigs = {
  new: {
    key: 'new',
    label: 'New',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    textColor: '#6d28d9',
    icon: 'Inbox',
  },
  open: {
    key: 'open',
    label: 'Open',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    textColor: '#92400e',
    icon: 'AlertCircle',
  },
  inProgress: {
    key: 'inProgress',
    label: 'In Progress',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    textColor: '#1e40af',
    icon: 'Play',
  },
  underReview: {
    key: 'underReview',
    label: 'Under Review',
    color: '#06b6d4',
    bgColor: '#cffafe',
    textColor: '#0e7490',
    icon: 'Eye',
  },
  resolved: {
    key: 'resolved',
    label: 'Resolved',
    color: '#10b981',
    bgColor: '#d1fae5',
    textColor: '#065f46',
    icon: 'CheckCircle',
  },
  closed: {
    key: 'closed',
    label: 'Closed',
    color: '#64748b',
    bgColor: '#e2e8f0',
    textColor: '#334155',
    icon: 'Archive',
  },
};

/**
 * Status keys in order of lifecycle progression
 */
export const STATUS_LIFECYCLE_ORDER = [
  'new',
  'open',
  'inProgress',
  'underReview',
  'resolved',
  'closed',
] as const;

/**
 * Type for valid status keys
 */
export type StatusKey = keyof typeof DEFAULT_STATUSES;

/**
 * Type for status lifecycle order
 */
export type StatusLifecycleKey = (typeof STATUS_LIFECYCLE_ORDER)[number];
