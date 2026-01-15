/**
 * Status Registry
 *
 * Centralized registry for feedback status management.
 * Provides a single source of truth for status definitions,
 * mappings, and extensibility.
 *
 * @module registry/statusRegistry
 */

import {
  Inbox,
  AlertCircle,
  Play,
  Eye,
  PauseCircle,
  CheckCircle,
  Archive,
  Ban,
  XCircle,
  Lightbulb,
  Bug,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { StatusConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Status key identifier
 */
export type StatusKey =
  | 'new'
  | 'inProgress'
  | 'underReview'
  | 'onHold'
  | 'resolved'
  | 'closed'
  | 'wontFix'
  | string;

/**
 * Status mapping entry for normalization
 */
export interface StatusMapping {
  /** The source status value to map from */
  from: string;
  /** The target status key to map to */
  to: StatusKey;
}

/**
 * Complete status definition with all visual properties
 */
export interface StatusDefinition extends StatusConfig {
  /** Unique identifier for the status */
  key: StatusKey;
  /** Display order (lower = first) */
  order: number;
  /** Whether this status is a terminal state */
  isTerminal: boolean;
  /** Icon component for the status */
  iconComponent?: LucideIcon;
}

/**
 * Status registry configuration
 */
export interface StatusRegistryConfig {
  /** Default status key for new items */
  defaultStatus: StatusKey;
  /** Status definitions */
  statuses: StatusDefinition[];
  /** Status mappings for normalization */
  mappings: StatusMapping[];
}

// ============================================================================
// Default Status Definitions
// ============================================================================

/**
 * Default status definitions following standard feedback workflow
 */
export const DEFAULT_STATUSES: StatusDefinition[] = [
  {
    key: 'new',
    label: 'New',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    textColor: '#1d4ed8',
    icon: 'Inbox',
    iconComponent: Inbox,
    order: 1,
    isTerminal: false,
  },
  {
    key: 'inProgress',
    label: 'In Progress',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    textColor: '#b45309',
    icon: 'Play',
    iconComponent: Play,
    order: 2,
    isTerminal: false,
  },
  {
    key: 'underReview',
    label: 'Under Review',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    textColor: '#6d28d9',
    icon: 'Eye',
    iconComponent: Eye,
    order: 3,
    isTerminal: false,
  },
  {
    key: 'onHold',
    label: 'On Hold',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    textColor: '#374151',
    icon: 'PauseCircle',
    iconComponent: PauseCircle,
    order: 4,
    isTerminal: false,
  },
  {
    key: 'resolved',
    label: 'Resolved',
    color: '#10b981',
    bgColor: '#ecfdf5',
    textColor: '#047857',
    icon: 'CheckCircle',
    iconComponent: CheckCircle,
    order: 5,
    isTerminal: true,
  },
  {
    key: 'closed',
    label: 'Closed',
    color: '#64748b',
    bgColor: '#f1f5f9',
    textColor: '#475569',
    icon: 'Archive',
    iconComponent: Archive,
    order: 6,
    isTerminal: true,
  },
  {
    key: 'wontFix',
    label: "Won't Fix",
    color: '#ef4444',
    bgColor: '#fef2f2',
    textColor: '#dc2626',
    icon: 'XCircle',
    iconComponent: XCircle,
    order: 7,
    isTerminal: true,
  },
];

/**
 * Default status mappings for normalization
 */
export const DEFAULT_MAPPINGS: StatusMapping[] = [
  // New status aliases
  { from: 'reported', to: 'new' },
  { from: 'submitted', to: 'new' },
  { from: 'pending', to: 'new' },
  { from: 'open', to: 'new' },
  // In Progress aliases
  { from: 'doing', to: 'inProgress' },
  { from: 'in_progress', to: 'inProgress' },
  { from: 'started', to: 'inProgress' },
  { from: 'working', to: 'inProgress' },
  // Under Review aliases
  { from: 'review', to: 'underReview' },
  { from: 'under_review', to: 'underReview' },
  { from: 'reviewing', to: 'underReview' },
  // On Hold aliases
  { from: 'hold', to: 'onHold' },
  { from: 'on_hold', to: 'onHold' },
  { from: 'paused', to: 'onHold' },
  { from: 'blocked', to: 'onHold' },
  // Resolved aliases
  { from: 'done', to: 'resolved' },
  { from: 'fixed', to: 'resolved' },
  { from: 'completed', to: 'resolved' },
  // Closed aliases
  { from: 'archived', to: 'closed' },
  // Won't Fix aliases
  { from: 'rejected', to: 'wontFix' },
  { from: 'wont_fix', to: 'wontFix' },
  { from: 'cancelled', to: 'wontFix' },
  { from: 'canceled', to: 'wontFix' },
  { from: 'invalid', to: 'wontFix' },
];

// ============================================================================
// Feedback Type Definitions
// ============================================================================

/**
 * Feedback type icons for categorization
 */
export const FEEDBACK_TYPE_ICONS: Record<string, LucideIcon> = {
  bug: Bug,
  feature: Lightbulb,
  improvement: Zap,
  question: AlertCircle,
};

// ============================================================================
// Status Registry Class
// ============================================================================

/**
 * Status Registry
 *
 * Provides centralized management for feedback statuses with:
 * - Registration of custom statuses
 * - Status normalization with mappings
 * - Type-safe status lookups
 * - Extensibility for custom workflows
 *
 * @example
 * ```typescript
 * const registry = new StatusRegistry();
 *
 * // Register custom status
 * registry.registerStatus({
 *   key: 'testing',
 *   label: 'Testing',
 *   color: '#06b6d4',
 *   bgColor: '#ecfeff',
 *   textColor: '#0891b2',
 *   icon: 'Eye',
 *   order: 4.5,
 *   isTerminal: false,
 * });
 *
 * // Add mapping
 * registry.addMapping('qa', 'testing');
 *
 * // Normalize status
 * const normalized = registry.normalize('qa'); // 'testing'
 *
 * // Get status definition
 * const status = registry.get('testing');
 * ```
 */
export class StatusRegistry {
  private statuses: Map<StatusKey, StatusDefinition>;
  private mappings: Map<string, StatusKey>;
  private defaultStatus: StatusKey;

  constructor(config?: Partial<StatusRegistryConfig>) {
    this.statuses = new Map();
    this.mappings = new Map();
    this.defaultStatus = config?.defaultStatus ?? 'new';

    // Initialize with defaults or provided statuses
    const statusesToLoad = config?.statuses ?? DEFAULT_STATUSES;
    for (const status of statusesToLoad) {
      this.statuses.set(status.key, status);
    }

    // Initialize with defaults or provided mappings
    const mappingsToLoad = config?.mappings ?? DEFAULT_MAPPINGS;
    for (const mapping of mappingsToLoad) {
      this.mappings.set(mapping.from.toLowerCase(), mapping.to);
    }
  }

  /**
   * Get a status definition by key
   */
  get(key: StatusKey): StatusDefinition | undefined {
    return this.statuses.get(key);
  }

  /**
   * Get all registered statuses
   */
  getAll(): StatusDefinition[] {
    return Array.from(this.statuses.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get all non-terminal statuses
   */
  getActiveStatuses(): StatusDefinition[] {
    return this.getAll().filter((s) => !s.isTerminal);
  }

  /**
   * Get all terminal statuses
   */
  getTerminalStatuses(): StatusDefinition[] {
    return this.getAll().filter((s) => s.isTerminal);
  }

  /**
   * Register a new status
   */
  registerStatus(status: StatusDefinition): void {
    this.statuses.set(status.key, status);
  }

  /**
   * Unregister a status by key
   */
  unregisterStatus(key: StatusKey): boolean {
    return this.statuses.delete(key);
  }

  /**
   * Add a status mapping
   */
  addMapping(from: string, to: StatusKey): void {
    this.mappings.set(from.toLowerCase(), to);
  }

  /**
   * Remove a status mapping
   */
  removeMapping(from: string): boolean {
    return this.mappings.delete(from.toLowerCase());
  }

  /**
   * Normalize a status value to a registered status key
   */
  normalize(status: string | null | undefined): StatusKey {
    if (!status) {
      return this.defaultStatus;
    }

    const statusLower = status.toLowerCase();

    // Check if it's a direct status key
    if (this.statuses.has(status)) {
      return status as StatusKey;
    }

    // Check mappings
    const mapped = this.mappings.get(statusLower);
    if (mapped && this.statuses.has(mapped)) {
      return mapped;
    }

    // Return default if not found
    return this.defaultStatus;
  }

  /**
   * Check if a status key is registered
   */
  has(key: StatusKey): boolean {
    return this.statuses.has(key);
  }

  /**
   * Get the default status key
   */
  getDefault(): StatusKey {
    return this.defaultStatus;
  }

  /**
   * Set the default status key
   */
  setDefault(key: StatusKey): void {
    if (this.statuses.has(key)) {
      this.defaultStatus = key;
    }
  }

  /**
   * Convert to a simple Record for compatibility with existing code
   */
  toRecord(): Record<string, StatusConfig> {
    const record: Record<string, StatusConfig> = {};
    for (const [key, status] of this.statuses) {
      record[key] = {
        label: status.label,
        color: status.color,
        bgColor: status.bgColor,
        textColor: status.textColor,
        icon: status.icon,
      };
    }
    return record;
  }

  /**
   * Create a registry from a Record (for migration from existing code)
   */
  static fromRecord(
    statuses: Record<string, StatusConfig>,
    defaultStatus: StatusKey = 'new'
  ): StatusRegistry {
    const definitions: StatusDefinition[] = Object.entries(statuses).map(
      ([key, config], index) => ({
        key,
        label: config.label ?? key,
        color: config.color ?? '#6b7280',
        bgColor: config.bgColor ?? '#f3f4f6',
        textColor: config.textColor ?? '#374151',
        icon: config.icon ?? 'AlertCircle',
        order: index + 1,
        isTerminal: ['resolved', 'closed', 'wontFix'].includes(key),
      })
    );

    return new StatusRegistry({
      defaultStatus,
      statuses: definitions,
      mappings: DEFAULT_MAPPINGS,
    });
  }
}

// ============================================================================
// Default Registry Instance
// ============================================================================

/**
 * Default status registry instance
 * Use this for global status management or create your own for customization
 */
export const defaultStatusRegistry = new StatusRegistry();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a custom status registry with additional statuses
 */
export function createStatusRegistry(
  customStatuses?: StatusDefinition[],
  customMappings?: StatusMapping[]
): StatusRegistry {
  const statuses = customStatuses
    ? [...DEFAULT_STATUSES, ...customStatuses]
    : DEFAULT_STATUSES;

  const mappings = customMappings
    ? [...DEFAULT_MAPPINGS, ...customMappings]
    : DEFAULT_MAPPINGS;

  return new StatusRegistry({ statuses, mappings });
}

/**
 * Merge custom status config with defaults
 */
export function mergeStatusConfig(
  custom: Record<string, Partial<StatusConfig>>
): Record<string, StatusConfig> {
  const registry = new StatusRegistry();
  const result = registry.toRecord();

  for (const [key, config] of Object.entries(custom)) {
    if (result[key]) {
      result[key] = { ...result[key], ...config };
    } else {
      result[key] = {
        label: config.label ?? key,
        color: config.color ?? '#6b7280',
        bgColor: config.bgColor ?? '#f3f4f6',
        textColor: config.textColor ?? '#374151',
        icon: config.icon ?? 'AlertCircle',
      };
    }
  }

  return result;
}
