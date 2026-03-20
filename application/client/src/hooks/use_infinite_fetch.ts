import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_INITIAL_LIMIT = 30;
const DEFAULT_PAGE_LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

interface Options {
  initialData?: unknown[];
  initialLimit?: number;
  pageLimit?: number;
}

function buildPaginatedPath(apiPath: string, limit: number, offset: number): string {
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
  const initialLimit = options.initialLimit ?? DEFAULT_INITIAL_LIMIT;
  const pageLimit = options.pageLimit ?? DEFAULT_PAGE_LIMIT;
  const initialData = options.initialData as T[] | undefined;
  const initialOffset = initialData?.length ?? 0;
  const bootstrappedApiPathRef = useRef(initialData != null && apiPath !== "" ? apiPath : null);
  const internalRef = useRef({
    hasMore: apiPath !== "" && initialData != null ? initialOffset === initialLimit : true,
    isLoading: false,
    offset: initialOffset,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: initialData ?? [],
    error: null,
    isLoading: apiPath !== "" && initialData == null,
  });

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
    if (apiPath === "" || !hasMore || isLoading) {
      return;
    }
    const limit = offset === 0 ? initialLimit : pageLimit;

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
    };

    void fetcher(buildPaginatedPath(apiPath, limit, offset)).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: pageData.length === limit,
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
          hasMore,
          isLoading: false,
          offset,
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
        hasMore: false,
        isLoading: false,
        offset: 0,
      };
      return;
    }

    if (bootstrappedApiPathRef.current === apiPath) {
      return;
    }

    bootstrappedApiPathRef.current = null;
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
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
