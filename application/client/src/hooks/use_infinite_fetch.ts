import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_LIMIT = 2;
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
  initialData?: T[] | null,
): ReturnValues<T> {
  const hasInitialData = initialData != null && initialData.length > 0;
  const internalRef = useRef({ isLoading: false, offset: hasInitialData ? initialData.length : 0, isFirstFetch: !hasInitialData });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: hasInitialData ? initialData : [],
    error: null,
    isLoading: !hasInitialData,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, isFirstFetch } = internalRef.current;
    if (isLoading || !apiPath) {
      return;
    }

    const currentLimit = isFirstFetch ? INITIAL_LIMIT : LIMIT;

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      isFirstFetch,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${currentLimit}&offset=${offset}`;

    void fetcher(paginatedPath).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + currentLimit,
          isFirstFetch: false,
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
          isFirstFetch: false,
        };
      },
    );
  }, [apiPath, fetcher]);

  const initialDataUsedRef = useRef(hasInitialData);

  useEffect(() => {
    if (initialDataUsedRef.current) {
      initialDataUsedRef.current = false;
      return;
    }
    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: false,
      offset: 0,
      isFirstFetch: true,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
