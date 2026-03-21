import { startTransition, useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

declare global {
  interface Window {
    __PRELOADED_POSTS__?: unknown[];
  }
}

function consumePreloadedData<T>(apiPath: string): T[] | null {
  if (apiPath === "/api/v1/posts" && window.__PRELOADED_POSTS__ != null) {
    const data = window.__PRELOADED_POSTS__ as T[];
    delete window.__PRELOADED_POSTS__;
    return data;
  }
  return null;
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
): ReturnValues<T> {
  const preloaded = useRef(consumePreloadedData<T>(apiPath));
  const internalRef = useRef({
    hasMore: true,
    isLoading: false,
    offset: preloaded.current?.length ?? 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>(() => {
    if (preloaded.current != null) {
      return {
        data: preloaded.current,
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
    if (!apiPath) {
      return;
    }
    const { hasMore, isLoading, offset } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const pagedUrl = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;
    void fetcher(pagedUrl).then(
      (pageData) => {
        internalRef.current = {
          hasMore: pageData.length >= LIMIT,
          isLoading: false,
          offset: offset + pageData.length,
        };
        startTransition(() => {
          setResult((cur) => ({
            ...cur,
            data: [...cur.data, ...pageData],
            isLoading: false,
          }));
        });
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          hasMore,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
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
      };
      return;
    }

    // プリロードデータがある場合はfetchをスキップ
    if (preloaded.current != null) {
      preloaded.current = null;
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
    };

    fetchMore();
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
