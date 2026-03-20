import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({ hasReachedEnd: false, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const createPaginatedPath = useCallback((offset: number) => {
    const url = new URL(apiPath, window.location.origin);
    url.searchParams.set("limit", String(LIMIT));
    url.searchParams.set("offset", String(offset));
    return `${url.pathname}${url.search}`;
  }, [apiPath]);

  const fetchMore = useCallback(() => {
    const { hasReachedEnd, isLoading, offset } = internalRef.current;
    if (apiPath === "" || hasReachedEnd || isLoading) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasReachedEnd,
      isLoading: true,
      offset,
    };

    void fetcher(createPaginatedPath(offset)).then(
      (nextData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...nextData],
          isLoading: false,
        }));
        internalRef.current = {
          hasReachedEnd: nextData.length < LIMIT,
          isLoading: false,
          offset: offset + LIMIT,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          hasReachedEnd,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, createPaginatedPath, fetcher]);

  useEffect(() => {
    if (apiPath === "") {
      setResult(() => ({
        data: [],
        error: null,
        isLoading: false,
      }));
      internalRef.current = {
        hasReachedEnd: true,
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
      hasReachedEnd: false,
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
