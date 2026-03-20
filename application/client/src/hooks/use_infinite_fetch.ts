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
  const internalRef = useRef({ generation: 0, hasReachedEnd: false, isLoading: false, offset: 0 });
  const fetcherRef = useRef(fetcher);

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const createPaginatedPath = useCallback((offset: number) => {
    const url = new URL(apiPath, window.location.origin);
    url.searchParams.set("limit", String(LIMIT));
    url.searchParams.set("offset", String(offset));
    return `${url.pathname}${url.search}`;
  }, [apiPath]);

  const fetchMore = useCallback(() => {
    const { generation, hasReachedEnd, isLoading, offset } = internalRef.current;
    if (apiPath === "" || hasReachedEnd || isLoading) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      generation,
      hasReachedEnd,
      isLoading: true,
      offset,
    };

    void fetcherRef.current(createPaginatedPath(offset)).then(
      (nextData) => {
        if (internalRef.current.generation !== generation) {
          return;
        }
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...nextData],
          error: null,
          isLoading: false,
        }));
        internalRef.current = {
          generation,
          hasReachedEnd: nextData.length < LIMIT,
          isLoading: false,
          offset: offset + LIMIT,
        };
      },
      (error) => {
        if (internalRef.current.generation !== generation) {
          return;
        }
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          generation,
          hasReachedEnd,
          isLoading: false,
          offset,
        };
      },
    );
  }, [apiPath, createPaginatedPath]);

  useEffect(() => {
    const nextGeneration = internalRef.current.generation + 1;

    if (apiPath === "") {
      setResult(() => ({
        data: [],
        error: null,
        isLoading: false,
      }));
      internalRef.current = {
        generation: nextGeneration,
        hasReachedEnd: true,
        isLoading: false,
        offset: 0,
      };
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      generation: nextGeneration,
      hasReachedEnd: false,
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
