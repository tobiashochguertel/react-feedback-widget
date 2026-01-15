/**
 * Registry Module
 *
 * Centralized registries for extensible component configuration.
 * Provides patterns for registering and managing:
 * - Statuses
 * - (Future: Icons, Themes, etc.)
 *
 * @module registry
 */

// Status Registry
export {
  StatusRegistry,
  defaultStatusRegistry,
  createStatusRegistry,
  mergeStatusConfig,
  DEFAULT_STATUSES,
  DEFAULT_MAPPINGS,
  FEEDBACK_TYPE_ICONS,
  type StatusKey,
  type StatusMapping,
  type StatusDefinition,
  type StatusRegistryConfig,
} from './statusRegistry';
