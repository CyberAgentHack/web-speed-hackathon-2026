import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 5;

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
  const internalRef = useRef({ hasMore: true, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    if (apiPath === "") {
      setResult((cur) => ({
        ...cur,
        data: [],
        isLoading: false,
      }));
      return;
    }

    const { hasMore, isLoading, offset } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    const separator = apiPath.includes("?") ? "&" : "?";
    const fetchPath = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
    };

    void fetcher(fetchPath).then(
      (chunk) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...chunk],
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: chunk.length === LIMIT,
          isLoading: false,
          offset: offset + chunk.length,
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
  }, [apiPath, fetcher]);

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

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
