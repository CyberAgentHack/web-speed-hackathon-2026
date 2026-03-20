import { useCallback, useEffect, useRef, useState } from "react";

import { FetchOptions, isAbortError } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

function withPagination(apiPath: string, limit: number, offset: number) {
  const separator = apiPath.includes("?") ? "&" : "?";
  return `${apiPath}${separator}limit=${limit}&offset=${offset}`;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string, options?: FetchOptions) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef<{
    abortController: AbortController | null;
    hasMore: boolean;
    isLoading: boolean;
    offset: number;
  }>({
    abortController: null,
    hasMore: true,
    isLoading: false,
    offset: 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { hasMore, isLoading, offset } = internalRef.current;
    if (apiPath === "" || hasMore === false || isLoading) {
      return;
    }

    const abortController = new AbortController();
    setResult((cur) => ({
      ...cur,
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      ...internalRef.current,
      abortController,
      hasMore,
      isLoading: true,
      offset,
    };

    void fetcher(withPagination(apiPath, LIMIT, offset), {
      signal: abortController.signal,
    }).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          abortController: null,
          hasMore: pageData.length === LIMIT,
          isLoading: false,
          offset: offset + pageData.length,
        };
      },
      (error) => {
        if (isAbortError(error)) {
          return;
        }

        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          abortController: null,
          hasMore,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    internalRef.current.abortController?.abort();

    setResult(() => ({
      data: [],
      error: null,
      isLoading: apiPath !== "",
    }));
    internalRef.current = {
      abortController: null,
      hasMore: apiPath !== "",
      isLoading: false,
      offset: 0,
    };

    if (apiPath !== "") {
      fetchMore();
    }

    return () => {
      internalRef.current.abortController?.abort();
    };
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
