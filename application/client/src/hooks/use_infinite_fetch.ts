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
  const internalRef = useRef({ hasMore: true, isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    if (apiPath === "") {
      return;
    }

    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    const separator = apiPath.includes("?") ? "&" : "?";
    const pathWithPagination = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      hasMore,
      isLoading: true,
      offset,
    };

    void fetcher(pathWithPagination).then(
      (pagedData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pagedData],
          isLoading: false,
        }));
        internalRef.current = {
          hasMore: pagedData.length >= LIMIT,
          isLoading: false,
          offset: offset + pagedData.length,
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
      isLoading: apiPath !== "",
    }));
    internalRef.current = {
      hasMore: apiPath !== "",
      isLoading: false,
      offset: 0,
    };

    if (apiPath !== "") {
      fetchMore();
    }
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
