// src/hooks/useInfiniteScroll.js
import { useState, useCallback } from 'react';

/**
 * Hook for implementing infinite scroll / pagination
 */
export const useInfiniteScroll = (fetchFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  /**
   * Load initial data
   */
  const loadData = useCallback(async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchFunction({ 
        ...initialParams, 
        page: 1 
      });

      setData(response.data || []);
      setHasMore(response.hasMore || false);
      setPage(1);
    } catch (err) {
      setError(err);
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, initialParams]);

  /**
   * Load more data (pagination)
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      setError(null);

      const nextPage = page + 1;
      const response = await fetchFunction({ 
        ...initialParams, 
        page: nextPage 
      });

      setData(prev => [...prev, ...(response.data || [])]);
      setHasMore(response.hasMore || false);
      setPage(nextPage);
    } catch (err) {
      setError(err);
      console.error('Failed to load more:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, initialParams, page, hasMore, isLoading]);

  /**
   * Refresh data (pull to refresh)
   */
  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      setError(null);

      const response = await fetchFunction({ 
        ...initialParams, 
        page: 1 
      });

      setData(response.data || []);
      setHasMore(response.hasMore || false);
      setPage(1);
    } catch (err) {
      setError(err);
      console.error('Failed to refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFunction, initialParams]);

  return {
    data,
    isLoading,
    isRefreshing,
    hasMore,
    error,
    loadData,
    loadMore,
    refresh,
  };
};

export default useInfiniteScroll;
