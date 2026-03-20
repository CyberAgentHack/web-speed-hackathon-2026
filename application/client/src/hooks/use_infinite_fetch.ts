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
