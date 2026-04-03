import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 7;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  initialData?: T[],
): ReturnValues<T> {
  const hasInitialData = initialData != null && initialData.length > 0;
  const internalRef = useRef({
    isLoading: false,
    offset: hasInitialData ? initialData.length : 0,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: hasInitialData ? initialData : [],
    error: null,
    isLoading: !hasInitialData,
  });

  const fetchMore = useCallback(() => {
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

    if (!apiPath) {
      setResult((cur) => ({ ...cur, isLoading: false }));
      internalRef.current = { isLoading: false, offset };
      return;
    }

    const separator = apiPath.includes("?") ? "&" : "?";
    const url = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(url).then(
      (data) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...data],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + LIMIT,
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
    if (hasInitialData) {
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
    };

    fetchMore();
  }, [fetchMore, hasInitialData]);

  return {
    ...result,
    fetchMore,
  };
}
