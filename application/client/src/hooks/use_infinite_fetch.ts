import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 12;

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
  const internalRef = useRef({ isLoading: false, isExhausted: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    if (apiPath.trim() === "") {
      return;
    }

    const { isLoading, isExhausted, offset } = internalRef.current;
    if (isLoading || isExhausted) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      isExhausted,
      offset,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const pagedApiPath = `${apiPath}${separator}limit=${LIMIT}&offset=${offset}`;

    void fetcher(pagedApiPath).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          isExhausted: pageData.length < LIMIT,
          offset: offset + pageData.length,
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
          isExhausted,
          offset,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    setResult(() => ({
      data: [],
      error: null,
      isLoading: apiPath.trim() !== "",
    }));
    internalRef.current = {
      isLoading: false,
      isExhausted: false,
      offset: 0,
    };

    if (apiPath.trim() !== "") {
      fetchMore();
    }
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
