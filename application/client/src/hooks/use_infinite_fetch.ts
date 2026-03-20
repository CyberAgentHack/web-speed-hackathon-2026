import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

interface Options {
  useServerPagination?: boolean;
}

function withPagination(apiPath: string, limit: number, offset: number): string {
  const url = new URL(apiPath, window.location.origin);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  return `${url.pathname}${url.search}`;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options: Options = {},
): ReturnValues<T> {
  const { useServerPagination = true } = options;
  const internalRef = useRef({ hasMore: true, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
    if (apiPath === "" || isLoading || !hasMore) {
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

    const requestPath = useServerPagination ? withPagination(apiPath, LIMIT, offset) : apiPath;

    void fetcher(requestPath).then(
      (nextData) => {
        const data =
          useServerPagination === true ? nextData : nextData.slice(offset, offset + LIMIT);

        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...data],
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: data.length === LIMIT,
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
          hasMore,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, fetcher, useServerPagination]);

  useEffect(() => {
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

    if (apiPath === "") {
      setResult(() => ({
        data: [],
        error: null,
        isLoading: false,
      }));
      return;
    }

    fetchMore();
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
