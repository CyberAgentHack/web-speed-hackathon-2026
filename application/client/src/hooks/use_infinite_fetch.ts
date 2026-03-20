import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  hasMore: boolean;
  fetchMore: () => void;
}

interface UseInfiniteFetchOptions {
  limit?: number;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit == null || !Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.floor(limit);
}

function buildPaginatedApiPath(apiPath: string, limit: number, offset: number): string {
  const url = new URL(apiPath, window.location.origin);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  return `${url.pathname}${url.search}`;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options: UseInfiniteFetchOptions = {},
): ReturnValues<T> {
  const limit = normalizeLimit(options.limit);
  const internalRef = useRef({ hasMore: true, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    hasMore: true,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
    };

    const paginatedApiPath = buildPaginatedApiPath(apiPath, limit, offset);

    void fetcher(paginatedApiPath).then(
      (nextItems) => {
        const fetchedCount = nextItems.length;
        const nextOffset = offset + fetchedCount;
        const hasMoreAfterFetch = fetchedCount >= limit;

        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...nextItems],
          error: null,
          hasMore: hasMoreAfterFetch,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: hasMoreAfterFetch,
          isLoading: false,
          offset: nextOffset,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          hasMore,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, fetcher, limit]);

  useEffect(() => {
    if (apiPath === "") {
      setResult(() => ({
        data: [],
        error: null,
        hasMore: false,
        isLoading: false,
      }));
      internalRef.current = {
        hasMore: false,
        isLoading: false,
        offset: 0,
      };
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      hasMore: true,
      isLoading: false,
    }));
    internalRef.current = {
      hasMore: true,
      isLoading: false,
      offset: 0,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
