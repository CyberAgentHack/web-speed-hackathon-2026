import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 5;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  hasMore: boolean;
  isLoading: boolean;
  fetchMore: () => void;
}

function buildPaginatedPath(basePath: string, offset: number) {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}offset=${offset}&limit=${LIMIT}`;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    hasMore: true,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (!apiPath || isLoading || !hasMore) {
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

    const paginatedPath = buildPaginatedPath(apiPath, offset);
    void fetcher(paginatedPath).then(
      (page) => {
        const nextOffset = offset + page.length;
        const nextHasMore = page.length === LIMIT;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...page],
          hasMore: nextHasMore,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: nextHasMore,
          isLoading: false,
          offset: nextOffset,
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
  }, [apiPath, fetcher]);

  useEffect(() => {
    setResult(() => ({
      data: [],
      error: null,
      hasMore: apiPath !== "",
      isLoading: apiPath !== "",
    }));
    internalRef.current = {
      hasMore: apiPath !== "",
      isLoading: false,
      offset: 0,
    };

    if (apiPath) {
      fetchMore();
    }
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
