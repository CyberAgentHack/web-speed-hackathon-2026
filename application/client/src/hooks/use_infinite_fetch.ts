import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

interface Options {
  enabled?: boolean;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  hasMore: boolean;
  isLoading: boolean;
  fetchMore: () => void;
}

function appendPaginationParams(apiPath: string, limit: number, offset: number): string {
  const url = new URL(apiPath, window.location.origin);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  return `${url.pathname}${url.search}`;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options: Options = {},
): ReturnValues<T> {
  const enabled = options.enabled ?? true;
  const internalRef = useRef({
    hasMore: apiPath !== "" && enabled,
    isLoading: false,
    offset: 0,
    requestId: 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    hasMore: apiPath !== "" && enabled,
    isLoading: apiPath !== "" && enabled,
  });

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
    if (!enabled || !apiPath || !hasMore || isLoading) {
      return;
    }

    const requestId = internalRef.current.requestId + 1;
    setResult((cur) => ({
      ...cur,
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
      requestId,
    };

    void fetcher(appendPaginationParams(apiPath, LIMIT, offset)).then(
      (pageData) => {
        if (internalRef.current.requestId !== requestId) {
          return;
        }

        const nextHasMore = pageData.length === LIMIT;
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
          requestId,
        };
      },
      (error) => {
        if (internalRef.current.requestId !== requestId) {
          return;
        }

        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore,
          isLoading: false,
          offset,
          requestId,
        };
      },
    );
  }, [apiPath, enabled, fetcher]);

  useEffect(() => {
    internalRef.current = {
      hasMore: apiPath !== "" && enabled,
      isLoading: false,
      offset: 0,
      requestId: internalRef.current.requestId + 1,
    };

    setResult(() => ({
      data: [],
      error: null,
      hasMore: apiPath !== "" && enabled,
      isLoading: apiPath !== "" && enabled,
    }));

    if (!enabled || !apiPath) {
      return;
    }

    fetchMore();
  }, [apiPath, enabled, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
