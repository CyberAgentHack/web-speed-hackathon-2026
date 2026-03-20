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
  initialData?: T[],
): ReturnValues<T> {
  const hasInitial = initialData != null && initialData.length > 0;
  const internalRef = useRef({
    isLoading: false,
    offset: hasInitial ? initialData.length : 0,
    hasMore: !hasInitial || initialData.length >= LIMIT,
  });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: initialData ?? [],
    error: null,
    isLoading: !hasInitial,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      ...internalRef.current,
      isLoading: true,
    };

    void fetcherRef.current(apiPath).then(
      (allData) => {
        const newItems = allData.slice(offset, offset + LIMIT);
        if (newItems.length === 0) {
          setResult((cur) => ({
            ...cur,
            isLoading: false,
          }));
          internalRef.current = {
            isLoading: false,
            offset,
            hasMore: false,
          };
          return;
        }
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...newItems],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + LIMIT,
          hasMore: newItems.length >= LIMIT,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          ...internalRef.current,
          isLoading: false,
        };
      },
    );
  }, [apiPath]);

  const initialFetchDone = useRef(hasInitial);
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...result,
    fetchMore,
  };
}
