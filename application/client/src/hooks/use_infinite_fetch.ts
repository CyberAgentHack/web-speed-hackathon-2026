import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

export interface InfiniteFetchPage<T> {
  items: T[];
  hasMore: boolean;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

function normalizePage<T>(value: T[] | InfiniteFetchPage<T>): InfiniteFetchPage<T> {
  if (Array.isArray(value)) {
    return {
      items: value,
      hasMore: value.length === LIMIT,
    };
  }

  return value;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (
    apiPath: string,
    params: { limit: number; offset: number },
  ) => Promise<T[] | InfiniteFetchPage<T>>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true, requestId: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore, requestId } = internalRef.current;
    if (apiPath === "" || isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      hasMore,
      requestId,
    };

    void fetcher(apiPath, { limit: LIMIT, offset }).then(
      (response) => {
        if (internalRef.current.requestId !== requestId) {
          return;
        }

        const pageData = normalizePage(response);
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData.items],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + pageData.items.length,
          hasMore: pageData.hasMore,
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
          isLoading: false,
          offset,
          hasMore,
          requestId,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    const nextRequestId = internalRef.current.requestId + 1;

    if (apiPath === "") {
      setResult({
        data: [],
        error: null,
        isLoading: false,
      });
      internalRef.current = {
        isLoading: false,
        offset: 0,
        hasMore: false,
        requestId: nextRequestId,
      };
      return;
    }

    setResult({
      data: [],
      error: null,
      isLoading: true,
    });
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
      requestId: nextRequestId,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
