import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

function withPagination(apiPath: string, offset: number, limit: number): string {
  const sep = apiPath.includes("?") ? "&" : "?";
  return `${apiPath}${sep}limit=${limit}&offset=${offset}`;
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
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    hasMore: true,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    if (!apiPath) {
      internalRef.current = { isLoading: false, offset: 0 };
      setResult({
        data: [],
        error: null,
        hasMore: false,
        isLoading: false,
      });
      return;
    }

    const { isLoading, offset } = internalRef.current;
    if (isLoading) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
    };

    const pagedPath = withPagination(apiPath, offset, LIMIT);

    void fetcher(pagedPath).then(
      (page) => {
        const nextOffset = offset + page.length;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...page],
          hasMore: page.length === LIMIT,
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: nextOffset,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          hasMore: false,
          isLoading: false,
        }));
        internalRef.current = {
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
      hasMore: true,
      isLoading: true,
    }));
    internalRef.current = {
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
