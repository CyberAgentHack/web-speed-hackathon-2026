import { useCallback, useEffect, useRef, useState } from "react";

const LIMIT = 10;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string | null,
  fetcher: (apiPath: string) => Promise<T[]>,
  initialData?: T[],
  pageSize: number = LIMIT,
): ReturnValues<T> {
  const hasInitialData = (initialData?.length ?? 0) > 0;
  const internalRef = useRef({ isLoading: false, offset: hasInitialData ? (initialData?.length ?? 0) : 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: initialData ?? [],
    error: null,
    isLoading: apiPath !== null && !hasInitialData,
  });

  const fetchMore = useCallback(() => {
    if (apiPath === null) return;
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

    const separator = apiPath.includes("?") ? "&" : "?";
    void fetcher(`${apiPath}${separator}offset=${offset}&limit=${pageSize}`).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + pageSize,
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
  }, [apiPath, fetcher, pageSize]);

  useEffect(() => {
    setResult(() => ({
      data: initialData ?? [],
      error: null,
      isLoading: apiPath !== null && !hasInitialData,
    }));
    internalRef.current = {
      isLoading: false,
      offset: hasInitialData ? (initialData?.length ?? 0) : 0,
    };

    if (apiPath !== null && !hasInitialData) {
      fetchMore();
    }
    // initialData は window.__INITIAL_POSTS__ から一度だけ読まれる値のため deps から除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
