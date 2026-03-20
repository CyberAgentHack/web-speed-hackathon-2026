import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

// limit, offset クエリを付与した URL を fetcher に渡す
export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({
    isLoading: false,
    offset: 0,
    canFetchMore: true,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, canFetchMore } = internalRef.current;
    if (isLoading || !canFetchMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      canFetchMore: true,
      offset,
    };

    const url = new URL(apiPath, window.location.origin);
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("limit", String(LIMIT));

    void fetcher(url.toString()).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + pageData.length,
          canFetchMore: pageData.length !== 0,
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
          canFetchMore: false,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
      canFetchMore: true,
    }));
    internalRef.current = {
      isLoading: false,
      offset: 0,
      canFetchMore: true,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
