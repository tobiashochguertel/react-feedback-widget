/**
 * @file useApi hook
 *
 * Provides a typed API client instance using the current auth state.
 */

import { useMemo } from "react";
import { createApiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";

/**
 * Hook to get a typed API client with current auth credentials
 *
 * @example
 * const api = useApi();
 * const { data } = useQuery({
 *   queryKey: ["feedback-list"],
 *   queryFn: () => api.feedback.list({ page: 1 }),
 * });
 */
export function useApi() {
  const apiKey = useAuthStore((state) => state.apiKey);

  return useMemo(
    () =>
      createApiClient({
        baseUrl: "",
        apiKey: apiKey || undefined,
      }),
    [apiKey]
  );
}
