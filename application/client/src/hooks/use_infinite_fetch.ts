import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { SSRDataContext } from "@web-speed-hackathon-2026/client/src/contexts/SSRDataContext";

const LIMIT = 30;

interface Options {
  initialLimit?: number;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  hasMore: boolean;
  isLoading: boolean;
  fetchMore: () => void;
  reset: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options?: Options,
): ReturnValues<T> {
  const initialLimit = options?.initialLimit;
  const ssrData = useContext(SSRDataContext);
  const ssrValue = ssrData?.[apiPath] as T[] | undefined;
  const skipRef = useRef(ssrValue !== undefined);
  const isFirstFetchRef = useRef(true);
  const [resetKey, setResetKey] = useState(0);

  const internalRef = useRef({
    hasMore: ssrValue !== undefined ? ssrValue.length >= (initialLimit ?? LIMIT) : true,
    isLoading: false,
    offset: ssrValue !== undefined ? ssrValue.length : 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore" | "reset">>({
    data: ssrValue !== undefined ? ssrValue : [],
    error: null,
    hasMore: ssrValue !== undefined ? ssrValue.length >= (initialLimit ?? LIMIT) : true,
    isLoading: ssrValue !== undefined ? false : true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    const currentLimit = isFirstFetchRef.current && initialLimit != null ? initialLimit : LIMIT;

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      ...internalRef.current,
      isLoading: true,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${currentLimit}&offset=${offset}`;

    void fetcher(paginatedPath).then(
      (pageData) => {
        const newHasMore = pageData.length >= currentLimit;
        isFirstFetchRef.current = false;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          hasMore: newHasMore,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: newHasMore,
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
          ...internalRef.current,
          isLoading: false,
        };
      },
    );
  }, [apiPath, fetcher, initialLimit]);

  const reset = useCallback(() => {
    setResult({
      data: [],
      error: null,
      hasMore: true,
      isLoading: true,
    });
    internalRef.current = {
      hasMore: true,
      isLoading: false,
      offset: 0,
    };
    isFirstFetchRef.current = true;
    setResetKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
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
  }, [fetchMore, resetKey]);

  return {
    ...result,
    fetchMore,
    reset,
  };
}
