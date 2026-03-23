import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

function consumeInitialData<T>(cacheKey: string): T[] | null {
  const store = (window as unknown as { __INITIAL_DATA__?: Record<string, unknown> })
    .__INITIAL_DATA__;
  if (store && cacheKey in store) {
    const data = store[cacheKey] as T[];
    delete store[cacheKey];
    return data;
  }
  return null;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0 });
  const usedInitialDataRef = useRef(false);

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>(() => {
    // Check for server-injected initial data
    const separator = apiPath.includes("?") ? "&" : "?";
    const cacheKey = `${apiPath}${separator}limit=${LIMIT}&offset=0`;
    const cached = consumeInitialData<T>(cacheKey);
    if (cached != null) {
      internalRef.current = { isLoading: false, offset: LIMIT };
      usedInitialDataRef.current = true;
      return {
        data: cached,
        error: null,
        isLoading: false,
      };
    }
    return {
      data: [],
      error: null,
      isLoading: true,
    };
  });

  const fetchMore = useCallback(() => {
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

    if (!apiPath) {
      return;
    }

    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedUrl = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(paginatedUrl).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
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
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    // Skip initial fetch if we already consumed server-injected data
    if (usedInitialDataRef.current) {
      usedInitialDataRef.current = false;
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
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
