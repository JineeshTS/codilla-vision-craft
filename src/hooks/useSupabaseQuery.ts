/**
 * Reusable hook for common Supabase query patterns
 * Provides consistent loading, error, and data management
 */

import { useState, useEffect, useCallback } from 'react';
import { logError } from '@/lib/errorTracking';

interface UseSupabaseQueryOptions<T> {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseSupabaseQueryReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for Supabase queries with automatic error handling and loading states
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  options: UseSupabaseQueryOptions<T> = {}
): UseSupabaseQueryReturn<T> {
  const { enabled = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const executeQuery = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      logError(error, { context: 'useSupabaseQuery' });
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, onSuccess, onError]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    loading,
    error,
    refetch: executeQuery,
  };
}
