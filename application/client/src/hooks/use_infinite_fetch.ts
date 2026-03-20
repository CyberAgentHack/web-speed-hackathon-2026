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
  const internalRef = useRef({ isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset } = internalRef.current;
    if (isLoading) {
      return;
    }

    const requestUrl = new URL(apiPath, window.location.origin);
    requestUrl.searchParams.set("limit", String(LIMIT));
    requestUrl.searchParams.set("offset", String(offset));

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
    };

    void fetcher(requestUrl.pathname + requestUrl.search).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
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
