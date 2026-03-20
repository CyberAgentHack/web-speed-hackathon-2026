import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

function appendPaginationParams(url: string, limit: number, offset: number): string {
  if (url === "") {
    return "";
  }
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}limit=${String(limit)}&offset=${String(offset)}`;
}

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
  const internalRef = useRef({ isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset } = internalRef.current;
    if (isLoading) {
      return;
    }

    if (apiPath === "") {
      setResult({
        data: [],
        error: null,
        isLoading: false,
      });
      internalRef.current = { isLoading: false, offset: 0 };
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

    const pageUrl = appendPaginationParams(apiPath, LIMIT, offset);

    void fetcher(pageUrl).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
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
    setResult({
      data: [],
      error: null,
      isLoading: true,
    });
    internalRef.current = {
      isLoading: false,
      offset: 0,
    };

    if (apiPath === "") {
      setResult({
        data: [],
        error: null,
        isLoading: false,
      });
      return;
    }

    fetchMore();
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
