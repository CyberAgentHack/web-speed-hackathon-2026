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
  const normalizedApiPath = apiPath.trim();
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (normalizedApiPath === "" || isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      hasMore,
    };

    const separator = normalizedApiPath.includes("?") ? "&" : "?";
    const path = `${normalizedApiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(path).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        const nextOffset = offset + pageData.length;
        internalRef.current = {
          isLoading: false,
          offset: nextOffset,
          hasMore: pageData.length === LIMIT,
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
          hasMore,
        };
      },
    );
  }, [normalizedApiPath, fetcher]);

  useEffect(() => {
    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };

    if (normalizedApiPath === "") {
      setResult(() => ({
        data: [],
        error: null,
        isLoading: false,
      }));
      return;
    }

    fetchMore();
  }, [fetchMore, normalizedApiPath]);

  return {
    ...result,
    fetchMore,
  };
}
