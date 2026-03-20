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
  const internalRef = useRef<{
    isLoading: boolean;
    offset: number;
    allData: T[] | null;
  }>({
    isLoading: false,
    offset: 0,
    allData: null,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, allData } = internalRef.current;
    if (isLoading) {
      return;
    }

    if (allData !== null) {
      const nextItems = allData.slice(offset, offset + LIMIT);
      setResult((cur) => ({
        ...cur,
        data: [...cur.data, ...nextItems],
        isLoading: false,
      }));
      internalRef.current = {
        isLoading: false,
        offset: offset + nextItems.length,
        allData,
      };
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      allData,
    };

    void fetcher(apiPath).then(
      (allData) => {
        const nextItems = allData.slice(offset, offset + LIMIT);
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...nextItems],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + nextItems.length,
          allData,
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
          allData: null,
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
      isLoading: false,
      offset: 0,
      allData: null,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
