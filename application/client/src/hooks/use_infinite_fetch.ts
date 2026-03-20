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
  const internalRef = useRef({ isLoading: false, offset: hasInitial ? initialData.length : 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: initialData ?? [],
    error: null,
    isLoading: !hasInitial,
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

    void fetcher(apiPath).then(
      (allData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...allData.slice(offset, offset + LIMIT)],
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
