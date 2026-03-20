import { useCallback, useEffect, useRef, useState } from "react";

import { FetchOptions, isAbortError } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const LIMIT = 30;
const EMPTY_DATA: [] = [];

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

interface UseInfiniteFetchOptions<T> {
  initialData?: Array<T>;
}

function withPagination(apiPath: string, limit: number, offset: number) {
  const separator = apiPath.includes("?") ? "&" : "?";
  return `${apiPath}${separator}limit=${limit}&offset=${offset}`;
}

function createInitialState<T>(apiPath: string, initialData: Array<T>) {
  return {
    data: initialData,
    error: null,
    isLoading: apiPath !== "" && initialData.length === 0,
  };
}

function shouldFetchMore(apiPath: string, initialDataLength: number) {
  return apiPath !== "" && (initialDataLength === 0 || initialDataLength === LIMIT);
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string, options?: FetchOptions) => Promise<T[]>,
  options: UseInfiniteFetchOptions<T> = {},
): ReturnValues<T> {
  const initialData = options.initialData ?? (EMPTY_DATA as T[]);
  const internalRef = useRef<{
    abortController: AbortController | null;
    hasMore: boolean;
    isLoading: boolean;
    offset: number;
  }>({
    abortController: null,
    hasMore: shouldFetchMore(apiPath, initialData.length),
    isLoading: false,
    offset: initialData.length,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>(
    createInitialState(apiPath, initialData),
  );

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

    setResult(() => createInitialState(apiPath, initialData));
    internalRef.current = {
      abortController: null,
      hasMore: shouldFetchMore(apiPath, initialData.length),
      isLoading: false,
      offset: initialData.length,
    };

    if (apiPath !== "" && initialData.length === 0) {
      fetchMore();
    }

    return () => {
      internalRef.current.abortController?.abort();
    };
  }, [apiPath, fetchMore, initialData]);

  return {
    ...result,
    fetchMore,
  };
}
