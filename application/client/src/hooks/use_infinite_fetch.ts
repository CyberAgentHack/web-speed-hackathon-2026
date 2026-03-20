import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 5;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

function buildPaginatedPath(basePath: string, offset: number) {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}offset=${offset}&limit=${LIMIT}`;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    if (!apiPath) {
      return;
    }
    const { isLoading, offset } = internalRef.current;
    if (isLoading) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
    };

    const paginatedPath = buildPaginatedPath(apiPath, offset);
    void fetcher(paginatedPath).then(
      (allData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...allData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + allData.length,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
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
      isLoading: false,
      offset: 0,
    };

    if (apiPath) {
      fetchMore();
    }
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
