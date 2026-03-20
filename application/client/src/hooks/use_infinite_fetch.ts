import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

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
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true, requestId: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    hasMore: true,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    if (!apiPath) {
      return;
    }

    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    internalRef.current = {
      ...internalRef.current,
      isLoading: true,
    };
    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));

    const currentRequestId = ++internalRef.current.requestId;
    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(paginatedPath).then(
      (pageData) => {
        if (currentRequestId !== internalRef.current.requestId) {
          return;
        }
        const newHasMore = pageData.length >= LIMIT;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          hasMore: newHasMore,
          isLoading: false,
        }));
        internalRef.current = {
          ...internalRef.current,
          isLoading: false,
          offset: offset + pageData.length,
          hasMore: newHasMore,
        };
      },
      (error) => {
        if (currentRequestId !== internalRef.current.requestId) {
          return;
        }
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          ...internalRef.current,
          isLoading: false,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
      requestId: internalRef.current.requestId + 1,
    };

    if (!apiPath) {
      setResult({ data: [], error: null, hasMore: false, isLoading: false });
      return;
    }

    setResult({ data: [], error: null, hasMore: true, isLoading: true });
    fetchMore();
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
