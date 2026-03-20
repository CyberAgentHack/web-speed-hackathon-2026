import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LIMIT = 12;

interface Options {
  enabled?: boolean;
  limit?: number;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  hasMore: boolean;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  { enabled = true, limit = DEFAULT_LIMIT }: Options = {},
): ReturnValues<T> {
  const internalRef = useRef({ hasMore: true, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    hasMore: true,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
    if (!apiPath || !enabled || isLoading || !hasMore) {
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

    const requestUrl = new URL(apiPath, window.location.origin);
    requestUrl.searchParams.set("limit", String(limit));
    requestUrl.searchParams.set("offset", String(offset));

    void fetcher(`${requestUrl.pathname}${requestUrl.search}`).then(
      (pageData) => {
        const nextHasMore = pageData.length === limit;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          hasMore: nextHasMore,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: nextHasMore,
          isLoading: false,
          offset: offset + pageData.length,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, enabled, fetcher, limit]);

  useEffect(() => {
    if (!apiPath || !enabled) {
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
      isLoading: true,
    }));
    internalRef.current = {
      hasMore: true,
      isLoading: false,
      offset: 0,
    };

    fetchMore();
  }, [apiPath, enabled, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
