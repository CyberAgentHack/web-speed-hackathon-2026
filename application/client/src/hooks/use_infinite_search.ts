import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_LIMIT = 30;

function appendPaginationParams(apiPath: string, limit: number, offset: number) {
  const url = new URL(apiPath, window.location.origin);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  return `${url.pathname}${url.search}`;
}

interface SearchResponse<T> {
  posts: T[];
  totalCount: number;
}

interface Options {
  limit?: number;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  hasMore: boolean;
  isLoading: boolean;
  totalCount: number;
  fetchMore: () => void;
}

export function useInfiniteSearch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<SearchResponse<T>>,
  options: Options = {},
): ReturnValues<T> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const internalRef = useRef({ hasMore: true, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    hasMore: apiPath !== "",
    isLoading: apiPath !== "",
    totalCount: 0,
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

    void fetcher(appendPaginationParams(apiPath, limit, offset)).then(
      ({ posts, totalCount }) => {
        setResult((cur) => {
          const data = [...cur.data, ...posts];
          return {
            ...cur,
            data,
            totalCount,
            hasMore: data.length < totalCount,
            isLoading: false,
          };
        });
        internalRef.current = {
          hasMore: offset + posts.length < totalCount,
          isLoading: false,
          offset: offset + posts.length,
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
  }, [apiPath, fetcher, limit]);

  useEffect(() => {
    if (apiPath === "") {
      setResult(() => ({
        data: [],
        error: null,
        hasMore: false,
        isLoading: false,
        totalCount: 0,
      }));
      internalRef.current = {
        hasMore: false,
        isLoading: false,
        offset: 0,
      };
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      hasMore: true,
      isLoading: true,
      totalCount: 0,
    }));
    internalRef.current = {
      hasMore: true,
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
