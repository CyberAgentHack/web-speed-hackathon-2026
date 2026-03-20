import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 30;

/** apiPath に既にクエリがある場合は & で limit/offset を付与する */
function buildUrl(apiPath: string, offset: number): string {
  const sep = apiPath.includes("?") ? "&" : "?";
  return `${apiPath}${sep}limit=${LIMIT}&offset=${offset}`;
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
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: true,
  });

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore || !apiPath) {
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

    void fetcher(buildUrl(apiPath, offset)).then(
      (page) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...page],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + LIMIT,
          hasMore: page.length === LIMIT,
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
  }, [apiPath, fetcher]);

  useEffect(() => {
    if (!apiPath) {
      setResult({ data: [], error: null, isLoading: false });
      internalRef.current = { isLoading: false, offset: 0, hasMore: false };
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
      hasMore: true,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
