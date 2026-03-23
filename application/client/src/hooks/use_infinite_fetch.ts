import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

type PrefetchCache = Record<string, Promise<unknown>>;

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchPage = useCallback(
    (offset: number) => {
      if (!apiPath || isLoadingRef.current || !hasMoreRef.current) return;
      isLoadingRef.current = true;

      const separator = apiPath.includes("?") ? "&" : "?";
      const url = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

      setResult((cur) => ({ ...cur, isLoading: true }));

      // Check inline prefetch cache (only for offset=0 / first page)
      const cache = (window as unknown as { __q?: PrefetchCache }).__q;
      const prefetched = offset === 0 ? (cache?.[url] as Promise<T[] | null> | undefined) : undefined;
      if (prefetched) {
        delete cache![url];
        void prefetched.then(
          (pageData) => {
            isLoadingRef.current = false;
            if (pageData !== null) {
              offsetRef.current = pageData.length;
              if (pageData.length < LIMIT) hasMoreRef.current = false;
              setResult((cur) => ({ ...cur, data: pageData, isLoading: false }));
            } else {
              void fetcher(url).then(
                (pageData) => {
                  isLoadingRef.current = false;
                  offsetRef.current = pageData.length;
                  if (pageData.length < LIMIT) hasMoreRef.current = false;
                  setResult((cur) => ({ ...cur, data: pageData, isLoading: false }));
                },
                (error) => {
                  isLoadingRef.current = false;
                  setResult((cur) => ({ ...cur, error, isLoading: false }));
                },
              );
            }
          },
        );
        return;
      }

      void fetcher(url).then(
        (pageData) => {
          isLoadingRef.current = false;
          offsetRef.current = offset + pageData.length;
          if (pageData.length < LIMIT) {
            hasMoreRef.current = false;
          }
          setResult((cur) => ({
            ...cur,
            data: offset === 0 ? pageData : [...cur.data, ...pageData],
            isLoading: false,
          }));
        },
        (error) => {
          isLoadingRef.current = false;
          setResult((cur) => ({ ...cur, error, isLoading: false }));
        },
      );
    },
    [apiPath, fetcher],
  );

  const fetchMore = useCallback(() => {
    fetchPage(offsetRef.current);
  }, [fetchPage]);

  useEffect(() => {
    offsetRef.current = 0;
    isLoadingRef.current = false;
    hasMoreRef.current = true;
    setResult({ data: [], error: null, isLoading: !!apiPath });
    fetchPage(0);
  }, [apiPath, fetchPage]);

  return { ...result, fetchMore };
}
