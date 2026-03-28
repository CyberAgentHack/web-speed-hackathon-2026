import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

function withPagination(apiPath: string, limit: number, offset: number): string {
  const separator = apiPath.includes("?") ? "&" : "?";
  return `${apiPath}${separator}limit=${limit}&offset=${offset}`;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({ hasMore: true, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
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

    void fetcher(withPagination(apiPath, LIMIT, offset)).then(
      (pageData) => {
        const fetchedCount = pageData.length;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: fetchedCount === LIMIT,
          isLoading: false,
          offset: offset + fetchedCount,
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
    if (!apiPath) {
      setResult(() => ({
        data: [],
        error: null,
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
      isLoading: true,
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
