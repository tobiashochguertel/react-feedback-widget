/**
 * @file Hooks exports
 *
 * Central export point for all custom hooks.
 */

export { useApi } from "./useApi";

// React Query hooks
export {
  useFeedbackList,
  useFeedback,
  useStats,
  useHealthCheck,
  useCreateFeedback,
  useUpdateFeedback,
  useDeleteFeedback,
  useBulkDeleteFeedback,
  usePrefetchFeedback,
  usePrefetchFeedbackList,
  queryKeys,
} from "./useFeedback";
export type {
  UseFeedbackListOptions,
  UseFeedbackOptions,
  UseStatsOptions,
  UseCreateFeedbackOptions,
  UseUpdateFeedbackOptions,
  UseDeleteFeedbackOptions,
  UseBulkDeleteFeedbackOptions,
} from "./useFeedback";
