import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LIMIT = 30;

interface Options {
  initialLimit?: number;
  pageLimit?: number;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options?: Options,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });
  const isFirstRef = useRef(true);
  const initialLimit = options?.initialLimit ?? DEFAULT_LIMIT;
  const pageLimit = options?.pageLimit ?? DEFAULT_LIMIT;

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    if (apiPath === "") {
      return;
    }

    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
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
    };

    const limit = isFirstRef.current ? initialLimit : pageLimit;
    const url = apiPath.includes("?")
      ? `${apiPath}&limit=${limit}&offset=${offset}`
      : `${apiPath}?limit=${limit}&offset=${offset}`;

    void fetcher(url).then(
      (page) => {
        const receivedCount = page.length;
        const nextOffset = offset + receivedCount;
        const nextHasMore = receivedCount === limit;
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...page],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: nextOffset,
          hasMore: nextHasMore,
        };
        isFirstRef.current = false;
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
          hasMore,
        };
      },
    );
  }, [apiPath, fetcher, initialLimit, pageLimit]);

  useEffect(() => {
    if (apiPath === "") {
      setResult(() => ({
        data: [],
        error: null,
        isLoading: false,
      }));
      internalRef.current = {
        isLoading: false,
        offset: 0,
        hasMore: false,
      };
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
      hasMore: true,
    };
    isFirstRef.current = true;

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
