/**
 * React Query Hooks
 *
 * Custom hooks for data fetching with React Query:
 * - useFeedbackList with filters
 * - useFeedback for single item
 * - useStats for dashboard
 * - useUpdateFeedback mutation
 * - useDeleteFeedback mutation
 *
 * TASK-WUI-020
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useApi } from './useApi';
import type {
  Feedback,
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  PaginatedFeedbackList,
  DashboardStats,
  FeedbackListParams,
} from '@/types/api';
import { ApiError } from '@/lib/api/client';
import { useNotifications } from '@/stores';

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  all: ['feedback'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (params: FeedbackListParams) => [...queryKeys.lists(), params] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
  stats: () => [...queryKeys.all, 'stats'] as const,
  health: () => ['health'] as const,
};

// ============================================================================
// Feedback List Hook
// ============================================================================

export interface UseFeedbackListOptions {
  /** Filter parameters */
  params?: FeedbackListParams | undefined;
  /** React Query options */
  options?: Omit<
    UseQueryOptions<PaginatedFeedbackList, ApiError>,
    'queryKey' | 'queryFn'
  > | undefined;
}

/**
 * Hook for fetching paginated feedback list with filters
 *
 * @example
 * const { data, isLoading, error } = useFeedbackList({
 *   params: { page: 1, limit: 10, status: 'pending' },
 * });
 */
export function useFeedbackList(args: UseFeedbackListOptions = {}) {
  const { params = {}, options } = args;
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: () => api.feedback.list(params),
    ...options,
  });
}

// ============================================================================
// Single Feedback Hook
// ============================================================================

export interface UseFeedbackOptions {
  /** Feedback ID */
  id: string;
  /** React Query options */
  options?: Omit<
    UseQueryOptions<Feedback, ApiError>,
    'queryKey' | 'queryFn'
  > | undefined;
}

/**
 * Hook for fetching a single feedback item
 *
 * @example
 * const { data: feedback, isLoading } = useFeedback({ id: '123' });
 */
export function useFeedback({ id, options }: UseFeedbackOptions) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => api.feedback.get(id),
    enabled: !!id,
    ...options,
  });
}

// ============================================================================
// Dashboard Stats Hook
// ============================================================================

export interface UseStatsOptions {
  /** React Query options */
  options?: Omit<
    UseQueryOptions<DashboardStats, ApiError>,
    'queryKey' | 'queryFn'
  > | undefined;
}

/**
 * Hook for fetching dashboard statistics
 *
 * @example
 * const { data: stats, isLoading } = useStats();
 */
export function useStats(args: UseStatsOptions = {}) {
  const { options } = args;
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: () => api.feedback.stats(),
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

// ============================================================================
// Health Check Hook
// ============================================================================

/**
 * Hook for checking API health
 *
 * @example
 * const { data, isError } = useHealthCheck();
 */
export function useHealthCheck() {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: () => api.health.check(),
    staleTime: 1000 * 30, // 30 seconds
    retry: 3,
    retryDelay: 1000,
  });
}

// ============================================================================
// Create Feedback Mutation
// ============================================================================

export interface UseCreateFeedbackOptions {
  /** Show success notification (default: true) */
  showSuccessNotification?: boolean | undefined;
  /** Show error notification (default: true) */
  showErrorNotification?: boolean | undefined;
}

/**
 * Hook for creating a new feedback item
 *
 * Automatically invalidates list and stats queries on success.
 * Shows toast notifications by default (can be disabled).
 *
 * @example
 * const { mutate: createFeedback, isPending } = useCreateFeedback();
 *
 * createFeedback(
 *   { title: 'Bug Report', type: 'bug' },
 *   {
 *     onSuccess: (data) => console.log('Created:', data.id),
 *     onError: (error) => console.error('Failed:', error.message),
 *   }
 * );
 */
export function useCreateFeedback(options: UseCreateFeedbackOptions = {}) {
  const { showSuccessNotification = true, showErrorNotification = true } =
    options;
  const api = useApi();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();

  return useMutation<Feedback, ApiError, CreateFeedbackRequest>({
    mutationFn: (data) => api.feedback.create(data),
    onSuccess: (data) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });

      if (showSuccessNotification) {
        success('Feedback Created', `Feedback "${data.title}" was created`);
      }
    },
    onError: (err) => {
      if (showErrorNotification) {
        showError('Failed to Create Feedback', err.message);
      }
    },
  });
}

// ============================================================================
// Update Feedback Mutation
// ============================================================================

export interface UseUpdateFeedbackOptions {
  /** Show success notification (default: true) */
  showSuccessNotification?: boolean | undefined;
  /** Show error notification (default: true) */
  showErrorNotification?: boolean | undefined;
}

type UpdateVariables = { id: string; data: UpdateFeedbackRequest };
type UpdateContext = { previousFeedback: Feedback | undefined };

/**
 * Hook for updating a feedback item
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Cache invalidation on success
 * - Toast notifications
 *
 * @example
 * const { mutate: updateFeedback, isPending } = useUpdateFeedback();
 *
 * updateFeedback(
 *   { id: '123', data: { status: 'resolved' } },
 *   { onSuccess: () => console.log('Updated!') }
 * );
 */
export function useUpdateFeedback(options: UseUpdateFeedbackOptions = {}) {
  const { showSuccessNotification = true, showErrorNotification = true } =
    options;
  const api = useApi();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();

  return useMutation<Feedback, ApiError, UpdateVariables, UpdateContext>({
    mutationFn: ({ id, data }) => api.feedback.update(id, data),
    onMutate: async ({ id, data }): Promise<UpdateContext> => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.detail(id) });

      // Snapshot the previous value
      const previousFeedback = queryClient.getQueryData<Feedback>(
        queryKeys.detail(id)
      );

      // Optimistically update the cache
      if (previousFeedback) {
        queryClient.setQueryData<Feedback>(queryKeys.detail(id), {
          ...previousFeedback,
          ...data,
        });
      }

      return { previousFeedback };
    },
    onSuccess: (data, variables) => {
      // Update the detail cache with server response
      queryClient.setQueryData(queryKeys.detail(variables.id), data);
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });

      if (showSuccessNotification) {
        success('Feedback Updated', 'Changes have been saved');
      }
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value
      if (context?.previousFeedback) {
        queryClient.setQueryData(
          queryKeys.detail(variables.id),
          context.previousFeedback
        );
      }

      if (showErrorNotification) {
        showError('Failed to Update Feedback', err.message);
      }
    },
  });
}

// ============================================================================
// Delete Feedback Mutation
// ============================================================================

export interface UseDeleteFeedbackOptions {
  /** Show success notification (default: true) */
  showSuccessNotification?: boolean | undefined;
  /** Show error notification (default: true) */
  showErrorNotification?: boolean | undefined;
}

/**
 * Hook for deleting a feedback item
 *
 * @example
 * const { mutate: deleteFeedback, isPending } = useDeleteFeedback();
 *
 * deleteFeedback('123', {
 *   onSuccess: () => navigate('/feedback'),
 * });
 */
export function useDeleteFeedback(options: UseDeleteFeedbackOptions = {}) {
  const { showSuccessNotification = true, showErrorNotification = true } =
    options;
  const api = useApi();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => api.feedback.delete(id),
    onSuccess: (_, id) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: queryKeys.detail(id) });
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });

      if (showSuccessNotification) {
        success('Feedback Deleted', 'The feedback item has been removed');
      }
    },
    onError: (err) => {
      if (showErrorNotification) {
        showError('Failed to Delete Feedback', err.message);
      }
    },
  });
}

// ============================================================================
// Bulk Operations
// ============================================================================

export interface UseBulkDeleteFeedbackOptions {
  /** Show success notification (default: true) */
  showSuccessNotification?: boolean | undefined;
  /** Show error notification (default: true) */
  showErrorNotification?: boolean | undefined;
}

/**
 * Hook for bulk deleting feedback items
 *
 * @example
 * const { mutate: bulkDelete, isPending } = useBulkDeleteFeedback();
 * bulkDelete(['123', '456', '789']);
 */
export function useBulkDeleteFeedback(
  options: UseBulkDeleteFeedbackOptions = {}
) {
  const { showSuccessNotification = true, showErrorNotification = true } =
    options;
  const api = useApi();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();

  return useMutation<void[], ApiError, string[]>({
    mutationFn: async (ids) => {
      return Promise.all(ids.map((id) => api.feedback.delete(id)));
    },
    onSuccess: (_, ids) => {
      // Remove from detail cache
      ids.forEach((id) => {
        queryClient.removeQueries({ queryKey: queryKeys.detail(id) });
      });
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });

      if (showSuccessNotification) {
        success(
          'Feedback Items Deleted',
          `${ids.length} items have been removed`
        );
      }
    },
    onError: (err) => {
      if (showErrorNotification) {
        showError('Failed to Delete Items', err.message);
      }
    },
  });
}

// ============================================================================
// Prefetch Helpers
// ============================================================================

/**
 * Prefetch a single feedback item
 *
 * @example
 * const prefetchFeedback = usePrefetchFeedback();
 *
 * // On hover
 * <Link onMouseEnter={() => prefetchFeedback(id)}>View</Link>
 */
export function usePrefetchFeedback() {
  const api = useApi();
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.detail(id),
      queryFn: () => api.feedback.get(id),
    });
  };
}

/**
 * Prefetch the next page of feedback
 *
 * @example
 * const prefetchList = usePrefetchFeedbackList();
 *
 * // Prefetch next page
 * prefetchList({ page: currentPage + 1, limit: 10 });
 */
export function usePrefetchFeedbackList() {
  const api = useApi();
  const queryClient = useQueryClient();

  return (params: FeedbackListParams) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.list(params),
      queryFn: () => api.feedback.list(params),
    });
  };
}
