import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

interface ReturnValues<T> {
  data: T[];
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

type InfiniteFetcher<T> = (
  apiPath: string,
  offset: number,
  limit: number,
) => Promise<T[]>;

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: InfiniteFetcher<T>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0 });
  const requestIdRef = useRef(0);

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: false,
  });

  const runFetch = useCallback(
    async (offset: number, replace: boolean) => {
      if (internalRef.current.isLoading) return;

      internalRef.current.isLoading = true;
      const requestId = ++requestIdRef.current;

      setResult((cur) => ({
        ...cur,
        isLoading: true,
        error: null,
      }));

      try {
        const items = await fetcher(apiPath, offset, LIMIT);

        if (requestId !== requestIdRef.current) return;

        setResult((cur) => ({
          data: replace ? items : [...cur.data, ...items],
          error: null,
          isLoading: false,
        }));

        internalRef.current = {
          isLoading: false,
          offset: offset + items.length,
        };
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        setResult((cur) => ({
          ...cur,
          error: error instanceof Error ? error : new Error("Unknown error"),
          isLoading: false,
        }));

        internalRef.current.isLoading = false;
      }
    },
    [apiPath, fetcher],
  );

  const fetchMore = useCallback(() => {
    void runFetch(internalRef.current.offset, false);
  }, [runFetch]);

  useEffect(() => {
    internalRef.current = {
      isLoading: false,
      offset: 0,
    };

    setResult({
      data: [],
      error: null,
      isLoading: false,
    });

    void runFetch(0, true);
  }, [apiPath, fetcher, runFetch]);

  return {
    ...result,
    fetchMore,
  };
}
