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
  const internalRef = useRef({
    hasMore: true,
    isLoading: false,
    offset: 0,
    requestToken: 0,
  });

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

    const paginatedApiPath = `${apiPath}${apiPath.includes("?") ? "&" : "?"}limit=${LIMIT}&offset=${offset}`;
    const requestToken = internalRef.current.requestToken;
    internalRef.current = {
      ...internalRef.current,
      isLoading: true,
      offset,
    };
    setResult((cur) => ({
      ...cur,
      error: null,
      isLoading: true,
    }));

    void fetcher(paginatedApiPath).then(
      (pageData) => {
        if (requestToken !== internalRef.current.requestToken) {
          return;
        }

        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          ...internalRef.current,
          hasMore: pageData.length === LIMIT,
          isLoading: false,
          offset: offset + pageData.length,
        };
      },
      (error) => {
        if (requestToken !== internalRef.current.requestToken) {
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
          offset,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    const requestToken = internalRef.current.requestToken + 1;

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
        requestToken,
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
      requestToken,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
