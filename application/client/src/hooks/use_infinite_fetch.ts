import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      ...internalRef.current,
      isLoading: true,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const pagedApiPath = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(pagedApiPath).then(
      (pagedData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pagedData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + pagedData.length,
          hasMore: pagedData.length === LIMIT,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          ...internalRef.current,
          isLoading: false,
        };
      }
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    setResult({
      data: [],
      error: null,
      isLoading: true,
    });
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
